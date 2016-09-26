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

	function constructor(){
		window.scrollTo(0, 0);
		$scope.$emit('heading',{heading: 'Audit Form', icon : 'fa fa-check-square-o'});
		if (sessionStorage.getItem('fromJobsScreenCache')) $scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: $scope.onBackClicked});
		$scope.$emit('right', {label: 'Save', icon: 'fa fa-save', onclick: $scope.saveSignature});
		$scope.inspectiontype = $routeParams.inspectiontype;
		$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
		fetchGPs();
		$scope.Form.JSON.LicenseNumber = sessionStorage.getItem('currentLicenseNumber');
		$scope.Form.JSON.VinNumber = sessionStorage.getItem('currentVinNumber');
		$scope.Form.JSON.LicenceExpiryDate = sessionStorage.getItem('currentExpirayDate');
		$scope.inspectorSignatureBoxLabel = 'Inspector';
	}
	constructor();

});
