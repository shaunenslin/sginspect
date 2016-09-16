coreApp.controller("AuditReportCtrl", function($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter){
	$scope.Report = [];
	$scope.kilometersImages = [];
	$scope.otherImages = [];
	$scope.TyresImages = [];
	$scope.signature = '';
	$scope.imageUrl =  'https://s3.amazonaws.com/rapidtradeimages/' + GlobalSvc.getUser().SupplierID + '/';

	function fetchReport(){
		$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
		$scope.Report.JSON.timeString =  moment($scope.Report.JSON.InspectionDate).format('YYYY/MM/DD');
		$scope.Report.FormDate = moment($scope.Report.FormDate).format('YYYY/MM/DD');
		$scope.Report.JSON.Tarre = parseInt($scope.Report.JSON.Tarre);
		$scope.Report.JSON.Tarre = $scope.Report.JSON.Tarre.toString();
		$scope.kilometersImages = $scope.Report.JSON.KilometersImages;
		$scope.Report.JSON.FireExtinguisherExpDate = moment($scope.Report.JSON.FireExtinguisherExpDate).format('YYYY/MM/DD');
		$scope.TyresImages = $scope.Report.JSON.TyresImages;
		$scope.otherImages = $scope.Report.JSON.other_photosimages;
		$scope.signature = $scope.imageUrl + $scope.Report.JSON.Signature;
		$scope.$emit('UNLOAD');
	}
	function constructor(){
		$scope.$emit('LOAD');
		$scope.$emit('heading',{heading: 'Audit Form' , icon : 'fa fa-check'});
		$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back()}});
		fetchReport();
	}
	constructor();
});