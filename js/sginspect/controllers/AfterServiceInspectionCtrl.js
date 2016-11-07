coreApp.controller('AfterServiceInspectionCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc, OptionSvc, $filter, SyncSvc){
	$scope.isPhoneGap = Settings.isPhoneGap;
	$scope.signature = {"inspector" : "", "techAdvisor" : "", "manager" : ""};
	$scope.currentDate = new Date();
	DaoSvc.openDB();
	/** The variable below is the svg represtion of an empty signature  **/
	var emptySignature = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4=";

    $scope.kilometerImages = [];
    $scope.otherPhotos = [];

    $scope.inspectInspectionTypes = [
        {  name : "Done"},
        {  name : "Attempted"},
        {  name : "Not Done"},
    ];

    $scope.inspectInspectionTypesWithNA = [
        {  name : "Done"},
        {  name : "Attempted"},
        {  name : "Not Done"},
        {  name : "N/A"},
    ];
    var afterservice_overall_ratings = {'radiatorconditionchecked' : 6,'engineoillevelschecked' : 15,'oilfilterschecked' : 15,'oilleaks' : 6,'aircleanerserviced' : 15,'fuelfilterchecked' : 15,'gearboxbreatherserviced' : 3,'diffbreatherserviced' : 3,'diffsoilleleaks' : 3,'diffsoillevelchecked' : 2,'diffandrearaxlewashed' : 2,'fithwheelcleaned' : 2,'hardenedcinsert' : 2,'batteriesserviced' : 3,'springshaklesandtrunionlubricated' : 3,'kingsandsteeringjointgreased' : 3,'propsshaftuniversal' : 2};
	var o = {'good': 1, 'bad': 0, 'average': 0.5, 'yes': 1, 'no' :0, 'valid': 1, 'expired': 0, 'done': 1, 'attempted': 0.5, 'not done': 0, 'n/a': 1};
	var rating = 0;
	var ratedResults = {};


	$scope.onBackClicked = function(){
		$scope.Form.JSON = JSON.stringify($scope.Form.JSON);
		sessionStorage.setItem('currentForm', JSON.stringify($scope.Form));
		sessionStorage.removeItem('fromJobsScreenCache');
		$location.path('/jobs/open');
	}

	$scope.onPhotoClicked = function(field, filenames){
		var reader = new FileReader();
		reader.onload = function() {
			$scope.image = reader.result;
			if ($scope.image){
				var key = $scope.Form.FormID + '_' + field + filenames.length  + '.png';
				CaptureImageSvc.savePhoto(key, $scope.Form.FormID, $scope.image, $scope.Form.ClientID, $scope.Form.FormDate);
				filenames.push(key);
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

    $scope.removeImage = function(idx, filenames){
		DaoSvc.deleteItem('Unsent',filenames[idx],undefined,function(){
			$alert({content:'Error removing image', duration: 5, placement: 'top-right', type: 'danger', show: true});
		},function(){
			filenames.splice(idx,1);
    		$scope.$apply();
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

	function fetchGPS(){
		$scope.$emit('LOAD');
		GlobalSvc.getGPS(function(position){
			$scope.Form.JSON.Latitude  = position ? position.coords.latitude : "";
			$scope.Form.JSON.Longitude = position ? position.coords.longitude : "";
		},function(error){
			$scope.Form.JSON.Latitude  = "";
			$scope.Form.JSON.Longitude =  "";
		});
	}
	$scope.addComments = function(comment){
		if (!comment) return;
		if (!$scope.Form.JSON.otherCommentsp) $scope.Form.JSON.otherComments = [];
		$scope.Form.JSON.otherComments.push(comment);
		$scope.Form.JSON.Comments = '';
	}

	$scope.removeComment = function(idx){
		$scope.Form.JSON.otherComments.splice(idx,1);
    }

	$scope.saveSignature = function(){
		$scope.$emit('LOAD');
		if ($scope.Form.JSON.vinmatch && $scope.Form.JSON.licensematch){
			if(!$scope.Form.JSON.actionByService){
				$alert({ content: "Please enter in all fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
	            $scope.$emit('UNLOAD');
	            return;
			}

			for (prop in $scope.Form.JSON) {
				if (($scope.Form.JSON[prop] === "Not Done"|| $scope.Form.JSON[prop] === "Attempted") && !$scope.Form.JSON[prop + "Comment"]){
					$alert({ content: "Please enter comments where you have selected " + $scope.Form.JSON[prop] , duration: 5, placement: 'top-right', type: 'danger', show: true});
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
				if (($scope.Form.JSON[prop] === "No" && prop === 'diffsOilLeLeaks') && !$scope.Form.JSON[prop + "Comment"]){
					$alert({ content: "Please enter comments where you have selected " + $scope.Form.JSON[prop] , duration: 5, placement: 'top-right', type: 'danger', show: true});
		        	$scope.$emit('UNLOAD');
		           	return;
				}
				//Doing an extra validation of the whole form incase the last value is filled in but another value is null
				if($scope.Form.JSON[prop] === undefined){
					$alert({ content: "Please enter in all fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
					$scope.$emit('UNLOAD');
					return;
				}
			}
		}
		

        if($scope.signature.inspector[1] === emptySignature || !$scope.signature.inspector){
            $alert({ content: "You cannot continue without adding the required signature", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
			return;
        }
		saveForm();
	}
	$scope.syncCompleted = function(reload){
		$scope.$emit('UNLOAD');
		var path = (JSON.parse(sessionStorage.getItem('currentForm')).JSON.vinmatch && JSON.parse(sessionStorage.getItem('currentForm')).JSON.licensematch) ? '/jobs/ratings' : '/';
		$alert({ content: "Your Form has been saved Ok.", duration: 5, placement: 'top-right', type: 'success', show: true});
		sessionStorage.removeItem('currentImage');
		sessionStorage.removeItem('currentLicenceImage');
		sessionStorage.removeItem('currentForm');
		$location.path(path);	
	}
	function saveForm(){
		if (!$scope.Form.JSON.otherComments) {
			$scope.Form.JSON.otherComments = [];
			$scope.Form.JSON.otherComments[0] = {otherComment : $scope.Form.JSON.Comments};
		}
		delete $scope.Form.JSON.Comments;
		delete $scope.Form.JSON.Path;
		delete $scope.Form.JobType;
		deleteCurrentPartialForm($scope.Form.FormID);
		calculateAfterServiceRating();
		$scope.Form.JSON.kilometerImages = $scope.kilometerImages;
		$scope.Form.JSON.otherPhotos = $scope.otherPhotos;
		var inspectorSignature =  createSignatureImage($scope.signature.inspector, 'Inspector');
		var key = $scope.Form.FormID + '_inspectorSig.svgx';
		$scope.Form.JSON.Signature = key;
		CaptureImageSvc.savePhoto(key, $scope.Form.FormID, inspectorSignature.FileData, $scope.Form.ClientID, $scope.Form.FormDate);
		deleteCurrentPartialForm($scope.Form.FormID);
		sessionStorage.setItem('formTobeRatedCache', JSON.stringify($scope.Form));
		$scope.Form.JSON = fetchJson();
		$scope.Form.JSON = JSON.stringify($scope.Form.JSON);
		var success = function(){
			// Now send images
			SyncSvc.sync("SGInspector", GlobalSvc.getUser().UserID, $scope, false, true);
		}
		var error = function(err){
			$scope.$emit('UNLOAD');
			$alert({ content:   "Warning: Items have been saved, please sync as soon as possible as you appear to be offline", duration: 5, placement: 'top-right', type: 'warning', show: true});
			$location.path('/');
		}
		var url = Settings.url + 'Post?method=SGIFormHeaders_modify';
		GlobalSvc.postData(url, $scope.Form, success, error, 'SGIFormHeaders', 'Modify', false, true);
	}


	/*
	 - Reference variables declared at controller beginning to understand calculation
	 - o contains the units by which we divide/multiply each value from the ratings obj's based off of properties of the JSON
	 - We do a safe check to avoid NaN values from the calculation
	 - The fire extinguisher ONLY has a value for additional equipment rating 
	*/

	function calculateAfterServiceRating(){
		 for(var prop in  $scope.Form.JSON){
		 	if (o[typeof($scope.Form.JSON[prop]) === 'string' && $scope.Form.JSON[prop].toLowerCase()] !== undefined){
				rating += isNaN(afterservice_overall_ratings[prop.toLowerCase()]) ? 0 : Math.ceil(afterservice_overall_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]);
				ratedResults[prop + 'Rating'] = isNaN(afterservice_overall_ratings[prop.toLowerCase()]) ? 0 :  Math.ceil(afterservice_overall_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]);
			}
		 }
		//merging the two objects
		for (var prop in ratedResults){$scope.Form.JSON[prop] = ratedResults[prop]};
		$scope.Form.JSON.overallRating = rating
		
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
	$scope.$watch("Form.JSON", function(){if($scope.Form.JSON.Path !== undefined) savePartialForm();}, true);

	function fetchJson(){
		return {
		    "Longitude": $scope.Form.JSON.Longitude ? $scope.Form.JSON.Longitude : "",
		    "Latitude": $scope.Form.JSON.Latitude ? $scope.Form.JSON.Latitude : "",
		    "User_Name": $scope.Form.JSON.User_Name ? $scope.Form.JSON.User_Name : "",
		    "Signature": $scope.Form.JSON.Signature ? $scope.Form.JSON.Signature : "",
		    "CustomerName": $scope.Form.JSON.CustomerName ? $scope.Form.JSON.CustomerName : "",
		    "ExpiryDate": $scope.Form.JSON.ExpiryDate ? $scope.Form.JSON.ExpiryDate : "",
		    "LicenseNumber": $scope.Form.JSON.LicenseNumber ? $scope.Form.JSON.LicenseNumber : "",
		    "Tarre": $scope.Form.JSON.Tarre ? $scope.Form.JSON.Tarre : "",
		    "DiscNo": $scope.Form.JSON.DiscNo ? $scope.Form.JSON.DiscNo : "",
		    "RegistrationNo": $scope.Form.JSON.RegistrationNo ? $scope.Form.JSON.RegistrationNo : "",
		    "VehicleRegistrationNo": $scope.Form.JSON.VehicleRegistrationNo ? $scope.Form.JSON.VehicleRegistrationNo : "",
		    "VehicleDescription": $scope.Form.JSON.VehicleDescription ? $scope.Form.JSON.VehicleDescription : "",
		    "Make": $scope.Form.JSON.Make ? $scope.Form.JSON.Make : "",
		    "EngineNo": $scope.Form.JSON.EngineNo ? $scope.Form.JSON.EngineNo : "",
		    "Color": $scope.Form.JSON.Color ? $scope.Form.JSON.Color : "",
		    "NatisLicenseNumber": $scope.Form.JSON.NatisLicenseNumber ? $scope.Form.JSON.NatisLicenseNumber : "",
		    "RegistrationFrequency": $scope.Form.JSON.RegistrationFrequency ? $scope.Form.JSON.RegistrationFrequency : "",
		    "Model": $scope.Form.JSON.Model ? $scope.Form.JSON.Model : "",
		    "LiceneNumber": $scope.Form.JSON.LiceneNumber ? $scope.Form.JSON.LiceneNumber : "",
		    "VinNumber": $scope.Form.JSON.VinNumber ? $scope.Form.JSON.VinNumber : "",
		    "LicenceExpiryDate": $scope.Form.JSON.LicenceExpiryDate ? $scope.Form.JSON.LicenceExpiryDate : "",
		    "kilometer": $scope.Form.JSON.kilometer ? $scope.Form.JSON.kilometer : "",
		    "serviceProvider": $scope.Form.JSON.serviceProvider ? $scope.Form.JSON.serviceProvider : "",
		    "dateOfService": $scope.Form.JSON.dateOfService ? $scope.Form.JSON.dateOfService : "",
		    "radiatorConditionChecked": $scope.Form.JSON.radiatorConditionChecked ? $scope.Form.JSON.radiatorConditionChecked : "",
		    "radiatorConditionCheckedComment": $scope.Form.JSON.radiatorConditionCheckedComment ? $scope.Form.JSON.radiatorConditionCheckedComment : "",
		    "engineOilLevelsChecked": $scope.Form.JSON.engineOilLevelsChecked ? $scope.Form.JSON.engineOilLevelsChecked : "",
		    "engineOilLevelsCheckedComment": $scope.Form.JSON.engineOilLevelsCheckedComment ? $scope.Form.JSON.engineOilLevelsCheckedComment : "",
		    "oilFiltersChecked": $scope.Form.JSON.oilFiltersChecked ? $scope.Form.JSON.oilFiltersChecked : "",
		    "oilFiltersCheckedComment": $scope.Form.JSON.oilFiltersCheckedComment ? $scope.Form.JSON.oilFiltersCheckedComment : "",
		    "oilLeaks": $scope.Form.JSON.oilLeaks ? $scope.Form.JSON.oilLeaks : "",
		    "oilLeaksComment": $scope.Form.JSON.oilLeaksComment ? $scope.Form.JSON.oilLeaksComment : "",
		    "airCleanerServiced": $scope.Form.JSON.airCleanerServiced ? $scope.Form.JSON.airCleanerServiced : "",
		    "airCleanerServicedComment": $scope.Form.JSON.airCleanerServicedComment ? $scope.Form.JSON.airCleanerServicedComment : "",
		    "FuelFilterChecked": $scope.Form.JSON.FuelFilterChecked ? $scope.Form.JSON.FuelFilterChecked : "",
		    "FuelFilterCheckedComment": $scope.Form.JSON.FuelFilterCheckedComment ? $scope.Form.JSON.FuelFilterCheckedComment : "",
		    "gearBoxBreatherServiced": $scope.Form.JSON.gearBoxBreatherServiced ? $scope.Form.JSON.gearBoxBreatherServiced : "",
		    "gearBoxBreatherServicedComment": $scope.Form.JSON.gearBoxBreatherServiced ? $scope.Form.JSON.gearBoxBreatherServiced : "",
		    "diffBreatherServiced": $scope.Form.JSON.gearBoxBreatherServiced ? $scope.Form.JSON.gearBoxBreatherServiced : "",
		    "diffBreatherServicedComment": $scope.Form.JSON.diffBreatherServicedComment ? $scope.Form.JSON.diffBreatherServicedComment : "",
		    "diffsOilLeLeaks": $scope.Form.JSON.diffsOilLeLeaks ? $scope.Form.JSON.diffsOilLeLeaks : "",
		    "diffsOilLeLeaksComment": $scope.Form.JSON.diffsOilLeLeaksComment ? $scope.Form.JSON.diffsOilLeLeaksComment : "",
		    "diffsOilLevelChecked": $scope.Form.JSON.diffsOilLevelChecked ? $scope.Form.JSON.diffsOilLevelChecked : "",
		    "diffsOilLevelCheckedComment": $scope.Form.JSON.diffsOilLevelCheckedComment ? $scope.Form.JSON.diffsOilLevelCheckedComment : "",
		    "diffAndRearAxleWashed": $scope.Form.JSON.diffAndRearAxleWashed ? $scope.Form.JSON.diffAndRearAxleWashed : "",
		    "diffAndRearAxleWashedComment": $scope.Form.JSON.diffAndRearAxleWashedComment ? $scope.Form.JSON.diffAndRearAxleWashedComment : "",
		    "fithWheelCleaned": $scope.Form.JSON.fithWheelCleaned ? $scope.Form.JSON.fithWheelCleaned : "",
		    "fithWheelCleanedComment": $scope.Form.JSON.fithWheelCleanedComment ? $scope.Form.JSON.fithWheelCleanedComment : "",
		    "hardenedCInsert": $scope.Form.JSON.hardenedCInsert ? $scope.Form.JSON.hardenedCInsert : "",
		    "hardenedCInsertComment": $scope.Form.JSON.hardenedCInsertComment ? $scope.Form.JSON.hardenedCInsertComment : "",
		    "batteriesServiced": $scope.Form.JSON.batteriesServiced ? $scope.Form.JSON.batteriesServiced : "",
		    "batteriesServicedComment": $scope.Form.JSON.batteriesServicedComment ? $scope.Form.JSON.batteriesServicedComment : "",
		    "springShaklesAndTrunionLubricated": $scope.Form.JSON.springShaklesAndTrunionLubricated ? $scope.Form.JSON.springShaklesAndTrunionLubricated : "",
		    "springShaklesAndTrunionLubricatedComment": $scope.Form.JSON.springShaklesAndTrunionLubricatedComment ? $scope.Form.JSON.springShaklesAndTrunionLubricatedComment : "",
		    "kingsAndSteeringJointGreased": $scope.Form.JSON.kingsAndSteeringJointGreased ? $scope.Form.JSON.kingsAndSteeringJointGreased : "",
		    "kingsAndSteeringJointGreasedComment": $scope.Form.JSON.kingsAndSteeringJointGreasedComment ? $scope.Form.JSON.kingsAndSteeringJointGreasedComment : "",
		    "propsShaftUniversal": $scope.Form.JSON.propsShaftUniversal ? $scope.Form.JSON.propsShaftUniversal : "",
		    "propsShaftUniversalComment": $scope.Form.JSON.propsShaftUniversalComment ? $scope.Form.JSON.propsShaftUniversalComment : "",
		    "dateOfInspection": $scope.Form.JSON.dateOfInspection ? $scope.Form.JSON.dateOfInspection : "",
		    "otherComments": $scope.Form.JSON.otherComments ? $scope.Form.JSON.otherComments : [],
		    "actionByService": $scope.Form.JSON.actionByService ? $scope.Form.JSON.actionByService : "",
		    "radiatorConditionCheckedRating": $scope.Form.JSON.radiatorConditionCheckedRating ? $scope.Form.JSON.radiatorConditionCheckedRating : "",
		    "engineOilLevelsCheckedRating": $scope.Form.JSON.engineOilLevelsCheckedRating ? $scope.Form.JSON.engineOilLevelsCheckedRating : "",
		    "oilFiltersCheckedRating": $scope.Form.JSON.oilFiltersCheckedRating ? $scope.Form.JSON.oilFiltersCheckedRating : "",
		    "oilLeaksRating": $scope.Form.JSON.oilLeaksRating ? $scope.Form.JSON.oilLeaksRating : "",
		    "airCleanerServicedRating": $scope.Form.JSON.airCleanerServicedRating ? $scope.Form.JSON.airCleanerServicedRating : "",
		    "FuelFilterCheckedRating": $scope.Form.JSON.FuelFilterCheckedRating ? $scope.Form.JSON.FuelFilterCheckedRating : "",
		    "gearBoxBreatherServicedRating": $scope.Form.JSON.gearBoxBreatherServicedRating ? $scope.Form.JSON.gearBoxBreatherServicedRating : "",
		    "diffBreatherServicedRating": $scope.Form.JSON.diffBreatherServicedRating ? $scope.Form.JSON.diffBreatherServicedRating : "",
		    "diffsOilLeLeaksRating": $scope.Form.JSON.diffsOilLeLeaksRating ? $scope.Form.JSON.diffsOilLeLeaksRating : "",
		    "diffsOilLevelCheckedRating": $scope.Form.JSON.diffsOilLevelCheckedRating ? $scope.Form.JSON.diffsOilLevelCheckedRating : "",
		    "diffAndRearAxleWashedRating": $scope.Form.JSON.diffAndRearAxleWashedRating ? $scope.Form.JSON.diffAndRearAxleWashedRating : "",
		    "fithWheelCleanedRating": $scope.Form.JSON.fithWheelCleanedRating ? $scope.Form.JSON.fithWheelCleanedRating : "",
		    "hardenedCInsertRating": $scope.Form.JSON.hardenedCInsertRating ? $scope.Form.JSON.hardenedCInsertRating : "",
		    "batteriesServicedRating": $scope.Form.JSON.batteriesServicedRating ? $scope.Form.JSON.batteriesServicedRating : "",
		    "springShaklesAndTrunionLubricatedRating": $scope.Form.JSON.springShaklesAndTrunionLubricatedRating ? $scope.Form.JSON.springShaklesAndTrunionLubricatedRating : "",
		    "kingsAndSteeringJointGreasedRating": $scope.Form.JSON.kingsAndSteeringJointGreasedRating ? $scope.Form.JSON.kingsAndSteeringJointGreasedRating : "",
		    "propsShaftUniversalRating": $scope.Form.JSON.propsShaftUniversalRating ? $scope.Form.JSON.propsShaftUniversalRating : "",
		    "overallRating": $scope.Form.JSON.overallRating ? $scope.Form.JSON.overallRating : "",
		    "kilometerImages":  $scope.Form.JSON.kilometerImages ?  $scope.Form.JSON.kilometerImages : [],
		    "otherPhotos": $scope.Form.JSON.otherPhotos ? $scope.Form.JSON.otherPhotos : [],
		    "vinimage": $scope.Form.JSON.vinimage ? $scope.Form.JSON.vinimage : "",
		    "regimage": $scope.Form.JSON.regimage ? $scope.Form.JSON.regimage : "",
		    "vinmatch": $scope.Form.JSON.vinmatch,
		    "licensematch": $scope.Form.JSON.licensematch,
		    "Branch": $scope.Form.JSON.Branch ? $scope.Form.JSON.Branch : ""
		};
	}

	function constructor(){
		window.scrollTo(0, 0);
		$scope.$emit('LOAD');
	    if (sessionStorage.getItem('fromJobsScreenCache')) $scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: $scope.onBackClicked});
        $scope.$emit('right', {label: 'Next', icon: 'fa fa-chevron-right', onclick: $scope.onNextClicked, rightIcon: true});
        $scope.$emit('heading',{heading: 'After Service Inspection', icon : 'fa fa-car'});
        $scope.$emit('right', {label: 'Save', icon: 'fa fa-save', onclick: $scope.saveSignature});
        $scope.Form = JSON.parse(sessionStorage.getItem('currentForm'));
        $scope.Form.JSON.LiceneNumber = sessionStorage.getItem('fromJobsScreenCache') ? $scope.Form.JSON.LiceneNumber : sessionStorage.getItem('currentLicenseNumber');
        $scope.Form.JSON.VinNumber = sessionStorage.getItem('fromJobsScreenCache') ? $scope.Form.JSON.VinNumber : sessionStorage.getItem('currentVinNumber');
        $scope.Form.JSON.LicenceExpiryDate = sessionStorage.getItem('fromJobsScreenCache') ? $scope.Form.JSON.LicenceExpiryDate : sessionStorage.getItem('currentExpirayDate');
		fetchGPS();
		savePartialForm();
        $scope.$emit('UNLOAD');
	}
	constructor();
});
