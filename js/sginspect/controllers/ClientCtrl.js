coreApp.controller("ClientCtrl",function($scope,$route,$routeParams,$http,GlobalSvc,Settings,JsonFormSvc,$location,$alert){
    $scope.$emit('heading',{heading: 'Clients' , icon : 'glyphicon glyphicon-briefcase'});
    $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back();}});
    $scope.clients = [];
    $scope.clientEdit = {};
    var savebtnClicked = false;
    var user = GlobalSvc.getUser();

	function newClientObject(){
        var newClient = {};
        newClient.ClientID = "";
        newClient.Name = "";
        newClient.Active = 1;

        return newClient;
	}

   $scope.deleteClient = function(){
        var Active = confirm('Are you sure you want to delete this client ?');
        if (Active === true) {
            $scope.$emit('LOAD');
            $scope.clientEdit.Active = 0;
            save();
        } else{
            return;
        }
        
    };
    $scope.saveClient = function(){
        if(!$scope.clientEdit.ClientID){
            $alert({ content: "Please fill in the Client Code", duration: 4, placement: 'top-right', type: 'danger', show: true});
            return;
        }    
        savebtnClicked = true;
        if($routeParams.id === 'new'){
            //Checking if the user already exists //this Code Could Be Improved
            $http.get(Settings.url + 'Get?method=Client_ReadSingle&clientid=' + $scope.clientEdit.ClientID).success(function(data){                //get the First Object because it comes back as array
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
        sessionStorage.removeItem( "Clientscache");
        var url = Settings.url + "Post?method=Client_modify";
        GlobalSvc.postData(url,$scope.clientEdit,function(){
            $scope.$emit('UNLOAD');
            $alert({ content: 'Client saved Ok', duration: 4, placement: 'top-right', type: 'success', show: true});
            sessionStorage.removeItem("Clientscache");
            $scope.$apply();
            $location.path('/Clients');
        },function(){
            $scope.$emit('UNLOAD');
            $scope.errorMsg = 'Error saving client';
            $scope.$apply();
        },'SGIClient','modify',false,true);
    }

    function fetchClients(){
    	if (sessionStorage.getItem( "Clientscache")) {
    		$scope.clients = JSON.parse(sessionStorage.getItem( "Clientscache"));
    		$scope.$emit('UNLOAD');
    	} else {
	        var url = Settings.url + 'Get?method=Clients_readlist';
	        console.log(url);
	        $http.get(url).success(function(data){
	            $scope.clients = data;
	            $scope.$emit('UNLOAD');
	            sessionStorage.setItem( "Clientscache",JSON.stringify($scope.clients) );
	        });
    	}
        console.log($scope.clients);
    }
    function fetchClient(){
        if($routeParams.id === 'new' && !savebtnClicked){
            $scope.clientEdit = newClientObject();
            $scope.$emit('UNLOAD');
        }else{
            var url = Settings.url + 'Get?method=Client_ReadSingle&clientid=' + $routeParams.id;
            console.log(url);
            $http.get(url).success(function(data){
                //get the First Object because it comes back because it is what stores the user data
                $scope.clientEdit = data[0];
                $scope.$emit('UNLOAD');
            });
        }
    }

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
            $scope.$emit('right',{label: 'Add Client' , icon : 'glyphicon glyphicon-plus', href : "#/Clients/form/new"});
            $scope.mode = 'list';
            fetchClients();
        }
    }

    constructor();
});