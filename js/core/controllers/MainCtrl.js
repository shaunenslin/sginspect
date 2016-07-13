coreApp.controller("MainCtrl", function ($scope,DaoSvc,$location,$window, Settings) {
    $scope.Settings = Settings;
    $scope.menuUrl = 'js/core/view/menu.html';

    $scope.logout = function(){
        DaoSvc.deleteDB(function(){$location.path("/#");});
        $scope.loggedIn = false;

    };

    $(window).resize(function(){
        $scope.$apply(function(){
            $scope.outerWidth = $window.outerWidth;
            if($window.innerWidth < 990 ){
               if($window.innerWidth < 767 ){
                    $scope.windowWidth = (($window.innerWidth - 62)/2);
                }else{
                    $scope.windowWidth = (($window.innerWidth - 265)/2);
                }
            }else{
                $scope.windowWidth = (($window.innerWidth  - 203) /2);
            }
        });
    });
    $scope.outerWidth = $window.outerWidth;
    $scope.$on('heading',function(event, data){$scope.heading = data.heading; $scope.icon = data.icon} );
    $scope.$on('LOAD',function(){$scope.loading = true;});
    $scope.$on('UNLOAD',function(){$scope.loading = false;});
    $scope.$on('right',function(event, data){$scope.right = data});
    $scope.$on('left',function(event, data){$scope.left = data});
    $scope.$on('$routeChangeStart', function(next, current) {
        delete $scope.heading; delete $scope.icon;
        delete  $scope.right;
        delete  $scope.left;
    });
    $scope.loading = false;
    $scope.$on('userLoggedIn',function(event,args) {
         $scope.menuUrl=null;
         $scope.menuUrl = 'js/core/view/menu.html?new=1';
    });

    var constructor = function(){
        $scope.SupplierID = Settings.supplierID;
        if($window.innerWidth < 990 ){
            if($window.innerWidth < 767 ){
                $scope.windowWidth = (($window.innerWidth - 62)/2);
            }else{
                $scope.windowWidth = (($window.innerWidth - 265)/2);
            }
        }else{
            $scope.windowWidth = (($window.innerWidth - 203)/2);
        }
    };

    constructor();

});
