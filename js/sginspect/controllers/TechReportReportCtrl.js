coreApp.controller("TechReportCtrl", function($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter){
	$scope.Report = [];
	$scope.DescriptionImages = [];
	$scope.signature = '';
	$scope.imageUrl =  'https://s3.amazonaws.com/rapidtradeimages/' + GlobalSvc.getUser().SupplierID + '/';

	function fetchReport(){
		$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
		$scope.Report.JSON.timeString =  moment($scope.Report.JSON.InvestigationDate).format('YYYY/MM/DD HH:mm');
		$scope.Report.FormDate =  moment($scope.Report.FormDate).format('YYYY/MM/DD HH:mm');
		$scope.DescriptionImages = $scope.Report.JSON.DescriptionImages;
		$scope.signature = 'https://s3.amazonaws.com/rapidtradeimages/' + GlobalSvc.getUser().SupplierID + '/' + $scope.Report.JSON.Signature;
		$scope.$emit('UNLOAD');
	}

	function constructor(){
		$scope.$emit('LOAD');
		$scope.$emit('heading',{heading: 'After Service  Inspection' , icon : 'fa fa-check'});
		$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back()}});
		fetchReport();
	}
	constructor();
});