coreApp.controller("LogoutCtrl", function ($scope, DaoSvc, $location,$route) {
    $scope.disableLogout = true;
    $scope.logout = function(){
        if ($scope.disableLogout)
            return;

        //DaoSvc.deleteDB(function(){window.location.reload(true);});    //$location.path("/#");});
        DaoSvc.deleteDB(function(){window.location.reload(true);});
        $scope.loggedIn = false;
    };

    $scope.back = function(){
        $location.path('/welcome');
    };

    function checkUnsent(){
        var onComplete = function(len){
            $scope.disableLogout = len > 0 ? true : false;
            if($scope.disableLogout) $scope.showMessage = true;
            $scope.$apply();
        };

        var onError = function(len){
            $scope.disableLogout = false;
        $scope.$apply();
        };

        DaoSvc.count('Unsent', 'undefined', 'index1', onComplete, onError);
    }

    function constructor(){
        window.scrollTo(0, 0);
        checkUnsent();
    }
    constructor();

});
