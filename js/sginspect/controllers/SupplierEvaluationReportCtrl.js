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
		var url  = $scope.imageUrl + $scope.Report.JSON.TechAdvisorSignature;
		$http.get (url)
		.success(function(sig1){
	    	data = "data:image/svg+xml;base64," + btoa(sig1);
	    	$scope.techAdvisorSignature = data;
	    	fetchManagerSignature($scope.imageUrl + $scope.Report.JSON.ManagerSignature);
		})
		.error(function(){
			console.log('Error fetching tech advisor signature');
		})
		$scope.$emit('UNLOAD');
	}

	function fetchManagerSignature(url){
		$http.get (url)
		.success(function(sig2){
	    	data = "data:image/svg+xml;base64," + btoa(sig2);
	    	$scope.managerSignature = data;
		})
		.error(function(){
			console.log('Error fetching manager signature');
		})
	}
	function constructor(){
		$scope.$emit('LOAD');
		$scope.$emit('heading',{heading: 'Supplier Evaluation' , icon : 'fa fa-check'});
		$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back()}});
		fetchReport();
	}
	constructor();
});