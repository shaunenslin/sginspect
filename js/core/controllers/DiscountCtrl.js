coreApp.controller(
'DiscountCtrl',
function($scope, $routeParams, $http, Settings, GlobalSvc, $location, $alert) {
	var user = GlobalSvc.getUser();
	$scope.discounts = [];
	$scope.conditions = [];
	$scope.currentCondition = {};
	$scope.discountEdit = {};
	$scope.Types = [ 'DISCOUNT', 'PRICE' ];

	function saveDiscount() {
		var success = function() {
			if ($scope.discountEdit.Deleted === 0) {
				$alert({content: 'Discount has been saved', duration:4, placement:'top-right', type:'success', show:true});
				$location.path("discount/form/" + $scope.discountEdit.DiscountID);
			} else {
				$alert({content: 'Discount has been deleted', duration:4, placement:'top-right', type:'success', show:true});
			}
			$scope.$apply();
		};
		var error = function() {
			if ($scope.discountEdit.Deleted === 0) {
				$scope.errorMsg = "Error saving Discount";
			} else {
				$scope.errorMsg = "Error deleting Discount";
			}
		};
		var url = Settings.url + 'StoredProcModify?StoredProc=usp_discount_modify';
		GlobalSvc.postData(url, $scope.discountEdit, success,
				error, 'Discount', 'Modify', false, true);
		console.log($scope.discountEdit);
	}

	$scope.deleteDiscount = function() {
		$scope.discountEdit.Deleted = 1;
		saveDiscount();
	};

	$scope.saveDiscount = function() {
		$scope.discountEdit.Deleted = 0;
		saveDiscount();
	};

	/*
	 * Save the discount conditions
	 */
	function saveCondition() {
		var success = function() {
			if ($scope.currentCondition.Deleted === 0) {
				$alert({content: 'Condition has been saved', duration:4, placement:'top-right', type:'success', show:true});
			} else {
				$alert({content: 'Discount has been deleted', duration:4, placement:'top-right', type:'success', show:true});
			}
			$location.path('discount/conditions/' + $routeParams.id);
		};
		var error = function() {
			$alert({content: 'Error saving', duration:4, placement:'top-right', type:'danger', show:true});
		};
		var url = Settings.url + 'StoredProcModify?StoredProc=usp_discountcondition_modify';
		GlobalSvc.postData(url, $scope.currentCondition, success, error, 'DiscountCondition', 'Modify', false, true);
	}

	$scope.saveCondition = function() {
		$scope.currentCondition.InCond  = ($scope.currentCondition.operation === 'In') ? true : false;
		$scope.currentCondition.Deleted = 0;
		saveCondition();
	};

	$scope.deleteCondition = function() {
		$scope.currentCondition.Deleted = 1;
		saveCondition();
	};

	/*
	 * On change of RTObject
	 */
	$scope.RTObjectChanged = function() {
		initDiscountCondition();
	};

	function newObject() {
		$scope.discountEdit = {
			SupplierID : user.SupplierID,
			DiscountID : '',
			Name : '',
			Type : '',
			SortOrder : 0,
			OverwriteDiscount : false,
			SkipRest : false,
			ApplyToGross : false

		};
		$scope.$emit('UNLOAD');
	}

	function newConditionObject() {
		var conditions = JSON.parse(sessionStorage.getItem('conditions'));
		$scope.currentCondition = {
			SupplierID : user.SupplierID,
			DiscountID : $routeParams.id,
			DiscountConditionID : '',
			DiscountField : '',
			InCond : false,
			AndCond : false,
			OrCond : false,
			RTAttribute : '',
			RTObject : '#ProductID'
		};
		if (conditions === undefined || conditions === null || conditions.length === 0) {
			$scope.currentCondition.DiscountConditionID = 1;
		} else {
			$scope.currentCondition.DiscountConditionID = conditions.length + 1;
		}
		initDiscountCondition();
		$scope.$emit('UNLOAD');
	}

	function fetchDiscount() {
		var url = Settings.url
				+ "GetStoredProc?StoredProc=usp_discount_readsingle3&params=("
				+ user.SupplierID + "|" + $scope.id + ")";
		$http({method : 'GET',url : url}).success(function(data) {
			$scope.$emit('UNLOAD');
			$scope.discountEdit = data[0];
			console.log(data);
		}).error(function(err) {
			console.log(err);
		});
	}

	function fetchDiscounts() {
		var url = Settings.url
				+ "GetStoredProc?StoredProc=usp_discount_readlist&params=("
				+ user.SupplierID + ")";
		$http({method : 'GET',url : url})
		.success(function(data) {
			$scope.$emit('UNLOAD');
			$scope.discounts = data;
		}).error(function(err) {
			console.log(err);
		});
	}

	/*
	 * Find current condition from sessionStorage
	 */
	function fetchCondition() {
		var conditions = JSON.parse(sessionStorage.getItem('conditions'));
		for (var x=0; x<conditions.length; x++){
			if (conditions[x].DiscountConditionID.toString() === $routeParams.conditionid){
				$scope.currentCondition = conditions[x];
				initDiscountCondition();
				$scope.$emit('UNLOAD');
				return;
			}
		}
	}

	function fetchConditions() {
		delete $scope.conditions;
		delete $scope.InfoMsg;
		$scope.conditiontracker = [];
		var url = Settings.url + "GetStoredProc?StoredProc=usp_discountcondition_readlist2&params=(" + user.SupplierID + "|" + $scope.id + ")";
		$http({method : 'GET',url : url})
		.success(
			function(data) {
				if (data.length === 0) {
					$scope.InfoMsg = "You need to add conditions for this discount by clicking the 'New' button.";
				} else {
					sessionStorage.setItem('conditions', JSON.stringify(data));
					$scope.conditions = data;
				};
				$scope.$emit('UNLOAD');
				//$scope.currentCondition = data[0];
				//initDiscountCondition();
			}).error(function(err) {
				console.log(err);
			});
	}

	/*
	 * Set valid choices for fields
	 */
	function initDiscountCondition() {
		$scope.form_params = {currentConditionID : 1,rtfield : [],disField : [],operation : [ 'Equals', 'In' ]};
		$scope.currentCondition.operation = '';
		$scope.form_params.currentConditionID = $scope.currentCondition.DiscountConditionID;
		if ($scope.currentCondition.InCond === true) {
			$scope.currentCondition.operation = 'In';
		} else {
			$scope.currentCondition.operation = 'Equals';
		}
		if ($scope.currentCondition.RTObject === '#Account') {
			$scope.form_params.rtfield = [ "AccountID", "AccountGroup", "BranchID",
			            				"AccountType", "Pricelist", "Userfield01",
			            				"Userfield02", "Userfield03", "Userfield04",
			            				"Userfield05"];
		} else {
			$scope.form_params.rtfield = [ 'ProductID',
					'Description', 'CategoryName',
					'Usefield01', 'Usefield02', 'Usefield03' ];
		}
		$scope.form_params.RTObject = [ '#Account', '#Product' ];
		$scope.form_params.disField = [ "AccountID", "AccountGroup", "BranchID",
		        		 				"ProductID", "Category", "Usefield01",
		        		 				"Usefield02", "Usefield03", "Usefield04" ];
	}

	function constructor() {
		if (!user.IsAdmin) {
			$scope.errorMsg = 'You are not authorised....';
			return;
		}
		$scope.$emit('LOAD');
		$scope.$emit('heading', {heading : 'Discounts',icon : 'fa fa-user'});
		if ($routeParams.mode && $routeParams.id) {
			$scope.id = $routeParams.id;
			$scope.mode = $routeParams.mode;
			if ($scope.id === 'new') {
				$scope.$emit('left', {label : 'Back',icon : 'glyphicon glyphicon-chevron-left',onclick : function() {window.history.back();}});
				$scope.$emit('right', {label : 'Save',icon : 'glyphicon glyphicon-floppy-save',onclick : $scope.saveDiscount});
				newObject();
			} else if ($routeParams.mode === 'conditions') {
				$scope.$emit('left',{label : 'Back',icon : 'glyphicon glyphicon-chevron-left',onclick : function() {$location.path('discount');}});
				$scope.$emit('right', {label : 'New',icon : 'glyphicon glyphicon-plus',href : '#/discount/condition/' + $scope.id + '/new'});
				$scope.activetab = 'Condition';
				fetchConditions();
			} else if ($routeParams.mode === 'condition') {
				$scope.mode = 'condition';
				if ($routeParams.conditionid === 'new')
					newConditionObject();
				else
					fetchCondition();
				$scope.$emit('left',{label : 'Back',icon : 'glyphicon glyphicon-chevron-left',onclick : function() {window.history.back();}});
				$scope.$emit('right',{label : 'Save',icon : 'glyphicon glyphicon-floppy-save',onclick : $scope.saveCondition});
			} else {
				$scope.$emit('left', {label : 'Back',icon : 'glyphicon glyphicon-chevron-left',onclick : function() {$location.path('discount');}});
				$scope.$emit('right', {label : 'Save',icon : 'glyphicon glyphicon-floppy-save',onclick : $scope.saveDiscount});
				$scope.mode = 'form';
				$scope.activetab = 'Discount';
				fetchDiscount();
			}
		} else {
			$scope.$emit('right', {label : 'New Discount',icon : 'glyphicon glyphicon-plus',href : '#/discount/form/new'});
			$scope.mode = 'list';
			fetchDiscounts();
		}
	}
	constructor();
});
