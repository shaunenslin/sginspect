coreApp.controller("SupplierCtrl",function($scope,$route,$routeParams,$http,GlobalSvc,Settings,JsonFormSvc,$location,$alert, $filter){
    $scope.$emit('heading',{heading: 'Suppliers' , icon : 'glyphicon glyphicon-road'});
    $scope.newArr = [];
    $scope.splitArr = [];
    $scope.suppliers = [];
    $scope.idx = 0;
    $scope.supplierEdit = {};
    $scope.checkboxs = {'Active' : true};
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

    function userExistsCheck(CsvCustomer){
        var url = Settings.url + "Get?method=Supplier_ReadSingle2&supplierid='" + CsvCustomer.SupplierID + "'";
        $http.get(url)
            .success(function(data){                //get the First Object because it comes back as array
                if(data.length){
                    $alert({ content: "Supplier Code already exists!", duration: 4, placement: 'top-right', type: 'danger', show: true});
                    user_exists = true;
                    return user_exists;
                } else{
                    if ($scope.id === 'new') save();
                    if($scope.mode === 'list') uploadSupplier(CsvCustomer);
                }
            })
            .error(function(){
                $alert({ content: 'An error occured while fetching your Supplier', duration: 4, placement: 'top-right', type: 'danger', show: true});
                $scope.$emit('LOAD');
            });
    }

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
        sessionStorage.removeItem('navigateAfterSupplierSave');
        sessionStorage.removeItem( "Supplierscache");
        var success = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: ((!$scope.supplierEdit.Active) ? 'Supplier deactivated successfully' : 'Supplier saved Ok'), duration: 4, placement: 'top-right', type: 'success', show: true});
            sessionStorage.removeItem("Supplierscache");
            $scope.$apply();
            $location.path('/Suppliers');
            if(sessionStorage.getItem('suplierCurrIdx')) sessionStorage.setItem('navigateAfterSupplierSave', true);
        };
        var error = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: ((!$scope.supplierEdit.Active) ? 'Error deactivating Supplier' : 'Error saving Supplier'), duration: 4, placement: 'top-right', type: 'danger', show: true}); 
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
        if (sessionStorage.getItem('navigateAfterSupplierSave')) $scope.navigate(parseInt(sessionStorage.getItem('suplierCurrIdx')));
    }
    function fetchSupplier(){
        var url = Settings.url + "Get?method=Supplier_ReadSingle2&supplierid='"+ $scope.id + "'" ;
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
            newArr.push(splitArr);
        }
        return newArr;
    };
    // set index to session to ensure we are in the correct page after saving.
    $scope.filterList = function(){
        var result  = $filter('filter')(JSON.parse(sessionStorage.getItem( "Supplierscache")), {$ : $scope.searchText});
        result = arraySplit(result);
        $scope.splitArr  =  result;
        $scope.idx = 0;
        sessionStorage.setItem('currIdx', $scope.idx);
    }

    $scope.navigate = function(change){
        if(sessionStorage.getItem('navigateAfterSupplierSave')){
            changedVal = $scope.idx + change;
            arrayLength = parseInt(sessionStorage.getItem('SupplierArrayLength'));
            if(changedVal < 0 || changedVal >= arrayLength) return;
            $scope.idx = changedVal;
            sessionStorage.setItem('suplierCurrIdx', $scope.idx);
        }else{
            sessionStorage.removeItem('suplierCurrIdx');
            sessionStorage.removeItem('SupplierArrayLength');
            changedVal = $scope.idx + change;
            sessionStorage.setItem('SupplierArrayLength', $scope.splitArr.length);
            // if(changedVal < 0 || changedVal >= $scope.splitArr.length) return;
            $scope.idx = changedVal;
            sessionStorage.setItem('suplierCurrIdx', $scope.idx);
        }
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
            userExistsCheck(json[i]);
        }            
    };

    function onBackClicked(){
        if(sessionStorage.getItem('suplierCurrIdx')){
            $location.path('/Suppliers');
            sessionStorage.setItem('navigateAfterSupplierSave', true);
        }else{
            $location.path('/Suppliers');
        }
    }

    function constructor(){
        if(!user.IsAdmin){
            $scope.errorMsg = 'You are not authorised....';
            return;
        }
        $scope.$emit('LOAD');
        window.scrollTo(0,0);
        $scope.id = $routeParams.id;
        if ($routeParams.mode && $scope.id !== 'new') {
            $scope.$emit('right',{label: 'Save' , icon : 'glyphicon glyphicon-floppy-save', onclick: $scope.saveSupplier});
            $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){onBackClicked();}});
            $scope.mode = 'form';
            fetchSupplier();
        } else if($scope.id === 'new'){
            $scope.$emit('right',{label: 'Save' , icon : 'glyphicon glyphicon-floppy-save', onclick: $scope.saveSupplier});
            $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){onBackClicked()}});
            $scope.supplierEdit = newSupplierObject();
            $scope.supplierEdit.SupplierID = parseInt($scope.supplierEdit.SupplierID);
            $scope.$emit('UNLOAD');
        }else {
            $scope.$emit('right',{label: 'Add Supplier' , icon : 'glyphicon glyphicon-plus', href : "#/Suppliers/form/new"});
            $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){$location.path('/admin');sessionStorage.removeItem('navigateAfterSupplierSave');sessionStorage.removeItem('SupplierArrayLength');sessionStorage.removeItem('suplierCurrIdx');}});
            $scope.mode = 'list';
            newCsvObj();
            fetchSuppliers();
        }
    }

    constructor();
});