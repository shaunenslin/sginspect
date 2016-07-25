coreApp.controller('SelectClientCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc){
	$scope.isPhoneGap = Settings.isPhoneGap;

	function newObject(){
		$scope.Form = {
			FormType: $routeParams.inspectiontype,
			ClientID: "",
			FormID: GlobalSvc.getGUID()
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
			$scope.Form.vinimage = key;
			sessionStorage.setItem('currentImage', $scope.image);
			CaptureImageSvc.savePhoto(key, $scope.image);
		}else if ($routeParams.screennum == 3){
			if ($scope.Form.vinmatch === undefined){
				$alert({content: "Please select an option below before continuing !", duration:6, placement:'top-right', type:'danger', show:true});
				return;
			}
		} else if ($routeParams.screennum == 4){
			if(!$scope.image) {
				$alert({content: "Please capture the Licene Plate Number picture before continuing !", duration:6, placement:'top-right', type:'danger', show:true});
				return;
			}
			var key = $scope.Form.FormID + 'reg.png';
			$scope.Form.regimage = key;
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

	$scope.onPhotoClicked = function(){
		var reader = new FileReader();
		reader.addEventListener("load", function () {
			$scope.image = reader.result;
			$scope.licenceImage = reader.result;
			$scope.capture = true;
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

			if (image){
        		reader.readAsDataURL(image.files[0]);
        	}
		}
	}

	$scope.matchClicked = function(clickVal){
		if($routeParams.screennum == 3){
		$scope.Form.vinmatch = (clickVal.length > 0) ? true : false;

		} else{
			$scope.Form.regmatch = (clickVal.length > 0) ? true : false;
		}
		$alert({content:"Choice captured. Please press Next to continue", duration:6, placement:'top-right', type:'success', show:true});
		$scope.$apply();
	}


	function constructor(){
		$scope.$emit('LOAD');
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
		}
	}
	constructor();

});