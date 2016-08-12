coreApp.controller("SupplierCtrl",function($scope,$route,$routeParams,$http,GlobalSvc,Settings,JsonFormSvc,$location,$alert){
    $scope.$emit('heading',{heading: 'Suppliers' , icon : 'glyphicon glyphicon-road'});
    $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back();}});
    $scope.newArr = [];
    $scope.splitArr = [];
    $scope.suppliers = [];
    $scope.idx = 0;
    $scope.supplierEdit = {};
    var user_exists = false;
    var user = GlobalSvc.getUser();

	function newSupplierObject(){
        return {
            SupplierID : '',
            Name : "",
            Active : 1,
            Address : '',
            Longitude : '',
            Latitude : ''
        };
	}

    function userExistsCheck(SupplierID){
        var url = Settings.url + 'Get?method=Supplier_ReadSingle&supplierid=' + SupplierID;
        $http.get(url)
            .success(function(data){                //get the First Object because it comes back as array
                if(data.length){
                    $alert({ content: "Supplier Code already exists!", duration: 4, placement: 'top-right', type: 'danger', show: true});
                    user_exists = true;
                    return user_exists;
                } else{
                    if ($scope.id === 'new') save();
                }
            })
            .error(function(){
                $alert({ content: 'An error occured while fetching your Supplier', duration: 4, placement: 'top-right', type: 'danger', show: true});
                $scope.$emit('LOAD');
            });
    }

    $scope.deleteSupplier = function(){
        if (confirm('Are you sure you want to delete this Supplier?')){
            $scope.$emit('LOAD');
            $scope.supplierEdit.Active = 0;
            save();
        }        
    };

    $scope.saveSupplier = function(){
        if(!$scope.supplierEdit.SupplierID){
            $alert({ content: "Please fill in the Supplier Code correctly", duration: 4, placement: 'top-right', type: 'danger', show: true});
            return;
        }
        if(!$scope.supplierEdit.Name){
            $alert({ content: "Please fill in the Supplier Name", duration: 4, placement: 'top-right', type: 'danger', show: true});
            return;
        }
        if($scope.id === 'new'){
           userExistsCheck($scope.supplierEdit.SupplierID);
        }else{
            save();
        }
    };

    function save(){
        $scope.$emit('LOAD');
        sessionStorage.removeItem( "Supplierscache");
        var success = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: (($scope.supplierEdit.Active === 0) ? 'Supplier deleted successfully' : 'Supplier saved Ok'), duration: 4, placement: 'top-right', type: 'success', show: true});
            sessionStorage.removeItem("Supplierscache");
            $scope.$apply();
            $location.path('/Suppliers');
        };
        var error = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: (($scope.supplierEdit.Active === 0) ? 'Error deleting Supplier' : 'Error saving Supplier'), duration: 4, placement: 'top-right', type: 'danger', show: true}); 
        };
        var url = Settings.url + "Post?method=Supplier_modify";
        GlobalSvc.postData(url,$scope.supplierEdit,success,error,'SGISuppliers','modify',false,true)
    }

    function fetchSuppliers(){
    	if (sessionStorage.getItem( "Supplierscache")) {
    		$scope.suppliers = JSON.parse(sessionStorage.getItem( "Supplierscache"));
            $scope.splitArr = arraySplit(JSON.parse(sessionStorage.getItem( "Supplierscache")));
    		$scope.$emit('UNLOAD');
    	} else {
	        var url = Settings.url + 'Get?method=Suppliers_ReadList';
	        console.log(url);
	        $http.get(url)
            .success(function(data){
	            sessionStorage.setItem( "Supplierscache",JSON.stringify(data));
                $scope.suppliers = data;
                $scope.splitArr =  arraySplit(data);
	            $scope.$emit('UNLOAD');
	        })
            .error(function(){
                $alert({ content: 'An error occured in fetching your Suppliers', duration: 4, placement: 'top-right', type: 'danger', show: true});
            });
    	}
        console.log($scope.suppliers);
        console.log($scope.splitArr);
    }
    function fetchSupplier(){
        var url = Settings.url + 'Get?method=Supplier_ReadSingle&supplierid='+ $scope.id ;
        console.log(url);
        $http.get(url)
        .success(function(data){
            //get the First Object because it comes back because it is what stores the supplier data
            $scope.supplierEdit = data[0];
            $scope.supplierEdit.SupplierID = parseInt($scope.supplierEdit.SupplierID);
            $scope.$emit('UNLOAD');
        })
        .error(function(){
            $alert({ content: 'An error occured in displaying your Supplier', duration: 4, placement: 'top-right', type: 'danger', show: true});
        });
    }

    function arraySplit(data){
        var newArr = [];
        while(data.length !== 0){
            var splitArr = data.splice(0, 25);
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

    function newCsvObj(){
        $scope.csv = {
            content: null,
            header: true,
            headerVisible: true,
            separator: ',',
            separatorVisible: true,
            result: null,
            encoding: 'ISO-8859-1',
            encodingVisible: true,
        };
    };
    
    function uploadSupplier(json){
        userExistsCheck(json.SupplierID);
        if (user_exists === false){
        var success = function(){
            sessionStorage.removeItem( "Supplierscache");
            $scope.$emit('UNLOAD');
            $alert({ content: 'Supplier uploaded Ok', duration: 4, placement: 'top-right', type: 'success', show: true});
            $scope.$apply();
            $route.reload();
        };
        var error = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: 'Error uploading supplier', duration: 4, placement: 'top-right', type: 'danger', show: true});
        };
        var url = Settings.url + "Post?method=Supplier_modify";
        GlobalSvc.postData(url,json,success,error,'SGISuppliers','modify',false,true);
        }
    }

    $scope.uploadCsv = function(header, json){
        if (!json){
            $alert({ content: "Cannot upload empty file !", duration: 4, placement:"top-right", type: "danger", show:true});
            return;
        }
        for (var i = 0; i < json.length; i++){
            json[i].SupplierID = json[i].SupplierID;
            json[i].Name = json[i].Name;
            json[i].Active = (json[i].Active = true);
            json[i].Address = json[i].Address;
            json[i].Longitude = json[i].Longitude;
            json[i].Latitude = json[i].Latitude;
            uploadSupplier(json[i]);
        }            
    };

    function constructor(){
        if(!user.IsAdmin){
            $scope.errorMsg = 'You are not authorised....';
            return;
        }
        $scope.$emit('LOAD');
        $scope.id = $routeParams.id;
        if ($routeParams.mode && $scope.id !== 'new') {
            $scope.$emit('right',{label: 'Save' , icon : 'glyphicon glyphicon-floppy-save', onclick: $scope.saveSupplier});
            $scope.mode = 'form';
            fetchSupplier();
        } else if($scope.id === 'new'){
            $scope.$emit('right',{label: 'Save' , icon : 'glyphicon glyphicon-floppy-save', onclick: $scope.saveSupplier});
            $scope.supplierEdit = newSupplierObject();
            $scope.supplierEdit.SupplierID = parseInt($scope.supplierEdit.SupplierID);
            $scope.$emit('UNLOAD');
        }else {
            $scope.$emit('right',{label: 'Add Supplier' , icon : 'glyphicon glyphicon-plus', href : "#/Suppliers/form/new"});
            $scope.mode = 'list';
            newCsvObj();
            fetchSuppliers();
        }
    }

    constructor();
});