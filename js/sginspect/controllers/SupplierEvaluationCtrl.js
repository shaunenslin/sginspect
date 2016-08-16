coreApp.controller('SupplierEvaluationCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc, JsonFormSvc, OptionSvc, $filter, SyncSvc){
	$scope.isPhoneGap = Settings.isPhoneGap;
    $scope.signature = {technicaladvisor : "", workshopmanager: ""};
	$scope.evaluationImages = [];
	$scope.CleanlinessImages = [];
	$scope.SpecialToolsTrainingImages = [];
	$scope.ReceptionImages = [];
	/** The variable below is the svg represtion of an empty signature  **/
	var emptySignature = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4=";
	var Imgfiles = [];
    $scope.options = [
                {name:"Good"},
                {name:"Average"},
                {name:"Bad"}]

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
			SupplierID: $scope.Form.JSON.SupplierID,
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
            $scope.$emit('UNLOAD');
            $scope.$apply();
        },function(){
            $scope.$emit('UNLOAD');
            $scope.$apply();
        },'SGISuppliers','modify',false,true);
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
		$location.path("selectclient/supplierevaluation/0");
	}

	$scope.fetchGPS = function(){
		$scope.$emit('LOAD');
		GlobalSvc.getGPS(function(position){
			$scope.Form.JSON.Latitude  = position ? position.coords.latitude : "";
			$scope.Form.JSON.Longitude = position ? position.coords.longitude : "";
			$alert({content:"GPS location captured successfully", duration:5, placement:'top-right', type:'success', show:true});
			$scope.$emit('UNLOAD');
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
		if ($scope.mode == 'new') {
			var found = $filter('filter')($scope.Suppliers,{SupplierID:$scope.Form.JSON.SupplierID});
			if (found.length > 0) {
				$alert({ content: "This supplierID already exists, please use another", duration: 5, placement: 'top-right', type: 'danger', show: true});
	            $scope.$emit('UNLOAD');
	            return;
			}
		}

		if(!$scope.supplierevaluationform.$valid){
			$alert({ content: "Please enter in all fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
		}

		// Check the very last field on format, if it has a value, assume other fields been filled in OK
		if(!$scope.Form.JSON.SpecialToolsTraining){
			$alert({ content: "Please enter in all fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
		}

		// Now check if any items dont have comments or where pictures are needed
		for (prop in $scope.Form.JSON) {
			if ($scope.Form.JSON[prop] === "Bad") {
				if (!$scope.Form.JSON[prop + "Comment"]){
					$alert({ content: "Please enter comments when you have selected BAD", duration: 5, placement: 'top-right', type: 'danger', show: true});
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
 		deleteCurrentPartialForm($scope.Form.FormID);
		appendImagesToJSON();
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
		saveSupplier();
		//Create Unique Key For Signature(s) and/or image(s)
		delete $scope.Form.JSON.Path;
		delete $scope.Form.JobType;
		var technicaladvisorSignature =  createSignatureImage($scope.signature.technicaladvisor, 'technicaladvisor');
		var workshopmanagerSignature =  createSignatureImage($scope.signature.workshopmanager, 'workshopmanager');
		$scope.Form.JSON[technicaladvisorSignature.ID] = technicaladvisorSignature.FileData;
		$scope.Form.JSON[workshopmanagerSignature.ID] = workshopmanagerSignature.FileData;
		$scope.Form.JSON = JSON.stringify($scope.Form.JSON);
		var success = function(){
			sessionStorage.removeItem('currentForm');
			$alert({ content: "Supplier Evaluation Complete", duration: 5, placement: 'top-right', type: 'success', show: true});
			$location.path('/');
		}

		var error = function(err){
			$scope.$emit('UNLOAD');
			$alert({ content:   "Warning: Items have been saved, please sync as soon as possible as you appear to be offline", duration: 5, placement: 'top-right', type: 'warning', show: true});
			sessionStorage.removeItem('currentForm');
			$location.path('/');
		}
		var url = Settings.url + 'Post?method=SGIFormHeaders_modify';
		GlobalSvc.postData(url, $scope.Form, success, error, 'SGIFormHeaders', 'Modify', false, true);
	}

	function watchSupplierChanged(){
		$scope.$watch(function(scope) { return scope.Form.JSON.SupplierID },
			function(newValue, oldValue) {
			  	if ($scope.mode === 'existing'){
				  	var found = $filter('filter')($scope.Suppliers,{SupplierID:$scope.Form.JSON.SupplierID});
					if (found.length > 0) $scope.currentsupplier = found[0];
			  	}
		  	}
		 );
	}

	function constructor(){
		$scope.mode = $routeParams.mode;
		DaoSvc.openDB();
        $scope.$emit('heading',{heading: 'Supplier Evaluation', icon : 'fa fa-check-square-o' });
		$scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: $scope.onBackClicked});
		$scope.$emit('right', {label: 'Save', icon: 'fa fa-save', onclick: $scope.saveSignature});
		$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
		fetchSuppliers();
		watchSupplierChanged();
		savePartialForm();
	}
	constructor();
});
