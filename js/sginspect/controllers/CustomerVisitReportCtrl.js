coreApp.controller('CustomerVisitReportCtrl', function($scope, $routeParams,$location, $alert, $http, GlobalSvc, Settings){
	$scope.Report=[];
	$scope.imageUrl =  'https://s3.amazonaws.com/rapidtradeimages/' + GlobalSvc.getUser().SupplierID + '/';

	function fetchReport(){
		$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
		$scope.SpecialRequests = $scope.Report.JSON.SpecialRequests;
		if ($scope.Report.JSON.SpecialRequests) $scope.SpecialRequests.map(function(e){ e.RequestDate = moment(e.RequestDate).format('YYYY/MM/DD')})
		$scope.Report.JSON.timeString =  moment($scope.Report.FormDate).format('YYYY/MM/DD HH:mm');
		$scope.Report.FormDate = moment($scope.Report.FormDate).format('YYYY/MM/DD HH:mm');
		$scope.signature = $scope.imageUrl + $scope.Report.JSON.Signature;
		$scope.$emit('UNLOAD');
	
	}
	function constructor(){
		$scope.$emit('heading',{heading: 'Customer Visit Report' , icon : 'fa fa-check'});
		$scope.$emit('left',{label: 'back' , icon : 'fa fa-chevron-left', onclick: function(){$location.path('/reports')}});
		fetchReport();
	}
	constructor();		

});