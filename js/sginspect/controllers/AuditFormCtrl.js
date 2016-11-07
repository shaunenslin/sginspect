coreApp.controller('AuditFormCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc, $filter, SyncSvc){
	$scope.isPhoneGap = Settings.isPhoneGap;
	$scope.image = "";
	$scope.signature = {"inspector" : ""};
	/** The variable below is the svg represtion of an empty signature  **/
	var emptySignature = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4=";
	$scope.supplierStatus = "";
	$scope.KilometersImages = [];
	$scope.TyresImages = [];
	$scope.other_photosimages = [];
	$scope.currentDate = new Date();
	$scope.vehicleFitnessRating = 'Pass';
	$scope.selectOptions =[{name : "Good"}, {name : "Average"}, {name : "Bad"}];
	$scope.booleanValues = [{value : "Yes"},{value : "No"}];
	$scope.expiryStatus = [{status : "Valid"}, {status: "Expired"}];
	$scope.overallRating = 0;
	$scope.additionalEquipmentRating = 0;
	var audit_overall_ratings = {'cabinterior': 7,'steeringplay': 6,'electrical': 6,'engine_smoke': 13,'clutchoperation': 7,'brakes': 14,'gearselector': 6,'propshaftplay': 5,'cabexterior': 7,'rust': 5,'licensecard': 8,'fluidleaks': 7,'tyres' : 9,'fireextinguisher': 0,'fireextisvalid': 0,'fireextinguisherdate': 0,'equipment': 0,'abuserelatedcosts': 0};
	var audit_additional_equipment_ratings = {'fireextinguisher': 50, 'equipment': 50};
	var rating = 0;
	var add_rating = 0;
	var ratedResults = {};
	var o = {'good': 1, 'bad': 0, 'average': 0.5, 'yes': 1, 'no' :0, 'valid': 1, 'expired': 0, 'done': 1, 'attempted': 0.5, 'not done': 0, 'n/a': 1};

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

	function fetchGPs(){
		GlobalSvc.getGPS(function(position){
			$scope.Form.JSON.Latitude  = position ? position.coords.latitude : "";
			$scope.Form.JSON.Longitude = position ? position.coords.longitude : "";
			$scope.$emit('UNLOAD');
		},function(error){
			console.log('error! ' + error);
			$scope.Form.JSON.Latitude = '';
			$scope.Form.JSON.Longitude = '';
			$scope.$emit('UNLOAD');
		});
	}
	/** This method create an svg image of the signature captured **/
	function createSignatureImage(datapair,type){
		var image = {};
		image.ID = $scope.Form.FormID + "_" + type;
		image.FileData = datapair[1];
		image.Type = datapair[0];
		if (image.Type.toLowerCase() == 'image/svg+xml;base64'){
			image.Name = image.Id + '.svgx';
		}
		return image;
	}

	$scope.saveSignature = function(){
		$scope.$emit('LOAD');
		if($scope.Form.JSON.vinmatch && $scope.Form.licensematch){
			if(!$scope.Form.JSON.AbuseRelatedCosts || ($scope.Form.JSON.AbuseRelatedCosts === "Yes" && !$scope.Form.JSON.Costs)){
				$alert({ content: "Please enter in all fields fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
				$scope.$emit('UNLOAD');
				return;
			}
			// Now check if any items dont have comments or where pictures are needed
		for (prop in $scope.Form.JSON) {
			if ($scope.Form.JSON[prop] === "Bad" || $scope.Form.JSON[prop] === "Average" || $scope.Form.JSON[prop] === "No") {
				if (!$scope.Form.JSON[prop + "Comment"] && (prop !== "FireExtinguisher" && prop !== "AbuseRelatedCosts")){
					$alert({ content: "Please enter comments where you have selected " + $scope.Form.JSON[prop], duration: 5, placement: 'top-right', type: 'danger', show: true});
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
			if($scope.Form.JSON[prop] === undefined){
				$alert({ content: "Please enter in all fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
				$scope.$emit('UNLOAD');
				return;
			}
				//Doing an extra validation of the whole form incase the last value is filled in but another value is null
				if($scope.Form.JSON[prop] === undefined){
					$alert({ content: "Please enter in all fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
					$scope.$emit('UNLOAD');
					return;
				}
				if ($scope.KilometersImages.length === 0) {
				$alert({ content: "Please take picture(s) for Odometer reading", duration: 5, placement: 'top-right', type: 'danger', show: true});
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

	$scope.onBackClicked = function(){
		$scope.Form.JSON = JSON.stringify($scope.Form.JSON);
		sessionStorage.setItem('currentForm', JSON.stringify($scope.Form));
		sessionStorage.removeItem('fromJobsScreenCache');
		$location.path('/jobs/open');
	}
	$scope.syncCompleted = function(reload){
		$scope.$emit('UNLOAD');
		var path = (JSON.parse(sessionStorage.getItem('currentForm')).JSON.vinmatch && JSON.parse(sessionStorage.getItem('currentForm')).JSON.licensematch) ? '/jobs/ratings' : '/';
		$alert({ content: "Audit Form Complete!", duration: 5, placement: 'top-right', type: 'success', show: true});
		sessionStorage.removeItem('currentImage');
		sessionStorage.removeItem('currentLicenceImage');
		sessionStorage.removeItem('currentForm');
		$location.path(path);
	}

	function saveForm(){
		$scope.$emit('LOAD');
		delete $scope.Form.JSON.Path;
		delete $scope.Form.JobType;
		deleteCurrentPartialForm($scope.Form.FormID);
		calculateAuditRating();
		$scope.Form.JSON.KilometersImages = $scope.KilometersImages;
		$scope.Form.JSON.TyresImages = $scope.TyresImages;
		$scope.Form.JSON.other_photosimages = $scope.other_photosimages;
		var inspectorSignature =  createSignatureImage($scope.signature.inspector, 'Inspector');
		var key = $scope.Form.FormID + '_inspectorSig.svgx';
		$scope.Form.JSON.Signature = key;
		CaptureImageSvc.savePhoto(key, $scope.Form.FormID,inspectorSignature.FileData, $scope.Form.ClientID, $scope.Form.FormDate);
		deleteCurrentPartialForm($scope.Form.FormID);
		sessionStorage.setItem('formTobeRatedCache', JSON.stringify($scope.Form));
		$scope.Form.JSON =  fetchJson();
		$scope.Form.JSON = JSON.stringify($scope.Form.JSON);
		var success = function(){
			// Now send images
			SyncSvc.sync("SGInspector", GlobalSvc.getUser().UserID, $scope, false, true);
		}
		var error = function(err){
			$scope.$emit('UNLOAD');
			$alert({ content:   "Warning: Items have been saved, please sync as soon as possible as you appear to be offline", duration: 5, placement: 'top-right', type: 'warning', show: true});
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
	function calculateAuditRating(){
		for (var prop in $scope.Form.JSON){
			if (o[typeof($scope.Form.JSON[prop]) === 'string' && $scope.Form.JSON[prop].toLowerCase()] !== undefined){
				rating += isNaN(audit_overall_ratings[prop.toLowerCase()]) ? 0 : Math.ceil(audit_overall_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]);
				if (audit_additional_equipment_ratings[prop.toLowerCase()] !== undefined){
					if(prop.toLowerCase() === 'fireextinguisher' || prop.toLowerCase() === 'equipment') 
						ratedResults[prop + 'Rating'] = isNaN(audit_additional_equipment_ratings[prop.toLowerCase()]) ? 0 : (Math.ceil(audit_additional_equipment_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]));
						add_rating+= isNaN(audit_additional_equipment_ratings[prop.toLowerCase()]) ? 0 :  (Math.ceil(audit_additional_equipment_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]));	
				}
				ratedResults[prop + 'Rating'] = isNaN(audit_overall_ratings[prop.toLowerCase()]) ? 0 : (Math.ceil(audit_overall_ratings[prop.toLowerCase()] * o[$scope.Form.JSON[prop].toLowerCase()]));
				$scope.overallRating = rating;
				$scope.additionalEquipmentRating = add_rating;
			}
		}

		//merging the two objects
		for (var prop in ratedResults){$scope.Form.JSON[prop] = ratedResults[prop]};
		if ($scope.Form.JSON.Engine_Smoke == 'Bad' || !$scope.Form.JSON.Engine_Smoke || $scope.Form.JSON.Brakes == 'Bad' || !$scope.Form.JSON.Brakes || $scope.Form.JSON.LicenseCard == 'Expired' || !$scope.Form.JSON.LicenseCard) $scope.vehicleFitnessRating = 'Fail';
		$scope.Form.JSON.additionalEquipmentRating =  $scope.additionalEquipmentRating;
		$scope.Form.JSON.vehicleFitnessRating = $scope.vehicleFitnessRating;
		$scope.Form.JSON.overallRating = $scope.overallRating;
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
	   	return{
			"CustomerName":$scope.Form.JSON.CustomerName ? $scope.Form.JSON.CustomerName :  "",
			"User_Name":$scope.Form.JSON.User_Name ?  $scope.Form.JSON.User_Name :  "",
			"ExpiryDate": $scope.Form.JSON.ExpiryDate ? $scope.Form.JSON.ExpiryDate : "",
			"LicenseNumber":$scope.Form.JSON.LicenseNumber ? $scope.Form.JSON.LicenseNumber :  "",
			"Tarre": $scope.Form.JSON.Tarre ? $scope.Form.JSON.Tarre : "",
			"DiscNo":$scope.Form.JSON.DiscNo ? $scope.Form.JSON.DiscNo : "",
			"RegistrationNo":$scope.Form.JSON.RegistrationNo ? $scope.Form.JSON.RegistrationNo : "",
			"VehicleRegistrationNo":$scope.Form.JSON.VehicleRegistrationNo ? $scope.Form.JSON.VehicleRegistrationNo : "",
			"VehicleDescription":$scope.Form.JSON.VehicleDescription ? $scope.Form.JSON.VehicleDescription : "",
			"Make":$scope.Form.JSON.Make ? $scope.Form.JSON.Make : "",
			"EngineNo":$scope.Form.JSON.EngineNo ? $scope.Form.JSON.EngineNo : "",
			"Color":$scope.Form.JSON.Color ? $scope.Form.JSON.Color : "",
			"NatisLicenseNumber":$scope.Form.JSON.NatisLicenseNumber ? $scope.Form.JSON.NatisLicenseNumber :  "",
			"RegistrationFrequency": $scope.Form.JSON.RegistrationFrequency ? $scope.Form.JSON.RegistrationFrequency : "",
			"Model":$scope.Form.JSON.Model? $scope.Form.JSON.Model : "",
			"vinmatch": $scope.Form.JSON.vinmatch,
			"licensematch": $scope.Form.JSON.licensematch,
			"VinNumber":$scope.Form.JSON.VinNumber ? $scope.Form.JSON.VinNumber :  "",
			"LicenceExpiryDate":$scope.Form.JSON.LicenceExpiryDate ? $scope.Form.JSON.LicenceExpiryDate : "",
			"Latitude":$scope.Form.JSON.Latitude ? $scope.Form.JSON.Latitude : "",
			"Longitude":$scope.Form.JSON.Longitude ? $scope.Form.JSON.Longitude : "",
			"Kilometers": $scope.Form.JSON.Kilometers ? $scope.Form.JSON.Kilometers : "",
			"Branch":$scope.Form.JSON.Branch ? $scope.Form.JSON.Branch : "",
			"InspectionDate":$scope.Form.JSON.InspectionDate ? $scope.Form.JSON.InspectionDate : "",
			"CabInterior":$scope.Form.JSON.CabInterior ? $scope.Form.JSON.CabInterior : "",
			"CabInteriorComment":$scope.Form.JSON.CabInteriorComment ? $scope.Form.JSON.CabInteriorComment : "",
			"SteeringPlay":$scope.Form.JSON.SteeringPlay ? $scope.Form.JSON.SteeringPlay : "",
			"SteeringPlayComment":$scope.Form.JSON.SteeringPlayComment ? $scope.Form.JSON.SteeringPlayComment : "",
			"Electrical":$scope.Form.JSON.Electrical ? $scope.Form.JSON.Electrical : "",
			"ElectricalComment":$scope.Form.JSON.ElectricalComment ? $scope.Form.JSON.ElectricalComment : "",
			"Engine_Smoke":$scope.Form.JSON.Engine_Smoke ? $scope.Form.JSON.Engine_Smoke :  "",
			"Engine_SmokeComment":$scope.Form.JSON.Engine_SmokeComment ? $scope.Form.JSON.Engine_SmokeComment : "",
			"ClutchOperation":$scope.Form.JSON.ClutchOperation ? $scope.Form.JSON.ClutchOperation : "",
			"ClutchOperationComment":$scope.Form.JSON.ClutchOperationComment ? $scope.Form.JSON.ClutchOperationComment : "",
			"Brakes":$scope.Form.JSON.Brakes ? $scope.Form.JSON.Brakes : "",
			"BrakesComment":$scope.Form.JSON.BrakesComment ? $scope.Form.JSON.BrakesComment : "",
			"GearSelector":$scope.Form.JSON.GearSelector ? $scope.Form.JSON.GearSelector : "",
			"GearSelectorComment":$scope.Form.JSON.GearSelectorComment ? $scope.Form.JSON.GearSelectorComment : "",
			"PropshaftPlay":$scope.Form.JSON.PropshaftPlay ? $scope.Form.JSON.PropshaftPlay : "",
			"PropshaftPlayComment":$scope.Form.JSON.PropshaftPlayComment ? $scope.Form.JSON.PropshaftPlayComment : "",
			"CabExterior":$scope.Form.JSON.CabExterior ? $scope.Form.JSON.CabExterior : "",
			"CabExteriorComment":$scope.Form.JSON.CabExteriorComment ? $scope.Form.JSON.CabExteriorComment : "",
			"Rust":$scope.Form.JSON.Rust,
			"RustComment":$scope.Form.JSON.RustComment ? $scope.Form.JSON.RustComment : "",
			"LicenseCard":$scope.Form.JSON.LicenseCard ? $scope.Form.JSON.LicenseCard : "",
			"FluidLeaks":$scope.Form.JSON.FluidLeaks ? $scope.Form.JSON.FluidLeaks : "",
			"FluidLeaksComment":$scope.Form.JSON.FluidLeaksComment ? $scope.Form.JSON.FluidLeaksComment : "",
			"FireExtinguisher":$scope.Form.JSON.FireExtinguisher ? $scope.Form.JSON.FireExtinguisher : "",
			"FireExtIsValid": $scope.Form.JSON.FireExtIsValid ? $scope.Form.JSON.FireExtIsValid : "",
			"FireExtinguisherExpDate":$scope.Form.JSON.FireExtinguisherExpDate ? $scope.Form.JSON.FireExtinguisherExpDate : "",
			"Tyres":$scope.Form.JSON.Tyres ? $scope.Form.JSON.Tyres :  "",
			"TyresComment":$scope.Form.JSON.TyresComment ? $scope.Form.JSON.TyresComment : "",
			"Equipment":$scope.Form.JSON.Equipment ? $scope.Form.JSON.Equipment : "",
			"EquipmentComment":$scope.Form.JSON.EquipmentComment ? $scope.Form.JSON.EquipmentComment :  "",
			"AbuseRelatedCosts":$scope.Form.JSON.AbuseRelatedCosts,
			"Costs": $scope.Form.JSON.Costs ? $scope.Form.JSON.Costs : "",
			"CabInteriorRating":$scope.Form.JSON.CabInteriorRating ? $scope.Form.JSON.CabInteriorRating : "",
			"SteeringPlayRating":$scope.Form.JSON.SteeringPlayRating ? $scope.Form.JSON.SteeringPlayRating : "",
			"ElectricalRating":$scope.Form.JSON.ElectricalRating ? $scope.Form.JSON.ElectricalRating : "",
			"Engine_SmokeRating":$scope.Form.JSON.Engine_SmokeRating ? $scope.Form.JSON.Engine_SmokeRating : "",
			"ClutchOperationRating":$scope.Form.JSON.ClutchOperationRating ? $scope.Form.JSON.ClutchOperationRating : "",
			"BrakesRating":$scope.Form.JSON.BrakesRating ? $scope.Form.JSON.BrakesRating : "",
			"GearSelectorRating":$scope.Form.JSON.GearSelectorRating ? $scope.Form.JSON.GearSelectorRating : "",
			"PropshaftPlayRating":$scope.Form.JSON.PropshaftPlayRating ? $scope.Form.JSON.PropshaftPlayRating : "",
			"CabExteriorRating":$scope.Form.JSON.CabExteriorRating ? $scope.Form.JSON.CabExteriorRating : "",
			"RustRating":$scope.Form.JSON.RustRating ? $scope.Form.JSON.RustRating : "",
			"LicenseCardRating":$scope.Form.JSON.LicenseCardRating ? $scope.Form.JSON.LicenseCardRating : "",
			"FluidLeaksRating":$scope.Form.JSON.FluidLeaksRating ? $scope.Form.JSON.FluidLeaksRating : "",
			"FireExtinguisherRating":$scope.Form.JSON.FireExtinguisherRating ? $scope.Form.JSON.FireExtinguisherRating : "",
			"FireExtIsValidRating":$scope.Form.JSON.FireExtIsValidRating ? $scope.Form.JSON.FireExtIsValidRating : "",
			"TyresRating":$scope.Form.JSON.TyresRating ? $scope.Form.JSON.TyresRating : "",
			"EquipmentRating":$scope.Form.JSON.EquipmentRating ? $scope.Form.JSON.EquipmentRating : "",
			"AbuseRelatedCostsRating":$scope.Form.JSON.AbuseRelatedCostsRating ? $scope.Form.JSON.AbuseRelatedCostsRating : "",
			"additionalEquipmentRating":$scope.Form.JSON.additionalEquipmentRating ? $scope.Form.JSON.additionalEquipmentRating : "",
			"vehicleFitnessRating":$scope.Form.JSON.vehicleFitnessRating ? $scope.Form.JSON.vehicleFitnessRating : "",
			"overallRating":$scope.Form.JSON.overallRating ? $scope.Form.JSON.overallRating : "",
			"KilometersImages":$scope.Form.JSON.KilometersImages ? $scope.Form.JSON.KilometersImages : [],
			"TyresImages":$scope.Form.JSON.TyresImages ? $scope.Form.JSON.TyresImages : [],
			"other_photosimages":$scope.Form.JSON.other_photosimages ? $scope.Form.JSON.other_photosimages : [],
			"regimage" :  $scope.Form.JSON.regimage ? $scope.Form.JSON.regimage : "",
			"vinimage" : $scope.Form.JSON.vinimage ? $scope.Form.JSON.vinimage : "", 
			"Signature":$scope.Form.JSON.Signature ? $scope.Form.JSON.Signature : ""
		}
   }

	function constructor(){
		window.scrollTo(0, 0);
		$scope.$emit('heading',{heading: 'Audit Form', icon : 'fa fa-check-square-o'});
		if (sessionStorage.getItem('fromJobsScreenCache')) $scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: $scope.onBackClicked});
		$scope.$emit('right', {label: 'Save', icon: 'fa fa-save', onclick: $scope.saveSignature});
		$scope.inspectiontype = $routeParams.inspectiontype;
		$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
		fetchGPs();
		$scope.Form.JSON.LicenseNumber = sessionStorage.getItem('fromJobsScreenCache') ? $scope.Form.JSON.LicenseNumber :  sessionStorage.getItem('currentLicenseNumber');
		$scope.Form.JSON.VinNumber = sessionStorage.getItem('fromJobsScreenCache') ? $scope.Form.JSON.VinNumber : sessionStorage.getItem('currentVinNumber');
		$scope.Form.JSON.LicenceExpiryDate = sessionStorage.getItem('fromJobsScreenCache') ? $scope.Form.JSON.LicenceExpiryDate :  sessionStorage.getItem('currentExpirayDate');
		$scope.inspectorSignatureBoxLabel = 'Inspector';
	}
	constructor();

});
