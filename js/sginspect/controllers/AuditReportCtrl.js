coreApp.controller("AuditReportCtrl", function($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter){
	$scope.Report = [];

	function fetchReport(){
		$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
		switch ($scope.Report.FormType){
			case 'audit' :
				$scope.$emit('heading',{heading: 'Audit Form' , icon : 'fa fa-check'});
				break;
			case 'supplierevaluation':
				$scope.$emit('heading',{heading: 'Supplier Evaluation' , icon : 'fa fa-check'});
				break;
			case 'technicalreport' :
				$scope.$emit('heading',{heading: 'Technical Report' , icon : 'fa fa-check'});
				break;
			case 'afterserviceevaluation' :
				$scope.$emit('heading',{heading: 'After Service Inspection' , icon : 'fa fa-check'});
				break;
			case 'customervisit' : 
				$scope.$emit('heading',{heading: 'Customer Visit' , icon : 'fa fa-check'});
	    		break;
    	}
	}

	function constructor(){
		if ($routeParams.mode){
			$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back()}});
			fetchReport();
		}
	}
	constructor();
});