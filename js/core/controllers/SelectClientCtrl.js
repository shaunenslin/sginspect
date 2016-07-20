coreApp.controller('SelectClientCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location){

	function newObject(){
		$scope.form = {
			FormType: $routeParams.inspectiontype,
			ClientID: ""
		}
	}
	$scope.onNextClicked = function(){
		if (!$scope.form.ClientID){
			$alert({content: "Please select a Client before continuing !", duration:6, placement:'top-right', type:'danger', show:true});
			return;
		}
		sessionStorage.setItem('currentForm', JSON.stringify($scope.form));
		$location.path(Settings.workflow[$routeParams.inspectiontype][parseInt($routeParams.screennum) + 1].route + '/' + $routeParams.inspectiontype + '/' + (parseInt($routeParams.screennum) + 1));
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
		$location.path(Settings.workflow[$routeParams.inspectiontype][parseInt($routeParams.screennum) - 1].route  + '/' + $routeParams.inspectiontype + '/' + (parseInt($routeParams.screennum) - 1));
	}

	$scope.onScanClicked = function(){
		$location.path(Settings.workflow[$routeParams.inspectiontype][parseInt($routeParams.screennum) + 4].route + '/' + $routeParams.inspectiontype + '/' + (parseInt($routeParams.screennum) + 1));
	}

	$scope.nfcScan = function(){
		$scope.VinNumber = "IG1YY23671299872";
		$alert({content: "Vehicle number 'IG1YY23671299872' scanned successfully. Please Press 'Next' to continue", duration:6, placement:'top-right', type:'success', show:true});
	}

	function constructor(){
		if ($routeParams.screennum == 0){
			$scope.inspectiontype = 'client';
			$scope.$emit('heading',{heading: 'Audit', icon : 'fa fa-check-square-o'});
            $scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: function(){window.history.back();}});
            $scope.$emit('right', {label: 'Next', icon: 'fa fa-chevron-right', onclick: $scope.onNextClicked, rightIcon : true});
			newObject();
			fetchClients();
		} else if ($routeParams.screennum == 1){
			$scope.inspectiontype = 'licence';
			$scope.$emit('heading',{heading: 'Scan', icon : 'fa fa-search'});
			$scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: function(){$scope.onBackClicked();}});
            $scope.$emit('right', {label: 'Next', icon: 'fa fa-chevron-right', onclick: $scope.onScanClicked, rightIcon : true});
            $scope.Form = JSON.parse(sessionStorage.getItem('currentForm'));
		}
	}
	constructor();

});