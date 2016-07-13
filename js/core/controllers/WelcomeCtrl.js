coreApp.controller("WelcomeCtrl", function ($scope, GlobalSvc, $rootScope, OptionSvc, DaoSvc, UserCodeSvc,$modal, $log, SyncSvc, $window, $location, $http,Settings, $route) {
    //DaoSvc.openDB();
    //OptionSvc.init();
    $scope.$emit('heading',{heading: 'Home' , icon : 'glyphicon glyphicon-home'});

    /*
     *Code From the modal instance controller
     */

    $scope.id = GlobalSvc.getGUID();
    $scope.user = GlobalSvc.getUser();
    $scope.message = undefined;
    $scope.errormessage = undefined;
    $scope.syncProgress = [];
    $scope.hasUser = false;
    $scope.Modalstate = "login";
    $scope.myModal = undefined;
    $scope.activeTab = 0;
    $scope.settings = Settings;

    $scope.tabClicked = function(num){
        $scope.activeTab = num;
    };

    $scope.tourClicked = function(){
        this.user.UserID = 'TOUR';
        this.user.Password = 'TOUR';
        $scope.loginClicked();
    };

    $scope.ChangeModalState = function(){
        if($scope.Modalstate === 'login'){
            $scope.Modalstate = "register";
        }else if($scope.Modalstate === 'register'){
            $scope.Modalstate  = "login";
        }
    };

    $scope.id = GlobalSvc.getGUID();
    $scope.user = GlobalSvc.getUser();
    $scope.message = undefined;
    $scope.errormessage = undefined;
    $scope.syncProgress = [];
    $scope.hasUser = false;
    $scope.Modalstate = "login";

    $scope.syncCompleted = function(mustreload){
        sessionStorage.setItem('lastSyncTime',new Date().getTime());
        if (Settings.version) localStorage.setItem('version', Settings.version);
        sessionStorage.removeItem('optioninfo');
        sessionStorage.removeItem('userExit');
        sessionStorage.removeItem('currentTree');
        UserCodeSvc.init();
        OptionSvc.init(function(){
          $('body').removeClass('modal-open'); //Added for issue #10
          $location.path('/reload');
          $rootScope.$broadcast('userLoggedIn');
          $scope.myModal.hide();
          $scope.$apply();
          // For injection, must reload, else it doesnt kick in
          if (mustreload) window.location.reload(true);
        });
    };

    $scope.loginClicked = function(){
        GlobalSvc.busy(true);
        $scope.message = 'Verifying user details';
        $scope.errormessage = undefined;
        var url = Settings.url + 'Users/VerifyPassword?userID=' + this.user.UserID + '&password=' + this.user.Password + '&format=json';
        //g_ajaxget(url, this.fetchUserOnSuccess, this.fetchUserOnError);
        $http({method: 'GET', url: url})
            .success(function(json, status, headers, config) {
                var status = Boolean(json.Status);
                if (status) {
                    $scope.errormessage = undefined;
                    $scope.message = 'User verified, downloading data...';
                    delete json.UserInfo.PasswordHash;
                    delete json.UserInfo.PasswordSalt;
                    localStorage.setItem('currentUser',JSON.stringify(json.UserInfo));
                    //$scope.loggedIn = true;
                    localStorage.setItem('loggedIn','true');
                    DaoSvc.openDB(function(){SyncSvc.sync(GlobalSvc.getUser().SupplierID, GlobalSvc.getUser().UserID, $scope, true)});
                    //SyncSvc.sync(GlobalSvc.getUser().SupplierID, GlobalSvc.getUser().UserID, $scope);
                    //$location.path('/main');
                    //loginjs.getInstance().sync();
                } else {
                    GlobalSvc.busy(true);
                    $scope.errormessage = 'Wrong password, please try again.';
                    $scope.message = undefined;
                }
            })
            .error(function(data, status, headers, config) {
                if (status === 0 || data === null) {
                   $scope.errormessage = 'You seem to be offline. Please check your internet connection and try again.'
                } else {
                   $scope.errormessage = 'An error occurred' +  (data ? ': ' + data + '. ' : '. ') + 'Please contact support.';
                }
                $scope.message = undefined;
            });
    };

    $scope.remindMeClicked = function(){
        if (this.user.UserID==='' || this.user.UserID === undefined){
            alert('To get emailed a password reminder, please enter your email address, then click on \'Forgot my password\'');
            return;
        }
        var url = Settings.url + 'Users/ForgotPassword?userID=' + this.user.UserID + '&format=json';
        $http({method: 'GET', url: url})
            .success(function(json) {
                if (json.indexOf('successfully') > 0){
                    alert('You have been sent an email with your password. Please check your Junk Mail folder if you dont find it in your inbox.');
                } else {
                    alert('This does not seem to be a valid email address. Please contact support;');
                }
            })
            .error(function(data, status, headers, config) {
                alert('This does not seem to be a valid email address. Please contact support;');
            });
    };

    $scope.addProgress = function(msg){
        $scope.syncProgress.push(msg);
    };

    $scope.ChangeModalState = function(){

        if($scope.Modalstate === 'login'){
            $scope.Modalstate = "register";
            $scope.registeredOK = false;
            $scope.message = undefined;
        }else if($scope.Modalstate === 'register'){
            $scope.Modalstate  = "login";
        }
    };

    $scope.RegisterClicked = function(){
        var obj = {};
        obj.EventID = $scope.id;
        obj.SupplierID = Settings.supplierID;
        obj.Deleted = false;
        obj.BranchID = '';
        obj.EndDate = GlobalSvc.getDate();
        obj.DueDate = GlobalSvc.getDate();
        if ($scope.activeTab === 0) {
            obj.EventTypeID = 'Register';
            obj.Notes = 'Please contact ' + this.user.UserName + ' on ' + this.user.MobileNo + ' to give them a username and password.';
            obj.Data = this.user.UserEmail;
            obj.AccountID = this.user.AccountID;
            obj.UserID = '';
        } else {
            obj.EventTypeID = 'NEWCUSTOMER';
            obj.Notes = 'Please contact ' + this.user.UserName + ' on ' + this.user.MobileNo + ' as they have registered as a new customer.' +
                '\nAddress1: ' + this.user.Address1 +
                '\nAddress2: ' + this.user.Address2 +
                '\nPost Code: ' + this.user.PostCode +
                '\nVAT: ' + this.user.VATNo;
            obj.Data = JSON.stringify(this.user);
            obj.AccountID = this.user.AccountID;
            obj.UserID = '';
        }

        $scope.Register = obj;

        //console.log(obj);
        var url =  (Settings.dotnetPostUrl) ? Settings.dotnetPostUrl : Settings.url + 'activities2/' + $scope.id;
        console.log(url);
        GlobalSvc.postData(url,
            $scope.Register,
            function(){
                $scope.message = 'Thank you for registering, we will contact you shortly with a username and password.';
                if (Settings.allowTour) $scope.message += 'Take a tour of our App by clicking the \'Take a Tour\' button above.';
                $scope.registeredOK = true;
                $scope.Modalstate = 'login';
                $scope.$apply();

            },
            function(){
                alert('Error Creating Issue');
            },
            'Activities',
            'Modify'
        );
    };

    $scope.selfRegisterClicked = function(){
        var userObj = {};
        delete $scope.errormessage;
        if(this.user.UserPassword !== this.user.RepeatUserPassword){$scope.errormessage = 'Your passwords do not match'; return;}
        userObj.SupplierID = Settings.supplierID;
        userObj.UserID = this.user.UserEmail;
        userObj.Email = this.user.UserEmail;
        userObj.Name = this.user.firstName + " " + this.user.lastName;
        userObj.Tel = this.user.MobileNo;
        userObj.PasswordHash = this.user.UserPassword;
        userObj.deleted = 0;
        var url = Settings.url + 'View/ModifyAll?table=users&type=insert';
        var $this = this;
        GlobalSvc.postData(url,userObj,function(){
            $scope.message = 'You have successfully been registerd. Now logging you in';
            $this.user.UserID = userObj.UserID;
            $this.user.Password = userObj.PasswordHash;
            $scope.loginClicked();

        },function(err){
            $scope.errormessage = "Issue Registering. Please try again";
        },'Users','INSERT',false,true);
    };

    $scope.windowSize = $window.document.width;
    function getjumbotron(){
        DaoSvc.get('tree', GlobalSvc.getUser().SupplierID + 'HOME',
            function(tree){
                try {
                    //var tree = JSON.parse(json);//localStorage.getItem('currentTree'));
                    //var json = JSON.parse('{"img":"glyphicon glyphicon-home"}');
                    var obj = JSON.parse(tree.JSON.replace(/\'/g,'"'));
                    $scope.head1 = obj.head1;
                    $scope.par1 = obj.par1;
                    $scope.learn1 = obj.learn1;
                    //text1 = obj.text1.replace(/\|/g,'"');
                    //$scope.jumbotron = text1;
                    //console.log(item);
                } catch (err){
                    console.log(err.message);
                }
            }
        );
    }

    var fetchCurrentAccount = function(){

        if(localStorage.getItem('currentAccount')) return;

        var url = (Settings.phpurl ? Settings.phpurl : Settings.url ) + 'GetStoredProc?StoredProc=usp_account_readsingle&params=('+ GlobalSvc.getUser().SupplierID+ '|"' + GlobalSvc.getUser().RepID + '")';
        console.log(url);
        $http.get(url)
            .success(function(json){
                console.log(json);
                localStorage.setItem('currentAccount',JSON.stringify(json));
            })
            .error(function(data){
                console.log(data);
            });

    };

    function resync(){
      //if come here via menu, then assume we dont sync
      if (($location.path() !== '/welcome' || Settings.AnonymousUser) && Settings.appName == 'RapidSales') {
          //get last sync time, if we last synced over an hour ago, then do a sync
          var lastSyncTime = (sessionStorage.getItem('lastSyncTime')) ? sessionStorage.getItem('lastSyncTime') : (new Date().getTime() - 460000 );
          if (lastSyncTime < (new Date().getTime() - 360000 )) {
              $scope.myModal = $modal({title: 'Synchronizing', content: 'Please wait', show: true});
              SyncSvc.sync(GlobalSvc.getUser().SupplierID, GlobalSvc.getUser().UserID, $scope, false);
              return;
          }
      }
      OptionSvc.init();
      UserCodeSvc.init();
      fetchCurrentAccount();
      $rootScope.$broadcast('userLoggedIn');
      $scope.loggedIn = true;
      if (Settings.firstPage) $location.path(Settings.firstPage);
    }

    //check internet explorer version
    function oldIEVersion(){
        var agent = navigator.userAgent;
        var reg = /MSIE\s?(\d+)(?:\.(\d+))?/i;
        var matches = agent.match(reg);
        if(matches !== null) {
            if (matches[1] <10) {
              alert('Please upgrade to at least Internet Explorer 10');
              return true;
            }
        }
        return false;
    }

    /*
     * Constructor function
     */
    function constructor(){
        //allow for an upgrade forcing a logout
        if (Settings.version && GlobalSvc.getUser().UserID.length!==0) {
            if (localStorage.getItem('version') !== Settings.version.toString()) {
                $scope.$emit('LOAD');
                DaoSvc.deleteDB(function(){window.location.reload(true);});
                return;
            }
        }
        if (oldIEVersion()) return;

        //first time sign in
        if(Settings.AnonymousUser){
            localStorage.setItem('currentUser',JSON.stringify(Settings.AnonymousUser));
            DaoSvc.openDB(resync);
        } else if (GlobalSvc.getUser().UserID.length===0) {
            $scope.myModal = $modal({scope: $scope, template: 'js/core/modal/login.html', show : 'false', keyboard: false, backdrop: 'static'});
            $scope.loggedIn = false;
        } else{
            DaoSvc.openDB(resync);
        }
    }
    constructor();
});

/*
var SyncingModalCtrl = function ($scope, $modalInstance, GlobalSvc, SyncSvc) {
    $scope.syncProgress = [];
    $scope.message = undefined;
    $scope.errormessage = undefined;

    $scope.syncCompleted = function(){
        $modalInstance.dismiss('cancel');
    };

    function constructor(){
        SyncSvc.sync(GlobalSvc.getUser().SupplierID, GlobalSvc.getUser().UserID, $scope);
    };
    constructor();
};
*/

coreApp.directive('resize',function($window){

    return function (scope, element) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return { 'h': w.height(), 'w': w.width() };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            console.log(scope.windowWidth);

            scope.style = function () {
                if(scope.windowWidth < 770){
                    return {
                        'height':965 + 'px'
                    };
                }else if(scope.windowWidth > 770){
                    return {
                        'height':710 + 'px'
                    };
                }
            };


        }, true);
        w.bind('resize', function () {

            scope.$apply();
        });
    };
});
