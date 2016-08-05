coreApp.controller('SelectClientCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc, JsonFormSvc, OptionSvc, $filter){
	$scope.isPhoneGap = Settings.isPhoneGap;
	$scope.image = "";

	$scope.supplierStatus = "";
	function newObject(){
		$scope.Form = {
			FormType: $routeParams.inspectiontype,
			ClientID: "",
			FormID: GlobalSvc.getGUID(),
			SupplierID  : "",
			UserID 		: GlobalSvc.getUser().UserID,
			FormDate	: moment().format('YYYY-MM-DD HH:mm:ss'),
			JSON 		: {}
		}
	}

	$scope.onNextClicked = function(){
		// Validation across all screens
		if ($routeParams.screennum == 0){
				if (!$scope.Form.ClientID) {$alert({content: "Please select a Client before continuing !", duration:5, placement:'top-right', type:'danger', show:true}); return;};

		}else if ($routeParams.screennum == 1){
			if (!$scope.VinNumber){
				$alert({content: "Please scan license disk continuing !", duration:5, placement:'top-right', type:'danger', show:true});
				return;
			}

		}else if($routeParams.screennum == 2){
			if(!$scope.image) {
				$alert({content: "Please capture the VIN picture before continuing !", duration:5, placement:'top-right', type:'danger', show:true});
				return;
			}
			var key = $scope.Form.FormID + '_vin.png';
			$scope.Form.JSON.vinimage = key;
			sessionStorage.setItem('currentImage', $scope.image);
			CaptureImageSvc.savePhoto(key, $scope.image);
		}else if ($routeParams.screennum == 3){
			if ($scope.Form.JSON.vinmatch === undefined){
				$alert({content: "Please select an option below before continuing !", duration:5, placement:'top-right', type:'danger', show:true});
				return;
			}
		} else if ($routeParams.screennum == 4){
			if(!$scope.image) {
				$alert({content: "Please capture the Licene Plate Number picture before continuing !", duration:5, placement:'top-right', type:'danger', show:true});
				return;
			}
			var key = $scope.Form.FormID + '_reg.png';
			$scope.Form.JSON.regimage = key;
			sessionStorage.setItem('currentLicenceImage', $scope.image);
			CaptureImageSvc.savePhoto(key, $scope.image);
		}
		sessionStorage.setItem('currentForm', JSON.stringify($scope.Form));
		 // Path is generic to cater for all navigation scenarios
		var path = ($routeParams.screennum == 5) ? $routeParams.inspectiontype : Settings.workflow['audit'][parseInt($routeParams.screennum) + 1].route + '/' + $routeParams.inspectiontype + '/' + (parseInt($routeParams.screennum) + 1);
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
				$alert({content: "Error fetching Clients " + err, duration:5, placement:'top-right', type:'danger', show:true});
			},function(){
				sessionStorage.setItem('currentClientsCache', JSON.stringify($scope.Clients));
				$scope.$emit('UNLOAD');
				$scope.$apply();
		});
	}

	$scope.onBackClicked = function(){
		if($routeParams.screennum == 6 && ($scope.inspectiontype === 'customervisit' || $scope.inspectiontype === 'supplierevaluation'))
			var path = Settings.workflow['audit'][0].route + '/' + $routeParams.inspectiontype + '/' + 0; 
		else
			var path = $routeParams.screennum == 0 ? '/' : Settings.workflow['audit'][parseInt($routeParams.screennum) - 1].route  + '/' + $routeParams.inspectiontype + '/' + (parseInt($routeParams.screennum) - 1);
		$location.path(path);
	}

	$scope.nfcScan = function(){
		$scope.VinNumber = "IG1YY23671299872";
		sessionStorage.setItem('currentRegNumber', 'HTT 091 GP');
		sessionStorage.setItem('currentVinNumber', $scope.VinNumber);
		$alert({content: "Vehicle number " + $scope.VinNumber + " scanned successfully. Please Press 'Next' to continue", duration:5, placement:'top-right', type:'success', show:true});
	}

	$scope.onPhotoClicked = function(field){
		if(field === 'other-photos' && $routeParams.screennum == 6){
			saveMultiplePhotos(field);
			$alert({content:"Image captured successfully", duration:5, placement:'top-right', type:'success', show:true});
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
				var image = $('#file-select')[0];

				if (image && image.files.length > 0){
		    		reader.readAsDataURL(image.files[0]);
		    	}
			}
		}
	}

	$scope.matchClicked = function(clickVal){
		if($routeParams.screennum == 3){
		$scope.Form.JSON.vinmatch = (clickVal.length > 0) ? true : false;

		} else{
			$scope.Form.JSON.regmatch = (clickVal.length > 0) ? true : false;
		}
		$scope.onNextClicked();
		$scope.$apply();
	}

	function constructor(){
		$scope.$emit('LOAD');
		$scope.inspectiontype = $routeParams.inspectiontype;
		switch ($scope.inspectiontype){
			case 'technicalreport':
				$scope.$emit('heading',{heading: 'Technical Report', icon : 'fa fa-book'});
				break;
			case 'supplierevaluation' :
				$scope.$emit('heading',{heading: 'Supplier Evaluation', icon : 'fa fa-thumbs-o-up'});
				break;
			case 'afterserviceevaluation' : 
				$scope.$emit('heading',{heading: 'After Service Evaluation', icon : 'fa fa-car'});
				break;
			case 'audit' :
			case 'customervisit' :
				$scope.$emit('heading',{heading: ($scope.inspectiontype === 'audit' ? 'Audit' : 'Customer Visit') + 'Form', icon : ($scope.inspectiontype === 'audit' ? 'fa fa-check-square-o' : 'fa fa-map-marker')});
		}
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
		} else{
			$scope.$emit('UNLOAD');
			$scope.view = 'licensematch';
			$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
			$scope.image = sessionStorage.getItem('currentLicenceImage');
			$scope.RegNumber = sessionStorage.getItem('currentRegNumber');
		}
	}
	constructor();

});