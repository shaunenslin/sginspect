coreApp.controller("ListOpenCtrl", function ($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter) {
	DaoSvc.openDB();
	$scope.InspectionForms = [];
	$scope.data = [];
	$scope.openJobsCount = 0
	$scope.CompletedJobsCount = 0;
	$scope.CloseJobsCount = 0;
	$scope.selectOptions =[{name : 'Audit Form', value : 'audit'}, {name : 'Customer Visit', value : 'customervisit'}, {name : 'After Service Inspection', value : 'afterserviceevaluation'}, {name : 'Technical Report', value : 'technicalreport'}, {name : 'Supplier Evaluation', value : 'supplierevaluation'}];
	$scope.searchText = {"JobType" : "", "Date" : "", "Text": ""};
	$scope.supplierCompetencyRating = 0
	$scope.supplierEtiquetteRating = 0;
	$scope.supplierPaymentRating = 0;
	$scope.settings = Settings;
	$scope.currentForm = {};
	$scope.currentDate = new Date();
	$scope.closedJobsMsg = '(Please wait...)'

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
			$scope.closedJobsMsg = '(Unavailable as you are offline)';
			console.log('Error fetching closed jobs count ' + err);
		})

	}
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

	function deleteOpenJob(idx){
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
		);
	}
	$scope.fetchOpenJobImages = function(index){
		if(!confirm('Are you sure you want to delete this Job ?')) return;
		var imageKeys = [];
		var index = index;
		DaoSvc.cursor('Unsent',
			function(json){
				//Checking if this is an image incase the are inspection that were saved offline
				if(json.ImageID){
					//Ensure that we are only getting images belonging to this current Form
					if(json.ImageID.indexOf($scope.InspectionForms[index].FormID) > -1){
					imageKeys.push(json.ImageID)
					}
				}
			},
			function(error){
				console.log('Error fetching from Unsent ' + error);
				deleteOpenJob(index);
				$scope.$emit('UNLOAD');
			}, function(){
				//Recursively Deleting the Images out of unsent and executing the save form when done
				deleteUnsentImages(0,imageKeys, deleteOpenJob, index);
			}
		);
	}
	function deleteUnsentImages(idx,keys, onComplete, index){
		if(idx >= keys.length){
			onComplete(index);
			return;
		}
		DaoSvc.deleteItem('Unsent',keys[idx],undefined,function(){
			idx = idx + 1;
			deleteUnsentImages(idx,keys,onComplete, index)
		}, function(){
			idx = idx + 1;
		deleteUnsentImages(idx, keys,onComplete, index)
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
            	json.timeString = moment(json.FormDate).format("DD MMM YYYY");
            	json.JSON = JSON.stringify(json.JSON);
            	inspection_forms.push(json);
            },
            function(err){
            	$scope.hide = true;
            	$scope.InspectionForms = [];
                $scope.$emit('UNLOAD');
            },
            function(){
            	$scope.data = inspection_forms;
            	$scope.InspectionForms = $scope.data;
                $scope.$emit('UNLOAD');
                $scope.$apply();
            }
        );
	}
	$scope.onInspectionClicked = function(idx){
		delete $scope.InspectionForms[idx].timeString;
		$scope.InspectionForms[idx].JSON = JSON.parse($scope.InspectionForms[idx].JSON);
		sessionStorage.setItem('currentForm', JSON.stringify($scope.InspectionForms[idx]));
		sessionStorage.setItem('fromJobsScreenCache', true);
		DaoSvc.deleteItem('InProgress', $scope.InspectionForms[idx].FormID, undefined, function(){console.log('Error Clearing InProgress table');}, function(){console.log('InProgress table cleared successfully');$scope.$apply();});
		$location.path($scope.InspectionForms[idx].JSON.Path);
	}
	$scope.onClearClicked = function(){
		$scope.searchText = {"JobType" : "", "Date" : "", "Text": ""};
		$scope.InspectionForms = $scope.data;
		
	}
	$scope.onSearchClicked = function(){
		if ($scope.searchText.JobType.length > 0){
			$scope.InspectionForms = $filter('filter')($scope.data, {FormType: $scope.searchText.JobType});
		} else if ($scope.searchText.Date !== ""){
			$scope.InspectionForms = $filter('filter')($scope.data, {timeString: moment($scope.searchText.Date).format('DD MMM YYYY')})
		}else{
			var search_results = [];
			$filter('filter')($scope.InspectionForms, function(item) {
		        if(item.JSON.includes($scope.searchText.Text)){
		            search_results.push(item);
		        }
	        	$scope.InspectionForms = search_results;
    		});
		}

	}
	function fetchRating(){
		var currentForm = JSON.parse(sessionStorage.getItem('formTobeRatedCache'));
		$scope.jobType = currentForm.FormType
		$scope.overallRating = currentForm.JSON.overallRating;
		$scope.supplierCompetencyRating = currentForm.JSON.supplierCompetencyRating;
		$scope.supplierEtiquetteRating = currentForm.JSON.supplierEtiquetteRating;
		$scope.supplierPaymentRating = currentForm.JSON.InvoicePaymentRating;
		$scope.additionalEquipmentRating = currentForm.JSON.additionalEquipmentRating;
		$scope.supplierStatus =  currentForm.JSON.SupplierStatus;
		$scope.vehicleFitnessRating = currentForm.JSON.vehicleFitnessRating;

	}

	function constructor(){
		window.scrollTo(0, 0);
		if(!$routeParams.mode){
			$scope.$emit('heading',{heading: 'Jobs' , icon : 'fa fa-sticky-note'});
			$scope.mode = 'jobs';
			fetchOpenCount();
			CompletedJobsCount();
			fechClosedCount();
		} else if ($routeParams.mode === 'open'){
			$scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: function(){$location.path('/')}});
			$scope.$emit('heading',{heading: 'Open Jobs' , icon : 'fa fa-sticky-note'});
			$scope.mode = $routeParams.mode;
			fetchInspections();
		} else if ($routeParams.mode === 'ratings'){
			$scope.mode = $routeParams.mode;
			$scope.$emit('heading',{heading: 'Remarks' , icon : 'fa fa-sticky-note'});
			$scope.$emit('left',{label: 'Home' , icon : 'fa fa-home', onclick: function(){sessionStorage.removeItem('formTobeRatedCache');$location.path('/');}});
			fetchRating();
		}
	}
	constructor();
});
