coreApp.controller("ViewCtrl", function ($scope, GlobalSvc, DaoSvc, $location, $http, Settings) {
    $scope.errormessage;
    $scope.session = {
        id: '',
        formid: '',
        type: '',
        currentTree:  {},
        json: {},
        jsonArray: new Array(),
        jsonObj: {},
        displayfields: new Array(),
        settings: {}
    };
    
    $scope.fetchhttp = function() {
        $scope.$emit('LOAD');
        var url = '';
        if ($scope.session.settings.url.indexOf('http') !== -1)
            url = $scope.session.settings.url;
        else
            url = Settings.url + $scope.session.settings.url;
        //if there was a key via the url (eg. view/<xxx>/keyfield
        if ($scope.session.key) 
            url = url.replace(':Key',$scope.session.key); 
        
        //if there is a lastobject, see if its needed
        if (sessionStorage.getItem('lastObject')) {
            var obj = JSON.parse(sessionStorage.getItem('lastObject'));
            url = GlobalSvc.setParamaters(url,obj);
            localStorage.removeItem('lastObject');
        }
        
        //replace any ~ with '
        url = url.replace(/~/g,"'");
        url = GlobalSvc.setParamaters(url, $scope.session.prevjson);
        console.log(url);
        url = url.replace('CONVTEST','conv'); //this is for testing
        $http({method: 'GET', url: url})
        .success(function(json, status, headers, config) {
            if ($scope.session.settings.resultfield)
                $scope.session.json = json[$scope.session.settings.resultfield];
            else
                $scope.session.json = json;
            $scope.fetchDisplayFields();
        })
        .error(function(data, status, headers, config) {
            $scope.errormessage = 'Issue.';
            $scope.$on('UNLOAD');
        });           
    };
    
    /*
     * Fetch displayfields, then set session.jsonarray or session.jsonobj
     * @returns {undefined}
     */
    $scope.fetchDisplayFields = function(){
        $scope.$emit('LOAD');
        DaoSvc.openDB();
        var id = $scope.session.settings.id;
        // allow different displayfields based on key
        if ($scope.session.settings.fieldsbykey){
            if ($scope.session.key) {
                id = id + $scope.session.key;    
            }
        }
        //allow for different display fields based on fields in lastobject
        if ($scope.session.settings.idsuffix){
            if (sessionStorage.getItem('lastObject')) {
                var obj = JSON.parse(sessionStorage.getItem('lastObject'));
                id = id + obj[$scope.session.settings.idsuffix];    
            }
        }
        $scope.session.settings.id = id;
        
        DaoSvc.indexsorted('DisplayFields',id,'index1','index2', 
            function(json){ 
                if ($scope.rowidx === 'new' && json.Type !== 'Default') 
                    json.ReadOnly = false;
                
                $scope.session.displayfields.push(json);
            }, 
            function(err){
                try {
                    var obj = ($scope.session.json instanceof Array) ? $scope.session.json[0]: $scope.session.json;
                    $scope.session.displayfields = new Array();
                    $scope.addDisplayFields(obj,true);
                    //$scope.session.jsonArray = $scope.session.json;
                } catch (err){
                    alert(err.message);
                }
            }, 
            function(){
                //set etiher table or Obj depending on if form or table
                switch ($scope.session.settings.type){
                    case 'table':
                        $scope.session.jsonArray = $scope.session.json;
                        break;
                    case 'form':                       
                        if ($scope.rowidx === 'new') 
                            $scope.session.jsonObj = addDefaultValues($scope.session.json, $scope.session.displayfields);
                        else
                            $scope.session.jsonObj = $scope.session.json;    
                        break;
                    case 'split':
                        $scope.session.jsonArray = $scope.session.json;
                        $scope.session.jsonObj = $scope.session.prevjson;
                        break;
                }
                    
                sessionStorage.setItem($scope.session.cacheid,JSON.stringify($scope.session));
                $scope.$emit('UNLOAD');
                $scope.$apply(); //force update of scope as we insice async methodss
            });
    };
    
    /*
     * If we have cache, then use it
     * Also check setting to see as sometimes we dont want to use cache if nocache=true
     * @returns {Boolean}
     */
    function canUseCache(){
        try {
            if ($scope.session.cacheid===undefined) return false;
            if (sessionStorage.getItem($scope.session.cacheid)) {
                if ($scope.session.settings.nocache) 
                    return !$scope.session.settings.nocache;
                else 
                    return true;                
            } else {
                return false;
            }
            
        } catch (err){
            return true;
        }
    }
    
    
    /*
     * Builds JSON Form, Table or Listview
     * @returns {undefined}
     */
    $scope.buildForm = function() {
        //Get formid and key
        $scope.$emit('UNLOAD');
        var formid = $location.path().substring(6);
        
        
        if (formid.indexOf('/') > 0){
            $scope.session.key = formid.split('/')[1];
            $scope.session.formid = formid.split('/')[0];  
            formid = $scope.session.formid;
            $scope.session.cacheid =  $scope.session.formid + $scope.session.key + 'cache';
        } else {
            delete $scope.session.key;
            $scope.session.formid = formid;
            $scope.session.cacheid =  $scope.session.formid + 'cache';
        }

        //Get session from cache
        sessionStorage.setItem('CurrentFormCacheID',$scope.session.cacheid);
        sessionStorage.setItem('CurrentFormID',$scope.session.formid);
        //if (sessionStorage.getItem($scope.session.cacheid) &&  (mustCache()) ){
        //    $scope.session = JSON.parse(sessionStorage.getItem($scope.session.cacheid));
        //    return;
        //}

        getTree(formid);
    };
    
    function getTree(formid){
        // Get the Tree record
        DaoSvc.openDB();
        var key = GlobalSvc.getUser().SupplierID + formid;
        DaoSvc.get('tree', key,
            function(row){
                
                //get rid of some logic from core  vesion 1        
                var json = row.JSON; 
                if (angular.isString(json)){
                    json = json.replace('view.getInstance().showTable(','');
                    json = json.replace('})','}');
                    json = json.replace(/\'/g,'"');
                    try {
                        $scope.session.settings = JSON.parse(json); 
                    } catch (err){
                        alert('Error parsing row.json from tree');
                        return;
                    }                    
                } else {
                    $scope.session.settings = json;  
                }
                //TODO deal with hidedeading
                $scope.hideheading = true;
                $scope.$emit('heading',{heading: $scope.session.settings.heading , icon : $scope.session.settings.img});
                /*    
                if (Settings.navHeading) {
                    $scope.$emit('heading', $scope.session.settings.heading);
                    $scope.hideheading = true;
                } else {
                    $scope.hideheading = false;
                }   
                */
                
                $scope.session.settings.formid = formid; //save in settings for detailview
                $scope.session.type = $scope.session.settings.type; 
                if ($scope.session.view === 'drilldown') $scope.session.settings.backbutton = true;
                if ($scope.session.settings.url) {
                    if  (canUseCache() ){
                        $scope.session = JSON.parse(sessionStorage.getItem($scope.session.cacheid));
                        $scope.$apply();
                        return;
                    } else {
                        $scope.fetchhttp();
                    }
                }                   
            },
            function(err){
                alert(err);
                $scope.$on('UNLOAD');
            },
            undefined);
    };
    
    /*
     * Build the detail view which is called from either JSON table or Listview 
     * @returns {undefined}
     */
    $scope.buildDetail = function(){
        //build our tree ID and get index from array to use
        var formid = $location.path().substring(12);
        var rowidx = formid.substring(formid.indexOf('/')+1);
        formid = formid.substring(0,formid.indexOf('/'));
        
        //build a new session object based on previous session
        var prevSession = JSON.parse(sessionStorage.getItem(sessionStorage.getItem('CurrentFormCacheID'))); //formid.replace('Det','') + 'cache'));
        $scope.session.formid = formid;
        $scope.rowidx = rowidx;
        var newID = (prevSession.settings.detailID) ? prevSession.settings.detailID : prevSession.settings.id + 'Det';
        
        //Get the json Object
        if (rowidx==='new') {
            $scope.session.json = $scope.newObject(prevSession.jsonArray,prevSession.displayfields);
        } else {
            $scope.session.json = prevSession.jsonArray[parseInt(rowidx)];
            //for .net change date formats
            if (!Settings.phpServer){ 
                for (var prop in $scope.session.json){
                    if (angular.isString($scope.session.json[prop])){
                        var isdate = $scope.session.json[prop].indexOf("/Date(")
                        if (isdate > -1) {
                            $scope.session.json[prop] = GlobalSvc.toDate($scope.session.json[prop]);
                        }
                    }
                }
            }
        }
        //build new settings object
        $scope.session.settings = {
            heading: prevSession.settings.heading,
            id: newID,
            type: 'form',
            canDelete: (prevSession.settings.canDelete !== undefined) ? prevSession.settings.canDelete : true ,
            mode: prevSession.settings.mode};
        $scope.fetchDisplayFields();    
        prevSession = undefined;
    };
    
    
    /*
     * Build the detail view which is called from either JSON table or Listview 
     * @returns {undefined}
     */
    $scope.buildDrilldown = function(){
        //build our tree ID and get index from array to use
        var formid = $location.path().substring(11);
        var rowidx = formid.substring(formid.indexOf('/')+1);
        formid = formid.substring(0,formid.indexOf('/'));
        
        //build a new session object based on previous session
        var prevSession = JSON.parse(sessionStorage.getItem(sessionStorage.getItem('CurrentFormCacheID'))); //formid.replace('Det','') + 'cache'));
        $scope.session.formid = formid;
        $scope.session.cacheid =  $scope.session.formid + rowidx + 'cache';
        $scope.session.prevjson = prevSession.jsonArray[parseInt(rowidx)];
        $scope.session.view = 'drilldown';
        prevSession = undefined;  
        //TODO below may cause issues in Frameworkmaster dashboards       
        sessionStorage.setItem('CurrentFormCacheID',$scope.session.cacheid);
        sessionStorage.setItem('CurrentFormID',$scope.session.formid);
        getTree(formid);
    };
    
    /*
     * Build an initial JSON object when adding a new record. 
     * Add properties based on displayfields of previous table
     * @param {type} displayfields
     * @returns {undefined}
     */
    $scope.newObject = function(array, displayfields){
        var newObj = {};
        //plan A is to take an object from previous array
        if (array.length > 0) {
            var obj = array[0];
            
            for (var prop in obj) {
                if (angular.isNumber(obj[prop]))
                    newObj[prop] = 0;
                else
                    newObj[prop] = '';
            }
        } else {
            //Plan B is to create an object from displayfields
            // TODO - this still needs to be done
        }
         return newObj;   
    };
    
    /*
     * For new objects, we may want to default values from previous screen's, but not display them or allow user to choose.
     * @param {type} prop
     * @param {type} prevobj
     * @param {type} displayfields
     * @returns {undefined}
     */
    function addDefaultValues(newObj, displayfields ){
        try {
            for (var x=0; x < displayfields.length; x++){
                var df = displayfields[x];
                if (df.Type === 'Default'){
                    if (df.DefaultData){
                        if (df.DefaultData.indexOf('.') > 3) {
                            var arr = df.DefaultData.split(".");
                            var obj = JSON.parse(sessionStorage.getItem(arr[0]));
                            newObj[df.Name] = obj[arr[1]];                           
                        } else if (df.DefaultData.substring(0, 1)===':'){
                            newObj[df.Name] = GlobalSvc.setParamaters(df.DefaultData); 
                        } else {
                            newObj[df.Name] = df.DefaultData;
                        }   
                    } else {
                        newObj[df.Name] = '';
                    }
                }
            }
            return newObj;
        } catch (err){
            return newObj;
        }      
    };
       
    /*
     * Add display fields from an object.
     * Where displayfields do already exist, only add fields that dont already exist
     * @param {type} obj - the object used to get displayfields from 
     * @param {type} newlist - true if not existing displayfields
     * @returns {undefined}
     */
    $scope.addDisplayFields = function(obj){
        var x = 0;
        for (var prop in obj) {
            //check if this display field already already exists in $scope.displayfields 
            var foundarray = $scope.session.displayfields.filter(function(v) { return v.name === prop;});
            if (foundarray.length > 0) continue;

            //build new Displayfield
            var df = {};
            df.SupplierID = GlobalSvc.getUser().SupplierID;
            df.Name = prop;
            df.ReadOnly = false;
            df.RoleOnly = false;
            df.SortOrder = x; 
            df.Type = 'Text';
            df.Visible = true; //if building brand new list, then default first 5 fields to visible
            df.AdminOnly = false;
            df.ID = $scope.session.settings.id;
            df.Label = '';
            df.Mandatory = false;
            $scope.session.displayfields.push(df);
            x++;
            //if (x > 5) return; //only show first 5 fields if no displayfields
        }
    };
    
    /*
     * Constructor function
     * @returns {undefined}
     */
    $scope.constructor = function(){
        
        $scope.$emit('LOAD');
        if ($location.path().indexOf('viewdetail') > -1)
            $scope.buildDetail();
        else if ($location.path().indexOf('drilldown') > -1)
            $scope.buildDrilldown();
        else
            $scope.buildForm();
    };

    $scope.constructor();
});
