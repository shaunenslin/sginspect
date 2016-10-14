coreApp.controller("AfterServiceReportCtrl", function($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter){
	$scope.Report = [];
	$scope.kilometerImages = [];
    $scope.commentPhotoImages = [];
	$scope.signature = '';
	$scope.imageUrl =  'https://s3.amazonaws.com/rapidtradeimages/' + GlobalSvc.getUser().SupplierID + '/';
	$scope.xsl_download_path = Settings.isoGetUrl +  moment().format("MM") + ' ';

	function fetchReport(){
		$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
		$scope.xsl_download_path += moment($scope.Report.FormDate).format("MMM") + ' ' + moment($scope.Report.FormDate).format("YYYY") + '/Service Inspections/' + $scope.Report.JSON.LicenseNumber +'.xls'; 
		$scope.Report.JSON.timeString =  moment($scope.Report.JSON.dateOfService).format('YYYY/MM/DD');
		$scope.Report.JSON.dateOfService = moment($scope.Report.JSON.dateOfInspection).format('YYYY/MM/DD');
		$scope.Report.FormDate = moment($scope.Report.FormDate).format('YYYY/MM/DD');
		$scope.Report.JSON.Tarre = parseInt($scope.Report.JSON.Tarre);
		$scope.Report.JSON.Tarre = $scope.Report.JSON.Tarre.toString();
		$scope.kilometerImages = $scope.Report.JSON.kilometerImages;
		$scope.otherPhotos = $scope.Report.JSON.otherPhotos;
		$scope.otherComments = $scope.Report.JSON.otherComments;
		
		var url  = $scope.imageUrl + $scope.Report.JSON.Signature;
		$http.get (url)
		.success(function(img){
	    	data = "data:image/svg+xml;base64," + btoa(img);
	    	$scope.signature = data;
		})
		.error(function(){
			console.log('Error fetchig signature');
		})
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