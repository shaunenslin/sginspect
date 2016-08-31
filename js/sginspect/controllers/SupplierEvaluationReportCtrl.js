coreApp.controller("SupplierEvaluationReportCtrl", function($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter){
	$scope.Report = [];

	function fetchReport(){
		$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
		$scope.Report.JSON.timeString =  moment($scope.Report.JSON.EvaluationDate).format('YYYY/MM/DD HH:mm');
		$scope.$emit('UNLOAD');
	}
	function fetchImages(){
		var url = Settings.url + 'Gett?method=SGIImages_readlist&ClientID=' + $scope.Report.ClientID + '&ImageID=' + $scope.Report.FormID;
		$http.get (url)
		.success(function(data){
			$scope.images = data;
			$scope.$emit('UNLOAD');
		})
		.error(function(){
			$scope.$emit('UNLOAD');
			$alert({content:"Error fetching images", duration:5, placement:'top-right', type:'danger', show:true});
		})
	}

	function constructor(){
		$scope.$emit('LOAD');
		$scope.$emit('heading',{heading: 'Supplier Evaluation' , icon : 'fa fa-check'});
		$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back()}});
		fetchReport();
		// fetchImages();
	}
	constructor();
});