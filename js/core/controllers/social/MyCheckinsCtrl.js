
coreApp.controller("MyCheckins", function ($scope, GlobalSvc, Settings, $http, $routeParams, $location, $alert) {
    window.scrollTo(0, 0);
    $scope.userID = ($routeParams.userid) ? $routeParams.userid : GlobalSvc.getUser().UserID;
    $scope.isUser = false;
    
    $scope.activityTypeClicked = function(text){
        $scope.currentCheckin.ActivityType = text;
    };
    
    $scope.delete = function(row, idx){
        if (!confirm('Are you sure you want to delete?')) return;
        
        $scope.$emit('LOAD');
        delete $scope.errorMsg;
        delete $scope.successMsg;   
        delete $scope.infoMsg;
        var url = GlobalSvc.resturl() + 'View/ModifyAll?table=GroupCheckins&type=delete';        
         window.scrollTo(0, 0);
        GlobalSvc.postData(url,
            row,
            function(){
                $scope.$emit('UNLOAD');
                if ($scope.json) {
                    $scope.json.splice(idx,1);
                   
                    $alert({ content:   'Ok, we deleted this CheckIn from ' + row.CreatedOn, duration: 5, placement: 'top-right', type: 'success', show: true});
                    //$scope.successMsg = 'Ok, we deleted this CheckIn from ' + row.CreatedOn;
                    $scope.$emit('left',undefined); 
                    $scope.mode = 'list';
                    $scope.$apply();
                } else {
                    $scope.deletedMsg = 'Ok, we deleted this CheckIn from ' + row.CreatedOn;
                    $scope.mode = 'none';
                    $scope.$apply();
                }
            },

            function(err){
                $scope.$emit('UNLOAD');
                $scope.errorMsg = err;
                $scope.$apply();
        },
        'GroupCheckins','delete',false,true);       
    };
    
    $scope.toListClicked = function(){
        $location.path('/mycheckins' + ($routeParams.userid ? '/'+$routeParams.userid : ''));
    };
    
    $scope.rowClicked = function(row,index){
            $location.path('/mycheckins/form/' + index + ($routeParams.userid ? '/'+$routeParams.userid : ''));
    };
    
    $scope.fetchHistory = function(){
        $scope.$emit('LOAD');
        delete $scope.errorMsg;
        delete $scope.successMsg;   
        delete $scope.infoMsg;
        
        var url = Settings.url + 'GetStoredProc?StoredProc=social_checkins_readlist&params=(' + GlobalSvc.getUser().SupplierID + '|"' + $scope.userID +'")';
        $http({method : 'GET' , url : url}).success(function(json){
            $scope.$emit('UNLOAD');
            if (json.length===0){
                $scope.infoMsg = 'You don`t have have any history as you have not checked-in for any activity yet. Use the "Check In" menu option after a cycle or run.';
            }
            for (var x=0; x<json.length; x++) {
                try {
                    var row = json[x];
                    //get the time wording correct
                    if (!row.Notes) continue;
                    row.Time = row.Notes; 
                    if (row.Notes.toString().indexOf('.') !== -1)
                        row.Notes = row.Notes.toString().replace('.','h');
                    else 
                        row.Notes = row.Notes.toString() + 'h00';  
                    //get createdon to look good
                    row.CreatedOn = GlobalSvc.parseDate(row.CreatedOn);                   
                } catch (err){
                    console.log(err);
                }                
            }     
           
            sessionStorage.setItem('checkinCache', JSON.stringify(json));
            $scope.json = json;
        });
    };
    
    $scope.backClicked = function(){
        try{
            var path = sessionStorage.getItem('myCheckinBackURL');
            sessionStorage.removeItem('myCheckinBackURL');
            $location.path(path);
            $scope.$apply();
        } catch (err){
            $scope.errMsg = err;
        }
    };
    
    $scope.saveCheckIn = function(){
        window.scrollTo(0, 0);
        if (!$scope.currentCheckin.Value) {
            $alert({ content:  'Please enter a Distance such as 23 if you rode 23km', duration: 4, placement: 'top-right', type: 'danger', show: true});
            //$scope.errorMsg = 'Please enter a Distance such as 23 if you rode 23km';
            return;
        }
        if (!$scope.currentCheckin.Notes) {
            $alert({ content:  'Please enter a Duration such as 1.23 for 1 hour 23 minutes', duration: 4, placement: 'top-right', type: 'danger', show: true});
            return;
        }
        if(isNaN($scope.currentCheckin.Time)){ $alert({ content: "Please enter the a numeric value for Duration such as 1.23 for 1 hour 23 minutes'", duration: 4, placement: 'top-right', type: 'danger', show: true}); return;};
        
        $scope.currentCheckin.Notes = $scope.currentCheckin.Time;
        $scope.$emit('LOAD');
        delete $scope.errorMsg;
        delete $scope.successMsg;        
        
        var url = GlobalSvc.resturl() + 'View/ModifyAll?table=GroupCheckins&type=insert';        
        GlobalSvc.postData(url,
            $scope.currentCheckin,
            function(){
                $scope.$emit('UNLOAD');
                $alert({ content:  'Check In Updated Successfully..', duration: 5, placement: 'top-right', type: 'success', show: true});
                window.history.back();
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
    
    function constructor(){             
        window.scrollTo(0,0);
        if (!$routeParams.mode) {
            $scope.$emit('heading',{heading: 'My History' , icon : 'fa fa-history'}); 
            $scope.$emit('right',{label: 'Refresh' , icon : 'fa fa-refresh', onclick:$scope.fetchHistory}); 
            $scope.mode = 'list';
            $scope.fetchHistory();
            if($routeParams.userid){
                if($routeParams.userid.toLowerCase() === GlobalSvc.getUser().UserID.toLowerCase()){$scope.isUser = true;}else{$scope.isUser = false;}
            }else{
                $scope.isUser = true;
            }        
        } else {
            $scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick:$scope.toListClicked}); 
            //$scope.$emit('right',{label: 'Save' , icon : 'fa fa-save', onclick:$scope.saveCheckIn}); 
            $scope.mode = 'form';
            var json = JSON.parse(sessionStorage.getItem('checkinCache'));
            $scope.currentCheckin = json[$routeParams.index];
            $scope.$emit('heading',{heading: 'Session' , icon : 'fa fa-history'});
            
            if($routeParams.index && $routeParams.userid){
                if($routeParams.userid.toLowerCase() === GlobalSvc.getUser().UserID.toLowerCase() ){
                    $scope.$emit('right',{label: 'Save' , icon : 'fa fa-save', onclick:$scope.saveCheckIn}); 
                    $scope.isUser = true;
                }else{
                    $scope.isUser = false;
                }
            }else{
                $scope.$emit('right',{label: 'Save' , icon : 'fa fa-save', onclick:$scope.saveCheckIn}); 
                $scope.isUser = true;
            }
        }
        //if($routeParams.userid.toLowerCase() === GlobalSvc.getUser().UserID.toLowerCase() ){

        if (sessionStorage.getItem('myCheckinBackURL')){
            $scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick:$scope.backClicked});
        }
        
    };    

   constructor();
});

