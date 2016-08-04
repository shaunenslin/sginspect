coreApp.directive("jsonlist", function(GlobalSvc, $http, $route, DaoSvc, Settings, $location,UserCodeSvc) {
    DaoSvc.openDB();
    var JsonArr = [];
    var Scope;
    var Field;

    return {
        restrict: "E",
        template:
        '<div ng-hide="showsettings">' +
        '    <button ng-click="settingClicked()" ng-hide="settings.isAdmin===false"   id="settingBtn"    class="btn btn-primary" style="margin:3px;"><span class="glyphicon glyphicon-cog"></span> Settings</button>' +
        '    <ul class="list-group">' +
        '    <li class="list-group-item" ng-repeat="row in fields" ng-if="row.Visible" style="color:black;">' +
        '       <div class="row">' +
        '         <div class="col-xs-4 col-sm-4" ng-if="row.Type !== \'Link\'"><b>{{row.Label ? row.Label : row.Name}}:</b></div>' +
        '         <div class="col-xs-8 col-sm-8" style=" text-align: right" ng-if="row.Type !== \'Currency\' && row.Type !== \'Link\' && row.Type !== \'DatePicker\' && row.Type !== \'Date\'">{{json[row.Name]}}</div>' +
        '         <div class="col-xs-10 col-sm-8" style=" text-align: right" ng-if="row.Type === \'Currency\'">{{json[row.Name] | currency:currencyCode}}</div>' +
        '         <a class="col-xs-10 col-sm-8  btn btn-primary btn-block" ng-href="{{product[row.Name]}}" ng-if="row.Type === \'Link\'" target="blank"><b>{{row.Label}}</b></a>' +
        '         <div class="col-xs-6 col-sm-6 pull-right" ng-if="row.Type===\'DatePicker\' || row.Type===\'Date\'" >' +
        '            <input type="text" ng-model="json[row.Name]" date-format="longDate" data-autoclose="1" placeholder="Date" use-native="true" bs-datepicker class="form-control" />' +
        '         </div>' +
        '       </div>' +
        '     </li>' +
        '   </ul>' +
        '</div>' +
        '<jsonfields fields="fields" ></jsonfields>',
        scope: {
            fields: '=',
            json: '=',
            settings: '=',
            formid: '=',
            savefunction: '=',
            inline: '=',
            validation : '='
        },
        //link: function(scope, element, attrs) {
        link: {
            //return {
            pre: function preLink(scope, iElement, iAttrs, controller) {
                scope.showsettings = false;
                scope.asyncRslt = new Array;
                scope.format = 'yyyy-MM-dd';
                scope.showtree = false;
                scope.isAdmin = (GlobalSvc.getUser().IsAdmin===true || GlobalSvc.getUser().IsAdmin===1);


            },
            post: function postLink(scope, iElement, iAttrs, controller) {
                scope.formatDate = function(strdate){
                    try {
                        return strdate.replace(' 00:00:00','')
                        //var newDate = new Date(strdate.replace(' 00:00:00',''));
                        //return newDate.toDateString();
                    } catch (err){
                        return new Date().toDateString();
                    }
                };

                scope.getTypeahead = function(val,id){
                    //console.log(val + ":" + id);
                    //Get correct URL
                    var myEl = angular.element( document.querySelector( '#' + id  ) );
                    //get from http
                    //if (myEl[0].indexOf('http') !== -1) {
                    var url = myEl[0].attributes['url'].value;
                    url = url.replace(/:q/g,'\''); //replace all :q with a single quote
                    url = url.replace(/:p/g,'%');  //replace all :p with percentage sign
                    url = url.replace(/:Value/g,val);
                    url = GlobalSvc.resturl() + url;

                    $http({method: 'GET', url: url})
                    .then(function(data) {
                        return data.data;
                    })
                    .error(function(data, status, headers, config) {
                        console.log('issue');
                    });
                    //} else {

                    //}
                };

                /*
                 * For
                 * @param {type} $event
                 * @returns {undefined}
                 */
                scope.minDate =  new Date();
                scope.format = 'dd-MMMM-yyyy';
                scope.open = function($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    scope.opened = true;
                };

                scope.dateOptions = {
                    formatYear: 'yy',
                    startingDay: 1
                };

                scope.backClicked = function(){
                    window.history.back();
                };

                scope.settingClicked = function(){
                    scope.showsettings = true;
                    //scope.$apply();
                };

                scope.deleteClicked = function(){
                    deleteObject(scope);
                };

                scope.saveClicked = function(){
                    saveObject(scope);
                };

                scope.choicetreeClicked = function(idx){
                    var field = scope.fields[idx];
                    var obj = {};
                    try {
                        obj = JSON.parse(field.DefaultData);
                    } catch (err){
                        alert('defaultData needs to be {"table":"Functlocations","path":"notification"}');
                        return;
                    }
                    sessionStorage.setItem(scope.settings.jsoncacheid,JSON.stringify(scope.json));  //save json object to cache
                    sessionStorage.setItem('choiceTreeReturnPath',$location.path());            //path back to where we are
                    sessionStorage.setItem('choiceTreeDefaultData', JSON.stringify(obj));                 //allow multi select
                    sessionStorage.setItem('choiceTreeCacheID', scope.settings.jsoncacheid);        //be used by choicetree to pick up json object, so that field can be updated
                    $location.path('choicetree/' + field.Name + '/' + obj.table );
                };

                scope.treeClearedClicked = function(idx){
                    var field = scope.fields[idx];
                    scope.json[field.Name] = '';
                };


            }
            //};
        }
    };
});

