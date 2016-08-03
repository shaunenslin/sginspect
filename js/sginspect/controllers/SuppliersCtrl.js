coreApp.controller("SupplierCtrl",function($scope,$route,$routeParams,$http,GlobalSvc,Settings,JsonFormSvc,$location,$alert){
    $scope.$emit('heading',{heading: 'Suppliers' , icon : 'glyphicon glyphicon-road'});
    $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back();}});
    $scope.newArr = [];
    $scope.splitArr = [];
    $scope.suppliers = [];
    $scope.idx = 0;
    $scope.newPage = false;
    $scope.supplierEdit = {};
    var savebtnClicked = false;
    var user = GlobalSvc.getUser();

	function newSupplierObject(){
        var newSupplier = {};
        newSupplier.SupplierID;
        newSupplier.Name = "";
        newSupplier.Active = 1;

        return newSupplier;
	}

   $scope.deleteSupplier = function(){
        var Active = confirm('Are you sure you want to delete this supplier ?');
        if (Active === true) {
            $scope.$emit('LOAD');
            $scope.supplierEdit.Active = 0;
            save();
        } else{
            return;
        }
        
    };
    $scope.saveSupplier = function(){
        if(!$scope.supplierEdit.SupplierID){
            $alert({ content: "Please fill in the Supplier Code correctly", duration: 4, placement: 'top-right', type: 'danger', show: true});
            return;
        }
        savebtnClicked = true;
        if($routeParams.id === 'new'){
            //Checking if the user already exists //this Code Could Be Improved
            $http.get(Settings.url + 'Get?method=Supplier_ReadSingle&supplierid=('+ $scope.supplierEdit.SupplierID +')').success(function(data){
                //get the First Object because it comes back as array
                if(data.length){
                    delete $scope.errorMsg;
                    delete $scope.successMsg;
                    $alert({ content: "User already exists!", duration: 4, placement: 'top-right', type: 'danger', show: true});
                    return;
                }else{
                    save();
                }
            });
        }else{
            save();
        }
    };
    function save(){
        $scope.$emit('LOAD');
        sessionStorage.removeItem( "Supplierscache");
        var url = Settings.url + "Post?method=Supplier_modify";
        GlobalSvc.postData(url,$scope.supplierEdit,function(){
            $scope.$emit('UNLOAD');
            if ($scope.supplierEdit.Active === 0) {
                $alert({ content: 'Supplier deleted successfully', duration: 4, placement: 'top-right', type: 'success', show: true});
            }else{
                $alert({ content: 'Supplier saved Ok', duration: 4, placement: 'top-right', type: 'success', show: true});
            }
            sessionStorage.removeItem("Supplierscache");
            $scope.$apply();
            $location.path('/Suppliers');
        },function(){
            $scope.$emit('UNLOAD');
            if ($scope.supplierEdit.Active === 0) {
                $alert({ content: 'Error deleting Supplier', duration: 4, placement: 'top-right', type: 'danger', show: true});
            }else{
                $alert({ content: 'Error saving Supplier', duration: 4, placement: 'top-right', type: 'danger', show: true});
            }
            $scope.$apply();
        },'SGISuppliers','modify',false,true);
    }

    function fetchSuppliers(){
    	if (sessionStorage.getItem( "Supplierscache")) {
    		$scope.suppliers = JSON.parse(sessionStorage.getItem( "Supplierscache"));
            $scope.splitArr = arraySplit($scope.suppliers);
    		$scope.$emit('UNLOAD');
    	} else {
	        var url = Settings.url + 'Get?method=Suppliers_ReadList';
	        console.log(url);
	        $http.get(url).success(function(data){
	            $scope.suppliers = data;
                $scope.splitArr =  arraySplit(data);
	            $scope.$emit('UNLOAD');
	            sessionStorage.setItem( "Supplierscache",JSON.stringify($scope.suppliers) );
	        });
    	}
        console.log($scope.suppliers);
        console.log($scope.splitArr);
    }
    function fetchSupplier(){
        if($routeParams.id === 'new' && !savebtnClicked){
            $scope.supplierEdit = newSupplierObject();
            $scope.supplierEdit.SupplierID = parseInt($scope.supplierEdit.SupplierID);
            $scope.$emit('UNLOAD');
        }else{
            var url = Settings.url + 'Get?method=Supplier_ReadSingle&clientid='+ $routeParams.id ;
            console.log(url);
            $http.get(url).success(function(data){
                //get the First Object because it comes back because it is what stores the user data
                $scope.supplierEdit = data[0];
                $scope.supplierEdit.SupplierID = parseInt($scope.supplierEdit.SupplierID);
                $scope.$emit('UNLOAD');
            });
        }
    }

    function arraySplit(data){
        var newArr = [];
        while(data.length !== 0){
            var splitArr = data.splice(0, 2);
            //$scope.suppliers.splice(0, 2);
            newArr.push(splitArr);
        }
        return newArr;
    };

    $scope.navigate = function(change){
        changedVal = $scope.idx + change;
        if(changedVal < 0 || changedVal > $scope.splitArr.length) return;
        $scope.idx = changedVal;
    }


    function constructor(){
        if(!user.IsAdmin){
            $scope.errorMsg = 'You are not authorised....';
            return;
        }

        $scope.$emit('LOAD');
        if ($routeParams.mode && $routeParams.id) {
            $scope.$emit('right',{label: 'Save' , icon : 'glyphicon glyphicon-floppy-save', onclick: $scope.saveSupplier});
            $scope.mode = 'form';
            $scope.id = $routeParams.id;
            fetchSupplier();
        } else {
            $scope.$emit('right',{label: 'Add Supplier' , icon : 'glyphicon glyphicon-plus', href : "#/Suppliers/form/new"});
            $scope.mode = 'list';
            fetchSuppliers();
        }
    }

    constructor();
});