
//var coreApp = angular.module("coreApp",["ngRoute","ngResource","ngTouch","mgcrea.ngStrap","ngSanitize","ngAnimate","ngMap","daypilot","chart.js","ui.bootstrap","mwl.calendar","textAngular"]) //,,
var coreApp = angular.module("coreApp",["ngRoute","ngResource","mgcrea.ngStrap","ngSanitize","ngAnimate","daypilot","chart.js","ui.bootstrap","mwl.calendar","textAngular","ngCsv"])

.config(function ($routeProvider,$httpProvider) {
    $routeProvider.when("/sync", {templateUrl:"js/core/view/sync.html"});
    $routeProvider.when("/profile", {templateUrl:"js/core/view/profile.html"});
    //$routeProvider.when("/sync", {templateUrl:"js/core/view/login.html"});
    $routeProvider.when("/menu", {templateUrl:"js/core/view/welcome.html"});
    $routeProvider.when("/welcome", {templateUrl:"js/core/view/welcome.html"});
    $routeProvider.when("/logout", {templateUrl:"js/core/view/logout.html"});
    $routeProvider.when("/view/:formid", {templateUrl:"js/core/view/view.html"});
    $routeProvider.when("/view/:formid/:key", {templateUrl:"js/core/view/view.html"});
    $routeProvider.when("/drilldown/:formid/:index", {templateUrl:"js/core/view/view.html"});
    $routeProvider.when("/viewdetail/:formid/:index", {templateUrl:"js/core/view/view.html"});
    $routeProvider.when("/choicetree/:id/:table", {templateUrl:"js/core/view/choiceTree.html"});
    $routeProvider.when("/choicetree/:id/:table/:parentid", {templateUrl:"js/core/view/choiceTree.html"});
    $routeProvider.when("/admin", {templateUrl:"js/core/view/admin/adminmenu.html"});
    $routeProvider.when("/options", {templateUrl:"js/core/view/admin/options.html"});
    $routeProvider.when("/options/:mode/:id", {templateUrl:"js/core/view/admin/options.html"});
    $routeProvider.when('/users/',{templateUrl : "js/core/view/admin/users.html"});
    $routeProvider.when('/users/:mode/:id',{templateUrl : "js/core/view/admin/users.html"});
    $routeProvider.when('/userexit/',{templateUrl : "js/core/view/admin/userexit.html"});
    $routeProvider.when('/userexit/:mode/:id',{templateUrl : "js/core/view/admin/userexit.html"});
    $routeProvider.when('/prodedit/',{templateUrl : "js/core/view/admin/prodedit.html"});
    $routeProvider.when('/prodedit/:mode/:id',{templateUrl : "js/core/view/admin/prodedit.html"});
    $routeProvider.when('/tree/',{templateUrl : "js/core/view/admin/tree.html"});
    $routeProvider.when('/tree/:mode/:id',{templateUrl : "js/core/view/admin/tree.html"});
    $routeProvider.when('/prodcat',{templateUrl : "js/core/view/admin/prodcat.html"});
    $routeProvider.when('/prodcat/:mode',{templateUrl : "js/core/view/admin/prodcat.html"});
    $routeProvider.when('/prodcat/:mode/:id',{templateUrl : "js/core/view/admin/prodcat.html"});
    $routeProvider.when('/discount',{templateUrl : "js/core/view/discount.html"});
    $routeProvider.when('/discount/:mode/:id',{templateUrl : "js/core/view/discount.html"});
    $routeProvider.when('/discount/:mode/:id/:conditionid',{templateUrl : "js/core/view/discount.html"});
    $routeProvider.when('/prices/',{templateUrl : "js/core/view/admin/prodPrices.html"});
    $routeProvider.when('/prices/:pricelist',{templateUrl : "js/core/view/admin/prodPrices.html"});
    $routeProvider.when('/prices/:pricelist/:mode/:id',{templateUrl : "js/core/view/admin/prodPrices.html"});
    $routeProvider.when('/promo',{templateUrl : "js/core/view/admin/promo.html"});
    $routeProvider.when('/promo/:mode/:id',{templateUrl : "js/core/view/admin/promo.html"});
    $routeProvider.when('/dv',{templateUrl : "js/core/view/admin/dv.html"});
    $routeProvider.when('/dv/:mode/:id',{templateUrl : "js/core/view/admin/dv.html"});
    $routeProvider.when('/dv/:mode/:rtattribute/:possiblevalue',{templateUrl : "js/core/view/admin/dv.html"});
    $routeProvider.when('/activitytypes',{templateUrl : "js/core/view/admin/activitytypes.html"});
    $routeProvider.when('/activitytypes/:mode/:id',{templateUrl : "js/core/view/admin/activitytypes.html"});
    $routeProvider.when('/xsl',{templateUrl : "js/core/view/admin/xsl.html"});
    $routeProvider.when('/xsl/:id',{templateUrl : "js/core/view/admin/xsl.html"});
    $routeProvider.when('/xsl/:mode/:id',{templateUrl : "js/core/view/admin/xsl.html"});
    $routeProvider.when('/test',{templateUrl : "js/core/view/test.html"});
    $routeProvider.when('/dayendactivities',{templateUrl : "js/core/view/dayendactivities.html"});
    $routeProvider.when('/dayendactivities/:mode/:id',{templateUrl : "js/core/view/dayendactivities.html"});
    $routeProvider.when('/formtype',{templateUrl : "js/core/view/admin/formtype.html"});
    $routeProvider.when('/formtype/:id',{templateUrl : "js/core/view/admin/formtype.html"});
    $routeProvider.when('/formtype/:mode/:id',{templateUrl : "js/core/view/admin/formtype.html"});
    $routeProvider.when('/injectionadmin',{templateUrl :"js/core/view/admin/injectionadmin.html"});
    $routeProvider.when('/injectionadmin/:id',{templateUrl :"js/core/view/admin/injectionadmin.html"});
    $routeProvider.when('/injectionadmin/:id/:mode',{templateUrl :"js/core/view/admin/injectionadmin.html"});
    $routeProvider.when('/injectionadmin/:id/:mode/:functionId',{templateUrl :"js/core/view/admin/injectionadmin.html"});
    $routeProvider.when('/selectclient/:inspectiontype/:screennum', {templateUrl : "js/core/view/selectClient.html"});
    $routeProvider.when('/scanlicense/:inspectiontype/:screennum', {templateUrl : "js/core/view/selectClient.html"});
    $routeProvider.when('/licensematch/:inspectiontype/:screennum', {templateUrl : "js/core/view/selectClient.html"});

    //Social Routes
    $routeProvider.when("/mycheckins", {templateUrl:"js/core/view/social/myCheckins.html"});
    $routeProvider.when("/mycheckins/:userid", {templateUrl:"js/core/view/social/myCheckins.html"});
    $routeProvider.when("/mycheckins/:mode/:index", {templateUrl:"js/core/view/social/myCheckins.html"});
    $routeProvider.when("/mycheckins/:mode/:index/:userid", {templateUrl:"js/core/view/social/myCheckins.html"});
    $routeProvider.when("/checkin", {templateUrl:"js/core/view/social/groupCheckin.html"});
    $routeProvider.when("/groups/join", {templateUrl:"js/core/view/social/groupJoin.html"});
    $routeProvider.when("/groups/join/:public", {templateUrl:"js/core/view/social/groupJoin.html"});
    $routeProvider.when("/groups", {templateUrl:"js/core/view/social/groups.html"});
    $routeProvider.when("/groups/:id", {templateUrl:"js/core/view/social/groups.html"});
    $routeProvider.when("/groups/:id/:view", {templateUrl:"js/core/view/social/groups.html"});
    $routeProvider.when("/groups/:id/:view/:requests", {templateUrl:"js/core/view/social/groups.html"});
    $routeProvider.when("/groupedit/:id", {templateUrl:"js/core/view/social/groupEdit.html"});
    $routeProvider.when("/groupedit/:id/:refresh", {templateUrl:"js/core/view/social/groupEdit.html"});
    // End Social routes

    //Inject routes
    if (localStorage.getItem("Injection")) {
        var injectors = JSON.parse(localStorage.getItem("Injection"));
        for (var y=0; y < injectors.length; y++){
            var row = injectors[y];
            for (var x=0; x < row.Routes.length; x++){
                $routeProvider.when(row.Routes[x], {controller: 'InjectionCtrl as ctrl',templateUrl: row.ID});   //$routeProvider.when('/test', {controller: 'TestCtrl as test',templateUrl: 'test.html'});
            }
        }
    }

    AppRoutes($routeProvider);
    //:largecode*\
    //$routeProvider.otherwise({templateUrl:"views/welcome.html"});
    $routeProvider.otherwise({templateUrl:"js/core/view/welcome.html"});

    //Reset headers to avoid OPTIONS request (aka preflight)
    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
})
.run(function($location, $templateCache, DaoSvc){
    FastClick.attach(document.body);
    if (!localStorage.getItem('currentUser')) {
        $location.path('/welcome');
    } else {
        // if we do not check did we alredy set value for "Injection"
        // app will throw exception for trying to get injectors.length (in for(var y=0; y < injectors.length;....)) two lines below
        if (localStorage.getItem("Injection")) {
            var injectors = JSON.parse(localStorage.getItem("Injection"));
            for (var y=0; y < injectors.length; y++){
                var row = injectors[y];
                $templateCache.put(row.ID, row.HTML);   //$templateCache.put('test.html', 'Hello {{ test.user.name }}!, we have made FIRE....');
            }
        }
    }
})