coreApp.directive("jsonform", function(GlobalSvc, $http, $route, DaoSvc, Settings, $location,UserCodeSvc) {
    DaoSvc.openDB();
    var JsonArr = [];
    var Scope;
    var Field;
    var localOnComplete;

    function recurseDisplayFields(x, scope){
    	if (x > scope.fields.length) return;
    	var field = scope.fields[x];
    	scope.nextx = x + 1;
        if (!field) return;
        if (!field.Type) return;
        if (field.Type !== 'ListboxAsync' && field.Type !== 'Checkbox')
            recurseDisplayFields(scope.nextx, scope);
        //Create an array and fill via name of field rather than index
        if (field.Type === 'Checkbox'){
            try {
                //scope.fields[x].DefaultData  = JSON.parse(field.DefaultData);
                field.DefaultData  = JSON.parse(field.DefaultData);
                recurseDisplayFields(scope.nextx, scope);
            } catch (err) {
            	console.log("JsonFormDir.watch  - something could be wrong: " + err.message);
            	recurseDisplayFields(scope.nextx, scope);
            }
        } else {
            if (!scope.asyncRslt) scope.asyncRslt = new Array;
            scope.asyncRslt[field.Name] = new Array;

            var defaultData = {};
            try {
                defaultData = JSON.parse(field.DefaultData);
                if (defaultData.type === 'local') {
                    fetchLocal(field, defaultData, scope); //this may need to be done on ftchhttp below as well - SE
                } else {
                    var url = "table=" + defaultData.table + "&code="+ defaultData.Code + "&description=" + defaultData.Description + "&params=" + defaultData.Params; //myEl[0].attributes['url'].value;
                    url = url.replace(/:q/g, '\''); //replace all :q with a single quote
                    url = url.replace(/:p/g, '%');  //replace all :p with percentage sign
                    url = GlobalSvc.resturl() + 'GetCodeDescription?' + url;
                    fetchhttp(field, url, scope);
                    recurseDisplayFields(scope.nextx, scope);
                }
            } catch (err) {
            	//funny enough, ignore these errors for fetchlocal()
            	//console.log("JsonFormDir.watch  - something could be wrong: " + err.message);
            	//recurseDisplayFields(scope.nextx, scope);
            }
        }
    }

    function fetchhttp (field, url, scope){
        $http({method: 'GET', url: url})
            .success(function(json, status, headers, config) {
                scope.asyncRslt[field.Name] = json;
                scope.$apply();
            })
            .error(function(data, status, headers, config) {
                console.log('issue');
            });
    }

    function fetchLocal(field, defaultData, scope){
        try {
            Scope = scope;
            Field = field;
            JsonArr = [];
            if (defaultData.Index1)
                DaoSvc.index(defaultData.table,scope.json[defaultData.Index1],'index1',fetchLocalSuccess, undefined, fetchLocalComplete);
            else
                DaoSvc.cursor(defaultData.table,fetchLocalSuccess, undefined, fetchLocalComplete);
        } catch (err) {
            console.log("JsonFormDir.fetchLocal  - something could be wrong: " + err.message);
        }
    }
    function fetchLocalSuccess(json){
        var PushArr = {};
        var defaultdata = JSON.parse(Field.DefaultData);

        // we are checking if [Code] or [Description] fields are empty or undefined. (Skip them if they are)
        if (json[defaultdata.Code] === null || json[defaultdata.Code] === undefined || json[defaultdata.Code] === '' ||
            json[defaultdata.Description] === null || json[defaultdata.Description] === undefined || json[defaultdata.Description] === '') return;

        //check for contains in any string in the row for an additional check that may be needed before loading the lisbox
        if (defaultdata.Contains)
            if (JSON.stringify(json).toLowerCase().indexOf(defaultdata.Contains.toLowerCase()) === -1 ) return;
        PushArr.Code = json[defaultdata.Code];
        PushArr.Description = json[defaultdata.Description] ;
        JsonArr.push(PushArr);
        console.log(json);
    }

    function fetchLocalComplete(){
        Scope.asyncRslt[Field.Name] = JsonArr;
        Scope.$apply();
        recurseDisplayFields(Scope.nextx, Scope);
    }


    function RemoveLocalItem(){
        var ViewId = sessionStorage.CurrentFormCacheID;
        sessionStorage.removeItem(ViewId);
        //alert(ViewId);
    }

    function saveObject(scope){
        //If we have a save function, then call that and exit
        if (scope.savefunction){
            scope.savefunction(scope.json);
            return;
        }

        //Else, save as per TREE below
        //** Get the current tree so we know which table to save back to
        var key = GlobalSvc.getUser().SupplierID + sessionStorage.getItem('CurrentFormID');
        DaoSvc.get(
            'tree',
            key,
            function(treeJson){
                var  data = GlobalSvc.sanitiseData(scope.json);
                if (data === undefined) data = scope.json;
                RemoveLocalItem();
                var CurrentRoute = $route.current.params;
                //*** replace all ' with '' -this may not be needed with post.aspx, lets see
                var data = JSON.parse(JSON.stringify(scope.json).replace(/'/g,'\'\''));

                //Check for alias fields
                if (treeJson.tags){
                    var alias = JSON.parse(treeJson.tags);
                    console.log(alias);
                    angular.forEach(alias,function(aliasVal,aliasKey){
                        console.log(aliasKey);
                        angular.forEach(data,function(dataVal,dataKey){
                            if(dataKey === aliasKey){
                                data[aliasVal] = dataVal;
                                delete data[dataKey];
                            }
                        });
                    });
                }

                //Check for date fields and convert from GMT
                var type = CurrentRoute.index === 'new' ? 'insert' : 'update';
                var url = GlobalSvc.resturl() + 'View/ModifyAll?table=' + treeJson.tables + '&type=' + type;
                console.log(url);

                GlobalSvc.postData(url,
                    data,
                    function(){
                        alert('Saved...');
                        window.history.back();
                    },
                    function(err){
                        alert('Error Saving: ' + err.responseText);
                    }
                );
            },
            function(err){
                alert('Error getting tree in jsonform');
            });
    }

    function deleteObject(scope){
        RemoveLocalItem();
        var type = 'delete';
        var tbl = JSON.parse(localStorage.getItem("currentTree"));
        var data = scope.json;

        var url = GlobalSvc.resturl() + 'View/ModifyAll?table=' + tbl.tables + '&type=' + type;

        GlobalSvc.postData(url,
            data,
            function(){
                alert('Deleted');
                window.history.back();
            },
            function(){
                alert('Error Deleting Record');
            }
        );
    }

    return {
        restrict: "E",
        template:
        '<div ng-hide="showsettings">' +
        '<form name="jsonForm" role="form" ng-class="validateForm() ? \'\ \'\ : \'\ \'\" >' +
        '   <button ng-click="backClicked()"    ng-show="settings.backbutton===true" id="backBtn"       class="btn btn-primary" style="margin:3px;"><span class="glyphicon glyphicon-chevron-left"></span> Back</button>' +
        '   <button ng-click="settingClicked()" ng-hide="settings.isAdmin===false"   id="settingBtn"    class="btn btn-primary" style="margin:3px;"><span class="glyphicon glyphicon-cog"></span> Settings</button>' +
        '   <button ng-click="saveClicked()"    ng-hide="settings.mode!==\'edit\' && settings.mode!==\'save\'"   id="saveformBtn"   class="btn btn-success" style="margin:3px;" type="submit" ng-disabled="jsonForm.$invalid"><span class="glyphicon glyphicon-floppy-disk"></span> Save</button></span>' +
        '   <button ng-click="deleteClicked()"  ng-hide="settings.canDelete===false || settings.mode!==\'edit\'"   id="deleteformBtn" class="btn btn-danger" style="margin:3px;"><span class="glyphicon glyphicon-trash"></span> Delete</button></span>' +
        '   <div class="form-group" ng-repeat="child in fields" ng-if="child.Visible">' +
        '        <label for="{{child.Name}}" ng-if="(child.Type!==\'Checkbox\')" class="control-label">{{child.Label ? child.Label : child.Name}}<span ng-if="(child.Type===\'Currency\')"> (R)</span><span ng-if="child.Mandatory"> *</span></label>' +
        '        <div>' +
        '           <input ng-required="child.Mandatory"  ng-disabled="child.ReadOnly" maxlength="{{(child.Length < 1 ? 50 : child.Length)}}"' +
        '                   ng-if="(child.Type===\'Text\' || child.Type===\'Default\')" ng-model="json[child.Name]" class="form-control" id="{{child.Name}}" type="{{child.Type}}" ng-change="changeEvent(child.Name,child.Label,json[child.Name], json);"/>' +
        '                  <span class=\'error\' ng-show=\'json[child.Name].$error.required\'>Required!</span> ' +
        '                  <span class=\'error\' ng-show=\'json[child.Name].$error.maxlength\'>Too long!</span> ' +
        '       <fieldset ng-if="(child.Type===\'Checkbox\')" data-role="controlgroup">'+
        '           <label for="id="{{child.Name}}" class="chkbox2">{{child.Label ? child.Label : child.Name}}</label>'+
        '           <input ng-disabled="(child.ReadOnly)" ng-if="(child.Type===\'Checkbox\')" ng-model="json[child.Name]" type="checkbox" name="checkbox-1" ng-change="changeEvent(child.Name,child.Label,json[child.Name] + \':\'+ child.DefaultData.rightLabel , json);" class="custom checkbox-1" id="{{child.Name}}"/>'+
        '           <input ng-disabled="!json.editable" ng-change="changeEvent(child.Name,child.Label,json[child.Name] + \':\'+ child.DefaultData.rightLabel , json);" ng-model="fields[$index].DefaultData.rightLabel"></input>'+
        '       </fieldset>'+

        '           <input ng-disabled="(child.ReadOnly)" ng-if="(child.Type===\'Currency\')" ng-model="json[child.Name]" class="form-control" id="{{child.Name}}" ng-change="changeEvent(child.Name,child.Label,json[child.Name],json);" type="text" />' +
        '           <input ng-disabled="(child.ReadOnly)" ng-if="(child.Type===\'Number\')" ng-model="json[child.Name]" class="form-control" id="{{child.Name}}" type="Number" ng-change="changeEvent(child.Name,child.Label,json[child.Name], json,jsonForm.$invalid)"/>' +
        '           <textarea ng-required="child.Mandatory" ng-disabled="(child.ReadOnly)" ng-if="(child.Type===\'TextArea\')" ng-model="json[child.Name]" class="form-control" id="{{child.Name}}" type="{{child.Type}}" ng-change="changeEvent(child.Name,json[child.Name], json); rows="3" />' +
        '           <select ng-required="child.Mandatory"   ng-disabled="(child.ReadOnly)" ng-if="child.Type===\'Listbox\' || child.Type===\'ListBox\'" ng-model="json[child.Name]" class="form-control" id="{{child.Name}}" ng-options="opt.split(\'=\')[0] as (opt.split(\'=\')[1] ? opt.split(\'=\')[1] : opt.split(\'=\')[0])  for opt in child.DefaultData.split(\',\')" ng-change="changeEvent(child.Name,child.Label,json[child.Name],json);" >' +
        '               <option value="">-- choose --</option>' +
        '           </select>' +
        '           <select ng-required="child.Mandatory"   ng-disabled="(child.ReadOnly)" ng-if="child.Type===\'ListboxAsync\'" ng-model="json[child.Name]" class="form-control" id="{{child.Name}}" ng-options="opt.Code as opt.Description for opt in getasyncRslt(\'{{child.Name}}\')" url="{{child.DefaultData}}" ng-change="changeEvent(child.Name,child.Label,json[child.Name], json);">' +
        '               <option value="">-- choose --</option>' +
        '           </select>' +
        '           <label ng-if="child.Type===\'Label\'">{{child.DefaultData}}</label>'+
        '           <a ng-if="child.Type===\'URL\'" href="">{{child.name}}</a>' +
        '           <input type="text" class="form-control" ng-if="child.Type===\'Typeahead\'" ng-model="json.AccountID" data-animation="am-flip-x" bs-options="row.Code as row.Code for row in getTypeahead($viewValue, \'{{child.Name}}\')" placeholder="Search" url="{{child.DefaultData}}" id="{{child.Name}}" bs-typeahead>'+
        '           <i ng-if="child.Type===\'Typeahead\'" ng-show="loadingLocations" class="glyphicon glyphicon-refresh"></i>' +
        '           <div ng-if="child.Type===\'DatePicker\' || child.Type===\'Date\'" class="input-group">' +
        '              <input type="text" ng-model="json[child.Name]" date-format="{{\'yyyy-MM-dd\'}}" data-autoclose="1" placeholder="Date" use-native="true" bs-datepicker class="form-control" />' +
        '              <div class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span>' +
        '              </div>' +
        '           </div>' +
        '           <div ng-if="child.Type===\'Tree\'"class="input-group">' +
        '               <span class="input-group-btn">' +
        '                   <button ng-click="choicetreeClicked($index)" class="btn btn-default" type="button">Choose</button>' +
        '               </span>' +
        '               <input ng-required="child.Mandatory" readonly type="text" class="form-control" id="Funcloc" ng-model="json[child.Name]" id="{{child.Name}} placeholder="Search">' +
        '               <span class="input-group-btn">' +
        '                   <button ng-click="treeClearedClicked($index)" class="btn btn-warning" type="button"><span class="glyphicon glyphicon-remove"></span></button>' +
        '               </span>' +
        '           </div>' +
        '       </div>' +
        '    </div>' +
        '</form>' +
        '</div>' +
        '<jsonfields fields="fields" ></jsonfields>',
        scope: {
            fields: '=',
            json: '=',
            settings: '=',
            formid: '=',
            savefunction: '=',
            inline: '=',
            validation : '='
        },
        //link: function(scope, element, attrs) {
        link: {
            //return {
            pre: function preLink(scope, iElement, iAttrs, controller) {
                scope.showsettings = false;
                scope.asyncRslt = new Array;
                scope.format = 'yyyy-MM-dd';
                scope.showtree = false;
                scope.isAdmin = (GlobalSvc.getUser().IsAdmin===true || GlobalSvc.getUser().IsAdmin===1);
                //if(scope.json) scope.json.validForm = true;
                scope.$watch('fields.length', function(newValue, oldValue) {
                    if (newValue === oldValue) return;
                    recurseDisplayFields(0, scope);
                }, true);

                scope.changeEvent = function(fieldname,fieldlabel,newValue,formobject){

                    var code = UserCodeSvc.getCode('JsonForm.OnChange');
                    if (code) {
                        var userExit = new Function('fieldname','fieldlabel','newValue','formobject', 'formfields', code);
                        var returnobj = userExit(fieldname,fieldlabel,newValue,scope.json,scope.fields);
                        scope.json = returnobj.formObject ? returnobj.formObject : scope.json;
                        scope.fields = returnobj.formFields ? returnobj.formFields : scope.fields;
                    }
                    scope.validateForm();
                };



                scope.validateForm = function(){
                    scope.json.validForm = true;
                    for(var i = 0; i < scope.fields.length; i++){
                        if(scope.fields[i].Visible && scope.fields[i].Mandatory){
                            //If there is no value in this then the whole form is invalid
                            if(!scope.json[scope.fields[i].Name]){
                                scope.json.validForm = false;
                                break;
                            }
                        }
                    }
                };

                scope.getasyncRslt = function(id){
                    return scope.asyncRslt[id]; //JSON.parse('[{"Code":"1","Description":"Data Migration Team"},{"Code":"2","Description":"Human Resources"},{"Code":"3","Description":"SAP Functional"},{"Code":"4","Description":"Project Management Office"},{"Code":"5","Description":"BASIS"},{"Code":"6","Description":"Development"},{"Code":"7","Description":"Data Governance"},{"Code":"8","Description":"Change Management"},{"Code":"9","Description":"Technical \/ Infrastructure"},{"Code":"10","Description":"Governance, Risk & Compliance"},{"Code":"11","Description":"Unknown"},{"Code":"12","Description":"Feasibility to Construction"},{"Code":"13","Description":"Lead to Cash"},{"Code":"14","Description":"Record to Report"},{"Code":"15","Description":"Tender to Pay"},{"Code":"16","Description":"CRM Team"},{"Code":"17","Description":"Business Warehouse"},{"Code":"18","Description":"Contact Centre"},{"Code":"19","Description":"Data Verification Team"}]');
                };

            },
            post: function postLink(scope, iElement, iAttrs, controller) {
                scope.formatDate = function(strdate){
                    try {
                        return strdate.replace(' 00:00:00','')
                        //var newDate = new Date(strdate.replace(' 00:00:00',''));
                        //return newDate.toDateString();
                    } catch (err){
                        return new Date().toDateString();
                    }
                };

                scope.getTypeahead = function(val,id){
                    //console.log(val + ":" + id);
                    //Get correct URL
                    var myEl = angular.element( document.querySelector( '#' + id  ) );
                    //get from http
                    //if (myEl[0].indexOf('http') !== -1) {
                    var url = myEl[0].attributes['url'].value;
                    url = url.replace(/:q/g,'\''); //replace all :q with a single quote
                    url = url.replace(/:p/g,'%');  //replace all :p with percentage sign
                    url = url.replace(/:Value/g,val);
                    url = GlobalSvc.resturl() + url;

                    $http({method: 'GET', url: url})
                    .then(function(data) {
                        return data.data;
                    })
                    .error(function(data, status, headers, config) {
                        console.log('issue');
                    });
                    //} else {

                    //}
                };

                /*
                 * For
                 * @param {type} $event
                 * @returns {undefined}
                 */
                scope.minDate =  new Date();
                scope.format = 'dd-MMMM-yyyy';
                scope.open = function($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    scope.opened = true;
                };

                scope.dateOptions = {
                    formatYear: 'yy',
                    startingDay: 1
                };

                scope.backClicked = function(){
                    window.history.back();
                };

                scope.settingClicked = function(){
                    scope.showsettings = true;
                    //scope.$apply();
                };

                scope.deleteClicked = function(){
                    deleteObject(scope);
                };

                scope.saveClicked = function(){
                    saveObject(scope);
                };

                scope.choicetreeClicked = function(idx){
                    var field = scope.fields[idx];
                    var obj = {};
                    try {
                        obj = JSON.parse(field.DefaultData);
                    } catch (err){
                        alert('defaultData needs to be {"table":"Functlocations","path":"notification"}');
                        return;
                    }
                    sessionStorage.setItem(scope.settings.jsoncacheid,JSON.stringify(scope.json));  //save json object to cache
                    sessionStorage.setItem('choiceTreeReturnPath',$location.path());            //path back to where we are
                    sessionStorage.setItem('choiceTreeDefaultData', JSON.stringify(obj));                 //allow multi select
                    sessionStorage.setItem('choiceTreeCacheID', scope.settings.jsoncacheid);        //be used by choicetree to pick up json object, so that field can be updated
                    $location.path('choicetree/' + field.Name + '/' + obj.table );
                };

                scope.treeClearedClicked = function(idx){
                    var field = scope.fields[idx];
                    scope.json[field.Name] = '';
                };


            }
            //};
        }
    };
});

