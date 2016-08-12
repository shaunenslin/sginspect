coreApp.controller('TechnicalFormCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc, $filter){
	$scope.isPhoneGap = Settings.isPhoneGap;
	$scope.image = "";
	$scope.signature = {"inspector" : ""};
	$scope.serviceHistory = [];
	/** The variable below is the svg represtion of an empty signature  **/
	var emptySignature = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4=";
	$scope.DescriptionImages = [];

	$scope.onPhotoClicked = function(field, filenames){
		var reader = new FileReader();
		reader.addEventListener("load", function () {
			$scope.image = reader.result;
			if ($scope.image){
				var key = $scope.Form.FormID + '_' + field + filenames.length  + '.png';
				CaptureImageSvc.savePhoto(key, $scope.image);
				filenames.push(key);
			} else{
				$scope.capture = true;
			}
			$alert({content:"Image captured successfully", duration:5, placement:'top-right', type:'success', show:true});
			$scope.$apply();
		}, false);
		if ($scope.isPhoneGap){
			var onSuccess = function(img){
				reader.readAsDataURL(img);
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

	function deleteUnsentImages(idx,keys,onComplete){
		if(idx >= keys.length){
			onComplete();
			return;
		}
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
    	var url = Settings.url + 'Get?method=SGI_FETCH_SERVICE_HISTORY&FormType=techn' + '&ClientID=' + $scope.Form.ClientID + '&UserID=' + $scope.Form.UserID;
    	$http.get (url)
    	.success(function(data){
    		$scope.serviceHistory = [];
    		$scope.serviceHistory =data.map(function(e){
    			return moment(e).format('YYYY/MM/DD');
    		});
    	})
    	.error(function(err){
    		$alert({content: "Error fetching service history. Please check your connection", duration:5, placement:'top-right', type:'danger', show:true});
    		$scope.$emit('UNLOAD');
    	})
    }
    function appendImagesToJSON(){
		var imageKeys = [];
		DaoSvc.cursor('Unsent',
			function(json){
				//Checking if this is an image incase the are inspection that were saved offline 
				if(json.ImageID){
					//Ensure that we are only getting images belonging to this current Form
					if(json.ImageID.indexOf($scope.Form.FormID) > -1){
						$scope.Form.JSON[json.ImageID] = json.ImageData;
						imageKeys.push(json.ImageID)
					}
				}
			},
			function(error){
				console.log('Error fetching from Unsent ' + error);
				$scope.$emit('UNLOAD');
			}, function(){
				//Recursively Deleting the Images out of unsent and executing the save form when done
				deleteUnsentImages(0,imageKeys,saveForm);
			}
        );
	}
	function deleteUnsentImages(idx,keys,onComplete){
		if(idx >= keys.length){
		onComplete();
		return;
		}
		DaoSvc.deleteItem('Unsent',keys[idx],undefined,function(){
			idx = idx + 1;
			deleteUnsentImages(idx,keys,onComplete)
			}, function(){
				idx = idx + 1;
				deleteUnsentImages(idx, keys,onComplete)
			});
	}


	$scope.saveSignature = function(){
		$scope.$emit('LOAD');
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
		}
		if($scope.signature.inspector[1] === emptySignature || !$scope.signature.inspector){
			$alert({ content: "You cannot continue without adding the required signature", duration: 5, placement: 'top-right', type: 'danger', show: true});
			return;
		}
		appendImagesToJSON();
	}

	function saveForm(){
		$scope.$emit('LOAD');
		deleteCurrentPartialForm($scope.Form.FormID);
		var success = function(){
			$scope.$emit('UNLOAD');
			$alert({ content: "Technical Report Complete!", duration: 5, placement: 'top-right', type: 'success', show: true});
			sessionStorage.removeItem('currentImage');
			sessionStorage.removeItem('currentLicenceImage');
			sessionStorage.removeItem('currentForm');
			$location.path('/');	
		}
		var error = function(err){
			$scope.$emit('UNLOAD');
			$alert({ content:   "Warning: Items have been saved, please sync as soon as possible as you appear to be offline", duration: 5, placement: 'top-right', type: 'warning', show: true});
			$location.path('/');
		}
		var inspectorSignature =  createSignatureImage($scope.signature.inspector, 'Inspector');
		$scope.Form.JSON[inspectorSignature.ID] = inspectorSignature.FileData;
		$scope.Form.JSON = JSON.stringify($scope.Form.JSON);
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

    function fetchClient(){
    	var Client = JSON.parse(sessionStorage.getItem('currentClientsCache'));
    	$scope.Client = $filter('filter')(Client, {ClientID : $scope.Form.ClientID})[0];
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

	function constructor(){
		$scope.$emit('heading',{heading: 'Technical Report', icon : 'fa fa-check-square-o'});
		$scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: function(){window.history.back()}});
		$scope.$emit('right', {label: 'Save', icon: 'fa fa-save', onclick: $scope.saveSignature});
		$scope.inspectiontype = $routeParams.inspectiontype;
		$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
		fetchClient();
		fetchServiceHistory();
		savePartialForm();
		$scope.Form.JSON.RegNumber =  sessionStorage.getItem('currentRegNumber');
		$scope.Form.JSON.VinNumber = sessionStorage.getItem('currentVinNumber');
		$scope.Form.JSON.LicenceExpiryDate = '25 July 2017';
		$scope.inspectorSignatureBoxLabel = 'Inspector';
	}
	constructor();

});