coreApp.controller('TechnicalFormCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc, $filter, SyncSvc){
	$scope.isPhoneGap = Settings.isPhoneGap;
	$scope.image = "";
	$scope.signature = {"inspector" : ""};
	$scope.serviceHistory = [];
	$scope.currentDate = new Date();
	/** The variable below is the svg represtion of an empty signature  **/
	var emptySignature = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4=";
	$scope.DescriptionImages = [];

	$scope.onPhotoClicked = function(field, filenames){
		var reader = new FileReader();
		reader.onload = function () {
			$scope.image = reader.result;
			if ($scope.image){
				var key = $scope.Form.FormID + '_' + field + filenames.length  + '.png';
				CaptureImageSvc.savePhoto(key, $scope.Form.FormID, $scope.image,$scope.Form.ClientID, $scope.Form.FormDate);
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
	$scope.onBackClicked = function(){
		$scope.Form.JSON = JSON.stringify($scope.Form.JSON);
		sessionStorage.setItem('currentForm', JSON.stringify($scope.Form));
		sessionStorage.removeItem('fromJobsScreenCache');
		$location.path('/jobs/open');
	}

	$scope.fetchGPS = function(){
		GlobalSvc.getGPS(function(position){
			$scope.Form.JSON.Latitude  = position ? position.coords.latitude : "";
			$scope.Form.JSON.Longitude = position ? position.coords.longitude : "";
			$alert({content:'GPS coordinates captured successfully: ', duration: 5, placement: 'top-right', type: 'success', show: true});
			$scope.$emit('UNLOAD');
		},function(error){
			$alert({content:"GPS location not captured. Please ensure your location settings are enabled ", duration:5, placement:'top-right', type:'danger', show:true});
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
	function fetchServiceHistory(){
    	var url = Settings.url + "Get?method=SGI_FETCH_SERVICE_HISTORY&FormType=afterserviceevaluation&ClientID='" + $scope.Form.ClientID + "'&UserID='" + $scope.Form.UserID + "'&VinNumber='" + $scope.Form.VinNumber + "'";
    	$http.get (url)
    	.success(function(data){
    		$scope.serviceHistory = [];
    		$scope.serviceHistory =data.map(function(e){
    			return moment(e.servicehistory).format('YYYY/MM/DD');
    		});
    	})
    	.error(function(err){
    		$alert({content: "Error fetching service history. Please check your connection", duration:5, placement:'top-right', type:'danger', show:true});
    		$scope.$emit('UNLOAD');
    	})
    }
    $scope.saveSignature = function(){
		$scope.$emit('LOAD');
		if ($scope.Form.JSON.vinmatch && $scope.Form.licensematch){
			if(!$scope.Form.JSON.Conclusions){
				$alert({ content: "Please enter in all fields fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
				$scope.$emit('UNLOAD');
				return;
			}
			// Now check if any items dont have comments or where pictures are needed
			for (prop in $scope.Form.JSON) {
				if ($scope[prop + "Images"]) {
					if ($scope[prop + "Images"].length == 0) {
						$alert({ content: "Please take pictures for " + prop, duration: 5, placement: 'top-right', type: 'danger', show: true});
		           		$scope.$emit('UNLOAD');
		           		return;
					}
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
			return;
		}
		saveForm();
	}

	$scope.syncCompleted = function(reload){
		$scope.$emit('UNLOAD');
		$alert({ content: "Technical Report Complete!", duration: 5, placement: 'top-right', type: 'success', show: true});
		sessionStorage.removeItem('currentImage');
		sessionStorage.removeItem('currentLicenceImage');
		$location.path('/');
	}

	function saveForm(){
		delete $scope.Form.JSON.Path;
		delete $scope.Form.JobType;
		deleteCurrentPartialForm($scope.Form.FormID);
		$scope.Form.JSON.descriptionImages =  $scope.DescriptionImages;
		var inspectorSignature =  createSignatureImage($scope.signature.inspector, 'Inspector');
		var key = $scope.Form.FormID + '_inspectorSig.svgx';
		$scope.Form.JSON.Signature = key;
		$scope.Form.JSON.DescriptionImages = $scope.DescriptionImages;
		$scope.Form.JSON.isFindings = ($scope.Form.JSON.Description) ? true : false;
		CaptureImageSvc.savePhoto(key, $scope.Form.FormID,inspectorSignature.FileData, $scope.Form.ClientID, $scope.Form.FormDate);
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

    // REMOVES INDIVIDUAL IMAGES FROM OTHER PHOTO'S FIELD
    $scope.removeImage = function(idx, filenames){
		DaoSvc.deleteItem('Unsent',filenames[idx],undefined,function(){
		    $alert({content:'Error removing image', duration: 5, placement: 'top-right', type: 'danger', show: true});
		},function(){
		    filenames.splice(idx,1);
		    $scope.$apply();
		});
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
			"CustomerName": $scope.Form.JSON.CustomerName ? $scope.Form.JSON.CustomerName  : "",
			"User_Name": $scope.Form.JSON.User_Name ? $scope.Form.JSON.User_Name  : "",
			"ExpiryDate": $scope.Form.JSON.ExpiryDate ? $scope.Form.JSON.ExpiryDate  : "",
			"LicenseNumber": $scope.Form.JSON.LicenseNumber ? $scope.Form.JSON.LicenseNumber  : "",
			"Tarre": $scope.Form.JSON.Tarre ? $scope.Form.JSON.Tarre  : "",
			"DiscNo": $scope.Form.JSON.DiscNo ? $scope.Form.JSON.DiscNo  : "",
			"RegistrationNo": $scope.Form.JSON.RegistrationNo ? $scope.Form.JSON.RegistrationNo  : "",
			"VehicleRegistrationNo": $scope.Form.JSON.VehicleRegistrationNo ? $scope.Form.JSON.VehicleRegistrationNo  : "",
			"VehicleDescription": $scope.Form.JSON.VehicleDescription ? $scope.Form.JSON.VehicleDescription  : "",
			"Make": $scope.Form.JSON.Make ? $scope.Form.JSON.Make  : "",
			"EngineNo": $scope.Form.JSON.EngineNo ? $scope.Form.JSON.EngineNo  : "",
			"Color": $scope.Form.JSON.Color ? $scope.Form.JSON.Color  : "",
			"NatisLicenseNumber": $scope.Form.JSON.NatisLicenseNumber ? $scope.Form.JSON.NatisLicenseNumber  : "",
			"RegistrationFrequency": $scope.Form.JSON.RegistrationFrequency ? $scope.Form.JSON.RegistrationFrequency  : "",
			"Model": $scope.Form.JSON.Model ? $scope.Form.JSON.Model  : "",
			"regimage": $scope.Form.JSON.regimage ? $scope.Form.JSON.regimage  : "",
			"VinNumber": $scope.Form.JSON.VinNumber ? $scope.Form.JSON.VinNumber  : "",
			"LicenceExpiryDate": $scope.Form.JSON.LicenceExpiryDate ? $scope.Form.JSON.LicenceExpiryDate  : "",
			"Signature": $scope.Form.JSON.Signature ? $scope.Form.JSON.Signature  : "",
			"DescriptionImages":$scope.Form.JSON.DescriptionImages ? $scope.Form.JSON.DescriptionImages : [],
			"Latitude": $scope.Form.JSON.Latitude ? $scope.Form.JSON.Latitude  : "",
			"Longitude": $scope.Form.JSON.Longitude ? $scope.Form.JSON.Longitude  : "",
			"vinmatch":$scope.Form.JSON.vinmatch,
			"licensematch":$scope.Form.JSON.licensematch,
			"vinimage": $scope.Form.JSON.vinimage ? $scope.Form.JSON.vinimage  : "",
			"isFindings":$scope.Form.JSON.isFindings,
			"InvestigationDate": $scope.Form.JSON.InvestigationDate ? $scope.Form.JSON.InvestigationDate : "",
			"InvestigationReason":$scope.Form.JSON.InvestigationReason ? $scope.Form.JSON.InvestigationReason : "",
			"ClientUserGroup":$scope.Form.JSON.ClientUserGroup ? $scope.Form.JSON.ClientUserGroup : "",
			"Reference":$scope.Form.JSON.Reference ? $scope.Form.JSON.Reference : "",
			"Description":$scope.Form.JSON.Description ? $scope.Form.JSON.Description : "",
			"Reccomendations":$scope.Form.JSON.Reccomendations ? $scope.Form.JSON.Reccomendations : "",
			"Conclusions":$scope.Form.JSON.Conclusions ? $scope.Form.JSON.Conclusions : ""
}
	}

	function constructor(){
		window.scrollTo(0, 0);
		$scope.$emit('heading',{heading: 'Technical Report', icon : 'fa fa-check-square-o'});
		if (sessionStorage.getItem('fromJobsScreenCache')) $scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: $scope.onBackClicked});
		$scope.$emit('right', {label: 'Save', icon: 'fa fa-save', onclick: $scope.saveSignature});
		$scope.inspectiontype = $routeParams.inspectiontype;
		$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
		fetchServiceHistory();
		savePartialForm();
		$scope.Form.JSON.LicenseNumber = sessionStorage.getItem('fromJobsScreenCache') ? $scope.Form.JSON.LicenseNumber : sessionStorage.getItem('currentLicenseNumber');
        $scope.Form.JSON.VinNumber = sessionStorage.getItem('fromJobsScreenCache') ? $scope.Form.JSON.VinNumber : sessionStorage.getItem('currentVinNumber');
        $scope.Form.JSON.LicenceExpiryDate = sessionStorage.getItem('fromJobsScreenCache') ? $scope.Form.JSON.LicenceExpiryDate : sessionStorage.getItem('currentExpirayDate');
		$scope.inspectorSignatureBoxLabel = 'Inspector';
	}
	constructor();

});
