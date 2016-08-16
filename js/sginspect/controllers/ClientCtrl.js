coreApp.controller("ClientCtrl",function($scope,$route,$routeParams,$http,GlobalSvc,Settings,JsonFormSvc,$location,$alert){
    $scope.$emit('heading',{heading: 'Customer Management' , icon : 'glyphicon glyphicon-briefcase'});
    $scope.clients = [];
    $scope.clientEdit = {};
    $scope.splitArr = [];
    $scope.newArr = [];
    $scope.idx = 0;
    $scope.checkboxs = {'Active' : true};
    var user_exists = false;
    var user = GlobalSvc.getUser();

	function newClientObject(){
        return {
            ClientID : "",
            Name : "",
            Active : 1
        };
	}

    function userExistsCheck(CsvCustomer){
    var url = Settings.url + 'Get?method=Client_ReadSingle2&clientid=' + CsvCustomer.ClientID;
    $http.get(url)
        .success(function(data){                //get the First Object because it comes back as array
            if(data.length){
                $alert({ content: "Customer Code already exists!", duration: 4, placement: 'top-right', type: 'danger', show: true});
                user_exists = true;
                return user_exists;
            } else{
                if($scope.id === 'new') save();
                if($scope.mode === 'list') uploadClient(CsvCustomer);
            }
        })
        .error(function(){
            $alert({ content: 'An error occured while fetching your Customers', duration: 4, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('LOAD');
        });
    }

   /*$scope.deleteClient = function(){
        if (confirm('Are you sure you want to deactivate this Customer ?')){
            $scope.$emit('LOAD');
            $scope.clientEdit.Active = 0;
            save();
        }        
    };*/

    $scope.saveClient = function(){
        if(!$scope.clientEdit.ClientID){
            $alert({ content: "Please fill in the Client Code correctly", duration: 4, placement: 'top-right', type: 'danger', show: true});
            return;
        } 
        if(!$scope.clientEdit.Name){
            $alert({ content: "Please fill in the Client Name", duration: 4, placement: 'top-right', type: 'danger', show: true});
            return;
        }    
        if($scope.id === 'new'){
           userExistsCheck($scope.clientEdit.ClientID);
        }else{
            save();
        }
    };

    function save(){
        $scope.$emit('LOAD');
        sessionStorage.removeItem( "Clientscache");
        var success = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: ((!$scope.clientEdit.Active) ? 'Customer deactivated successfully' : 'Customer saved Ok'), duration: 4, placement: 'top-right', type: 'success', show: true});
            sessionStorage.removeItem("Clientscache");
            $scope.$apply();
            $location.path('/Clients');
            if(sessionStorage.getItem('currIdx')) sessionStorage.setItem('navigateAfterClientSave', true);
        };
        var error = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: ((!$scope.clientEdit.Active) ? 'Error deactivating Customer' : 'Error saving Customer'), duration: 4, placement: 'top-right', type: 'danger', show: true}); 
        };
        var url = Settings.url + "Post?method=Client_modify";
        GlobalSvc.postData(url,$scope.clientEdit,success,error,'SGIClient','modify',false,true)
    }

    function fetchClients(){
    	if (sessionStorage.getItem("Clientscache")) {
    		$scope.clients = JSON.parse(sessionStorage.getItem( "Clientscache"));
            $scope.splitArr = arraySplit(JSON.parse(sessionStorage.getItem( "Clientscache")));
            if (sessionStorage.getItem('navigateAfterClientSave')) $scope.navigate(sessionStorage.getItem('currIdx'));
    		$scope.$emit('UNLOAD');
    	} else {
	        var url = Settings.url + 'Get?method=Clients_readlist';
	        console.log(url);
	        $http.get(url)
            .success(function(data){
                sessionStorage.setItem("Clientscache",JSON.stringify(data));
	            $scope.clients = data;
                $scope.splitArr = arraySplit(data);
	            $scope.$emit('UNLOAD');
                console.log($scope.clients);
	        })
            .error(function(){
                $alert({ content: 'An error occured while fetching your Customers', duration: 4, placement: 'top-right', type: 'danger', show: true});
                $scope.$emit('UNLOAD');
            });
            if (sessionStorage.getItem('navigateAfterClientSave')) $scope.navigate(parseInt(sessionStorage.getItem('currIdx')));
    	}
    }

    function fetchClient(){
        var url = Settings.url + 'Get?method=Client_ReadSingle2&clientid=' + $scope.id;
        console.log(url);
        $http.get(url)
            .success(function(data){
            //get the First Object because it comes back because it is what stores the user data
            $scope.clientEdit = data[0];
            $scope.clientEdit.ClientID = parseInt($scope.clientEdit.ClientID);
            $scope.$emit('UNLOAD');
            })
            .error(function(){
                $alert({ content: 'An error occured in displaying your Customer', duration: 4, placement: 'top-right', type: 'danger', show: true});
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
        if(sessionStorage.getItem('navigateAfterClientSave')){
            changedVal = $scope.idx + change;
            arrayLength = parseInt(sessionStorage.getItem('ClientarrayLength'));
            if(changedVal < 0 || changedVal >= arrayLength) return;
            $scope.idx = changedVal;
            if(change < $scope.idx){
                sessionStorage.removeItem('currIdx');
                sessionStorage.removeItem('ClientarrayLength');
                sessionStorage.removeItem('navigateAfterClientSave');
            }    
        }else{
            sessionStorage.removeItem('currIdx');
            sessionStorage.removeItem('ClientarrayLength');
            changedVal = $scope.idx + change;
            sessionStorage.setItem('ClientarrayLength', $scope.splitArr.length);
            if(changedVal < 0 || changedVal >= $scope.splitArr.length) return;
            $scope.idx = changedVal;
            sessionStorage.setItem('currIdx', $scope.idx);
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
    
    function uploadClient(json){
        if (user_exists === false){
        var success = function(){
            sessionStorage.removeItem( "Clientscache");
            $scope.$emit('UNLOAD');
            $alert({ content: 'Customer uploaded Ok', duration: 4, placement: 'top-right', type: 'success', show: true});
            $scope.$apply();
            $route.reload();
        };
        var error = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: 'Error uploading customer', duration: 4, placement: 'top-right', type: 'danger', show: true});
        };
        var url = Settings.url + "Post?method=Client_modify";
        GlobalSvc.postData(url,json,success,error,'SGIClient','modify',false,true);
        }
    }

    $scope.uploadCsv = function(header, json){
        if (!json){
            $alert({ content: "Cannot upload empty file !", duration: 4, placement:"top-right", type: "danger", show:true});
            return;
        }
        for (var i = 0; i < json.length; i++){
            json[i].ClientID = json[i].ClientID;
            json[i].Name = json[i].Name;
            json[i].Active = (json[i].Active = true);
            userExistsCheck(json[i]);
        }            
    };

    function onBackClicked(){
        if(sessionStorage.getItem('currIdx')){
            $location.path('/Clients');
            sessionStorage.setItem('navigateAfterClientSave', true);
        }else{
            $location.path('/Clients');
        }
    }

    function constructor(){
        if(!user.IsAdmin){
            $scope.errorMsg = 'You are not authorised....';
            return;
        }
        $scope.$emit('LOAD');
        $scope.id = $routeParams.id;
        if ($routeParams.mode && $scope.id !== 'new') {
            $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){onBackClicked();}});
        	/*$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back();}});*/
            $scope.$emit('right',{label: 'Save' , icon : 'glyphicon glyphicon-floppy-save', onclick: $scope.saveClient});
            $scope.mode = 'form';
            fetchClient();
        } else if($scope.id === 'new'){
            $scope.$emit('right',{label: 'Save' , icon : 'glyphicon glyphicon-floppy-save', onclick: $scope.saveClient});
            $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){onBackClicked();}});
            $scope.clientEdit = newClientObject();
            $scope.clientEdit.ClientID = parseInt($scope.clientEdit.ClientID);
            $scope.$emit('UNLOAD');
        } else{
            $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){$location.path('/admin');sessionStorage.removeItem('navigateAfterClientSave');}});
            $scope.$emit('right',{label: 'Add Customer' , icon : 'glyphicon glyphicon-plus', href : "#/Clients/form/new"});
            $scope.mode = 'list';
            newCsvObj();
            fetchClients();
        }
    }

    constructor();
});