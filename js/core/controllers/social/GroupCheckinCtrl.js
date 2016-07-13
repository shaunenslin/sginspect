coreApp.controller("GroupCheckinCtrl", function ($scope, GlobalSvc, $alert, Settings, $routeParams, $http, $location) {
    $scope.types = [
                    {text: '<i class="fa fa-globe"></i>&nbsp;Cycling', click: '$scope.typeClicked("Holy guacamole!")'},
                    {text: '<i class="fa fa-globe"></i>&nbsp;Running', click: '$scope.typeClicked("Holy guacamole!")'}];
    
    $scope.selectedDate = new Date();
    $scope.checkin = newObject();
    window.scrollTo(0, 0);
    function newObject(){
        return {
            SupplierID: GlobalSvc.getUser().SupplierID,
            ID: 0,
            GroupEventID: undefined,
            ActivityType: (localStorage.getItem('lastActivityType')? localStorage.getItem('lastActivityType') : undefined),
            CreatedBy: GlobalSvc.getUser().UserID,
            CreatedOn: new Date(),
            Latitude: 0,
            Longitude: 0,
            Value: undefined,
            Notes: ''
        };
    }
    
    $scope.eventClicked = function(idx){
        for (var x=0; x<$scope.events.length; x++){
            if (idx===x){
                $scope.checkin.GroupEventID = $scope.events[x].EventID;
                $scope.events[x].active = 'active';
            } else {
                $scope.events[x].active = '';
            }
        }
    };
    
    $scope.activityTypeClicked = function(text){
        $scope.checkin.ActivityType = text;
    };
    
    $scope.save = function(){
        window.scrollTo(0, 0);
        if (!$scope.checkin.Value) {
            $alert({ content:  'Please enter a Distance such as 23 if you rode 23km', duration: 4, placement: 'top-right', type: 'danger', show: true});
            //$scope.errorMsg = 'Please enter a Distance such as 23 if you rode 23km';
            return;
        }
        if (!$scope.checkin.Notes) {
            $alert({ content:  'Please enter a Duration such as 1.23 for 1 hour 23 minutes', duration: 4, placement: 'top-right', type: 'danger', show: true});
            return;
        }
        
        if(isNaN($scope.checkin.Value)){ $alert({ content: "Please enter the a numeric value for Distance such as 23 if you rode 23km'", duration: 4, placement: 'top-right', type: 'danger', show: true}); return;};
        if(isNaN($scope.checkin.Notes)){ $alert({ content: "Please enter the a numeric value for Duration such as 1.23 for 1 hour 23 minutes'", duration: 4, placement: 'top-right', type: 'danger', show: true}); return;};
        if (!$scope.checkin.ActivityType){
            $alert({ content:  'Please choose either Running or Cycling', duration: 4, placement: 'top-right', type: 'danger', show: true});
            return;
        }
        localStorage.setItem('lastActivityType',$scope.checkin.ActivityType );
        
        $scope.$emit('LOAD');
        delete $scope.errorMsg;
        delete $scope.successMsg;        
        try {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(saveCheckin, checkinError);
            } else {
                saveCheckin(undefined);
            }
        } catch (err){
            saveCheckin(undefined);
        }
    };
    
    function checkinError (err){
        console.log(err.message);
        saveCheckin(undefined);
    };
    
    function saveCheckin(position){
        window.scrollTo(0, 0);
        if (position){
            $scope.checkin.Latitude = position.coords.latitude;
            $scope.checkin.Longitude = position.coords.longitude;
        }

        var url = GlobalSvc.resturl() + 'View/ModifyAll?table=GroupCheckins&type=insert';        
        GlobalSvc.postData(url,
            $scope.checkin,
            function(){
                $scope.$emit('UNLOAD');
                $alert({ content:  'Well done, you have Checked In...', duration: 5, placement: 'top-right', type: 'success', show: true});
                $scope.checkin = newObject();
                $scope.eventClicked(20);
                $scope.typeClicked(20);
                $scope.$apply();
                window.scrollTo(0, 0);
            },

            function(err){
                $scope.$emit('UNLOAD');
                $scope.errorMsg = data;
                $scope.$apply();
        },
        'GroupCheckins','insert',false,true);
    };
    
    function fetchTodaysEvents(){
       $scope.$emit('LOAD');
       var url = Settings.url + 
               'GetStoredProc?StoredProc=social_todaysevents_readlist&params=(' + 
               GlobalSvc.getUser().SupplierID + '|%27' + GlobalSvc.getUser().UserID + '%27)';       
       $http({method: 'GET', url: url})
           .success(function(json) {
               $scope.events = json;
               $scope.$emit('UNLOAD');
           })
           .error(function(data, status, headers, config) {
               $scope.errorMsg = data;
               $scope.$emit('UNLOAD');
           });       
    };
    
    function constructor(){    
        window.scrollTo(0, 0);
        $scope.$emit('heading',{heading: 'Check In' , icon : 'glyphicon glyphicon-tag'});            
        $scope.$emit('right',{label: 'Save' , icon : 'fa fa-save', onclick:$scope.save}); 
        
        fetchTodaysEvents();            
    };    

    constructor();
});