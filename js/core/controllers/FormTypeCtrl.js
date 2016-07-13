   coreApp.controller("FormTypeCtrl",function($scope,$http,$routeParams,$location,GlobalSvc,Settings,$alert){
	$scope.FormTypes = [];
	$scope.FormType = {};
	
	function fetchFormTypes(){
		delete $scope.errorMsg;
		delete $scope.successMsg;
		 var url= Settings.url + "GetStoredProc?StoredProc=formtype_readlist&params=(" + GlobalSvc.getUser().SupplierID + ")";
		 //TODO: Review Parameters for StoredProc
		 $http.get (url)
	        .success(function(data){
	            $scope.FormTypes = data;
	            console.log(data);
	            $scope.$emit('UNLOAD');
	        })
	        .error(function(error){
	        	$alert({content: 'Error Fetching Data' , duration: 4, placement: 'top-right', type: 'danger', show: true});
	            $scope.$emit('UNLOAD');
	        })
	};
	
	function fetchFormType(){
		delete $scope.errorMsg;
		delete $scope.successMsg;
		var url= Settings.url + "GetStoredProc?StoredProc=formtype_readsingle&params=(" + GlobalSvc.getUser().SupplierID + "|'" + $scope.FormTypeID + "')";
        $http.get (url)
        .success(function(data){
            $scope.FormType = data[0];
            console.log(data);
            $scope.$emit ('UNLOAD');
        })
        .error(function(error){
        	$alert({content: 'Error Fetching Data' , duration: 4, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
        })
	};
	
	function newFormTypeObject(){
		$scope.FormType = {
			SupplierID : GlobalSvc.getUser().SupplierID,
			FormTypeID : 0,
			FormName : '',
			ForAccountID : '',
			ForAccountGrp : '',
			MustSelectAccount : false,
			HasFormItems : false
		}
		$scope.$emit('UNLOAD');
	};
	
	function saveFormType(){
			delete $scope.errorMsg;
			delete $scope.successMsg;
			$scope.$emit('LOAD');
			
			var success = function(){
                $location.path("/formtype");
                if( $scope.FormType.Deleted === 0){
                    $alert({content: 'Form type has been successfully saved' , duration: 4, placement: 'top-right', type: 'success', show: true});
                }
                else{
                    $alert({content: 'Form type has been successfully deleted' , duration: 4, placement: 'top-right', type: 'success', show: true});
                }
                $scope.$emit('UNLOAD');
			};
			
			var error = function(){
                $location.path("/formtype");
                if($scope.FormType.Deleted !== 0){
                    $alert({content: 'Error saving form type' , duration: 4, placement: 'top-right', type: 'danger', show: true});
                }
                else{
                    $alert({content: 'Error deleting form type' , duration: 4, placement: 'top-right', type: 'danger', show: true});
                }
                $scope.$emit('UNLOAD');
                $scope.$apply();
			};
			var url = Settings.url + 'StoredProcModify?StoredProc=formtype_modify';
            GlobalSvc.postData(url, $scope.FormType,success,error, 'Form Type', 'Modify', false, false);
    };
		
	$scope.saveFormType = function(){
		 $scope.FormType.Deleted = 0;
         saveFormType();
	};
	
	$scope.deleteFormType = function(){
		$scope.FormType.Deleted = 1;
        saveFormType();
	}
	
	function constructor(){
        var user = GlobalSvc.getUser();
        if(!user.IsAdmin){
            $scope.errorMsg = 'You are not authorised....';
            return;
        };

        if(!$routeParams.mode && !$routeParams.id){
           $scope.$emit('LOAD');
           $scope.mode = 'list';
           $scope.$emit('heading',{heading: 'Form Types', icon: 'fa fa-file'});
           $scope.$emit('right',{label: 'New', icon:'glyphicon glyphicon-plus', href:'#/formtype/form/new'});
           $scope.mode = 'list';
           fetchFormTypes();
        }else{
            $scope.id = $routeParams.id;
            $scope.$emit('LOAD');
            $scope.$emit('heading',{heading: 'Form Type', icon: 'fa fa-file'});
            $scope.$emit('left',{label: 'Back', icon: 'glyphicon glyphicon-chevron-left', onclick : function(){window.history.back();}});
            $scope.$emit('right',{label: 'Save', icon: 'glyphicon glyphicon-floppy-save', onclick : $scope.saveFormType});
            $scope.mode = 'form';
            if($routeParams.id === 'new'){
                newFormTypeObject();
            } else {
            	$scope.FormTypeID = $routeParams.id;
                fetchFormType();
            }
        }
    }
    constructor();
});