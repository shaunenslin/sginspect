coreApp.controller("ListOpenCtrl", function ($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter) {
	DaoSvc.openDB();
	$scope.InspectionForms = [];
	$scope.data = [];
	$scope.openJobsCount = 0
	$scope.CompletedJobsCount = 0;
	$scope.CloseJobsCount = 0;
	$scope.selectOptions =[{name : 'audit'}, {name : 'customervisit'}, {name : 'afterserviceevaluation'}, {name : 'technicalreport'}, {name : 'supplierevaluation'}];
	$scope.searchText = {"JobType" : "", "Date" : "", "Text": ""};
	$scope.showWarning = false;
	$scope.vehicleFitnessRating = 'Pass';
	$scope.overallRating = 0;
	$scope.additionalEquipmentRating = 0;
	$scope.supplierCompetencyRating = 0
	$scope.supplierEtiquetteRating = 0;
	$scope.supplierPaymentRating = 0;
	var rating = 0;
	var add_rating = 0;
	var competency_rating = 0;
	var etiquette_rating = 0;
	var payment_rating = 0;
	var audit_overall_ratings = {'cabinterior': 7,'steeringplay': 6,'electrical': 6,'engine_smoke': 13,'clutchoperation': 7,'brakes': 14,'gearselector': 6,'propshaftplay': 5,'cabexterior': 7,'rust': 5,'licensecard': 8,'fluidleaks': 7,'tyres' : 9,'fireextinguisher': 0,'fireextisvalid': 0,'fireextinguisherdate': 0,'equipment': 0,'abuserelatedcosts': 0};
	var audit_additional_equipment_ratings = {'fireextinguisher': 50, 'equipment': 50};
	var afterservice_overall_ratings = {'radiatorconditionchecked' : 6,'engineoillevelschecked' : 15,'oilfilterschecked' : 15,'oilleaks' : 6,'aircleanerserviced' : 15,'fuelfilterchecked' : 15,'gearboxbreatherserviced' : 3,'diffbreatherserviced' : 3,'diffsoilleleaks' : 3,'diffsoillevelchecked' : 2,'diffandrearaxlewashed' : 2,'fithwheelcleaned' : 2,'hardenedcinsert' : 2,'batteriesserviced' : 3,'springshaklesandtrunionlubricated' : 3,'kingsandsteeringjointgreased' : 3,'propsshaftuniversal' : 2};
	var supplier_overall_ratings = {'reception' : 9,'procedures' : 9,'workmanship' : 12,'downtime' : 9,'cleanliness' : 11,'conformity' : 8,'partsavailibility' : 8,'facility' : 8,'warranties' : 9,'bulletins' : 7,'specialtoolstraining' : 10};
	var o = {'good': 1, 'bad': 0, 'average': 0.5, 'yes': 0, 'no' :1, 'valid': 1, 'expired': 0, 'done': 1, 'attempted': 0.5, 'not done': 0, 'n/a': 1};
	var supplier_competency_ratings = {'techcomp' : 50,'commskills' : 50};
	var supplier_etiquette_ratings = {'phoneetiquette' : 34, 'authleadtime' : 33, 'professionalism' : 33};
	var supplier_rfcPayment_ratings = {'invoicepayment' : 50, 'rfcnotifications' : 50};

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
	//  table, key, idx, ponerror, poncomplete
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
    		if ($scope.InspectionForms.length === 0) $scope.showWarning = true;    
		}

	}
	function calculateAuditRating(savedForm, prop){
		if (o[typeof(savedForm.JSON[prop]) === 'string' && savedForm.JSON[prop].toLowerCase()] !== undefined){
				rating += Math.ceil(audit_overall_ratings[prop.toLowerCase()] * o[savedForm.JSON[prop].toLowerCase()]);
				if (audit_additional_equipment_ratings[prop.toLowerCase()] !== undefined){
					add_rating+= (prop.toLowerCase() === 'fireextinguisher') ? Math.ceil(audit_additional_equipment_ratings[prop.toLowerCase()]) : (Math.ceil(audit_additional_equipment_ratings[prop.toLowerCase()] * o[savedForm.JSON[prop].toLowerCase()]));
				}
			}
		if (!savedForm.JSON.vinmatch || !savedForm.JSON.regmatch || savedForm.JSON.Engine_Smoke == 'Bad' || savedForm.JSON.Brakes == 'Bad' || savedForm.JSON.LicenseCard == 'Expired') $scope.vehicleFitnessRating = 'Fail';
		$scope.overallRating = rating;
		$scope.additionalEquipmentRating = add_rating;
	}

	function calculateAfterServiceRating(savedForm, prop){
		if (o[typeof(savedForm.JSON[prop]) === 'string' && savedForm.JSON[prop].toLowerCase()] !== undefined){
			rating += Math.ceil(afterservice_overall_ratings[prop.toLowerCase()] * o[savedForm.JSON[prop].toLowerCase()]);
		}
		$scope.overallRating = rating;
	}
	function calculateSupplierRating(savedForm, prop){
		$scope.supplierStatus =  savedForm.JSON.SupplierStatus;
		if (o[typeof(savedForm.JSON[prop]) === 'string' && savedForm.JSON[prop].toLowerCase()] !== undefined){
			rating += isNaN(supplier_overall_ratings[prop.toLowerCase()]) ? 0 :  Math.ceil(supplier_overall_ratings[prop.toLowerCase()] * o[savedForm.JSON[prop].toLowerCase()]);
			competency_rating += isNaN(supplier_competency_ratings[prop.toLowerCase()]) ? 0 : Math.ceil(supplier_competency_ratings[prop.toLowerCase()] * o[savedForm.JSON[prop].toLowerCase()]);
			etiquette_rating += isNaN(supplier_etiquette_ratings[prop.toLowerCase()]) ? 0 : Math.ceil(supplier_etiquette_ratings[prop.toLowerCase()] * o[savedForm.JSON[prop].toLowerCase()]);
			payment_rating += isNaN(supplier_rfcPayment_ratings[prop.toLowerCase()]) ? 0 :  Math.ceil(supplier_rfcPayment_ratings[prop.toLowerCase()] * o[savedForm.JSON[prop].toLowerCase()]);	
		}
		$scope.overallRating = rating;
		$scope.supplierCompetencyRating = competency_rating ;
		$scope.supplierEtiquetteRating = etiquette_rating;
		$scope.supplierPaymentRating = payment_rating;
	}

	/*
     - rating maps to overallRating & add_rating maps out to additional Equipment rating
     - Method calculates the overall rating, additional equipment rating & vehicle fitness for audit & technical form based on the JSON values of the form submitted
	*/
	function calculateRatings(){
		var savedForm = JSON.parse(sessionStorage.getItem('formTobeRatedCache'));
		$scope.jobType = savedForm.FormType;
		for (var prop in savedForm.JSON){
			if (savedForm.FormType === 'audit'){
				calculateAuditRating(savedForm, prop);
			} else if (savedForm.FormType === 'afterserviceevaluation'){
				calculateAfterServiceRating(savedForm, prop);
			} else{
				calculateSupplierRating(savedForm, prop);
			}
			if (!savedForm.JSON.vinmatch || !savedForm.JSON.regmatch) $scope.vehicleFitnessRating = 'Fail';
		}
	}

	function constructor(){
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
			$scope.$emit('left',{label: 'Home' , icon : 'fa fa-home', onclick: function(){sessionStorage.removeItem('formTobeRatedCache'); $location.path('/');}});
			calculateRatings();

		}
	}
	constructor();
});