coreApp.controller("ListOpenCtrl", function ($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route) {
	DaoSvc.openDB();
	$scope.InspectionForms = [];
	$scope.openJobsCount = 0
	$scope.CompletedJobsCount = 0;
	$scope.CloseJobsCount = 0;

	function fetchOpenCount(){
		$scope.openJobsCount = 0;
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
	function fechClosedCount(){
		var url = Settings.url + "Get?method=SGI_CompletedJobsCount&UserID='" + GlobalSvc.getUser().UserID + "'";
		$http.get (url)
		.success(function(count){
			$scope.CloseJobsCount = count[0];
			$scope.$emit('UNLOAD');
			$scope.$apply();
		})
		.error(function(err){
			console.log('Error fetching closed jobs count ' + err);
		})

	}
	// table, ponsuccessread, ponerror, poncomplete
	function CompletedJobsCount(){
		var completeCount = 0;
		DaoSvc.cursor('Unsent',
			function(item){
				if (item["Table"] && item["Table"].indexOf('SGIFormHeaders') > - 1){
					completeCount++;
				}
			},function(err){
				$scope.$emit('UNLOAD');
				$scope.$apply();
				console.log('error fetching completed Jobs count! ' + err);
			},
			function(){
				$scope.CompletedJobsCount = completeCount;
				$scope.$emit('UNLOAD');
				$scope.$apply();
			}

		);
	}

	$scope.deleteOpenJob = function(idx){
		if(!confirm('Are you sure you want to delete this Job ?')) return;
		DaoSvc.deleteItem('InProgress', $scope.InspectionForms[idx].FormID, undefined,
			function(err){
				$scope.$emit('UNLOAD');
				$alert({content:"Error Deleting form", duration:5, placement:'top-right', type:'danger', show:true});
			},function(){
				$alert({content:"Form Deleted successfully", duration:5, placement:'top-right', type:'success', show:true});
				$scope.$emit('UNLOAD');
				$scope.$apply();
				$route.reload();
			}
		)
	}
	/*function deleteOpenJobImages(){
		DaoSvc.deleteItem('Unsent',

		)
	}
*/
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
			CompletedJobsCount();
			fechClosedCount();
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