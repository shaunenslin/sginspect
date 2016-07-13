//var syncSvc = (function(){
//    var instance;
//    function instanceObj() {
coreApp.service('SyncSvc', function($http, GlobalSvc, DaoSvc, Settings, OptionSvc, $alert, $templateCache) {

    DaoSvc.openDB();
    this.syncCount = 0;
    this.numRows = 250;
    this.userID = '';
    this.supplierID = '';
    this.resultTable = [];
    this.sentcount = 0;
    var $this = this;
    $this.syncRetry = $this.syncRetry ? $this.syncRetry : 0;

    this.sync = function(SupplierID, UserID, $scope, initialSync){
        this.syncCount = 0;
        this.supplierID = SupplierID;
        this.userID = UserID;
        $this.syncRetry = $this.syncRetry ? $this.syncRetry : 0;
        $scope.syncProgress = [];
        $scope.syncProgress.push('Starting a sync');
        // var table_url = Settings.url + "Get?method=usercode_readsingle&SupplierID='"+ this.supplierID + "'&UserExit='sync.synctables'"
        // var keys_url = Settings.url + "Get?method=usercode_readsingle&SupplierID='"+ this.supplierID + "'&UserExit='sync.tablekeys'"
        //var keys_url = Settings.url + "GetStoredProc?StoredProc=usercode_readsingle&params=("+ this.supplierID + "|'sync.tablekeys')";
        var Oncomplete = function(){
            $this.postObjectsArray = [];
            DaoSvc.cursor('Unsent',
                function(json){
                    $this.postObjectsArray.push(json);
                },
                function(err){
                    $this.download($this.supplierID, $this.userID, $scope); //no objects to post, so continue
                },
                function(){
                    //$this.download($this.supplierID, $this.userID, $scope);
                    $this.postObjects(0, $scope);
                }
            );
        };

        var startTime = new Date().getTime();
        $http({
            method: 'GET',
            url: table_url,
            timeout : parseInt(OptionSvc.getText('AjaxTimeout', 30000)),
            }).success(function(data, status, header, config){
                if(!data.length){
                localStorage.setItem('localTablesCache',JSON.stringify(Settings.tableKeys));
                Oncomplete();
                return;
                }
                var userExitFunc = new Function('user',data[0].Code);
                var tables = userExitFunc( JSON.parse(localStorage.getItem('currentUser')));
                $http.get(keys_url).success(function(json){
                    Settings.syncTables = Settings.syncTables.concat(tables);
                    console.log(Settings.syncTables);
                    var userExitFunc = new Function('user',json[0].Code);
                    var keys = userExitFunc( JSON.parse(localStorage.getItem('currentUser')));
                    Settings.tableKeys = Settings.tableKeys.concat(keys);
                    localStorage.setItem('localTablesCache',JSON.stringify(Settings.tableKeys));
                    DaoSvc.openDB(Oncomplete());
                });
            }).error(function(data, status, header, config){
                var respTime = new Date().getTime() - startTime;
                if(respTime >= config.timeout){
                    $this.syncRetry = $this.syncRetry > 0 ? parseInt($this.syncRetry) : 0;
                    if ($this.syncRetry < parseInt(OptionSvc.getText('RetryLimit', 5))){
                        $this.syncRetry++;
                        $this.sync(GlobalSvc.getUser().SupplierID, GlobalSvc.getUser().UserID, $scope);
                    } else{
                        $alert({ content: "Connection timeout! : Please check your network connection and try again", duration: 6, placement: 'top-right', type: 'danger', show: true});
                    }
                }
                $scope.$emit('UNLOAD');
            });

    };

    this.postObjects = function(index, $scope){
        // Done posting, so download
        if (index === $this.postObjectsArray.length){
            $this.download($this.supplierID, $this.userID, $scope);
            return;
        }

        var obj = $this.postObjectsArray[index];
        $scope.syncProgress.push('Sending ' + obj.Table + '(' + (index + 1) + ')');

        GlobalSvc.postData(obj.url,
            obj.json,
            function(data){
                if(typeof(data) === 'string'){
                    data = data.replace(/'/g, '"');
                    data = (data.indexOf('COLUMN_NAME') > 1 || !data) ? '' : JSON.parse(data) ;
                }

                if (!data || data.status || data.Status) {
                    $scope.syncProgress[$scope.syncProgress.length -1] += ' --OK';
                    DaoSvc.deleteItem('Unsent',obj.key, undefined,
                            function(err){
                                alert('error deleting unsent records');
                                index += 1;
                                $this.postObjects(index, $scope);
                            },function(){
                                index += 1;
                                $this.postObjects(index, $scope);
                            });
                } else {
                    $scope.syncProgress[$scope.syncProgress.length -1] += ' --Error Sending - try again';
                    index += 1;
                    $this.postObjects(index, $scope);
                }
            },
            function(err){
                $scope.syncProgress[$scope.syncProgress.length -1] += (err && err.statusText) ? err.statusText : ' --Error Sending - try again';
                index += 1;
                $this.postObjects(index, $scope);
            },
            obj.Table,
            obj.Method,
            true
        );
    };

    this.download = function(SupplierID, UserID, $scope){
        var item = Settings.syncTables[this.syncCount];
        syncTableCount = 0;
        this.fetchTable(SupplierID, UserID, item, this.fetchLastTableSkip(item.table ), this.saveToDB, $scope, $this);
    };

    /*
    * Fetch method to get each individual table from the server
    */
    this.fetchTable = function (supplierid, userid, item, skip, callback, $scope, $this) {
        var version = this.fetchLastTableVersion(item.table );
        var userParameter = '';
        if (userid) userParameter = '&userID=' + GlobalSvc.getUser().UserID + '';
        var url = '';
        if(item.alternateLink ){
            url = item.alternateLink ;
        } else if(item.generic){
            url = Settings.url + '/Sync'+
                '?supplierID=' + supplierid +
                '&version=' + version +
                '&userid=' + GlobalSvc.getUser().UserID +
                '&table=' + item.table  +
                '&method='+ item.method +
                '&skip=' + skip +
                '&top=' + this.numRows + '&format=json';
                console.log(url);
        } else if(item.dynamo){
            url = Settings.dynamoUrl + 'dynamodb.php/Sync?table=' + item.table + '&hashkey=' + item.hashkey + '&hashvalue=' + item.hashvalue(supplierid);
            url += "&userID=" + GlobalSvc.getUser().UserID + "&version=" + ((item.table === 'UserCode' && this.initialSync) ? 0 : version);
        } else {
            url = Settings.url + item.table  + '/' + item.method +
                '?supplierID=' + supplierid +
                 userParameter +
                '&version=' + version +
                '&skip=' + skip +
                '&top=' + this.numRows + '&format=json';
        }
        if (skip === 0) $scope.syncProgress.push('Checking ' + item.table);
        var startTime = new Date().getTime();
        $http({
            method: 'GET',
            url: url,
            timeout : parseInt(OptionSvc.getText('AjaxTimeout', 30000))
        })
        .success(function(json, status, headers, config) {
            $this.syncRetry = 0;
            callback(json, supplierid, userid, version, item.table, item.method, skip, $scope, $this);
        })
        .error(function(data, status, headers, config) {
            var respTime = new Date().getTime() - startTime;
            if(respTime >= config.timeout){
                $this.syncRetry = $this.syncRetry > 0 ? parseInt($this.syncRetry) : 0;
                if ($this.syncRetry < parseInt(OptionSvc.getText('RetryLimit', 5))){
                    $this.syncRetry++;
                    $this.fetchTable(supplierid, userid, item, skip, callback, $scope, $this);
                } else{
                    $alert({ content: "Connection timeout! : Please check your network connection and try again", duration: 6, placement: 'top-right', type: 'danger', show: true});
                    $scope.$emit('UNLOAD');
                    $scope.$apply();
                }
            }
            // console.log(status);
        });
    };

    /*
    * return the last succesfull version for this table
    */
    this.fetchLastTableVersion = function(table){
        var lastversion = localStorage.getItem('lastversion' + table);
        if (lastversion === null) lastversion = 0;
        if (isNaN(lastversion)) lastversion = 0;
        return parseInt(lastversion);
    };
    /*
    * Store's the last page returned so we can restart from that point
    */
    this.fetchLastTableSkip = function (table) {
        // due the optional table sync, we always need to sync all data from Options table
        //if ('Options' === table) return 0;
        var lastskip = localStorage.getItem('lastSkip' + table);
        if (lastskip === null) lastskip = 0;
        return parseInt(lastskip);
    };

    this.setLastVersion = function (table, version){
        localStorage.setItem('lastversion' + table, version);
        localStorage.removeItem('lastSkip' + table);
    };

    /*
     * Move onto next item, unless we ignoring the sync via OptionInfo Ignore<tablename>, then
     * recursivly call next item again to check the next table
     */
    this.nextItem = function($this) {
        $this.syncCount++;
        var ignorecsv = OptionSvc.getText(Settings.appName + 'IgnoreTables','');
        var tbl = Settings.syncTables[$this.syncCount] ? Settings.syncTables[$this.syncCount].table : "xxx";
        if (ignorecsv.indexOf(tbl) !== -1){
            //$this.syncCount++;
            return this.nextItem($this); //skip this table and move onto next
        } else {
            return Settings.syncTables[$this.syncCount]; //return next table to sync
        }
    };

    /*
    * Any time we save data, it needs to be in a save<...> method
    * This method saves the sync data to local database
    */
    this.saveToDB = function (json, supplierID, userid, version, table, method, skip, $scope, $this) {
        if (this.stopsync===true) return;

        localStorage.setItem('lastSkip' + table, skip);
        var jsonarray = (json._Items) ? json._Items : json.items; // cater for Kevin avoiding standards
        var lastversion = (json._LastVersion) ? json._LastVersion : json.LastVersion;

        if (jsonarray === undefined || jsonarray === null || jsonarray.length === 0) {
            //this table sync is finished, so check if we need more downloads of this table
            $scope.syncProgress[$scope.syncProgress.length -1] += ' OK';
            $this.setLastVersion(table, lastversion);

            if ((Settings.syncTables.length === ($this.syncCount + 1))) { //completed the SYNC
                $this.completeSync($scope);
            } else {    // go on to the next table
                var item = $this.nextItem($this);
                $this.fetchTable(supplierID, userid, item, $this.fetchLastTableSkip(item.table ), $this.saveToDB, $scope, $this);
                return;
            }
            return;
        }
        var writeComplete = function() {
            if ((jsonarray.length ) < 250) {
                if (table === "Options") {
                    OptionSvc.options = {};
                    OptionSvc.init();
                }
                //less than 250 records, so move on to the next sync
                $scope.syncProgress[$scope.syncProgress.length -1] = table + ' (' + (skip + jsonarray.length) + ') downloaded';
                $this.setLastVersion(table, lastversion);
                if ((Settings.syncTables.length === ($this.syncCount + 1))) {
                    $this.completeSync($scope);
                } else {
                    var item = $this.nextItem($this);
                    try {
                        $this.fetchTable(supplierID, userid, item, $this.fetchLastTableSkip(item.table ), $this.saveToDB, $scope, $this);
                        //$this.fetchTable(supplierID, item.userid, item.method , item.method, $this.fetchLastTableSkip(item.method ),$this.saveToDB,$scope, $this, item.alternateLink,item.generic, item.dynamo);
                    } catch(err) {
                        console.log('Skipping');
                    }
                }
            } else {
                //get the next 250 records for the table
                $scope.syncProgress[$scope.syncProgress.length -1] = table + ' (' + (skip + jsonarray.length) + ') downloaded';
                var item = Settings.syncTables[$this.syncCount];
                $this.fetchTable(supplierID, userid, item, skip + $this.numRows, $this.saveToDB, $scope, $this);
                //$this.fetchTable(supplierID, userid, table, method, skip + $this.numRows,$this.saveToDB,$scope,$this,item.alternateLink,item.generic, item.dynamo); //get next 250 records
            }
        };

        if (jsonarray === undefined) return;
        if (jsonarray.length === 0) return;

        try {
            if (table==='DisplayFields'){
                for (var x=0; x < jsonarray.length; x++){
                    //on php length is a string, so convert to
                    if (angular.isString(jsonarray[x].Length))
                        jsonarray[x].Length = parseInt(jsonarray[x].Length);
                }
            }
            if (Settings.syncTables[$this.syncCount].localstorage ? Settings.syncTables[$this.syncCount].localstorage : false) {
                //For injection we must reload, else injection doesnt kick in
                if (Settings.syncTables[$this.syncCount].table === "Injection")
                    $scope.mustreload = true;
                else
                    $scope.mustreload = false;
                localStorage.setItem(Settings.syncTables[$this.syncCount].key, JSON.stringify(jsonarray));
                writeComplete();
            } else {
                DaoSvc.putMany(jsonarray,
                    table,
                    undefined,
                    function (tx) {
                        GlobalSvc.alert('Error on download, can\'t continue: ' + tx.message);
                        this.stopsync = true;
                        GlobalSvc.busy(false);
                    },
                    writeComplete);
            }


        } catch (err) {
            GlobalSvc.alert('Error opening transaction' + err.message);
            return;
        }
    };

    this.completeSync = function($scope) {
        console.log('===== Sync completed OK =====');
        $scope.message = 'Sync completed OK. Please wait';
        OptionSvc.options = {};
        OptionSvc.init();
        //For injection, must reload, else doesnt kick in
        if ($scope.syncCompleted) $scope.syncCompleted($scope.mustreload);
        GlobalSvc.busy(false);

    };


}); //end instance
