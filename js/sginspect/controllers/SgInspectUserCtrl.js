coreApp.controller("SgInspectUserCtrl",function($scope,$route,$routeParams,$http,GlobalSvc,Settings,JsonFormSvc,$window,$location,$modal,$alert){
    $scope.$emit('heading',{heading: 'Users' , icon : 'fa fa-user'});
    $scope.users = [];
    $scope.userEdit = {};
    $scope.checkboxs = {'isAdmin' : true};
    var savebtnClicked = false;
    var user = GlobalSvc.getUser();

    function newUserObject(){
       var newUser = {};
        newUser.SupplierID = user.SupplierID;
        newUser.UserID = "";
        newUser.Name = "";
        newUser.PasswordHash = "";
        newUser.PasswordSalt = null;
        newUser.AddressID = "";
        newUser.IsLockedOut = "";
        newUser.LastLoginDate = "";
        newUser.FailedPasswordAttemptCount = "";
        newUser.Email = "";
        newUser.Country = null;
        newUser.Deleted = 0;
        newUser.RepID = null;
        newUser.Manager = null;
        newUser.IsAdmin = false;
        newUser.IsRep =false;
        newUser.IsManager = false;
        newUser.DailySummary = false;
        newUser.WeeklySummary = false;
        newUser.MonthlyKPI = false;
        newUser.AllCustomers = false;
        newUser.NumCustomers = false;
        newUser.Role = null;
        newUser.Tel = "";

        return newUser;
    }

       $scope.deleteUser = function(){
        var Active = confirm('Are you sure you want to delete this user ?');
        if (Active === true) {
            $scope.$emit('LOAD');
            $scope.userEdit.Deleted = 1;
            save();
        } else{
            return;
        }
        
    };
    $scope.saveUser = function(){
        savebtnClicked = true;
        $scope.$emit('LOAD');
        if($routeParams.id === 'new'){
            //Checking if the user already exists //this Code Could Be Improved
            $http.get(Settings.url + 'GetStoredProc?StoredProc=usp_user_readsingle&params=("'+ $scope.userEdit.UserID +'")').success(function(data){
                //get the First Object because it comes back as array
                if(data.length){
                    delete $scope.errorMsg;
                    delete $scope.successMsg;
                    $alert({ content: "User already exists!", duration: 4, placement: 'top-right', type: 'danger', show: true});
                    $scope.$emit('UNLOAD');
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
        sessionStorage.removeItem( "UsersCache");
        var url = Settings.url + 'Post?method=usp_user_modify2';
        GlobalSvc.postData(url,$scope.userEdit,function(){
            $scope.$emit('UNLOAD');
            $scope.successMsg = 'User saved Ok';
            sessionStorage.removeItem("UsersCache");
            $location.path('/SgUsers');
            $scope.$apply();
        },function(){
            $scope.$emit('UNLOAD');
            $scope.errorMsg = 'Error saving user';
            $scope.$apply();
        },'users','modify',false,true);
    }

    function fetchUsers(){
    	if (sessionStorage.getItem( "UsersCache")) {
    		$scope.users = JSON.parse(sessionStorage.getItem( "UsersCache"));
    		$scope.$emit('UNLOAD');
    	} else {
	        var url = Settings.url + 'GetStoredProc?StoredProc=usp_user_readlist&params=('+ user.SupplierID +')';
	        console.log(url);
	        $http.get(url).success(function(data){
	            $scope.users = data;
	            $scope.$emit('UNLOAD');
	            sessionStorage.setItem( "UsersCache",JSON.stringify($scope.users) );
	        });
    	}
        console.log($scope.users);
    }

    function fetchUser(){
        if($routeParams.id === 'new' && !savebtnClicked){
            $scope.userEdit = newUserObject();
            $scope.$emit('UNLOAD');
        }else{
            var url = Settings.url + 'GetStoredProc?StoredProc=usp_user_readsingle&params=("'+ $routeParams.id +'")';
            console.log(url);
            $http.get(url).success(function(data){
                //get the First Object because it comes back because it is what stores the user data
                $scope.userEdit = data[0];
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
        	$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back();}});
            $scope.$emit('right',{label: 'Save' , icon : 'glyphicon glyphicon-floppy-save', onclick: $scope.saveUser});
            $scope.mode = 'form';
            $scope.id = $routeParams.id;
            fetchUser();
        } else {
            $scope.$emit('right',{label: 'Add User' , icon : 'glyphicon glyphicon-plus', href : "#/SgUsers/form/new"});
            $scope.mode = 'list';
            fetchUsers();
        }
    }

    constructor();
});