.controller("InjectionCtrl",['$scope', '$templateCache', '$location', 'Settings', 'JsonFormSvc', 'GlobalSvc', 'OptionSvc', 'DaoSvc', 'CartSvc', '$alert', '$http', '$routeParams', '$filter', 'UserCodeSvc', '$modal', function ($scope, $templateCache, $location, Settings, JsonFormSvc, GlobalSvc, OptionSvc, DaoSvc, CartSvc, $alert, $http, $routeParams, $filter, UserCodeSvc, $modal){
    function found(injector, $this) {
        try {
            $this.globals = JSON.parse(injector.Globals);
        } catch (err){
            alert('Could not load globals ' + injector.ID + ': ' + err.message);
            return;
        }

        for (var y=0; y < injector.Functions.length; y++){
            try {
                func = JSON.parse(injector.Functions[y]);
                if (func.Parameters !== "") {
                    var params = func.Parameters ? func.Parameters.split(",") : [];
                    switch (params.length){
                        case 1:
                            $this[func.Name] = new Function(params[0], injector.FunctionsCode[y]);
                            break;
                        case 2:
                            $this[func.Name] = new Function(params[0],params[1], injector.FunctionsCode[y]);
                            break;
                        case 3:
                            $this[func.Name] = new Function(params[0],params[1],params[2], injector.FunctionsCode[y]);
                            break;
                        case 4:
                            $this[func.Name] = new Function(params[0],params[1],params[2],params[3], injector.FunctionsCode[y]);
                            break;
                        default:
                            $this[func.Name] = new Function(injector.FunctionsCode[y]);
                            break;
                    }
                } else {
                    $this[func.Name] = new Function(injector.FunctionsCode[y]);
                }
            } catch (err){
                alert('Could not load function' + y + ': ' + err.message);
            }
        }

        try {
            if ($this.constructor) $this.constructor();
        } catch (err){
            alert('Error running the constructor: ' + err.message);
        }
    }

    try {
        var injectors = JSON.parse(localStorage.getItem("Injection"));
        var finish = false;
        for (var y=0; y < injectors.length; y++){
            for (var x = 0; x < injectors[y].Routes.length; ++x) {
                if (injectors[y].Routes[x] === $location.path()) {
                    this.Settings = Settings;
                    this.JsonFormSvc = JsonFormSvc;
                    this.$scope = $scope;
                    this.$location = $location;
                    this.GlobalSvc = GlobalSvc;
                    this.OptionSvc = OptionSvc;
                    this.DaoSvc = DaoSvc;
                    this.CartSvc = CartSvc;
                    this.$alert = $alert;
                    this.$http = $http;
                    this.$routeParams = $routeParams;
                    this.$filter = $filter;
                    this.UserCodeSvc = UserCodeSvc;
                    this.$modal = $modal;
                    found(injectors[y], this);
                    finish = true;
                    break;
                }
            }
            if (finish) break;
        }
    } catch (err){
        alert(err.message);
    }
}])

