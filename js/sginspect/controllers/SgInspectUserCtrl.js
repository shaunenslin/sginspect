coreApp.controller("SgInspectUserCtrl",function($scope,$route,$routeParams,$http,GlobalSvc,Settings,JsonFormSvc,$window,$location,$modal,$alert){
    $scope.$emit('heading',{heading: 'Users' , icon : 'fa fa-user'});
    $scope.users = [];
    $scope.userEdit = {};
    $scope.userRoleModal;
    $scope.checkboxs = {'isAdmin' : true};
    var savebtnClicked = false;
    var user = GlobalSvc.getUser();

    function newUserObject(){
        var newUser = {};
        newUser.SupplierID = user.SupplierID;
        newUser.UserID = "";
        newUser.Name = "";
        newUser.PasswordHash = "";
        newUser.PasswordSalt = "";
        newUser.AddressID = "";
        newUser.IsLockedOut = "";
        newUser.LastLoginDate = "";
        newUser.FailedPasswordAttemptCount = "";
        newUser.Email = "";
        newUser.Country = "";
        newUser.Deleted = 0;
        newUser.RepID = "";
        newUser.Manager = "";
        newUser.IsAdmin = false;
        newUser.IsRep =false;
        newUser.IsManager = false;
        newUser.DailySummary = false;
        newUser.WeeklySummary = false;
        newUser.MonthlyKPI = false;
        newUser.AllCustomers = false;
        newUser.NumCustomers = false;
        newUser.Role = "";
        newUser.Tel = "";

        return newUser;
    }

    $scope.newClicked = function(){
        var newUser = newUserObject();
        sessionStorage.setItem('currentuseredit',JSON.stringify(newUser));
        $location.path('/SgUsers/form/new');
    };

    /*$scope.backbtnClicked = function(){
        window.history.back();
    };*/
/*
    $scope.deleteUser = function(){
        $scope.$emit('LOAD');
        if (!confirm('Are you sure you want to delete this user ?')) return;
        success = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: "User Deleted Ok", duration: 4, placement: 'top-right', type: 'success', show: true});
            sessionStorage.removeItem("UsersCache");
            $location.path('/users/');
        };

        error = function(){
            $scope.$emit('UNLOAD');
            $alert({ content: "Error Deleting User", duration: 4, placement: 'top-right', type: 'danger', show: true});
            $location.path('/users/');
        };

        var url = Settings.url + 'View/ModifyAll?table=users&type=delete';
        GlobalSvc.postData(url,$scope.userEdit,success,error,'users','modify',false,true);
    };
*/
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
                    // sendMail();
                }
            });
        }else{
            save();
        }
    };
/*
    function sendMail(){
    	var onSuccess = function(){
    		$scope.$emit('UNLOAD');
    		$alert({content: 'Email has been sent', duration:4, placement:'top-right', type:'success', show:true});
        $scope.$apply();
    	};

    	var onError = function(err){
            $scope.$emit('UNLOAD');
            $alert({content: 'Error sending email', duration:4, placement:'top-right', type:'error', show:true});
            $scope.$apply();
      };

		var body = '<div><p>Hello ' + $scope.userEdit.Name + '. You have successfuly been registered to the ' + Settings.appName + ' website(' + Settings.siteUrl + '). Below are your login details. Enjoy! </p><p><b>Username: </b>' + $scope.userEdit.UserID + '</p><p><b>Password: </b>' + $scope.userEdit.PasswordHash + '<p>Kind Regards</p></div>';
    	var url = Settings.url + 'Send?userid=' + $scope.userEdit.UserID + '&subject= Login details for - ' + Settings.appName;

    	$.ajax({
            type : 'POST',
            data : body,
            datatype : 'json',
            url : url,
            crossDomain: true,
            success : onSuccess,
            error : onError
        });
    }

    $scope.userRoleClicked = function(){
        $scope.userRoleModal =  $modal({scope : $scope, title: 'User Roles', template: 'js/core/modal/userRole.html', show: true , animation: "am-fade-and-slide-top",keyboard : false,backdrop : 'static'});
        $scope.vansalesuser = {'warehouse' : $scope.userEdit.warehouse, 'number' : $scope.userEdit.van};
        //Checking whether userrole is currently pod or vansales
        $scope.activetab = $scope.userEdit.PasswordSalt === 'POD' ? 'pod' : 'vansales';
    };

    $scope.userRoleSaveClicked = function(){
        if($scope.activetab === 'vansales'){
            //$scope.userEdit.PasswordSalt = "canInv,wh="+$scope.vansalesuser.warehouse+",van="+$scope.vansalesuser.number;
            sessionStorage.setItem('userRole',"canInv,wh="+$scope.vansalesuser.warehouse+",van="+$scope.vansalesuser.number);
            $scope.userRoleModal.$promise.then($scope.userRoleModal.hide);
        }else if($scope.activetab === 'pod'){
            sessionStorage.setItem('userRole',"POD");
            $scope.userRoleModal.$promise.then($scope.userRoleModal.hide);
        }
    };

	function fetchManagers(){
        $http.get(Settings.url+'GetView?view=users&params=Where%20supplierid%20=%20%27'+GlobalSvc.getUser().SupplierID+'%27%20and%20isManager%20=%201').success(function(data){
            $scope.managers = [];
            for(var i = 0; i < data.length; i++){
                $scope.managers.push({UserID:data[i].UserID ,Name:data[i].Name});
            }
            console.log($scope.managers);
        });
    }
*/
    function save(){
        $scope.$emit('LOAD');
        sessionStorage.removeItem( "UsersCache");
        var url = Settings.url + 'StoredProcModify?StoredProc=usp_user_modify2';
		// for backward compatibility
		$scope.userEdit.PasswordSalt = $scope.userEdit.Role;

        GlobalSvc.postData(url,$scope.userEdit,function(){
            $scope.$emit('UNLOAD');
            $scope.successMsg = 'User saved Ok';
            sessionStorage.removeItem("UsersCache");
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
                /*
                 this piece of code deals with the Separation of the userRole field
                 $scope.userEdit.warehouse and $scope.userEdit.van are created so
                 we can bind them to the modal
                 the spilt just separate the the three different fields into an array
                 and than the values to be bound to the screen is substringed it out
                 */
                if($scope.userEdit.PasswordSalt !== 'POD' && $scope.userEdit.PasswordSalt !== '' && $scope.userEdit.PasswordSalt !== null){
                    var passwordSalt = $scope.userEdit.PasswordSalt.split(',');
                    $scope.userEdit.warehouse = passwordSalt[1].substr(passwordSalt[1].indexOf('=')+ 1);
                    $scope.userEdit.van = passwordSalt[2].substr(passwordSalt[1].indexOf('=')+ 2);
                    console.log($scope.userEdit.warehouse);
                    console.log($scope.userEdit.van);
                }
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