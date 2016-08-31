coreApp.controller("AuditReportCtrl", function($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter){
	$scope.Report = [];
	$scope.kilometerImages = [];
	$scope.otherPhotos = [];
	$scope.tyreImages = [];
	$scope.signature = '';

	function fetchReport(){
		$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
		$scope.Report.JSON.timeString =  moment($scope.Report.JSON.InspectionDate).format('YYYY/MM/DD HH:mm');
		$scope.Report.FormDate = moment($scope.Report.FormDate).format('YYYY/MM/DD HH:mm');
		$scope.$emit('UNLOAD');
	}
	function fetchImages(){
		var url = Settings.url + "Get?method=SGIImages_readlist&ClientID=" + $scope.Report.ClientID + "&ImageID='" + $scope.Report.FormID + "'";
		$http.get (url)
		.success(function(data){
			var images = data.map(function(e){
				e.timeString = moment(e.CreatedOn).format('YYYY/MM/DD HH:mm:ss');
				if (e.FormID.includes('kilometers')){
					$scope.kilometerImages.push(e);
				} else if (e.FormID.includes('inspectior')){
					$scope.signature = e;
				} else if (e.FormID.includes('tyre')){
					$scope.tyreImages.push(e);
				} else{
					$scope.otherPhotos.push(e);
				}
			});
			console.log(data);
			$scope.$emit('UNLOAD');
		})
		.error(function(){
			$scope.$emit('UNLOAD');
			$alert({content:"Error fetching images", duration:5, placement:'top-right', type:'danger', show:true});
		})
	}

	function constructor(){
		$scope.$emit('LOAD');
		$scope.$emit('heading',{heading: 'Audit Form' , icon : 'fa fa-check'});
		$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back()}});
		fetchReport();
		fetchImages();
	}
	constructor();
});