coreApp.directive("jsontable", function($window, GlobalSvc, OptionSvc) {
    function sort(a,b){
        if (a.SortOrder < b.SortOrder)
            return -1;
        else
            return 1;
    };

    function getCSVData(scope){
        var headings = getCSVHeadings(scope);
        if (!headings) return;
        var data = [];
        //add heading row
        var newRow = {};
        for (var y=0; y<headings.length; y++ )
            newRow[headings[y]] = headings[y];
        data.push(newRow);

        //add data
        for (var x=0; x<scope.json.length; x++ ){
            if (x===0){
            }
            var newRow = {};
            for (var y=0; y<headings.length; y++ ){
                newRow[headings[y]] =  isNaN(scope.json[x][headings[y]]) ? '"' + scope.json[x][headings[y]] + '"' : scope.json[x][headings[y]];
            }
            data.push(newRow);
            console.log()
        }
        console.log('csv done');
        scope.csvHeadings = headings;
        scope.csvData = data;
        return data;
    };

    /*
     * get headings for csv
     * @returns {Array|undefined}
     */
    function getCSVHeadings(scope){
        if (!scope.fields) return undefined;
        if (scope.fields.length===0) return undefined;
        var headings = [];
        var sorted = scope.fields.sort(sort);
        for (var x=0; x<sorted.length; x++ ){
            if (sorted[x].Visible) headings.push(sorted[x].Name);
        }
        console.log('headings done');
        //scope.csvHeadings = headings;
        return headings;
    };

    return {
        restrict: "E",
        template:
        	'<div ng-hide="showsettings">' +
            '<div>' +
            '   <button ng-hide="settings.backbutton !== true" id="tableBackBtn" class="btn btn-primary" style="margin:3px;"><span class="glyphicon glyphicon-chevron-left"></span> Back</button>' +
            '   <button ng-hide="settings.isAdmin===false" id="settingTableBtn" class="btn btn-primary" style="margin:10px;"><span class="glyphicon glyphicon-cog"></span> Settings</button>' +
            '   <button id="refreshBtn" class="btn btn-primary" style="margin:3px;"><span class="glyphicon glyphicon-refresh"></span> Refresh</button></span>' +
            '   <table class="table table-striped table-hover table-bordered"">' +
            '       <tr>' +
            '           <th ng-hide="settings.mode!==\'drilldown\'">&nbsp;</a></td>' +
            '           <th ng-hide="settings.mode!==\'edit\'"><a ng-click="onClick()" href="#/viewdetail/{{settings.formid}}Det/new"><span class="glyphicon glyphicon-plus"></span></a></td>' +
            '           <th ng-repeat="field in fields" ng-if="field.Visible">{{field.Label ? field.Label : field.Name}}</th>' +
            '       </tr>' +
            '       <tr ng-repeat="row in json" ng-init="rowIndex = $index">' +
            '           <td ng-hide="settings.mode!==\'drilldown\'" style="width:50px;"><a class="btn btn-default" ng-click="saveSession(row)" href="#/drilldown/{{settings.drilldownid}}/{{$index}}"><span class="glyphicon glyphicon-search" style="font-size: 1.0em;"></span></a></td>' +
            '           <td ng-hide="settings.mode!==\'edit\'" style="width:50px;"><a class="btn btn-default" ng-click="onClick()" href="#/viewdetail/{{settings.formid}}Det/{{$index}}"><span class="glyphicon glyphicon-pencil" style="font-size: 1.0em;"></span></a></td>' +
            '           <td ng-repeat="field in fields" ng-if="field.Visible" ng-switch on="field.Type">' +
                // '               <div ng-switch-when="URL"><a class="btn btn-info" ng-click="saveSession(row)" href="{{field.DefaultData.split(\':\')[0]}}{{row[field.DefaultData.split(\':\')[1]]}}">{{sanitiseURL(row[field.Name])}}</a></div>' +
            '               <div ng-switch-when="URL"><a class="btn btn-info" ng-if="row[field.Name]" ng-click="saveSession(row)" href="{{field.DefaultData.split(\':\')[0]}}{{formatURL(row[field.DefaultData.split(\':\')[1]])}}">{{row[field.Name]}}</a></div>' +
            '               <div ng-switch-when="Date">{{formatDate(row[field.Name])}}</div>' +
            '               <div ng-switch-when="Currency" class="pull-right">{{row[field.Name]|currency : currencyCode}}</div>' +
            '               <div ng-switch-when="Listbox" style="width: 100px;"><select ng-required="child.Mandatory"   ng-disabled="(child.ReadOnly)"  ng-model="row[field.Name]" class="form-control" id="{{field.Name}}" ng-options="opt.split(\'=\')[0] as opt.split(\'=\')[1]  for opt in field.DefaultData.split(\',\')" >' +
            '               <div ng-switch-when="ListBox" style="width: 100px;"><select ng-required="child.Mandatory"   ng-disabled="(child.ReadOnly)"  ng-model="row[field.Name]" class="form-control" id="{{field.Name}}" ng-options="opt.split(\'=\')[0] as opt.split(\'=\')[1]  for opt in field.DefaultData.split(\',\')" >' +
            '               <option value="">-- choose --</option>' +
            '           </select></div>' +
            '               <div ng-switch-when="Number" style="text-align:right">{{row[field.Name]}}</div>' +
            '               <div ng-switch-when="Checkbox"><span class="fa fa-check-square-o" ng-if="row[field.Name]"></span><span class="fa fa-square-o" ng-if="!row[field.Name]"></span></div>' +
            '               <div ng-switch-default>{{row[field.Name]}}</div>' +
            '           </td>' +
            '       </tr>' +
            '</table>' +
//            '<button ng-hide="json.length === 0" class="btn btn-default" type="button" ng-csv="getcsvData()" ' +
//            '               ng-click="exportClicked()" filename="{{formid}}.csv"><span class="glyphicon glyphicon-download"></span> Export to CSV</button>' +
        '</div></div>' +
        '<jsonfields fields="fields" ></jsonfields>',
        scope: {
            fields: '=',
            json: '=',
            settings: '=',
            formid: '='
        },


        link: function(scope, element, attrs) {
            scope.currencyCode = OptionSvc.getText('CurrencyCode','R');
            scope.isAdmin = (GlobalSvc.getUser().IsAdmin===true || GlobalSvc.getUser().IsAdmin===1);

            scope.getcsvData = function(){
                return getCSVData(scope);
            };

            scope.formatURL = function(str){

                str = str.replace('&','%26');
                str = str.replace('/','%2F');
                return str;
            };

            scope.sanitiseURL = function(val){

                if( val === null ){
                    return "0";
                }else{
                    return val;
                }

                scope.apply();

            };

            scope.formatDate = function(strdate){
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
            };
            scope.getlistboxvalue = function(field, str){
                try {
                    var options = field.DefaultData.split(',');
                    for (var x=0; x< options.length; x++){
                        var option = options[x].split('=')
                        if (option[0] === str){
                            return option[1];
                        }
                    }
                    return str;
                } catch (err){
                    return str;
                }
            };
            scope.saveSession = function(json){
                sessionStorage.setItem('lastObject',JSON.stringify(json));
            };
            /*
             scope.$watch('fields.length', function(oldVal, newVal) {
             if (scope.fields) console.log('fields' + scope.fields.length);
             });
             scope.$watch('json.length', function(oldVal, newVal) {
             if (scope.json) console.log('json' + scope.json.length);
             });
             */
            var button = element.find('button');
            button.on('click', function(e){
                if (e.target.id === 'settingTableBtn') {
                    scope.showsettings = true;
                    scope.$apply();
                } else if (e.target.id === 'tableBackBtn'){
                    $window.history.back();
                }else if (e.target.id === 'refreshBtn'){
                    var currentFormCacheID = sessionStorage.getItem('CurrentFormCacheID');
                    sessionStorage.removeItem(currentFormCacheID);
                    location.reload();
                }


            });
        }
    };
});

