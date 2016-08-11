coreApp.controller("ListOpenCtrl", function ($scope, $routeParams, DaoSvc, $location, $alert) {
	DaoSvc.openDB();
	$scope.InspectionForms = [];
	$scope.openJobsCount = 0
	$scope.CompletedJobsCount = 0;
	$scope.CloseJobsCount = 0;

	function fetchOpenCount(){
		// this.count = function (table, key, index,  poncomplete, ponerror) {
		DaoSvc.count('InProgress', 'Open Jobs', 'index3',
			function(count){
				$scope.openJobsCount = count;
				$scope.$emit('UNLOAD');
				$scope.$apply();
			},
			function(err){
				$scope.$emit('UNLOAD');
				console.log('COunt of 0 in InProgress table');
		});
	}
	$scope.onJobClicked = function(jobType){
		if (jobType === 'open'){
			$location.path('/jobs/' + jobType);
		}
	}
	function fetchInspections(){
		var inspection_forms = [];
		DaoSvc.cursor('InProgress',
            function(json){
            	json.timeString = moment(json.FormDate).format("DD MMM YY");
            	inspection_forms.push(json);
            },
            function(err){
            	$scope.hide = true;
                $scope.$emit('UNLOAD');
            },
            function(){
            	$scope.InspectionForms = inspection_forms;
                $scope.$emit('UNLOAD');
                $scope.$apply();
            }
        );
	}
	$scope.onInspectionClicked = function(idx){
		delete $scope.InspectionForms[idx].timeString;
		sessionStorage.setItem('currentForm', JSON.stringify($scope.InspectionForms[idx]));
		//this.deleteItem = function (table, key, idx, ponerror, poncomplete) {
		DaoSvc.deleteItem('InProgress', $scope.InspectionForms[idx].FormID, undefined, function(){console.log('Error Clearing InProgress table');}, function(){console.log('InProgress table cleared successfully');$scope.$apply();});
		$location.path($scope.InspectionForms[idx].JSON.Path);
	}

	function constructor(){
		if(!$routeParams.mode){
			$scope.$emit('heading',{heading: 'Jobs' , icon : 'fa fa-sticky-note'});
			$scope.mode = 'jobs';
			fetchOpenCount();
		} else if ($routeParams.mode === 'open'){
			$scope.$emit('heading',{heading: 'Open Jobs' , icon : 'fa fa-sticky-note'});
			$scope.mode = $routeParams.mode;
			fetchInspections();
		} else if ($routeParams.mode === 'closed'){
			$scope.$emit('heading',{heading: 'Closed Jobs' , icon : 'fa fa-sticky-note'});

		}
	}
	constructor();
});