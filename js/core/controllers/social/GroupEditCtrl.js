coreApp.controller("GroupEditCtrl", function ($scope, $route, $alert, GlobalSvc, $location, Settings, $routeParams, $http) {

    $scope.onfetch = function(json){
        //This method is used to push in the initial group shown in the groups list i.e. you see "Join a Group"
        json.push({

            Area: "",
            GroupID: 'join',
            Name: "Join a Group",
            SupplierID: GlobalSvc.getUser().SupplierID,
            image: "img/add.png",
            Tel: ""
        }
        );
        return json;
    };
    $scope.delete = function(){
        if (confirm('Are you sure you want to delete?')) $scope.save('delete');
    };

    $scope.save = function(type){
        $scope.$emit('LOAD');
        delete $scope.errorMsg;
        delete $scope.successMsg;
        // The Owner in $scope.group is sent as the Name
        if (!$scope.group.Owner){
            $alert({ content:   "Please enter a Contact Name before saving", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
        }
        var currentGroup = JSON.parse(localStorage.getItem('currentGroup'));
        $scope.group.ImageURL = $scope.groupIMG;
        $scope.group.image = $scope.group.ImageURL ? $scope.group.ImageURL : 'img/groups.png'; 
        $scope.group.isAdmin = currentGroup ? currentGroup.isAdmin : GlobalSvc.getUser().IsAdmin;
        if (!type) type = $routeParams.id === 'new' ? 'insert' : 'update';
        var url = GlobalSvc.resturl() + 'View/ModifyAll?table=Groups&type=' + type;

        GlobalSvc.postData(url,
            $scope.group,
            function(){
                localStorage.setItem('currentGroup', JSON.stringify($scope.group));
                $scope.$emit('UNLOAD');
                $alert({ content:   "Saved ok", duration: 5, placement: 'top-right', type: 'success', show: true});
                if (type==='delete') {
                    $alert({ content:   "Your group was deleted", duration: 5, placement: 'top-right', type: 'success', show: true});
                    localStorage.removeItem('currentGroupID');
                    localStorage.removeItem('currentGroup');
                    $location.path("/groups");
                    $scope.$apply();
                } else {
                    if (type==='insert') fetchNewGroup();
                    $scope.$apply();
                }
            },
            function(err){
                $scope.$emit('UNLOAD');
                $alert({ content:   "There was an error completing your request", duration: 5, placement: 'top-right', type: 'danger', show: true});
                $scope.$apply();
        },
        'Groups',type,false,true);
    };

    /*
     * Since groupID's are assigned after inserting, we need to fetch last added record to see group.
     * Then call groupedit
     */
    function fetchNewGroup(){
        var url = Settings.url + 'GetStoredProc?StoredProc=social_group_readlast&params=(' + GlobalSvc.getUser().SupplierID + ')';
        $http({method: 'GET', url: url})
            .success(function(json) {
                saveUserGroup(json[0].GroupID);
            })
            .error(function(data, status, headers, config) {
                $scope.errorMsg = data;
                $scope.$emit('UNLOAD');
            });
    };

    $scope.postImage = function (){
        $scope.$emit('LOAD');
        var onComplete = function(par1){
             sessionStorage.setItem('key', par1.url);
            location.reload();
            $scope.$emit('UNLOAD');
        };
        var onError = function(err){
            $scope.$emit('UNLOAD');
            $scope.errMsg = err;
        };
        GlobalSvc.postImage(GlobalSvc.getUser().SupplierID, 'GROUP' + $scope.group.GroupID, $('#file-select')[0], onComplete, onError);
    };

    function newObject(){
        $scope.group = {
            Area: "",
            GroupID: "",
            Name: "",
            SupplierID: GlobalSvc.getUser().SupplierID,
            Tel: ""
        };
        //JsonFormSvc.buildForm($scope, 'group', 'group', false, true, 'view', 'form', undefined, $scope.group );
        fetchGroupImage($scope.group.GroupID);
    };

    function newUGObject(groupID){
        return {
            SupplierID: GlobalSvc.getUser().SupplierID,
            GroupID: groupID,
            UserID: GlobalSvc.getUser().UserID,
            IsAdmin: 1,
            Accepted: 1
        };
    };

    /*
     * Fetch the last group created so we can get the GroupID
     */
    function fetchGroup(){
        var url = Settings.url + 'GetView?view=Groups&params=Where%20GroupID%20=%20' + $routeParams.id;
        $http({method: 'GET', url: url})
            .success(function(json) {
                $scope.group = json[0];
                fetchGroupImage($scope.group.GroupID);
                $scope.$emit('UNLOAD');
            })
            .error(function(data) {
                $scope.errorMsg = data;
                $scope.$emit('UNLOAD');
            });
    };

    /*
     * When creating a group, also enter this user as the first groupuser administrator
     */
    function saveUserGroup(groupID){
        console.log('saving usergroup');
        delete $scope.errorMsg;
        delete $scope.successMsg;
        var url = GlobalSvc.resturl() + 'View/ModifyAll?table=GroupUsers&type=insert';
        var obj = newUGObject(groupID);

        GlobalSvc.postData(url,
            obj,
            function(){
                console.log('saved going to /groupedit/' + groupID);
                $location.path('/groupedit/' + groupID);
                $scope.$apply();
            },
            function(err){
                $scope.$emit('UNLOAD');
                $scope.errorMsg = err;
                $scope.$apply();
        },
        'Groups','insert',false,true);
    };


    function fetchGroupImage(ID){
        var key = ID;
        if (sessionStorage.getItem(key)) {
            $scope.groupIMG = sessionStorage.getItem(key);
            return;
        }

        var url = 'https://rapidtradeimages.s3.amazonaws.com/' + GlobalSvc.getUser().SupplierID + '/GROUP'  + ID +'.jpg';
        $http({method: 'GET', url: url})
            .success(function(json) {
                if (json.indexOf('Not Found') === -1){
                    $scope.groupIMG = url;
                    sessionStorage.setItem(key, url);
                    $scope.$apply();
                } else {
                    delete $scope.groupIMG;
                }
            })
            .error(function(data, status, headers, config) {
                delete $scope.groupIMG;
            });
    };


    function constructor(){
        window.scrollTo(0, 0);
        $scope.groupIMG = 'none';
        $scope.id = $routeParams.id;
        $scope.$emit('left',{label: 'Cancel' , icon : 'fa fa-chevron-left', onclick: function(){($scope.id == 'new') ? window.history.back() : $location.path('/groups');}});
        $scope.$emit('heading',{heading: 'Edit' , icon : 'fa fa-users'});
        $scope.$emit('right',{label: 'Save' , icon : 'fa fa-save', onclick : $scope.save});
        if ($routeParams.id === 'new')
            newObject();
        else
            fetchGroup();
    }
    constructor();
});
