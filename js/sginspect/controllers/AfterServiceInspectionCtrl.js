coreApp.controller('AfterServiceInspectionCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc, JsonFormSvc, OptionSvc, $filter){
	$scope.isPhoneGap = Settings.isPhoneGap;
	$scope.signature = {"inspector" : "", "techAdvisor" : "", "manager" : ""};
	/** The variable below is the svg represtion of an empty signature  **/
	var emptySignature = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4=";

    $scope.kilometerImages = [];
    $scope.commentPhotoImages = [];
	
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



	$scope.onBackClicked = function(){
		if($routeParams.screennum == 6 && ($scope.inspectiontype === 'customervisit' || $scope.inspectiontype === 'supplierevaluation'))
			var path = Settings.workflow['audit'][0].route + '/' + $routeParams.inspectiontype + '/' + 0; 
		else
			var path = $routeParams.screennum == 0 ? '/' : Settings.workflow['audit'][parseInt($routeParams.screennum) - 1].route  + '/' + $routeParams.inspectiontype + '/' + (parseInt($routeParams.screennum) - 1);
		$location.path(path);
	}

	$scope.onPhotoClicked = function(field, filenames){
		var reader = new FileReader();
		reader.addEventListener("load", function () {
			$scope.image = reader.result;
			if ($scope.image){
				var key = $scope.Form.FormID + '_' + field + filenames.length  + '.png';
				CaptureImageSvc.savePhoto(key, $scope.image);
				filenames.push(key)
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

    $scope.removeImage = function(idx, filenames){
		filenames.splice(idx,1);
    	$scope.$apply();
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

	$scope.saveSignature = function(){
		$scope.$emit('LOAD');
		if(!$scope.Form.JSON.commentsOrPhotos){
			$alert({ content: "Please enter in all fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
		}

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
            $scope.$emit('UNLOAD');
			return;
        }
		saveForm();
	}

	function saveForm(){
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
		}
        
        );
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
			$alert({ content: "Your Form has been saved Ok.", duration: 5, placement: 'top-right', type: 'success', show: true});
			sessionStorage.removeItem('currentImage');
			sessionStorage.removeItem('currentLicenceImage');
			sessionStorage.removeItem('currentForm');
			sessionStorage.removeItem('currentVinNumber');
			sessionStorage.removeItem('currentClientsCache');
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

    function fetchClient(){
    	var Client = JSON.parse(sessionStorage.getItem('currentClientsCache'));
    	$scope.Client = $filter('filter')(Client, {ClientID : $scope.Form.ClientID})[0];
    }

	function constructor(){
		$scope.$emit('LOAD');
	    $scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: $scope.onBackClicked});
        $scope.$emit('right', {label: 'Next', icon: 'fa fa-chevron-right', onclick: $scope.onNextClicked, rightIcon: true});
        $scope.$emit('heading',{heading: 'After Service Inspection', icon : 'fa fa-car'});
        $scope.$emit('right', {label: 'Save', icon: 'fa fa-save', onclick: $scope.saveSignature});
        $scope.Form = JSON.parse(sessionStorage.getItem('currentForm'));
        $scope.Form.JSON.RegNumber = 'HTT 091 GP';
        $scope.Form.JSON.VinNumber = sessionStorage.getItem('currentVinNumber');
        $scope.Form.JSON.LicenceExpiryDate = '25 July 2017';
		fetchGPS();
        $scope.$emit('UNLOAD');
	}
	constructor();
});