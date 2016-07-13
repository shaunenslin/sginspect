coreApp.controller("SplashCtrl", function ($scope, Settings, GlobalSvc, $http, $modal, $route, $alert, $location) {
    $scope.showwelcome = false;
    
    function fetchNotifications(){
        $location.path('/groups');
        return; 
        
        var url = Settings.url + 'GetStoredProc?StoredProc=social_notifications_readlist&params=('+ GlobalSvc.getUser().SupplierID +'|\''+ GlobalSvc.getUser().UserID +'\')';
        $http({method : 'GET', url : url}).success(function(data){
            for (var x=0; x<data.length; x++) data[x].date = GlobalSvc.parseDate(data[x].DateTime);           
            $scope.timelines = data;
            $scope.$apply();
        }).error(function(err){
            console.log(err);
        });
    };
    
    $scope.gotitClicked = function(){
        localStorage.setItem('showwelcome',false);
        $scope.showwelcome = false; 
        window.scrollTo(0, 0);
        fetchNotifications();       
    };
    
    $scope.newMessageClicked = function(groupID){
        $scope.MessageModal = $modal({scope: $scope, template: 'js/core/modal/messageModal.html', show: true});
        $scope.message = {
            SupplierID : GlobalSvc.getUser().SupplierID,
            CreatedBy  : GlobalSvc.getUser().UserID,
            CreatedOn  : new Date(),
            Message    : "",
            GroupID    : groupID,
            ID : 0
        };
    };
    
    $scope.saveMessage = function(){
       delete $scope.errorMsg;
       delete $scope.successMsg;        
       var url = GlobalSvc.resturl() + 'View/ModifyAll?table=GroupMessages&type=insert';        
       GlobalSvc.postData(url,
           $scope.message,
           function(){
               $route.reload();
               $scope.MessageModal.$promise.then($scope.MessageModal.hide);
               $scope.$emit('UNLOAD');
               $alert({ content: 'Your message was sent...', duration: 5, placement: 'top-right', type: 'success', show: true});
           },

           function(err){
               $scope.$emit('UNLOAD');
               $scope.errorMsg = data;
               $scope.$apply();
       },
       'GroupsMessages','INSERT',false,true);
    };
    
    function constructor(){
        window.scrollTo(0, 0);
        if (!localStorage.getItem('showwelcome')){
            $scope.showwelcome = true; 
        } else {
            fetchNotifications();
        }
    };
    constructor();
});