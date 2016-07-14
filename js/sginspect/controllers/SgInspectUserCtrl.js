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
        $scope.$emit('LOAD');
        if (!confirm('Are you sure you want to delete this user ?')) return;
        success = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: "User Deleted Ok", duration: 4, placement: 'top-right', type: 'success', show: true});
            sessionStorage.removeItem("UsersCache");
            $location.path('/SgUsers');
        };

        error = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: "Error Deleting User", duration: 4, placement: 'top-right', type: 'danger', show: true});
            $location.path('/SgUsers');
        };

        var url = Settings.url + 'View/ModifyAll?table=users&type=delete';
        GlobalSvc.postData(url,$scope.userEdit,success,error,'users','modify',false,true);
    };

    $scope.saveUser = function(){
        savebtnClicked = true;
        if($routeParams.id === 'new'){
            //Checking if the user already exists //this Code Could Be Improved
            $http.get(Settings.url + 'GetStoredProc?StoredProc=usp_user_readsingle&params=("'+ $scope.userEdit.UserID +'")').success(function(data){
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
        sessionStorage.removeItem( "UsersCache");
        var url = Settings.url + 'StoredProcModify?StoredProc=usp_user_modify';
		// for backward compatibility
		$scope.userEdit.PasswordSalt = $scope.userEdit.Role;

        GlobalSvc.postData(url,$scope.userEdit,function(){
            $scope.$emit('UNLOAD');
            $scope.successMsg = 'User saved Ok';
            sessionStorage.removeItem("UsersCache");
            $scope.$apply();
            $location.path('/SgUsers');
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

    function fetchUser(userid){
        userid = userid || $routeParams.id;
        if($routeParams.id === 'new' && !savebtnClicked){
            //newUserObject();
            //$scope.userEdit = JSON.parse(sessionStorage.getItem('currentuseredit'));
            $scope.userEdit = newUserObject();
            $scope.$emit('UNLOAD');
        }else{
            var url = Settings.url + 'GetStoredProc?StoredProc=usp_user_readsingle&params=("'+ userid +'")';
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