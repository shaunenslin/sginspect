coreApp.controller('CustomerVisitReportCtrl', function($scope, $routeParams,$location, $alert, $http, GlobalSvc, Settings){
	$scope.Report=[];

	function fetchReport(){
		$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
		$scope.Report.JSON.timeString =  moment($scope.Report.FormDate).format('YYYY/MM/DD HH:mm');
		$scope.$emit('UNLOAD');
	
	}
	function constructor(){
		$scope.$emit('heading',{heading: 'Customer Visit Report' , icon : 'fa fa-check'});
		$scope.$emit('left',{label: 'back' , icon : 'fa fa-chevron-left', onclick: function(){$location.path('/reports')}});
		fetchReport();
	}
	constructor();		

});