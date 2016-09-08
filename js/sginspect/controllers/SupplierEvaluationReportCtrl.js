coreApp.controller("SupplierEvaluationReportCtrl", function($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter){
	$scope.Report = [];
	$scope.evaluationImages = [];
	$scope.CleanlinessImages = [];
	$scope.SpecialToolsTrainingImages = [];
	$scope.ReceptionImages = [];
	$scope.signature = [];
	$scope.imageUrl =  'https://s3.amazonaws.com/rapidtradeimages/' + GlobalSvc.getUser().SupplierID + '/';

	function fetchReport(){
		$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
		$scope.Report.JSON.timeString =  moment($scope.Report.JSON.EvaluationDate).format('YYYY/MM/DD');
		$scope.Report.FormDate = moment($scope.Report.FormDate).format('YYYY/MM/DD');
		$scope.evaluationImages = $scope.Report.JSON.evaluationImages;
		$scope.CleanlinessImages = $scope.Report.JSON.CleanlinessImages;
		$scope.SpecialToolsTrainingImages =  $scope.Report.JSON.SpecialToolsTrainingImages;
		$scope.ReceptionImages =  $scope.Report.JSON.ReceptionImages;
		$scope.techAdvisorSignature = $scope.imageUrl + $scope.Report.JSON.TechAdvisorSignature;
		$scope.managerSignature = $scope.imageUrl + $scope.Report.JSON.ManagerSignature;
		$scope.$emit('UNLOAD');
	}
	function constructor(){
		$scope.$emit('LOAD');
		$scope.$emit('heading',{heading: 'Supplier Evaluation' , icon : 'fa fa-check'});
		$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back()}});
		fetchReport();
	}
	constructor();
});