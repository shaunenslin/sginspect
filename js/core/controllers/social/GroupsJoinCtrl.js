coreApp.controller("GroupJoinCtrl", function ($scope, GlobalSvc, Settings, $http, $alert,$routeParams) {
    window.scrollTo(0, 0);
    $scope.$watch('searchText', function() {
        var json = $scope.groups;
        for (var x=0; x < json.length; x++){
            if (JSON.stringify(json[x]).toUpperCase().indexOf($scope.searchText.toUpperCase()) !== -1)
                json[x].show = true;
            else
                json[x].show = false;
        }        
    });
    
    function newObject(json){
        return {
            SupplierID: GlobalSvc.getUser().SupplierID,
            GroupID: json.GroupID,
            UserID: GlobalSvc.getUser().UserID,
            IsAdmin: 0,
            Accepted: 0
        };
    };
    
    $scope.save = function(json){
        delete $scope.errorMsg;
        delete $scope.successMsg;        

        var type = 'insert';
        if (json.class){
            if (json.class === 'list-group-item-success')   {
                $alert({ content: 'You have already requested or joined ' + json.Name + '. You can only request to join groups you have not already requested or joined', duration: 4, placement: 'top-right', type: 'danger', show: true});
                return;
            }
            if (json.class === 'list-group-item-warning')   {
                if (!confirm('Withdraw your request to join ' + json.Name)) return;
                type = 'delete';
            }           
        }
             
        $scope.$emit('LOAD');
        var url = GlobalSvc.resturl() + 'View/ModifyAll?table=GroupUsers&type=' + type;        
        var obj = newObject(json);

        GlobalSvc.postData(url,
            obj,
            function(){
                $scope.$emit('UNLOAD');
                if (type === 'insert') {
                    json.class = 'list-group-item-warning';
                    $alert({ content:  'You have requested to join "' + json.Name + '", please wait for the group leader to accept your request.', duration: 3, placement: 'top-right', type: 'success', show: true});
                } else {
                    json.class = '';
                    $alert({ content:  'You have removed your requested to join "' + json.Name + '"', duration: 3, placement: 'top-right', type: 'success', show: true});                
                }
                $scope.$apply();
            },

            function(err){
                $scope.$emit('UNLOAD');
                $scope.errorMsg = data;
                $scope.$apply();
        },
        'Groups',type,false,true);
    };
    
    function fetchGroups(){
        $scope.$emit('LOAD');
        var StoredProc = $routeParams.public === undefined ? "social_groups_readlist" : "social_groups_public_readlist" ; 
        var url = Settings.url + 
                'GetStoredProc?StoredProc='+StoredProc+'&params=(' + 
                GlobalSvc.getUser().SupplierID + '|%27' + GlobalSvc.getUser().UserID + '%27)';       
        $http({method: 'GET', url: url})
            .success(function(json) {
                
                for (var x=0; x<json.length;x++){
                    json[x].image = Settings.imageUrl + "?id=" + json[x].image + "&supplierID=" + GlobalSvc.getUser().SupplierID + "&width=40&height=40";
                    if (json[x].accepted===true) 
                        json[x].class = 'list-group-item-success';
                    else if (!json[x].accepted && json[x].userid)
                        json[x].class = 'list-group-item-warning';
                }
                console.log(json);
                $scope.groups = json;
                $scope.$emit('UNLOAD');
            })
            .error(function(data, status, headers, config) {
                $scope.errorMsg = data;
                $scope.$emit('UNLOAD');
            });       
    };
    
    
    function constructor(){
        window.scrollTo(0, 0);
        if(!$routeParams.public){
            $scope.$emit('left',{label: 'Cancel' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){localStorage.removeItem('currentGroupID');window.history.back();}}); 
            $scope.$emit('heading',{heading: 'Join a Group' , icon : 'fa fa-users'});
            $scope.placeholder = 'Search for groups to join';
        }else{
            $scope.$emit('heading',{heading: 'Official Events' , icon : 'fa fa-bicycle'});
            $scope.placeholder = 'Search';
        }
        fetchGroups();
    };   
    constructor();
});
