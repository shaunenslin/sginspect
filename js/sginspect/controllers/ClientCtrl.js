coreApp.controller("ClientCtrl",function($scope,$route,$routeParams,$http,GlobalSvc,Settings,JsonFormSvc,$location,$alert){
    $scope.$emit('heading',{heading: 'Customer Management' , icon : 'glyphicon glyphicon-briefcase'});
    $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back();}});
    $scope.clients = [];
    $scope.clientEdit = {};
    $scope.splitArr = [];
    $scope.newArr = [];
    $scope.idx = 0;
    var user = GlobalSvc.getUser();

	function newClientObject(){
        var newClient = {};
        newClient.ClientID = "";
        newClient.Name = "";
        newClient.Active = 1;

        return newClient;
	}

   $scope.deleteClient = function(){
        if (!confirm('Are you sure you want to delete this Customer ?')){
            return;
        } else{
            $scope.$emit('LOAD');
            $scope.clientEdit.Active = 0;
            save();
        }
        
    };

    $scope.saveClient = function(){
        if(!$scope.clientEdit.ClientID){
            $alert({ content: "Please fill in the Client Code correctly", duration: 4, placement: 'top-right', type: 'danger', show: true});
            return;
        } 
        if(!$scope.clientEdit.Name){
            $alert({ content: "Please fill in the Client Name", duration: 4, placement: 'top-right', type: 'danger', show: true});
            return;
        }    
        if($routeParams.id === 'new'){
            //Checking if the user already exists //this Code Could Be Improved
            $http.get(Settings.url + 'Get?method=Client_ReadSingle&clientid=' + $scope.clientEdit.ClientID).success(function(data){                //get the First Object because it comes back as array
                if(data.length){
                    delete $scope.errorMsg;
                    delete $scope.successMsg;
                    $alert({ content: "Customer Code already exists!", duration: 4, placement: 'top-right', type: 'danger', show: true});
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
        sessionStorage.removeItem( "Clientscache");
        var url = Settings.url + "Post?method=Client_modify";
        var success = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: (($scope.clientEdit.Active === 0) ? 'Customer deleted successfully' : 'Customer saved Ok'), duration: 4, placement: 'top-right', type: 'success', show: true});
            sessionStorage.removeItem("Clientscache");
            $scope.$apply();
            $location.path('/Clients');
        };
        var error = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: (($scope.clientEdit.Active === 0) ? 'Error deleting Customer' : 'Error saving Customer'), duration: 4, placement: 'top-right', type: 'danger', show: true}); 
        };
        GlobalSvc.postData(url,$scope.clientEdit,success,error,'SGIClient','modify',false,true)
    }

    function fetchClients(){
    	if (sessionStorage.getItem("Clientscache")) {
    		$scope.clients = JSON.parse(sessionStorage.getItem( "Clientscache"));
            $scope.splitArr = arraySplit(JSON.parse(sessionStorage.getItem( "Clientscache")));
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
    	}
    }

    function fetchClient(){
        if($routeParams.id === 'new'){
            $scope.clientEdit = newClientObject();
            $scope.clientEdit.ClientID = parseInt($scope.clientEdit.ClientID);
            $scope.$emit('UNLOAD');
        }else{
            var url = Settings.url + 'Get?method=Client_ReadSingle&clientid=' + $routeParams.id;
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

    $scope.getcsvHeader = function(){
        return $scope.csvHeadings;
    };

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
        $http.get(Settings.url + 'Get?method=Client_ReadSingle&clientid=' + json.ClientID)
            .success(function(data){                //get the First Object because it comes back as array
                if(data.length){
                    $alert({ content: "Customer Code already exists!", duration: 4, placement: 'top-right', type: 'danger', show: true});
                    return;
                } else{
                    var url = Settings.url + "Post?method=Client_modify";
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
                    GlobalSvc.postData(url,json,success,error,'SGIClient','modify',false,true);
                }
            });
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
            uploadClient(json[i]);
            }            
    };

    function constructor(){
        if(!user.IsAdmin){
            $scope.errorMsg = 'You are not authorised....';
            return;
        }

        $scope.$emit('LOAD');
        if ($routeParams.mode && $routeParams.id) {
        	/*$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back();}});*/
            $scope.$emit('right',{label: 'Save' , icon : 'glyphicon glyphicon-floppy-save', onclick: $scope.saveClient});
            $scope.mode = 'form';
            $scope.id = $routeParams.id;
            fetchClient();
        } else {
            $scope.$emit('right',{label: 'Add Customer' , icon : 'glyphicon glyphicon-plus', href : "#/Clients/form/new"});
            $scope.mode = 'list';
            newCsvObj();
            fetchClients();
        }
    }

    constructor();
});