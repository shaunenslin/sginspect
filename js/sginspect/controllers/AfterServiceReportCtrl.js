coreApp.controller("AfterServiceReportCtrl", function($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter){
	$scope.Report = [];
	$scope.kilometerImages = [];
    $scope.commentPhotoImages = [];
    $scope.newArray = [];
	$scope.signature = '';
	$scope.imageUrl =  'https://s3.amazonaws.com/rapidtradeimages/' + GlobalSvc.getUser().SupplierID + '/';

	function fetchReport(){
		$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
		$scope.Report.JSON.timeString =  moment($scope.Report.JSON.dateOfService).format('YYYY/MM/DD');
		$scope.Report.JSON.dateOfService = moment($scope.Report.JSON.dateOfInspection).format('YYYY/MM/DD');
		$scope.Report.FormDate = moment($scope.Report.FormDate).format('YYYY/MM/DD');
		$scope.kilometerImages = $scope.Report.JSON.kilometerImages;
		$scope.commentPhotoImages = $scope.Report.JSON.commentPhotoImages;
		var newcommentsorPhotos = {"ImageID": "", "Comment":""};
		for (var i = 0; i < $scope.commentPhotoImages.length; i++){
			newcommentsorPhotos.ImageID = $scope.commentPhotoImages[i]
			newcommentsorPhotos.Comment = $scope.Report.JSON.commentsOrPhotos[i];
			$scope.newArray.push(newcommentsorPhotos);
			newcommentsorPhotos = {"ImageID": "", "Comment":""};
		}
		$scope.signature = $scope.imageUrl + $scope.Report.JSON.Signature;
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