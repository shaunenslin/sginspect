coreApp.controller('SelectClientCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc, JsonFormSvc, OptionSvc){
	$scope.isPhoneGap = Settings.isPhoneGap;
	$scope.Uploadmessage = "Attach Image files";
	$scope.image = "";
	$scope.signature = {"inspector" : "", "techAdvisor" : "", "manager" : ""};
	/** The variable below is the svg represtion of an empty signature  **/
	var emptySignature = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4=";
	$scope.filenames = [];
	var Imgfiles = [];

	function newObject(){
		$scope.Form = {
			FormType: $routeParams.inspectiontype,
			ClientID: "",
			FormID: GlobalSvc.getGUID(),
			SupplierID  : GlobalSvc.getUser().SupplierID,
			UserID 		: GlobalSvc.getUser().UserID,
			FormDate	: moment().format('YYYY-MM-DD HH:mm:ss'),
			JSON 		: {
				"UserField01" : "",
				"UserField02" : "",
				"UserField03" : moment().format('YYYY-MM-DD HH:mm:ss'),
				"UserField04" : "",
				"UserField05" : "",
				"UserField06" : "",
				"UserField07" : "",
				"UserField08" : "",
				"UserField09" : "",
				"UserField10" : "",
				"UserField11" : "",
				"UserField12" : "",
				"UserField13" : "",
				"UserField14" : "",
				"UserField15" : "",
				"UserField16" : "",
				"UserField17" : "",
				"UserField18" : "",
				"UserField19" : "",
				"UserField20" : "",
				"UserField21" : "",
				"UserField22" : "",
				"UserField23" : "",
			}
		}
	}

	$scope.onNextClicked = function(){
		 // Path is generic to cater for all navigation scenarios
		var path = Settings.workflow[$routeParams.inspectiontype][parseInt($routeParams.screennum) + 1].route + '/' + $routeParams.inspectiontype + '/' + (parseInt($routeParams.screennum) + 1);
		if ($routeParams.screennum == 0){
			if (!$scope.Form.ClientID){
				$alert({content: "Please select a Client before continuing !", duration:6, placement:'top-right', type:'danger', show:true});
				return;
			}

		}else if ($routeParams.screennum == 1){
			if (!$scope.VinNumber){
				$alert({content: "Please scan license disk continuing !", duration:6, placement:'top-right', type:'danger', show:true});
				return;
			}

		}else if($routeParams.screennum == 2){
			if(!$scope.image) {
				$alert({content: "Please capture the VIN picture before continuing !", duration:6, placement:'top-right', type:'danger', show:true});
				return;
			}
			var key = $scope.Form.FormID + '_vin.png';
			$scope.Form.JSON.vinimage = key;
			sessionStorage.setItem('currentImage', $scope.image);
			CaptureImageSvc.savePhoto(key, $scope.image);
		}else if ($routeParams.screennum == 3){
			if ($scope.Form.JSON.vinmatch === undefined){
				$alert({content: "Please select an option below before continuing !", duration:6, placement:'top-right', type:'danger', show:true});
				return;
			}
		} else if ($routeParams.screennum == 4){
			if(!$scope.image) {
				$alert({content: "Please capture the Licene Plate Number picture before continuing !", duration:6, placement:'top-right', type:'danger', show:true});
				return;
			}
			var key = $scope.Form.FormID + '_reg.png';
			$scope.Form.JSON.regimage = key;
			sessionStorage.setItem('currentLicenceImage', $scope.image);
			CaptureImageSvc.savePhoto(key, $scope.image);
		}
		sessionStorage.setItem('currentForm', JSON.stringify($scope.Form));
		$location.path(path);
	}

	function fetchClients(){
		$scope.Clients = [];
		DaoSvc.openDB();
		DaoSvc.cursor('SGIClients',
			function(json){
				$scope.Clients.push(json);
			}, function(err){
				$scope.$emit('UNLOAD');
				$alert({content: "Error fetching Clients " + err, duration:6, placement:'top-right', type:'danger', show:true});
			},function(){
				$scope.$emit('UNLOAD');
				$scope.$apply();
		});
	}

	$scope.onBackClicked = function(){
		var path = $routeParams.screennum == 0 ? '/admin' : Settings.workflow[$routeParams.inspectiontype][parseInt($routeParams.screennum) - 1].route  + '/' + $routeParams.inspectiontype + '/' + (parseInt($routeParams.screennum) - 1);
		$location.path(path);
	}

	$scope.nfcScan = function(){
		$scope.VinNumber = "IG1YY23671299872";
		sessionStorage.setItem('currentVinNumber', $scope.VinNumber);
		$alert({content: "Vehicle number " + $scope.VinNumber + " scanned successfully. Please Press 'Next' to continue", duration:6, placement:'top-right', type:'success', show:true});
	}

	$scope.onPhotoClicked = function(field){
		if(field === 'other-photos' && $routeParams.screennum == 6){
			saveMultiplePhotos();
			$alert({content:"Image captured successfully", duration:6, placement:'top-right', type:'success', show:true});
		}else{
			var reader = new FileReader();
			reader.addEventListener("load", function () {
				$scope.image = reader.result;
				if ($routeParams.screennum == 6 && $scope.image){
					var key = $scope.Form.FormID + '_' + field + '.png';
					CaptureImageSvc.savePhoto(key, $scope.image);
				} else{
					$scope.capture = true;
				}
				$alert({content:"Image captured successfully", duration:6, placement:'top-right', type:'success', show:true});
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
				var image = $('#file-select')[0];

				if (image && image.files.length > 0){
		    		reader.readAsDataURL(image.files[0]);
		    	}
			}
		}
	}
	function saveMultiplePhotos(){
		// This method encodes images to base 64 and saves multiple files to the local table
		var idx = 0;
		for (var i = 0; i < Imgfiles.length; i++){
			var reader = new FileReader();
		    reader.onload = function (e) {
		    	var key = $scope.Form.FormID + '_other-photos_'+ idx;
		    	idx++
		    	CaptureImageSvc.savePhoto(key, e.target.result);
		    };
    		reader.readAsDataURL(Imgfiles[i]);
		}
	}

	$scope.matchClicked = function(clickVal){
		if($routeParams.screennum == 3){
		$scope.Form.JSON.vinmatch = (clickVal.length > 0) ? true : false;

		} else{
			$scope.Form.JSON.regmatch = (clickVal.length > 0) ? true : false;
		}
		$alert({content:"Choice captured. Please press Next to continue", duration:6, placement:'top-right', type:'success', show:true});
		$scope.$apply();
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

	function deleteUnsentImages(idx, images){
		var keys = images;
		if (keys[idx] && idx <= keys.length){
			DaoSvc.deleteItem('Unsent',keys[idx].ID, undefined, undefined, function(){idx++;deleteUnsentImages(idx, keys)});
		}
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

	$scope.saveSignature = function(){
		$scope.$emit('LOAD');
		if(!$scope.Form.JSON.validForm){
			$alert({ content: "Please enter in all required (*) fields before continuing", duration: 8, placement: 'top-right', type: 'danger', show: true});
			return;
		}
		if ($scope.inspectiontype !== 'supplierevaluation'){
			if($scope.signature.inspector[1] === emptySignature || !$scope.signature.inspector){
				$alert({ content: "You cannot continue without adding the required signature", duration: 5, placement: 'top-right', type: 'danger', show: true});
				return;
			}
		}else{
			if($scope.signature.techAdvisor[1] === emptySignature || !$scope.techAdvisor || $scope.signature.manager[1] === emptySignature || !$scope.signature.manager){
				$alert({ content: "You cannot continue without adding all required signature(s)", duration: 5, placement: 'top-right', type: 'danger', show: true});
			}
			return;
		}
		$scope.$emit('UNLOAD');
		saveForm();
	}

	function saveForm(){
		$scope.$emit('LOAD');
		images = [];
		DaoSvc.cursor('Unsent',
			function(json){
				if (json.FileData.indexOf('base64') > -1){
					$scope.Form.JSON[json.ID] = json.FileData;
					images.push(json);
				}
			},
			function(error){
				console.log('Error fetching from Unsent ' + error);
				$scope.$emit('UNLOAD');
			}, function(){
				$scope.$emit('UNLOAD');
				deleteUnsentImages(0, images);
				$scope.$apply()
		});
		//Create Unique Key For Signature(s) and/or image(s) in IF ELSE BLOCK
		if($scope.inspectiontype !== 'supplierevaluation'){
			var inspectorSignature =  createSignatureImage($scope.signature.inspector, 'Inspector');
			$scope.Form.JSON[inspectorSignature.ID] = inspectorSignature.FileData;
		}else{
			var techAdvisorSignsture = createSignatureImage($scope.signature.techAdvisor, 'Tech_Advisor');
			var managerSignature = createSignatureImage($scope.signature.manager, 'workflow_manager');
			$scope.Form.JSON[techAdvisorSignsture.ID] = techAdvisorSignsture.FileData;
			$scope.Form.JSON[managerSignature.ID] = managerSignature.FileData;
		}

		var success = function(){
			$scope.$emit('UNLOAD');
			$alert({ content: "Your Items have been saved Ok.", duration: 5, placement: 'top-right', type: 'success', show: true});
			sessionStorage.removeItem('currentImage');
			sessionStorage.removeItem('currentLicenceImage');
			sessionStorage.removeItem('currentForm');
			sessionStorage.removeItem('currentVinNumber');
			$location.path('/');	
		}
		var error = function(err){
			$scope.$emit('UNLOAD');
			$alert({ content: "Error Saving Form", duration: 5, placement: 'top-right', type: 'danger', show: true});
		}
		$scope.Form.JSON = JSON.stringify($scope.Form.JSON);
		var url = Settings.url + 'Post?method=SGIFormHeaders_modify';
		GlobalSvc.postData(url, $scope.Form, success, error, 'SGIFormHeaders', 'Modify', false, true);
	}
	// document.getElementById('upload-select').onchange = uploadOnChange;
	angular.element('#upload-select').context.onchange = uploadOnChange;
    function uploadOnChange() {
        var files = $('#upload-select')[0].files;
        $scope.filenames = $scope.filenames.length > 0 ? $scope.filenames : [];
        for(var i = 0; i < files.length; i++){
            $scope.filenames.push(files[i].name);
            Imgfiles.push(files[i]);
        }
        $scope.$apply();
        console.log($scope.filenames);
    }

    /*
	 * MEthod removes individual images from multiple file select in the view =>[other photo's]
	 * Remove the name in the chosen field if there are no records
	 TODO: Ensure that you submit images and pull request asap
    */
    $scope.removeImage = function(idx){
    	$scope.filenames.splice(idx,1);
    	if ($scope.filenames[idx] === $('#upload-select')[0].files[0].name) $('#upload-select')[0].files[0] ="";
    	if ($scope.filenames.length === 0) $('#upload-select')[0].value = "";
    	$scope.$apply();

    }

	function constructor(){
		$scope.$emit('LOAD');
		$scope.inspectiontype = $routeParams.inspectiontype;
		$scope.$emit('heading',{heading: 'Audit Form', icon : 'fa fa-check-square-o'});
		$scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: $scope.onBackClicked});
        $scope.$emit('right', {label: 'Next', icon: 'fa fa-chevron-right', onclick: $scope.onNextClicked, rightIcon: true});
		if ($routeParams.screennum == 0){
			$scope.view = 'client';
			newObject();
			fetchClients();
		} else if ($routeParams.screennum == 1){
			$scope.$emit('UNLOAD');
			sessionStorage.removeItem('currentImage');
			sessionStorage.removeItem('currentVinNumber');
			$scope.view = 'licence';
            $scope.Form = JSON.parse(sessionStorage.getItem('currentForm'));
		} else if ($routeParams.screennum == 2){
			$scope.$emit('UNLOAD');
			$scope.view = 'vinpicture';
			$scope.image = sessionStorage.getItem('currentImage');
			$scope.capture = $scope.image ? true : false;
			$scope.Form = JSON.parse(sessionStorage.getItem('currentForm'));
		} else if ($routeParams.screennum == 3){
			$scope.$emit('UNLOAD');
			$scope.image = sessionStorage.removeItem('currentLicenceImage');
			$scope.Form = JSON.parse(sessionStorage.getItem('currentForm'));
			$scope.view = 'vinmatch';
			$scope.image = sessionStorage.getItem('currentImage');
			$scope.VinNumber = sessionStorage.getItem('currentVinNumber');
		} else if ($routeParams.screennum == 4){
			$scope.$emit('UNLOAD');
			$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
			$scope.view = 'licensephoto';
			$scope.image = sessionStorage.getItem('currentLicenceImage');
			$scope.capture = $scope.image ? true : false;
		} else if ($routeParams.screennum == 5){
			$scope.$emit('UNLOAD');
			$scope.view = 'licensematch';
			$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
			$scope.image = sessionStorage.getItem('currentLicenceImage');
			//TODO: Remove Once Cordova plugin for scanning system is done
			$scope.RegNumber = 'HTT 091 GP';
		} else if ($routeParams.screennum == 6){
			$scope.$emit('right', {label: 'Save', icon: 'fa fa-save', onclick: $scope.saveSignature});
			$scope.view = 'form';
			if ($scope.inspectiontype === 'technicalreport' || $scope.inspectiontype === 'customervisits' ) fetchGPs();
			$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
			$scope.Form.JSON.RegNumber = 'HTT 091 GP';
			$scope.Form.JSON.VinNumber = sessionStorage.getItem('currentVinNumber');
			$scope.Form.JSON.LicenceExpiryDate = '25 July 2017';
			$scope.inspectorSignatureBoxLabel =  OptionSvc.getText('inspectorSignatureBoxLabel', 'Inspector');
			$scope.techSignatureBoxLabel = OptionSvc.getText('techSignatureBoxLabel', 'Technical Advisor');
			$scope.managerSignatureBoxLabel = OptionSvc.getText('managerSignatureBoxLabel', 'Workshop Manager');
			$scope.id = $scope.Form.FormType;
			JsonFormSvc.buildForm($scope, $scope.id, $scope.id, false, true, 'form', 'view', '', $scope.Form.JSON);
			$scope.$emit('UNLOAD');
		}
	}
	constructor();

});