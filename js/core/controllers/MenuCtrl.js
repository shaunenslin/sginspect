coreApp.controller("MenuCtrl", function ($scope, GlobalSvc, OptionSvc, DaoSvc, Settings, $http) {

    $scope.hcmenu = [];
    $scope.mainmenu = (sessionStorage.getItem('mainmenu')) ? JSON.parse(sessionStorage.getItem('mainmenu')) : []; //GlobalSvc.getmenu();
    $scope.oneAtATime = true;
    $scope.heading = '';
    $scope.menuStyle = Settings.menuStyle;
    $scope.isAdmin = GlobalSvc.getUser().IsAdmin;
    $scope.$on('reloadMenu',function(){alert('xxx');});
    $scope.noUser = !GlobalSvc.getUser().SupplierID ? true : false;
    $scope.groupClicked = function(){
        sessionStorage.setItem('mainmenu',JSON.stringify($scope.mainmenu));
    };

    $scope.itemClicked = function(child){
        if (child.TreeID === 'HOME' && !OptionSvc.getBoolean('UseRoutesLastSelectedDate', false) && localStorage.getItem('routesLastSelectedDate') ) {
        	localStorage.removeItem('routesLastSelectedDate');
    	}
        $("#wrapper").toggleClass("active");
        sessionStorage.setItem('currentTree',JSON.stringify(child));
    };

    $scope.status = {
        isFirstOpen: true,
        isFirstDisabled: false
    };

    $scope.checkUserRole = function(role){
        if (!GlobalSvc.getUser().Role) return false;
        if (GlobalSvc.getUser().Role.indexOf(role) > -1){
            return true;
        }else{
            return false;
        }
    };

    function fetchTree(){

        if (sessionStorage.getItem('mainmenu')){
            if (sessionStorage.getItem('mainmenu') !== '[]') return;
        }
        //TreeSvc.buildMenu($scope);
        var success = function(json){
            createMenu(json);
        };

        var error = function(err){
            fetchTreeHttp();
        };

        if (Settings.menuViaTree === undefined) Settings.menuViaTree = true;
        if (Settings.menuViaTree) {
            //this is legacy, rapidSales menu is stored under main menu
            var menuHeader = Settings.appName === 'RapidSales' ? 'mainmenu' : Settings.appName;
            DaoSvc.indexsorted('Tree',menuHeader,'index2','index3',
                success,
                error,
                onComplete);
        } else {
            for (var x=0; x< $scope.hcmenu.length; x++){
                createMenu($scope.hcmenu[x]);
            }
            onComplete();
        };
    };

    function onComplete(){
        $scope.$apply(); //force update of scope as we insice async methods
        sessionStorage.setItem('mainmenu',JSON.stringify($scope.mainmenu));
    };
    /*
     * Fetch Online if no offline found
     */
    function fetchTreeHttp(){
        if (!GlobalSvc.getUser().SupplierID) {
            console.log ('No SupplierID, dont build menu yet');
            return;
        }
        var url = Settings.url + 'GetStoredProc?StoredProc=usp_tree_readlist&params=(' + GlobalSvc.getUser().SupplierID + ')';
        $http({method: 'GET', url: url})
            .success(function(json) {
                for (var x=0; x< json.length; x++){
                    createMenu(json[x]);
                };
                onComplete();
                console.log('Menu built from HTTP');
                save(json);
            })
            .error(function(data, status, headers, config) {
                //alert('No menu items found...');
            });
    };

    /*
     * Since we got options online, try save locally for next time
     */
    function save(jsonarray){
        try {
            DaoSvc.putMany(jsonarray,
                'Tree',
                undefined,
                function (tx) {
                    console.log('Tree updated ok from http');
                });
        } catch (err){
            console.log('Error updating options from http');
        }

    };


    function constructor(){
        DaoSvc.openDB(fetchTree);
        if (!OptionSvc.getBoolean('UseRoutesLastSelectedDate', false) && localStorage.getItem('routesLastSelectedDate') ) {
        	localStorage.removeItem('routesLastSelectedDate');
    	}
        $scope.versionNumber = 'Version '+Settings.version;
        $scope.showVersion = Settings.showVersion;
        try{
            document.addEventListener('deviceready', function(){
                $scope.osversion = Settings.isPhoneGap ? window.device.version : undefined;
                $scope.$apply()
            }, false);

        }catch(e){
            console.log(e.message);
        }
    };
    constructor();

    function createMenu(json){
        var menuHeader = Settings.appName === 'RapidSales' ? 'mainmenu' : Settings.appName;
        if (json.ParentTreeID !== menuHeader) return;
        if (Settings.menuStyle==='List') {
            //for now assume one level
            var ob = JSON.parse(json.JSON.replace(/\'/g,'"'));
            if (ob.img)
                json.img = ob.img;
            $scope.mainmenu.push(json);
        } else {
            if (json.hasChildren === '1') {
                json.children = [];
                $scope.mainmenu.push(json);
            } else if (json.hasChildren === '0') {
                for (x=0; x<$scope.mainmenu.length; x++){
                    //find the parent and insert as a child
                    if ($scope.mainmenu[x].TreeID === json.ParentTreeID){
                        $scope.mainmenu[x].children.push(json);
                    }
                }
            }
        }
    };
});
