coreApp.controller("SgInspectUserCtrl",function($scope,$route,$routeParams,$http,GlobalSvc,Settings,JsonFormSvc,$window,$location,$modal,$alert){
    $scope.$emit('heading',{heading: 'Users' , icon : 'fa fa-user'});
    $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){window.history.back();}});
    $scope.users = [];
    $scope.userEdit = {};
    $scope.newArr = [];
    $scope.splitArr = [];
    $scope.idx = 0;
    $scope.checkboxs = {'isAdmin' : true};
    var savebtnClicked = false;
    var user = GlobalSvc.getUser();

    function newUserObject(){
        var user = {};
        user.SupplierID = GlobalSvc.getUser().SupplierID;
        user.UserID = "";
        user.Name = "";
        user.PasswordHash = "";
        user.PasswordSalt = "";
        user.AddressID = "";
        user.IsLockedOut = "";
        user.LastLoginDate = "";
        user.FailedPasswordAttemptCount = "";
        user.Email = "";
        user.Country = "";
        user.Deleted = 0;
        user.RepID = "";
        user.Manager = "";
        user.IsAdmin = false;
        user.IsRep =false;
        user.IsManager = false;
        user.DailySummary = false;
        user.WeeklySummary = false;
        user.MonthlyKPI = false;
        user.AllCustomers = false;
        user.NumCustomers = false;
        user.Role = "";
        user.Tel = "";
        return user;
    }

    $scope.deleteUser = function(){
        $scope.$emit('LOAD');
        if (!confirm('Are you sure you want to delete this user ?')) return;
        $scope.userEdit.Deleted = 1;
        save();
    };

    $scope.saveUser = function(){
        savebtnClicked = true;
        if($routeParams.id === 'new'){
            //Checking if the user already exists //this Code Could Be Improved
            $http.get(Settings.url + 'Get?method=usp_user_readsingle&userid=' + $scope.userEdit.UserID).success(function(data){
                //get the First Object because it comes back as array
                if(data.length){
                    delete $scope.errorMsg;
                    delete $scope.successMsg;
                    $alert({ content: "User already exists!", duration: 4, placement: 'top-right', type: 'danger', show: true});
                    return;
                }else{
                    save();
                    sendMail()
                }
            });
        }else{
            save();
        }
    };
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

        var body = '<div><p>Hello ' + $scope.userEdit.Name + '. You have successfuly been registered to the ' + Settings.appName + ' website. Below are your login details. Enjoy! </p><p><b>Username: </b>' + $scope.userEdit.UserID + '</p><p><b>Password: </b>' + $scope.userEdit.PasswordHash + '<p>Kind Regards</p></div>';
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

    function save(){
        $scope.$emit('LOAD');
        sessionStorage.removeItem( "UsersCache");
        var url = Settings.url + '/Post?method=usp_user_modify2';
        // for backward compatibility
        $scope.userEdit.PasswordSalt = $scope.userEdit.Role;
        GlobalSvc.postData(url,$scope.userEdit,function(){
            $scope.$emit('UNLOAD');
            if($scope.userEdit.Deleted){
                $alert({ content: "User deleted successfully", duration: 4, placement: 'top-right', type: 'success', show: true});
            }else{
                $alert({ content: "User saved ok", duration: 4, placement: 'top-right', type: 'success', show: true});
            }
            sessionStorage.removeItem("UsersCache");
            $scope.$apply();
            $location.path('/SgUsers');
        },function(){
            $scope.$emit('UNLOAD');
            if($scope.userEdit.Deleted){
                $alert({ content: "Error deleting user", duration: 4, placement: 'top-right', type: 'success', show: true});
            }else{
                $alert({ content: "Error saving user", duration: 4, placement: 'top-right', type: 'success', show: true});
            }
            $scope.errorMsg = 'Error saving user';
            $scope.$apply();
        },'users','modify',false,true);
    }

    function fetchUsers(){
        if (sessionStorage.getItem( "UsersCache")) {
            $scope.users = JSON.parse(sessionStorage.getItem( "UsersCache"));
            $scope.splitArr = arraySplit(JSON.parse(sessionStorage.getItem( "UsersCache")));
            $scope.$emit('UNLOAD');
        } else {
            var url = Settings.url + 'Get?method=usp_user_readlist&supplierid=' + user.SupplierID;
            console.log(url);
            $http.get(url).success(function(data){
                sessionStorage.setItem( "UsersCache",JSON.stringify(data));
                $scope.users = data;
                $scope.splitArr = arraySplit($scope.users);
                $scope.$emit('UNLOAD');
            });
        }
        console.log($scope.users);
    }
    function arraySplit(data){
        var newArr = [];
        while(data.length !== 0){
            var splitArr = data.splice(0, 10);
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

    function fetchUser(){
        if($routeParams.id === 'new' && !savebtnClicked){
            //newUserObject();
            //$scope.userEdit = JSON.parse(sessionStorage.getItem('currentuseredit'));
            $scope.userEdit = newUserObject();
            $scope.userEdit.Tel = parseInt($scope.userEdit.Tel);
            $scope.$emit('UNLOAD');
        }else{
            var url = Settings.url + 'Get?method=usp_user_readsingle&userid='+ $scope.id;
            console.log(url);
            $http.get(url).success(function(data){
                //get the First Object because it comes back because it is what stores the user data
                $scope.userEdit = data[0];
                $scope.userEdit.Tel = parseInt($scope.userEdit.Tel);
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