coreApp.directive("jsonfields", function(DaoSvc, GlobalSvc, $http, Settings, $modal, $alert) {

    var ModalSettingsCtrl = function ($scope, $modalInstance, defaultData, fieldType) {
        $scope.defaultData = defaultData;
        $scope.fieldType = fieldType;
        $scope.ok = function () {
            $modalInstance.close(JSON.stringify($scope.defaultData));
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    return {
        restrict: "E",
        template:
        '<div ng-hide="!showsettings">' +
        '<div class="table-responsive">' +
        '   <h4>Fields: {{fields[0].ID}}</h4>' +
        '   <table class="table table-striped table-hover table-bordered"">' +
        '       <tr>' +
        '           <th>Name</th>' +
        '           <th>Type</th>' +
        '           <th>Label</th>' +
        '           <th>Vis</th>' +
        '           <th>Dis</th>' +
        '           <th>Mand</th>' +
        '           <th>Length</th>' +
        '           <th>Sort</th>' +
        '           <th>Options</th>' +
        '           <th>TemplateRow</th>' +
        '           <th>TemplateColumn</th>' +

        '       </tr>' +
        '       <tr ng-repeat="row in fields">' +
        '           <td>{{row.Name}}</td>' +
        '           <td><Select style="min-width:100px" ng-model="row.Type" class="form-control" id="type{{row.Name}}" ><option>Text</option><option>TextArea</option><option>Date</option><option>Listbox</option><option>ListboxAsync</option><option>Checkbox</option><option>URL</option><option>Typeahead</option><option>Currency</option><option>Default</option><option>Number</option><option>Tree</option><option>Label</option></select></td>' +
        '           <td><input style="min-width:100px" ng-model="row.Label" class="form-control" id="label{{row.Name}}" ></td>' +
        '           <td><input ng-model="row.Visible" class="form-control" id="visible{{row.Name}}" type="checkbox"></td>' +
        '           <td><input ng-model="row.ReadOnly" class="form-control" id="ro{{row.Name}}" type="checkbox"></td>' +
        '           <td><input ng-model="row.Mandatory" class="form-control" id="mand{{row.Name}}" type="checkbox"></td>' +
        '           <td><input ng-model="row.Length" class="form-control" id="length{{row.Name}}" type="number" style="width:60px;"></td>' +
        '           <td><input ng-model="row.SortOrder" class="form-control" id="sort{{row.Name}}" type="number" style="width:60px;"></td>' +
        '           <td>' +
        '               <input ng-if="row.Type === \'Listbox\' || row.Type === \'ListBox\' || row.Type === \'URL\' || row.Type === \'Typeahead\' || row.Type === \'Default\'" ng-model="row.DefaultData" class="form-control" id="{{row.DefaultData}}">' +
        '               <button  ng-if="row.Type === \'Tree\' || row.Type === \'ListboxAsync\' || row.Type === \'Checkbox\'" class="btn btn-default" ng-click="openSettingsModal($index)">...</button>' +
        '           </td>' +
        '           <td><input ng-model="row.TemplateRow" class="form-control" id="{{row.TemplateRow}}" type="text" style="width:60px;"></td>' +
        '           <td><input ng-model="row.TemplateColumn" class="form-control" id="{{row.TemplateColumn}}" type="text" style="width:60px;"></td>' +

        '       </tr>' +
        '</table></div>' +
        '<span style="display: inline-block;"><button id="saveBtn" class="btn btn-success">Save</button><button id="cancelBtn" class="btn btn-warning" style="margin-left:10px;">Cancel</button>' +
        '</div>',

        link: function(scope, element, attrs) {
            element.find('button').on('click', function(e){
                switch (e.target.id){
                    case 'cancelBtn':
                        scope.showsettings = false;
                        scope.$apply();
                        break;
                    case 'saveBtn':
                        var url = Settings.url + "PostMany?method=usp_displayfields_modify";
                        //Ensuring that all righthand labels are stringified
                        for(var i = 0; i < scope.fields.length; i++){
                            if(scope.fields[i].Type === 'Checkbox'){
                                if(typeof scope.fields[i].DefaultData === 'string') continue;
                                scope.fields[i].DefaultData = JSON.stringify(scope.fields[i].DefaultData);
                            }
                        }
                        var data = GlobalSvc.sanitiseData(scope.fields.slice());
                        GlobalSvc.postData(
                            url,
                            data,
                            function(){
                                DaoSvc.openDB();
                                DaoSvc.putMany(scope.fields,
                                    'DisplayFields',
                                    undefined,
                                    function(err){alert('Oops, could not save...');},
                                    function(){
                                        sessionStorage.removeItem(scope.formid + 'session');
                                        $alert({content: 'Saved OK', duration:4, placement:'top-right', type:'success', show:true});
                                        scope.showsettings = false;
                                        scope.$apply();
                                    });
                            },
                            function(){
                                alert('nooooooo');
                            },
                            'DisplayFields',
                            'ModifyAll',
                            false,
                            true
                        );
                }
            });

            scope.openSettingsModal = function(idx){
                scope.field = scope.fields[idx];
                scope.defaultData = {};
                scope.settingsOK = function () {
                    scope.field.DefaultData = JSON.stringify(scope.defaultData);
                    scope.myModal.hide();
                };
                scope.settingsCancel = function () {
                    scope.myModal.hide();
                };


                try {
                    scope.defaultData = JSON.parse(scope.field.DefaultData);
                } catch (err) {
                    switch(scope.field.fieldType) {
                        //Build a default JSON object for this displayfield type
                        case 'Tree':
                            scope.defaultData = {table:"", code:"", description:"", multiselect:false};
                            break;
                        case 'ListboxAsync':
                            scope.defaultData = {type: "local", table:"", code:"", description:"", Params:""};
                            break;
                    }
                }


                if (!scope.field.DefaultData){
                    switch(scope.field.Type) {
                        //Build a default JSON object for this displayfield type
                        case 'Tree':
                            scope.defaultData = {table:"", code:"", description:"", multiselect:false};
                            break;
                        case 'ListboxAsync':
                            scope.defaultData = {type: "local", table:"", code:"", description:"", Params:""};
                            break;
                        case 'Checkbox':
                            scope.defaultData = {"rightlabel" : ""};
                            break;
                    }
                }

                scope.myModal = $modal({scope: scope, template: 'js/core/modal/jsonSettings.html', show : 'false'});
            };
        }
    };
});


coreApp.directive('generictable', function(GlobalSvc, $http, Settings) {


    function getHeaders(scope){

        scope.headings = [];
        if (!scope.table) return;
        if (!scope.table.length===0) return;

        for (prop in scope.table[0]){
            scope.headings.add(prop);
        }
    };

    return {
        restrict: "E",
        scope: {
            label: '@',
            table: '='
        },
        template:
        '<h3 ng-if="label">{{label}}</h3>' +
        '<div>' +
        '   <table class="table table-striped table-hover table-bordered"">' +
        '       <tr>' +
        '           <th ng-repeat="heading in headings">{{heading}}</th>' +
        '       </tr>' +
        '       <tr ng-repeat="row in table">' +
        '           <td ng-repeat="field in headings">{{row[field]}}</td>' +
        '       </tr>' +
        '   </table>' +
        '</div>',
        link: function(scope, element, attrs) {
            getHeaders(scope);
        }
    };
});
