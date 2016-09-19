coreApp.controller('SupplierEvaluationCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc, OptionSvc, $filter, SyncSvc){
	$scope.isPhoneGap = Settings.isPhoneGap;
    $scope.signature = {technicaladvisor : "", workshopmanager: ""};
	$scope.evaluationImages = [];
	$scope.CleanlinessImages = [];
	$scope.SpecialToolsTrainingImages = [];
	$scope.ReceptionImages = [];
	$scope.currentDate = new Date();
	var competency_rating = 0;
	var etiquette_rating = 0;
	var payment_rating = 0;
	var rating = 0;
	var ratedResults = {};
	var supplier_overall_ratings = {'reception' : 9,'procedures' : 9,'workmanship' : 12,'downtime' : 9,'cleanliness' : 11,'conformity' : 8,'partsavailibility' : 8,'facility' : 8,'warranties' : 9,'bulletins' : 7,'specialtoolstraining' : 10};
	var o = {'good': 1, 'bad': 0, 'average': 0.5, 'yes': 1, 'no' :0, 'valid': 1, 'expired': 0, 'done': 1, 'attempted': 0.5, 'not done': 0, 'n/a': 1};
	var supplier_competency_ratings = {'techcomp' : 50,'commskills' : 50};
	var supplier_etiquette_ratings = {'phoneetiquette' : 34, 'authleadtime' : 33, 'professionalism' : 33};
	var supplier_rfcPayment_ratings = {'invoicepayment' : 50, 'rfcnotifications' : 50};
	/** The variable below is the svg represtion of an empty signature  **/
	var emptySignature = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4=";
	var Imgfiles = [];
    $scope.options = [
        {name:"Good"},
        {name:"Average"},
        {name:"Bad"}
    ];

    function newObject(){
		$scope.Form = {
			FormType: $routeParams.inspectiontype,
			ClientID: "",
			FormID: GlobalSvc.getGUID(),
			SupplierID  : "",
			UserID 		: GlobalSvc.getUser().UserID,
			FormDate	: moment().format('YYYY-MM-DD HH:mm:ss'),
			JSON 		: { SpecialToolsTraining: undefined}
		}
	}

	function newSupplierObject(){
        return  {
			SupplierID: "",
			Name: $scope.Form.JSON.Name,
			Active: 1,
			Address: $scope.Form.JSON.Address,
			Longitude: $scope.Form.JSON.Longitude,
			Latitude: $scope.Form.JSON.Latitude
		};
	}

	function saveSupplier(){
        var url = Settings.url + "Post?method=Supplier_modify";
        GlobalSvc.postData(url,newSupplierObject(),function(){
            // $scope.$emit('UNLOAD');
            $scope.$apply();
        },function(){
            // $scope.$emit('UNLOAD');
            $scope.$apply();
        },'SGISuppliers','modify',false,true);
    }

	$scope.onPhotoClicked = function(field, filenames){
		var reader = new FileReader();
		reader.onload = function() {
			$scope.image = reader.result;
			if ($scope.image){
				var key = $scope.Form.FormID + '_' + field + filenames.length  + '.png';
				CaptureImageSvc.savePhoto(key, $scope.Form.FormID, $scope.image, $scope.Form.ClientID, $scope.Form.FormDate);
				filenames.push(key)
			} else{
				$scope.capture = true;
			}
			$alert({content:"Image captured successfully", duration:5, placement:'top-right', type:'success', show:true});
			$scope.$apply();
		};
		if ($scope.isPhoneGap){
			var onSuccess = function(img){
                $scope.image = img;
                if ($scope.image){
                    var key = $scope.Form.FormID + '_' + field + filenames.length  + '.png';
                    CaptureImageSvc.savePhoto(key, $scope.Form.FormID, $scope.image, $scope.Form.ClientID, $scope.Form.FormDate);
                    filenames.push(key);
                } else{
                    $scope.capture = true;
                }
                $alert({content:"Image captured successfully", duration:5, placement:'top-right', type:'success', show:true});
                $scope.$apply();
            }
			var onError = function(err){
				$alert({content:'Error: ' + err, duration: 5, placement: 'top-right', type: 'danger', show: true});
			}
			CaptureImageSvc.takePhoto(onSuccess, onError);
		} else{
			var image = $('#' + field + '-select')[0];

			if (image && image.files.length > 0){
	    		reader.readAsDataURL(image.files[0]);
	    	}
		}
	}


	/*
	 * Method removes individual images from multiple file select in the view =>[other photo's]
	 * Remove the name in the chosen field if there are no records
    */
    $scope.removeImage = function(idx, filenames){
		DaoSvc.deleteItem('Unsent',filenames[idx],undefined,function(){
     			$alert({content:'Error removing image', duration: 5, placement: 'top-right', type: 'danger', show: true});
			},function(){
     			filenames.splice(idx,1);
         		$scope.$apply();
		});
    }

	$scope.onBackClicked = function(){
		$scope.Form.JSON = JSON.stringify($scope.Form.JSON);
		sessionStorage.setItem('currentForm', JSON.stringify($scope.Form));
		sessionStorage.removeItem('fromJobsScreenCache');
		$location.path('/jobs/open');
	}

	$scope.fetchGPS = function(){
		$scope.$emit('LOAD');
		GlobalSvc.getGPS(function(position){
			$scope.Form.JSON.Latitude  = position ? position.coords.latitude : "";
			$scope.Form.JSON.Longitude = position ? position.coords.longitude : "";
			$alert({content:"GPS location captured successfully", duration:5, placement:'top-right', type:'success', show:true});
			$scope.$emit('UNLOAD');
			$scope.$apply();
		},function(error){
			$alert({content:"GPS location not captured. Please ensure your location settings are enabled ", duration:5, placement:'top-right', type:'danger', show:true});
			$scope.$emit('UNLOAD');
		});
	}


	/** This method create an svg image of the signature captured **/
	function createSignatureImage(datapair,type){
		var image = {};
		image.ID = $scope.Form.FormID + "_" + type;
		image.SupplierID = GlobalSvc.getUser().SupplierID;
		image.FileData = datapair[1];
		image.Type = datapair[0];
		if (image.Type.toLowerCase() == 'image/svg+xml;base64'){
			image.Name = image.Id + '.svgx';
		}
		return image;
	}
	$scope.syncCompleted = function(reload){
		sessionStorage.removeItem('currentForm');
		$alert({ content: "Supplier Evaluation Complete", duration: 5, placement: 'top-right', type: 'success', show: true});
		$scope.$emit('UNLOAD');
		$location.path('/jobs/ratings');
	}

	$scope.saveSignature = function(){
		$scope.$emit('LOAD');
		// Check the very last field on format, if it has a value, assume other fields been filled in OK
		if(!$scope.Form.JSON.SpecialToolsTraining){
			$alert({ content: "Please enter in all fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
		}
		// Cater for  when filling existing form.
		if(!$scope.Form.JSON.RFCNotifications && $scope.mode === 'existing'){
			$alert({ content: "Please enter in all fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
		}

		// Now check if any items dont have comments or where pictures are needed
		for (prop in $scope.Form.JSON) {
			if ($scope.Form.JSON[prop] === "Bad" || $scope.Form.JSON[prop] === "Average") {
				if (!$scope.Form.JSON[prop + "Comment"]){
					$alert({ content: "Please enter comments when you have selected " + $scope.Form.JSON[prop], duration: 5, placement: 'top-right', type: 'danger', show: true});
		            $scope.$emit('UNLOAD');
		            return;
				}
				if ($scope[prop + "Images"]) {
					if ($scope[prop + "Images"].length == 0) {
						$alert({ content: "Please take pictures for " + prop, duration: 5, placement: 'top-right', type: 'danger', show: true});
			            $scope.$emit('UNLOAD');
			            return;
					}
				}
			}
			//Doing an extra validation of the whole form incase the last value is filled in but another value is null
			if(!$scope.Form.JSON[prop]){
				$alert({ content: "Please enter in all fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
				$scope.$emit('UNLOAD');
				return;
			}
		}
		if ($scope.evaluationImages.length === 0) {
			$alert({ content: "Please take pictures for Evaluation", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
		}

        if($scope.signature.technicaladvisor[1] === emptySignature || !$scope.signature.technicaladvisor){
            $alert({ content: "Technical advisor to sign before you continue", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
        }
		if($scope.signature.workshopmanager[1] === emptySignature || !$scope.signature.workshopmanager){
            $alert({ content: "Workshop manager to sign before you continue", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
        }
		saveForm();
	}

	function fetchSuppliers(){
		$scope.Suppliers = [];
		DaoSvc.cursor('SGISuppliers',
			function(json){
				$scope.Suppliers.push(json);
			}, function(err){
				$alert({content: "Error fetching Suppliers " + err, duration:5, placement:'top-right', type:'danger', show:true});
			}
		);
	}
	function savePartialForm(){
		// Partial Save of Form this.put = function (json, table, key, ponsuccesswrite, ponerror, poncomplete)
		$scope.Form.JSON.Path = $location.path();
		$scope.Form.JobType = 'Open Jobs';
		DaoSvc.put($scope.Form, 'InProgress', $scope.Form.FormID, function(){console.log('Partial Save of ' + $location.path() + ' successful')},function(){console.log('Partial Save of' + $location.path() + ' failed')},function(){$scope.$apply();});
	}

	function deleteCurrentPartialForm(FormID){
		DaoSvc.deleteItem('InProgress', FormID, undefined, function(){console.log('Error Clearing InProgress table');}, function(){console.log('InProgress table cleared successfully');$scope.$apply();});
	}

	function saveForm(){
		$scope.$emit('LOAD');
		delete $scope.Form.JSON.Path;
		delete $scope.Form.JobType;
		delete $scope.Form.JSON.existingSupplier;
		$scope.hideForm = true;
		saveSupplier();
		deleteCurrentPartialForm($scope.Form.FormID);
		calculateSupplierRating();
		//Create Unique Key For Signature(s) and/or image(s)
		$scope.Form.JSON.evaluationImages =  $scope.evaluationImages;
		$scope.Form.JSON.CleanlinessImages = $scope.CleanlinessImages;
		$scope.Form.JSON.SpecialToolsTrainingImages = $scope.SpecialToolsTrainingImages;
		$scope.Form.JSON.ReceptionImages = $scope.ReceptionImages;

		var technicaladvisorSignature =  createSignatureImage($scope.signature.technicaladvisor, 'technicaladvisor');
		var workshopmanagerSignature =  createSignatureImage($scope.signature.workshopmanager, 'workshopmanager');
		var key_advisor = $scope.Form.FormID + '_techAdvisorSig.svgx';
		var key_manager = $scope.Form.FormID + '_workshopManagerSig.svgx';
		$scope.Form.JSON.TechAdvisorSignature = key_advisor;
		$scope.Form.JSON.ManagerSignature = key_manager;
		CaptureImageSvc.savePhoto(key_advisor, $scope.Form.FormID, technicaladvisorSignature.FileData, $scope.Form.ClientID, $scope.Form.FormDate);
		CaptureImageSvc.savePhoto(key_manager, $scope.Form.FormID, workshopmanagerSignature.FileData, $scope.Form.ClientID, $scope.Form.FormDate);
		sessionStorage.setItem('formTobeRatedCache', JSON.stringify($scope.Form));
		$scope.Form.JSON = JSON.stringify($scope.Form.JSON);
		var success = function(){
			// Now send images
			SyncSvc.sync("SGInspector", GlobalSvc.getUser().UserID, $scope, false, true);
		}

		var error = function(err){
			$scope.$emit('UNLOAD');
			$alert({ content:   "Warning: Items have been saved, please sync as soon as possible as you appear to be offline", duration: 5, placement: 'top-right', type: 'warning', show: true});
			sessionStorage.removeItem('currentForm');
			$location.path('/jobs/ratings');
		}
		var url = Settings.url + 'Post?method=SGIFormHeaders_modify';
		GlobalSvc.postData(url, $scope.Form, success, error, 'SGIFormHeaders', 'Modify', false, true);
	}

	/*
	 - Reference variables declared at controller beginning to understand calculation
	 - o contains the units by which we divide/multiply each value from the ratings obj's based off of properties of the JSON 
	 - We do a safe check to avoid NaN values from the calculation
	*/
	function calculateSupplierRating(){
		for (var prop in $scope.Form.JSON){
			if (o[typeof($scope.Form.JSON[prop]) === 'string' && $scope.Form.JSON[prop].toLowerCase()] !== undefined){
				//Calculate ratings per overall, competency, payment &  etiquette criteria
				rating += isNaN(supplier_overall_ratings[prop.toLowerCase()]) ? 0 :  Math.ceil(supplier_overall_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]);
				competency_rating += isNaN(supplier_competency_ratings[prop.toLowerCase()]) ? 0 : Math.ceil(supplier_competency_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]);
				etiquette_rating += isNaN(supplier_etiquette_ratings[prop.toLowerCase()]) ? 0 : Math.ceil(supplier_etiquette_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]);
				payment_rating += isNaN(supplier_rfcPayment_ratings[prop.toLowerCase()]) ? 0 :  Math.ceil(supplier_rfcPayment_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]);

				// ratedResults will be attached to form 
				if (prop.toLowerCase() === 'phoneetiquette' || prop.toLowerCase() === 'professionalism' || prop.toLowerCase() === 'authleadtime')
					ratedResults[prop + 'Rating'] = isNaN(supplier_etiquette_ratings[prop.toLowerCase()]) ? 0 : Math.ceil(supplier_etiquette_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]);
				else if(prop.toLowerCase() === 'techcomp' || prop.toLowerCase() === 'commskills')
					ratedResults[prop + 'Rating'] = isNaN(supplier_competency_ratings[prop.toLowerCase()]) ? 0 : Math.ceil(supplier_competency_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]);
				else if(prop.toLowerCase() === 'invoicepayment' || prop.toLowerCase() === 'rfCnotifications')
					ratedResults[prop + 'Rating'] = isNaN(supplier_rfcPayment_ratings[prop.toLowerCase()]) ? 0 :  Math.ceil(supplier_rfcPayment_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]);

				else
					ratedResults[prop + 'Rating'] = isNaN(supplier_overall_ratings[prop.toLowerCase()]) ? 0 :  Math.ceil(supplier_overall_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]);
			}
		}
		//merging the two objects
		for (var prop in ratedResults){$scope.Form.JSON[prop] = ratedResults[prop]};
		$scope.Form.JSON.overallRating = rating;
		$scope.Form.JSON.supplierEtiquetteRating = etiquette_rating;
		$scope.Form.JSON.supplierCompetencyRating = competency_rating; 
		$scope.Form.JSON.InvoicePaymentRating = payment_rating;
	}

	function watchSupplierChanged(){
		$scope.$watch(function(scope) { return scope.Form.JSON.SupplierID },
			function(newValue, oldValue) {
			  	if ($scope.mode === 'existing'){
				  	var found = $filter('filter')($scope.Suppliers,{SupplierID:$scope.Form.JSON.SupplierID});
					if (found.length > 0){
						$scope.currentsupplier = found[0];
						$scope.Form.JSON.Name = {"existingSupplier" : found[0].Name}
					}
			  	}
		  	}
		 );
	}
	$scope.$watch("Form.JSON", function(){if($scope.Form.JSON.Path !== undefined) savePartialForm();}, true);

	function constructor(){
		$scope.mode = $routeParams.mode;
		window.scrollTo(0, 0);
		DaoSvc.openDB();
        $scope.$emit('heading',{heading: 'Supplier Evaluation', icon : 'fa fa-check-square-o' });
		if (sessionStorage.getItem('fromJobsScreenCache')) $scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: $scope.onBackClicked});
		$scope.$emit('right', {label: 'Save', icon: 'fa fa-save', onclick: $scope.saveSignature});
		$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
		fetchSuppliers();
		watchSupplierChanged();
		savePartialForm();
	}
	constructor();
});
