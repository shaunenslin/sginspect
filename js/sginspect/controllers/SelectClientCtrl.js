coreApp.controller('SelectClientCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc, OptionSvc, $filter){
	$scope.isPhoneGap = Settings.isPhoneGap;
	$scope.image = "";
	DaoSvc.openDB();

	$scope.supplierStatus = "";
	function newObject(){
		return {
			FormType 	  : $routeParams.inspectiontype,
			ClientID 	  : "",
			FormID 		  : GlobalSvc.getGUID(),
			SupplierID    : "",
			UserID 		  : GlobalSvc.getUser().UserID,
			FormDate	  : moment().format('YYYY-MM-DD HH:mm:ss'),
			VinNumber 	  : "",
			ExportedtoISO : 0,
			JSON 		  : {}
		}
	}

	$scope.onNextClicked = function(){
		// Validation across all screens
		var path = '';
		if ($routeParams.screennum == 0){
			if (!$scope.Form.ClientID) {$alert({content: "Please select a Customer before continuing !", duration:5, placement:'top-right', type:'danger', show:true}); return;};
			$filter('filter')($scope.Clients, function(e){if (e.ClientID === $scope.Form.ClientID) {$scope.Form.JSON.CustomerName = e.Name; return;}} );
			$scope.Form.JSON.User_Name = GlobalSvc.getUser().Name;

		}else if ($routeParams.screennum == 1){
			if (!$scope.VinNumber){
				$alert({content: "Please scan license disk continuing !", duration:5, placement:'top-right', type:'danger', show:true});
				return;
			}

		} else if ($routeParams.screennum == 2){
			if ($scope.Form.JSON.vinmatch === undefined){
				$alert({content: "Please select an option below before continuing !", duration:5, placement:'top-right', type:'danger', show:true});
				return;
			}
		} else if($routeParams.screennum == 3){
			if(!$scope.image){
				$alert({content: "Please capture the VIN picture before continuing !", duration:5, placement:'top-right', type:'danger', show:true});
				return;
			}
			var key = $scope.Form.FormID + '_vin.png';
			$scope.Form.JSON.vinimage = key;
			CaptureImageSvc.savePhoto(key, $scope.Form.FormID, $scope.image, $scope.Form.ClientID, $scope.Form.FormDate);
		} else if ($routeParams.screennum == 4){
			if(!$scope.image) {
				$alert({content: "Please capture the Licene Plate Number picture before continuing !", duration:5, placement:'top-right', type:'danger', show:true});
				return;
			}
			var key = $scope.Form.FormID + '_license.png';
			$scope.Form.JSON.regimage = key;
			CaptureImageSvc.savePhoto(key, $scope.Form.FormID, $scope.image, $scope.Form.ClientID, $scope.Form.FormDate);
		}
		sessionStorage.setItem('currentForm', JSON.stringify($scope.Form));
		 // Path is generic to cater for all navigation scenarios
		if ($scope.inspectiontype !== 'supplierevaluation') {
			path = ($routeParams.screennum == 5 || $routeParams.inspectiontype === 'customervisit' || (!$scope.Form.JSON.vinmatch && $routeParams.screennum == 3) || (!$scope.Form.JSON.licensematch && $routeParams.screennum == 4)) ? $routeParams.inspectiontype : Settings.workflow['audit'][parseInt($routeParams.screennum) + 1].route + '/' + $routeParams.inspectiontype + '/' + (parseInt($routeParams.screennum) + 1);
		}else{
			path = $scope.inspectiontype + '/' + $scope.Form.JSON.SupplierStatus.toLowerCase();
			delete $scope.Form.JSON.SupplierStatus;	
		}
		savePartialForm();
		$location.path(path);
	}

	function fetchClients(){
		$scope.Clients = [];
		DaoSvc.openDB();
		DaoSvc.cursor('SGIClient',
			function(json){
				$scope.Clients.push(json);
			}, function(err){
				$scope.$emit('UNLOAD');
				$alert({content: "Error fetching Customers " + err, duration:5, placement:'top-right', type:'danger', show:true});
			},function(){
				sessionStorage.setItem('currentClientsCache', JSON.stringify($scope.Clients));
				$scope.$emit('UNLOAD');
				$scope.$apply();
		});
	}

	$scope.onBackClicked = function(){
		var path  = '';
		if (parseInt($routeParams.screennum) !== 0) savePartialForm();
		if (sessionStorage.getItem('fromJobsScreenCache')){
			path = '/jobs/open';
			sessionStorage.removeItem('fromJobsScreenCache');
		}else{ 
			path = window.history.back();
		}
		$location.path(path);
	}

	$scope.nfcScan = function(){
	    if(Settings.isPhoneGap){
            cordova.plugins.barcodeScanner.scan(
                  function (result) {
						if(result.cancelled) return;
		            	var barCodeData = result.text.split('%');
		                $scope.VinNumber = barCodeData[12];
						$scope.Form.VinNumber = $scope.VinNumber;
						$scope.Form.JSON.ExpiryDate = barCodeData[14];
						$scope.Form.JSON.LicenseNumber = barCodeData[6];
						$scope.Form.JSON.Tarre = barCodeData[2];
						$scope.Form.JSON.DiscNo = barCodeData[5];
						$scope.Form.JSON.RegistrationNo = barCodeData[1];
						$scope.Form.JSON.VehicleRegistrationNo = barCodeData[7];
						$scope.Form.JSON.VehicleDescription = barCodeData[8];
						$scope.Form.JSON.Make = barCodeData[9];
						$scope.Form.JSON.EngineNo = barCodeData[13]
						$scope.Form.JSON.Color =  barCodeData[11];
						$scope.Form.JSON.RegistrationFrequency = barCodeData[4];
						$scope.Form.JSON.NatisLicenseNumber = barCodeData[3];
						$scope.Form.JSON.Model = barCodeData[10];
						sessionStorage.setItem('currentLicenseNumber', barCodeData[6]);
						sessionStorage.setItem('currentVinNumber', barCodeData[12]);
						sessionStorage.setItem('currentExpirayDate', barCodeData[14]);
						$scope.onNextClicked();
						$scope.$apply();
                  },
                  function (error) {
                      alert("Scanning failed: " + error);
                  },
                  {
                      "prompt" : "Place a barcode inside the scan area", // supported on Android only
                      "formats" : "PDF_417", // default: all but PDF_417 and RSS_EXPANDED
                      "orientation" : "landscape" // Android only (portrait|landscape), default unset so it rotates with the device
                  }
               );
	    }else{
	        $scope.VinNumber = "IG1YY23671299872";
            $scope.Form.VinNumber = $scope.VinNumber;
            $scope.Form.JSON.ExpiryDate = '21 July 2017';
            $scope.Form.JSON.LicenseNumber = 'HTT 091 GP';
            $scope.Form.JSON.Tarre = '145';
            $scope.Form.JSON.DiscNo = '100105611VVY';
            $scope.Form.JSON.RegistrationNo = 'MVL1CC14'
            $scope.Form.JSON.VehicleRegistrationNo = 'VFN899W';
            $scope.Form.JSON.VehicleDescription = 'Van body / Toebak';
            $scope.Form.JSON.Make = 'NISSAN DIESEL';
            $scope.Form.JSON.EngineNo = 'FE6308052F'
            $scope.Form.JSON.Color =  'grey';
            $scope.Form.JSON.NatisLicenseNumber = '4024R00X';
            $scope.Form.JSON.RegistrationFrequency = 1;
            $scope.Form.JSON.Model = 'NP300 HARDBODY';
			sessionStorage.setItem('currentExpirayDate', '21 July 2017');
            sessionStorage.setItem('currentLicenseNumber', 'HTT 091 GP');
            sessionStorage.setItem('currentVinNumber', $scope.VinNumber);
        	$scope.onNextClicked();
        }
	}

	$scope.onPhotoClicked = function(field){
		var reader = new FileReader();
		reader.onload  = function(e) {
			$scope.image = reader.result;
			if(!$scope.image){
				$scope.capture = true;
			}
			$alert({content:"Image captured successfully", duration:5, placement:'top-right', type:'success', show:true});
			$scope.onNextClicked();
			$scope.$apply();
		};
		if ($scope.isPhoneGap){
			var onSuccess = function(img){
				$scope.image = img;
				$scope.capture = true;
				$scope.onNextClicked();
				$scope.$apply();
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

	$scope.matchClicked = function(clickVal){
		if($routeParams.screennum == 2){
			$scope.Form.JSON.vinmatch = (clickVal.length > 0) ? true : false;
			if ($scope.Form.JSON.vinmatch){

				sessionStorage.setItem('currentForm', JSON.stringify($scope.Form));
				$location.path('/licensematch/' + $routeParams.inspectiontype +'/5');
				return;
			}

		} else{
			$scope.Form.JSON.licensematch = (clickVal.length > 0) ? true : false;
			if(!$scope.Form.JSON.licensematch){
				sessionStorage.setItem('currentForm', JSON.stringify($scope.Form));
				$location.path('/licensephoto/' + $routeParams.inspectiontype + '/4');
				return;
			}
				
		}
		$scope.onNextClicked();
	}
	function savePartialForm(){
		$scope.Form.JSON.Path = $location.path();
		$scope.Form.JobType = 'Open Jobs';
		DaoSvc.put($scope.Form, 'InProgress', $scope.Form.FormID, function(){console.log('Partial Save of ' + $location.path() + ' successful')},function(){console.log('Partial Save of' + $location.path() + ' failed')},function(){$scope.$apply();});
	}

	function constructor(){
		$scope.$emit('LOAD');
		window.scrollTo(0, 0);
		$scope.inspectiontype = $routeParams.inspectiontype;
		switch ($scope.inspectiontype){
			case 'technicalreport':
				$scope.$emit('heading',{heading: 'Technical Report', icon : 'fa fa-book'});
				break;
			case 'supplierevaluation' :
				$scope.$emit('heading',{heading: 'Supplier Evaluation', icon : 'fa fa-thumbs-o-up'});
				break;
			case 'afterserviceevaluation' :
				$scope.$emit('heading',{heading: 'After Service Inspection', icon : 'fa fa-car'});
				break;
			case 'audit' :
			case 'customervisit' :
				$scope.$emit('heading',{heading: ($scope.inspectiontype === 'audit' ? 'Audit Form' : 'Customer Visit'), icon : 'fa fa-check-square-o'});
		}
		$scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: $scope.onBackClicked});
		if ($routeParams.screennum == 0){
			sessionStorage.removeItem('fromJobsScreenCache');
			sessionStorage.removeItem('currentClientsCache');
			$scope.view = 'client';
			$scope.Form = sessionStorage.getItem('currentForm') ? JSON.parse(sessionStorage.getItem('currentForm')) : newObject();
			if ($scope.Form.ClientID.length > 0) $scope.$emit('right', {label: 'Next', icon: 'fa fa-chevron-right', onclick: $scope.onNextClicked, rightIcon: true});
			fetchClients();
		} else if ($routeParams.screennum == 1){
			$scope.$emit('UNLOAD');
			sessionStorage.removeItem('currentVinNumber');
			$scope.view = 'licence';
            $scope.Form = JSON.parse(sessionStorage.getItem('currentForm'));
		} else if ($routeParams.screennum == 2){
			$scope.$emit('UNLOAD');
			$scope.Form = JSON.parse(sessionStorage.getItem('currentForm'));
			$scope.view = 'vinmatch';
			$scope.VinNumber = sessionStorage.getItem('currentVinNumber');
		} else if ($routeParams.screennum == 3){
			$scope.$emit('UNLOAD');
			$scope.view = 'vinpicture';
			$scope.Form = JSON.parse(sessionStorage.getItem('currentForm'));
		} else if ($routeParams.screennum == 4){
			$scope.$emit('UNLOAD');
			$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
			$scope.view = 'licensephoto';
		} else{
			$scope.$emit('UNLOAD');
			$scope.view = 'licensematch';
			$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
			$scope.LicenseNumber = sessionStorage.getItem('currentLicenseNumber');
			console.log($scope.image);
		}
		if (parseInt($routeParams.screennum) !== 0) savePartialForm();
	}
	constructor();
});