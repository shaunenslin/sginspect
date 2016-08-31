coreApp.controller("AfterServiceReportCtrl", function($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter){
	$scope.Report = [];
	$scope.kilometerImages = [];
	$scope.otherPhotos = [];
	$scope.signature = '';

	function fetchReport(){
		$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
		$scope.Report.JSON.timeString =  moment($scope.Report.JSON.dateOfService).format('YYYY/MM/DD HH:mm');
		$scope.Report.JSON.dateOfService = moment($scope.Report.JSON.dateOfInspection).format('YYYY/MM/DD HH:mm');
		$scope.Report.FormDate = moment($scope.Report.FormDate).format('YYYY/MM/DD HH:mm');
		$scope.$emit('UNLOAD');
	}
	function fetchImages(){
		var url = Settings.url + "Get?method=SGIImages_readlist&ClientID=" + $scope.Report.ClientID + "&ImageID='" + $scope.Report.FormID + "'";
		$http.get (url)
		.success(function(data){
			var images = data.map(function(e){
				if (e.FormID.includes('kilometer')){
					$scope.kilometerImages.push(e);
				} else if (e.FormID.includes('Sig')){
					$scope.signature = e;
				} else{
					$scope.otherPhotos.push(e);
				}
			});
			$scope.$emit('UNLOAD');
		})
		.error(function(){
			$scope.$emit('UNLOAD');
			$alert({content:"Error fetching images", duration:5, placement:'top-right', type:'danger', show:true});
		})
	}

	function constructor(){
		$scope.$emit('LOAD');
		$scope.$emit('heading',{heading: 'After Service  Inspection' , icon : 'fa fa-check'});
		$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back()}});
		fetchReport();
		fetchImages();
	}
	constructor();
});