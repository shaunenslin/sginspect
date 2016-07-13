//var daoSvc = (function(){
coreApp.service("JsonFormSvc", function(Settings, $http, DaoSvc, GlobalSvc, $location){
    this.session = {
        id: '',
        formid: '',
        type: '',
        currentTree:  {},
        json: {},
        jsonArray: new Array(),
        jsonObj: {},
        displayfields: new Array(),
        settings: {},
        errorMsg: undefined
    };

    this.fetchhttp = function( $scope) {
        var $this = this;
        $http({method: 'GET', url: $scope.session.settings.url})
            .success(function(json, status, headers, config) {
                $scope.session.json = json;
                $this.fetchDisplayFields($scope);
            })
            .error(function(data, status, headers, config) {
                $scope.session.errorMsg = 'Issue.';
            });
    };

    /*
     * Fetch displayfields, then set session.jsonarray or session.jsonobj
     * @returns {undefined}
     */
    this.fetchDisplayFields = function($scope){
        var $this = this;
        $scope.session.displayfields = [];
        DaoSvc.openDB();
        DaoSvc.indexsorted('DisplayFields',$scope.session.settings.id,'index1','index2',
            function(json){
                $scope.session.displayfields.push(json);
            },
            function(err){
                try {
                    var obj = ($scope.session.json instanceof Array) ? $scope.session.json[0]: $scope.session.json;
                    $scope.session.displayfields = new Array();
                    $this.addDisplayFields($scope, obj);
                    //$scope.session.jsonArray = $scope.session.json;
                } catch (err){
                    alert(err.message);
                }
            },
            function(){
                //set etiher table or Obj depending on if form or table
                if ($scope.session.settings.type==='table')
                    $scope.session.jsonArray = $scope.session.json;
                else
                    $scope.session.jsonObj = $scope.session.json;
                sessionStorage.setItem($scope.session.cacheid,JSON.stringify($scope.session));
                $scope.$apply(); //force update of scope as we insice async methods
            });
    };

    /*
     *
     * @param {type} $scope
     * @param {type} cacheid        eg. 'details'
     * @param {type} formid         id of display fields
     * @param {type} backbutton     true/false
     * @param {type} isAdmin        true/false
     * @param {type} mode           'edit' or 'view'
     * @param {type} type           'form' or 'edit'
     * @param {type} url            a url to fetch data from or undefined
     * @param {type} json           json or undefined
     */
    this.buildForm = function($scope, jsoncacheid, formid, backbutton, isAdmin, mode, type, url, json,drilldownid ) {
        $scope.session = this.session;
        $scope.session.cacheid =  formid + 'cache'; //cacheid;
        $scope.session.settings = {};
        $scope.session.settings.type = type;
        $scope.session.formid = formid;

        $scope.session.settings.cacheid = formid + 'cache'; //cacheid;
        $scope.session.settings.id = formid;
        $scope.session.settings.formid = $scope.session.formid;
        $scope.session.settings.url = url;
        $scope.session.settings.isAdmin = GlobalSvc.getUser().IsAdmin;
        $scope.session.settings.backbutton = backbutton;
        $scope.session.settings.isAdmin = isAdmin;
        $scope.session.settings.mode = mode;
        $scope.session.settings.jsoncacheid = jsoncacheid;  //used to store json object if needed
        $scope.session.settings.drilldownid = drilldownid;
        if ($scope.session.settings.url)
            this.fetchhttp($scope);
        else {
            $scope.session.json = json;
            this.fetchDisplayFields($scope);
        }
    };

    /*
     * Build the detail view which is called from either JSON table or Listview
     * @returns {undefined}
     */
    this.buildDetail = function($scope){

        //build a new session object based on previous session
        var prevSession = JSON.parse(sessionStorage.getItem(sessionStorage.getItem('CurrentFormCacheID'))); //formid.replace('Det','') + 'cache'));
        var newID = (prevSession.settings.detailID) ? prevSession.settings.detailID : prevSession.settings.id + 'Det';

        //Get the json Object
        if (rowidx==='new')
            $scope.session.json = $scope.newObject(prevSession.jsonArray,prevSession.displayfields);
        else
            $scope.session.json = prevSession.jsonArray[parseInt(rowidx)];

        //build new settings object
        $scope.session.settings = {heading: prevSession.settings.heading,
            id: newID,
            type: 'form',
            mode: prevSession.settings.mode};

        $scope.fetchDisplayFields($scope);
    };

    /*
     * Add display fields from an object.
     * Where displayfields do already exist, only add fields that dont already exist
     * @param {type} obj - the object used to get displayfields from
     * @param {type} newlist - true if not existing displayfields
     * @returns {undefined}
     */
    this.addDisplayFields = function($scope, obj){
        var x = 0;
        for (var prop in obj) {
            //check if this display field already already exists in $scope.displayfields
            var foundarray = $scope.session.displayfields.filter(function(v) { return v.name === prop;});
            if (foundarray.length > 0) continue;

            //build new Displayfield
            var df = {};
            df.SupplierID = GlobalSvc.getUser().SupplierID;
            df.ID = $scope.session.settings.id;
            df.Name = prop;
            df.Visible = true; //if building brand new list, then default first 5 fields to visible
            df.ReadOnly = false;
            df.Label = '';
            df.DefaultData = '';
            df.Type = 'Text';
            df.Length = 0;
            df.SortOrder = x;
            df.AdminOnly = false;
            df.RoleOnly = '';//false;
            df.Mandatory = false;
            df.TemplateRow = '';
            df.TemplateColumn = '';
            $scope.session.displayfields.push(df);
            x++;
            //if (x > 5) return; //only show first 5 fields if no displayfields
        }
    };

    this.toChoiceTree = function(cacheid, json, table, code, description, multiselect){
        var defaultdata = {};
        defaultdata.table = table;
        defaultdata.code = code;
        defaultdata.description = description;
        defaultdata.multiselect = multiselect;

        sessionStorage.setItem(cacheid,JSON.stringify(json));  //save json object to cache
        sessionStorage.setItem('choiceTreeReturnPath',$location.path());            //path back to where we are
        sessionStorage.setItem('choiceTreeDefaultData', JSON.stringify(defaultdata));                 //allow multi select
        sessionStorage.setItem('choiceTreeCacheID', cacheid);        //be used by choicetree to pick up json object, so that field can be updated
        $location.path('choicetree/' + code + '/' + table );

    };

});