.factory("GlobalSvc", function(Settings, $location, DaoSvc,$alert, OptionSvc, UserCodeSvc){
    return {
        url: function(){
          return Settings.url; //'http://www.dedicatedsolutions.co.za:8082/rest2/';
          //'http://54.206.28.119:8081/Rest/index.php/';//"http://app1.rapidtrade.biz/rest/";
        },
        resturl: function(){
          return Settings.url; //'http://www.dedicatedsolutions.co.za:8082/rest2/';
          //'http://54.206.28.119:8081/Rest/index.php/';//"http://app1.rapidtrade.biz/rest/";
        },
        hasUser: function(){
            if (localStorage.getItem('currentUser'))
                return true;
            else
                return false;
        },
        getUser: function(){
            if (localStorage.getItem('currentUser')) {
                var obj = JSON.parse(localStorage.getItem('currentUser'));
                if (obj.IsAdmin === '1') obj.IsAdmin = true;
                if (obj.IsAdmin === '0') obj.IsAdmin = false;
                return obj;
            } else
                return { UserID: "", Password: ""};
        },
        busy: function(show) {

        },
        alert: function(msg) {
            alert(msg);
        },
        isOnline: function(showAlert) {
        	showAlert = (showAlert !== undefined) ? showAlert : true;

//            if (g_deviceVersion !== undefined) {
//                var networkState = navigator.network.connection.type;
//
//                var states = {};
//                states[Connection.UNKNOWN]  = false; //'Unknown connection';
//                states[Connection.ETHERNET] = true;  //'Ethernet connection';
//                states[Connection.WIFI]     = true;  //'WiFi connection';
//                states[Connection.CELL_2G]  = true;  //'Cell 2G connection';
//                states[Connection.CELL_3G]  = true;  //'Cell 3G connection';
//                states[Connection.CELL_4G]  = true;  //'Cell 4G connection';
//                states[Connection.CELL]     = true;  //'Cell generic connection';
//                states[Connection.NONE]     = false; //'No network connection';
//
//                if (!states[networkState] && showAlert)
//                    g_alert('This feature is disabled in the offline mode.');
//
//                return states[networkState];
//            } else {
                if (!navigator.onLine && showAlert)
                    g_alert('This feature is disabled in the offline mode.');

                return navigator.onLine;
//            }
        },
        getmenu: function(){
           return [
            {name : "Scope",
                children: [{
                    name : "Grandchild12",
                    children: []
                    },{
                    name : "Grandchild2",
                        children: []
                    },{
                    name : "Grandchild3",
                    children: []
                }]
            }, {
                name: "Deliveries",
                children: []
            }];
        },
        toDate: function(strdate){
            try {
                //return strdate.replace(' 00:00:00','')
                var newDate;
                if (strdate.indexOf("/Date(") > -1) {
                    var substringedDate = strdate.substring(6);
                    var parsedIntDate = parseInt(substringedDate.replace(')/',''));
                    newDate = new Date(parsedIntDate);
                } else {
                    newDate = new Date(strdate.replace(' 00:00:00',''));
                }
                return newDate.toLocaleDateString();
            } catch (err){
                return err.message;
            }
        },
        toDateString: function(date){
            var str = date.getFullYear() + '-' + this.setLeadingZero(date.getMonth()+1) + '-' + this.setLeadingZero(date.getDate());
            return str;
        },
        toMiliString: function(strdate){
            try {
                var dte = new Date(strdate);
                var timezoneoffset = dte.getTimezoneOffset() * 60000; //get timezone offset
                var mili = '/Date(' + dte.getTime() + timezoneoffset  + ')/';
                return mili;
            } catch (err){
                return strdate;
            }

        },
        getDate: function(){
            var date = new Date();
            return date.getFullYear() + "-" +
                this.setLeadingZero((date.getMonth() + 1)) + "-" +
                this.setLeadingZero(date.getDate()) + "T" +
                this.setLeadingZero(date.getHours()) + ":"  +
                this.setLeadingZero(date.getMinutes()) + ":00";
        },
        getGUID: function(){
            var date = new Date();
            var onejan = new Date(date.getFullYear(), 0, 1);
            var yy = date.getFullYear().toString().slice(2);
            var JJJ = this.getJulianDay();
            var dd = this.setLeadingZero(date.getDate());
            var hh = this.setLeadingZero(date.getHours());
            var mm = this.setLeadingZero(date.getMinutes());
            var ss = this.setLeadingZero(date.getSeconds());
            var rr = this.setLeadingZero(Math.floor(Math.random()*100));
            return yy+JJJ+dd+hh+mm+ss+rr;
        },
        /*
         * Pass in a URL such as /funcloc/<id> and this will return the ID portion.
         * Use this to aid with allowing the back button
         * @param {type} view
         * @returns {String}
         */
        geturlid: function(view){
            try {
                var path = $location.path().replace('/' + view,'');
                var idx = path.lastIndexOf('/');
                return (idx === -1) ? '' : path.substring(idx + 1);
            } catch (err) {
                return '';
            }
        },
        setLeadingZero: function (number) {
            return number < 10 ? '0' + number : number;
        },
        getJulianDay: function(){
            var date = new Date();
            var onejan = new Date(date.getFullYear(), 0, 1);
            var JJJ = (Math.ceil((date - onejan) / 86400000)).toString();
            while (JJJ.length < 3)
                JJJ = '0' + JJJ;
            return JJJ;
        },
        getTodaysDate : function(){
            var date = new Date();
            var today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
            return today;
        },
        getSplitDate : function(date){
            date = date.split('.')[0];
            var splitDate = date.split(" ");
            var DateFormatArray = splitDate[0].split("-");
            var TimeFormatArray = splitDate[1].split(":");
            var dateObj = {};
            //parseInt(DateFormatArray[1]),DateFormatArray[2],DateFormatArray[0],TimeFormatArray[0],TimeFormatArray[1],TimeFormatArray[2]
            dateObj.yyyy = parseInt(DateFormatArray[0]);
            dateObj.mm = parseInt(DateFormatArray[1]);
            dateObj.dd = parseInt(DateFormatArray[2]);
            dateObj.hours = parseInt(TimeFormatArray[0]);
            dateObj.minutes = parseInt(TimeFormatArray[1]);
            dateObj.seconds = parseInt(TimeFormatArray[2]);
            return dateObj;
        },
        parseDate : function(date){
            date = date.split('.')[0];
            var splitDate = date.split(" ");
            var DateFormatArray = splitDate[0].split("-");
            var TimeFormatArray = splitDate[1].split(":");
            var dateObj = {};
            //parseInt(DateFormatArray[1]),DateFormatArray[2],DateFormatArray[0],TimeFormatArray[0],TimeFormatArray[1],TimeFormatArray[2]
            dateObj.yyyy = parseInt(DateFormatArray[0]);
            dateObj.mm = parseInt(DateFormatArray[1]);
            dateObj.dd = parseInt(DateFormatArray[2]);
            dateObj.hours = parseInt(TimeFormatArray[0]);
            dateObj.minutes = parseInt(TimeFormatArray[1]);
            dateObj.seconds = parseInt(TimeFormatArray[2]);
            var dte = new Date(dateObj.yyyy, dateObj.mm - 1, dateObj.dd, dateObj.hours, dateObj.minutes, dateObj.seconds);
            return dte;
        },
        sanitiseData: function(json){
            if (!angular.isArray(json)) return json;

            for (var x=0; x < json.length; x++){
                var item = json[x];
                delete item.key;
                delete item.$$hashKey;
            }
            console.log(json);
            return json;
        },
        /*
         * Post data back to server
         */
        postData: function(url,data, onSuccess, onError, table, method, fromSync,forcephp){
            if (fromSync === undefined) fromSync = false;
            for (var prop in data){
                if (angular.isString(data[prop])){
                    //data[prop] = data[prop].replace('&','&amp;');
                    //data[prop] = data[prop].replace('/','&#47;');
                }
                if (angular.isDate(data[prop])){
                    var mydate = data[prop];
                    var tz = data[prop].getTimezoneOffset() * -1;
                    var twentyMinutesLater = new Date(mydate.getTime() + (tz * 60 * 1000));
                    data[prop] = twentyMinutesLater;
                    //alert('hello');
                }
            }

            //Save in case of error posting due to no internet
            unPostedData.Table = table;
            unPostedData.Method = method;
            unPostedData.json = data;
            unPostedData.url = url;
            unPostedData.onError = onError;
            unPostedData.onSuccess = onSuccess;
            unPostedData.key = this.getGUID();

            //Below is if using post.aspx, then add table/method
            var ispostaspx = (url.toLowerCase().indexOf('post') !== -1) ? true : false;
            if (forcephp === undefined) forcephp = false;

            if ((!Settings.phpServer || ispostaspx) && !forcephp) {
                if (!ispostaspx) url = Settings.url + 'post/post.aspx';
                var obj = {};
                obj.Table = table;
                obj.Method = method;
                obj.json = JSON.stringify(unPostedData.json); //stringify the json for post.aspx
                data = $.param(obj);
                data = JSON.stringify(data);
                //annoyingly we suround the data with an extra "", so get rid
                data = data.replace('"',''); //get rid of first "
                data = data.substr(0,data.length-1); //get rid of last "
                console.log(obj);
            } else {
                data = JSON.stringify(data);
                //data = data.replace(/%/g,'');
            }

            var $this = this;
            $.ajax({
                type : 'POST',
                data : data,
                datatype : 'json',
                url : url,
                crossDomain: true,
                timeout: parseInt(OptionSvc.getText('AjaxTimeout', 30000)),
                success : onSuccess,
                error : function(jXh,exception){
                   if (exception === 'timeout')  $alert({ content: "Connection timeout!: Data saved locally, please sync as soon as possible as you appear to be offline", duration: 6, placement: 'top-right', type: 'warning', show: true});
                    setTimeout(function() {
                        (fromSync) ? onError() : $this.postOnError();
                    }, 6000)
                }
            });
        },
        /*
         * Called after saving offling fo
         */
        postOnError: function(err1, err2, err3){
            DaoSvc.put(unPostedData,
                'Unsent',
                unPostedData.key,
                function() {
                    var data = {};
                    data.status = true;
                    data.offline = true;
                    unPostedData.onError(data);
                },
                function(tx, e){
                    Alert = 'Major Error saving local unsent item failed, please try again, please note that your change will not be sent to the server';
                    //unPostedData.onError(data);
                });
        },

        /*
         * Replaces parameters in a url, either with global values
         * or with values form the object
         */
        setParamaters: function (url, obj){
            if (obj){
                for (var prop in obj) {
                    url = url.replace(':' + prop,obj[prop]);
                }
            }
            url = url.replace(':UserID',this.getUser().UserID);
            url = url.replace(':SupplierID',this.getUser().SupplierID);
            url = url.replace(':AccountID',this.getUser().RepID);
            return url;
        },

        findIndex: function (array, property, value){
            if (array===undefined) return -1;
            for (var x=0; x < array.length; x++){
                if (array[x][property] === value){
                    return x;
                }
            }
            return -1;
        },
        postImage: function (SupplierID, ID, input, onComplete, onError) {
            if (input.files && input.files[0]) {
                if (Settings.isPhoneGap) {
                    var image = {};
                    image.Id = ID;
                    image.SupplierID = SupplierID;
                    image.FileData = input.files[0];
                    image.Type = 'image/jpeg;base64';
                    image.Name = image.Id + '.jpg';

                    var url = Settings.url + '/PostImage';
                    $.ajax({
                           type: 'POST',
                           data: JSON.stringify(image), //jQuery.param(image),
                           url: url,
                           success: onComplete,
                           error: onError
                    });

                } else {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var image = {};
                        image.Id = ID;
                        image.SupplierID = SupplierID;
                        image.FileData = e.target.result.substring(e.target.result.indexOf(',')+1);
                        image.Type = e.target.result.substring(5,e.target.result.indexOf(','));
                        image.Name = image.Id + (image.Type.indexOf('jpeg')> 1 ? '.jpg' : '.png');

                        var url = Settings.url + '/PostImage';
                        $.ajax({
                               type: 'POST',
                               data: JSON.stringify(image), //jQuery.param(image),
                               url: url,
                               success: onComplete,
                               error: onError
                        });
                    };
                    reader.readAsDataURL(input.files[0]);
                }
            }
        },

        getGPS : function (onSuccess,onError){
            var options = {
                enableHighAccuracy: true,
                timeout: 50000,
                maximumAge: 0
            };
            var getPosition = function (position){
                if(onSuccess){
                    onSuccess(position);
                }
            };
            var error = function(error){
                if(onError){
                    console.warn(error);
                    onError(error);
                }
            };
            if(navigator.geolocation){
                navigator.geolocation.getCurrentPosition(getPosition, error, options);
            }else{
                $alert({ content: "This item cannot be saved without capturing your current location. Please ensure your location settings are enabled", duration: 5, placement: 'top-right', type: 'danger', show: true});
            }
        },
        getCurrentWeekInCycle : function(date){
            var code = UserCodeSvc.getCode('GetCurrentWeekInCycle.Calculate');
            if (code) {
                var userExit = new Function('date', 'user', code);
                var weekInCycle = userExit(date, this.getUser());
                return weekInCycle;
            } else if (!OptionSvc.getBoolean('RollingCallCycle', true)) {
                prefixes = [1,2,3,4,5];
                return prefixes[0 | moment(date).date() / 7]
            } else {
                var numWeeks = this.getNumberWeeksInCycle();
        		var now = moment(date);
        		var weekoy = now.week();
        		var cycle = Math.floor(weekoy / numWeeks);
        		var weekInCycle = weekoy - (cycle * numWeeks);
        		return weekInCycle ? weekInCycle : numWeeks;
            }
    	},
        getNumberWeeksInCycle : function(){
            if (OptionSvc.getBoolean('RollingCallCycle',true)) return parseInt(OptionSvc.getText('WeeksInCallCycle',4));
            return 5;
    	}
    };
});
var unPostedData = {};
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

angular.module('coreApp').directive('focus',
    function($timeout) {
      return {
          scope : {
          trigger : '@focus'
     },
     link : function(scope, element) {
      scope.$watch('trigger', function(value) {
        if (value === "true") {
          $timeout(function() {
           element[0].focus();
          });
       }
     });
     }
    };
});
