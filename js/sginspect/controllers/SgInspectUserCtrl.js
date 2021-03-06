
coreApp.controller("SgInspectUserCtrl",function($scope,$route,$routeParams,$http,GlobalSvc,Settings,$window,$location,$modal,$alert, $filter){
    $scope.$emit('heading',{heading: 'Users' , icon : 'fa fa-user'});
    
    $scope.users = [];
    $scope.userEdit = {};
    $scope.newArr = [];
    $scope.splitArr = [];
    $scope.idx = 0;
    $scope.checkboxs = {'isAdmin' : true};
    $scope.checkboxs = {'Deleted' : true};
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
        user.Email = user.UserID;
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
        $scope.userEdit.Deleted = 1;
    };

    $scope.saveUser = function(){
        savebtnClicked = true;
        if(isNaN($scope.userEdit.Tel) === true){$alert({ content: "Please fill a valid Phone Number", duration: 4, placement: 'top-right', type: 'danger', show: true});return;}
        if($scope.userEdit.UserID === undefined || $scope.userEdit.UserID === ''){
            $alert({ content: "Please fill a valid Username", duration: 4, placement: 'top-right', type: 'danger', show: true}); 
            return;
        }else if($scope.userEdit.Name ==='' || $scope.userEdit.Country === ''){
             $alert({ content: "Please fill in all of the Name fields", duration: 4, placement: 'top-right', type: 'danger', show: true}); 
            return;

        }
        if($routeParams.id === 'new'){
            //Checking if the user already exists //this Code Could Be Improved
            $http.get(Settings.url + 'Get?method=usp_user_readsingle2&userid=' + "'" + $scope.userEdit.UserID + "'").success(function(data){
                //get the First Object because it comes back as array
                if(data.length){
                    delete $scope.errorMsg;
                    delete $scope.successMsg;
                    $alert({ content: "User already exists!", duration: 4, placement: 'top-right', type: 'danger', show: true});
                    return;
                }else{
                    save();
                    sendMail();
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
        var url = Settings.url + '/Post?method=usp_user_modify3';
        // for backward compatibility
        $scope.userEdit.Email = $scope.userEdit.UserID;
        $scope.userEdit.PasswordSalt = $scope.userEdit.Role;
        GlobalSvc.postData(url,$scope.userEdit,function(){
            $scope.$emit('UNLOAD');
            if($scope.userEdit.Deleted){
                $alert({ content: "User deavtivated successfully", duration: 4, placement: 'top-right', type: 'success', show: true});
            }else{
                $alert({ content: "User saved ok", duration: 4, placement: 'top-right', type: 'success', show: true});
            }
            sessionStorage.removeItem("UsersCache");
            $scope.$apply();
            $location.path('/SgUsers');
            if(sessionStorage.getItem('userCurrIdx')) sessionStorage.setItem('navigateAfterUserSave', true);
        },function(){
            $scope.$emit('UNLOAD');
            if($scope.userEdit.Deleted){
                $alert({ content: "Error deactivating user", duration: 4, placement: 'top-right', type: 'success', show: true});
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
            var url = Settings.url + 'Get?method=usp_user_readlist2&supplierid=' + user.SupplierID;
            console.log(url);
            $http.get(url).success(function(data){
                sessionStorage.setItem( "UsersCache",JSON.stringify(data));
                $scope.users = data;
                $scope.splitArr = arraySplit($scope.users);
                $scope.$emit('UNLOAD');
            });
        }
        if (sessionStorage.getItem('navigateAfterUserSave')) $scope.navigate(parseInt(sessionStorage.getItem('userCurrIdx')));
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

    function fetchUser(){
        if($routeParams.id === 'new' && !savebtnClicked){
            //newUserObject();
            //$scope.userEdit = JSON.parse(sessionStorage.getItem('currentuseredit'));
            $scope.userEdit = newUserObject();
            $scope.userEdit.Tel = parseInt($scope.userEdit.Tel);
            $scope.$emit('UNLOAD');
        }else{
            var url = Settings.url + 'Get?method=usp_user_readsingle2&userid=' + "'" +$scope.id + "'";
            console.log(url);
            $http.get(url).success(function(data){
                //get the First Object because it comes back because it is what stores the user data
                $scope.userEdit = data[0];
                $scope.userEdit.Tel = parseInt($scope.userEdit.Tel);
                $scope.$emit('UNLOAD');
            });
        }
    }

    $scope.navigate = function(change){
        if(sessionStorage.getItem('navigateAfterUserSave')){
            changedVal = $scope.idx + change;
            arrayLength = parseInt(sessionStorage.getItem('UserArrayLength'));
            if(changedVal < 0 || changedVal >= arrayLength) return;
            $scope.idx = changedVal;
            sessionStorage.setItem('userCurrIdx', $scope.idx);
        }else{
            sessionStorage.removeItem('userCurrIdx');
            sessionStorage.removeItem('UserArrayLength');
            changedVal = $scope.idx + change;
            sessionStorage.setItem('UserArrayLength', $scope.splitArr.length);
            if(changedVal < 0 || changedVal >= $scope.splitArr.length) return;
            $scope.idx = changedVal;
            sessionStorage.setItem('userCurrIdx', $scope.idx);
        }
    }
    $scope.filterList = function(){
        var result  = $filter('filter')( JSON.parse(sessionStorage.getItem( "UsersCache")), {$ : $scope.searchText});
        result = arraySplit(result);
        $scope.splitArr  =  result; 
        $scope.idx = 0;
        sessionStorage.setItem('userCurrIdx', $scope.idx);
    }

    function onBackClicked(){
        if(sessionStorage.getItem('userCurrIdx')){
            $location.path('/SgUsers');
            sessionStorage.setItem('navigateAfterUserSave', true);
        }else{
            $location.path('/SgUsers');
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
            $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){onBackClicked();}});
            $scope.mode = 'form';
            $scope.id = $routeParams.id;
            fetchUser();
        } else {
            $scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){$location.path('/admin');sessionStorage.removeItem('navigateAfterUserSave');sessionStorage.removeItem('UserArrayLength'); sessionStorage.removeItem('userCurrIdx');}});
            $scope.$emit('right',{label: 'Add User' , icon : 'glyphicon glyphicon-plus', href : "#/SgUsers/form/new"});
            $scope.mode = 'list';
            fetchUsers();
        }
    }

    constructor();
});