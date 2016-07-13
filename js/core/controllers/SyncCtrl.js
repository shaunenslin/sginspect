coreApp.controller('SyncCtrl', function ($scope, GlobalSvc, OptionSvc, DaoSvc, UserCodeSvc,$modal, $log, SyncSvc, $window, $location, $http,Settings, $route, $alert) {

    $scope.user = GlobalSvc.getUser();
    $scope.message = undefined;
    $scope.errormessage = undefined;
    $scope.syncProgress = [];
    $scope.hasUser = false;

    $scope.syncCompleted = function(){
        sessionStorage.setItem('lastSyncTime',new Date().getTime());
        $scope.$emit('UNLOAD');
        $alert({content: 'Your sync has completed successfully.', duration:4, placement:'top-right', type:'success', show:true});
    };

    $scope.loginClicked = function(){
        $scope.$emit('LOAD');
        var url = Settings.url + 'Users/VerifyPassword?userID=' + $scope.user.UserID + '&password=' + $scope.user.Password + '&format=json';
        $http({method: 'GET', url: url})
            .success(function(json, status, headers, config) {
                var status = Boolean(json.Status);
                if (status) {
                    $scope.errormessage = undefined;
                    $scope.message = 'User verified, downloading data...';
                    localStorage.setItem('currentUser',JSON.stringify(json.UserInfo));
                    SyncSvc.sync(GlobalSvc.getUser().SupplierID, GlobalSvc.getUser().UserID, $scope, false);
                } else {
                    $scope.$emit('UNLOAD');
                    $alert({content: 'Incorrect password, use forgot password to get a password reminder via email.', duration:5, placement:'top-right', type:'danger', show:true});
                }
            })
            .error(function(data, status, headers, config) {
                $scope.$emit('UNLOAD');
                $alert({content: 'You seem to be offline........', duration:4, placement:'top-right', type:'danger', show:true});
            });
    };

    $scope.addProgress = function(msg){
        $scope.syncProgress.push(msg);
    };

    function constructor(){
        $scope.$emit('heading',{heading : 'Synchronize' , icon : 'fa fa-exchange'});
        $scope.$emit('right',{label : 'Synchronize' , icon : 'fa fa-exchange', onclick : $scope.loginClicked});
        $scope.user = GlobalSvc.getUser();
        //$scope.myModal = $modal({scope: $scope, template: 'js/core/modal/login.html', show : 'false', keyboard: false, backdrop: 'static'});
    };
    constructor();

});
