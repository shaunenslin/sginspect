coreApp.directive('choicetreedir', function(GlobalSvc, DaoSvc,OptionSvc, $location, $routeParams, $route,$http) {
    
    DaoSvc.openDB();
    var allowclick = true;
    var user = GlobalSvc.getUser();
    var currentAccount = JSON.parse(localStorage.getItem('currentAccount'));
    
    /*
     * Object to store choices
     * @param {type} name
     * @param {type} code
     * @param {type} scope
     * @returns {_L1.Choice}
     */
    function Choice(name, code, scope ,stock, numChildren) {
        this.name = name;
        this.code = code;
        this.checked = (scope.checkedlist.indexOf(code) !== -1) ? true : false;
        this.stock = stock;
        //If our tree already has a numchildren, then use it, else go search
        if (!numChildren) {
            this.numChildren = 0;
            var $this = this;
            DaoSvc.count(scope.choiceTreeSettings.table,code,'index1',
                function(cnt){
                    $this.numChildren = cnt;
                    scope.$apply();
                },
                function(error){
                console.log(error);
            });
        } else {
            this.numChildren = numChildren;
        }    
    };
    
    /*
     * Object to store bread crumbs
     * @param {type} name
     * @param {type} code
     * @returns {_L1.Breadcrumb}
     */
    function Breadcrumb(name, code){
        this.name = name;
        this.code = code;
    };
    
    /*
     * Make sure we have all the scope variables in place
     */
    function checkScope(scope){
        if (!scope.choiceTreeSettings) alert('You need a scope variable called choiceTreeSettings in your controller');        
        if (!scope.id) alert('You need a scope variable called id in your controller');
        if (!scope.choiceTreeSettings.table) alert('You need a scope variable called choiceTreeSettings.table in your controller');
        if (!scope.choiceTreeSettings.code) alert('You need a scope variable called choiceTreeSettings.code in your controller');
        if (!scope.choiceTreeSettings.description) alert('You need a scope variable called choiceTreeSettings.description in your controller');
        if (scope.choiceTreeSettings.multiselect === undefined) alert('You need a scope variable called choiceTreeSettings.multiselect in your controller');
        if (!scope.singleselect) scope.singleselect = false; 
        if (scope.choiceTreeSettings.rememberMe === undefined) scope.choiceTreeSettings.rememberMe = false;
    };
    
    /*
     * Fetch the tree records from local database
     * @param {type} scope
     * @param {type} parentid
     * @returns {undefined}
     */
    function fetchTree(scope, parentid){
        //Add OptionInfo check here 
        //this check if the item is the last item in the tree and then goes to get a stock count for each item
        var success = function(json){
            var choice = new Choice(json[scope.choiceTreeSettings.description], json[scope.choiceTreeSettings.code], scope, json.NumChildren);
            scope.children.push(choice); 
        };
        var error = function(err){
            console.log('fetchTree no records');
        };
        var completed = function(){
            scope.$apply();
        };
        scope.children = [];
        if(parentid === null || parentid === "null"){
           parentid = 'top';
        }
        DaoSvc.index(scope.choiceTreeSettings.table,parentid,'index1',success,error,completed);
    };
    
     /*
     * Save or remove the ID to store which tree objects are checked or not
     */
    function saveChecked(scope, choice){
        //if only one select allowed, alwasy clear
        
        //delete this selection
        if (choice.checked === false){
            for (var x=0; x < scope.checkedlist.length; x++){
                if (scope.checkedlist[x] === choice.code && choice.checked === false){
                    scope.checkedlist.splice(x,1);
                    //delete scope.checkedlist[x];
                } 
            }
        } else {
            if (!scope.multiselect) clearClicked(scope);
            scope.checkedlist.push(choice.code);
            choice.checked = true;
        }
    };
    
    function clearClicked(scope){
        scope.checkedlist = [];
        for (var x=0; x < scope.children.length; x++){
            scope.children[x].checked = false;
        }
    };
    
    /*
     * If item clicked, first check if we have first clicked on a check box and exit.
     * Else, if no children, then assume they clicking on checkbox
     * Else, add to breadcrumb and change location
     */
    function itemClicked (scope, choice){
        if (!allowclick) {
             allowclick = true;
            return;
        }
        //Remember ME
        if (scope.choiceTreeSettings.rememberMe) {
            sessionStorage.setItem('choiceTreeBreadCrumbCache', JSON.stringify(scope.breadcrumbs));
            sessionStorage.setItem('choiceTreeIDCache', scope.treeid);
            sessionStorage.setItem('choiceTreePreviousUrl', $location.path());
        }
        if (choice.numChildren === 0) {
            choice.checked = !choice.checked;
            saveChecked(scope, choice);
            //if we have onclickpath, then use it once they clicked on a childless node
            if (scope.choiceTreeSettings.onClickPath) {
                $location.path(scope.choiceTreeSettings.onClickPath + '/' + choice.code);  
            }              
        } else {
            scope.breadcrumbs.push(new Breadcrumb(choice.name, choice.code)); 
            sessionStorage.setItem('choiceTreeBreadCrumbCache', JSON.stringify(scope.breadcrumbs));
            sessionStorage.setItem('choiceTreeIDCache', choice.code);
            $location.path(scope.choiceTreeSettings.path + '/' + choice.code); 
        }
    };
    
    function rememberMe(scope){
        scope.treeid = ($routeParams.parentid) ? $routeParams.parentid : null; 
        
        //if no treeid and we want to remember
        if (scope.choiceTreeSettings.rememberMe  && scope.treeid === null) {           
            if (sessionStorage.getItem('choiceTreeIDCache')) {
                if (sessionStorage.getItem('choiceTreeBreadCrumbCache')) {
                    scope.breadcrumbs = JSON.parse(sessionStorage.getItem('choiceTreeBreadCrumbCache'));
                    scope.treeid = sessionStorage.getItem('choiceTreeIDCache');
                }               
            }
        }
    }
    
    /*
     * Select a tree node
     */
    function checkboxClicked(scope, choice){
        allowclick = false;
        choice.checked = !choice.checked;
        saveChecked(scope, choice);
    };
    
    function backClicked(scope){
        if (scope.breadcrumbs.length > 1) {
            var code = scope.breadcrumbs[scope.breadcrumbs.length-2].code;
            sessionStorage.setItem('choiceTreeIDCache', code);
            $location.path(scope.choiceTreeSettings.path + '/' + code); 
        } else {
            sessionStorage.removeItem('choiceTreeIDCache');
            sessionStorage.removeItem('choiceTreeBreadCrumbCache');
            if ($location.path() === scope.choiceTreeSettings.path)
                $location.path(scope.choiceTreeSettings.path);
            else
                $location.path(scope.choiceTreeSettings.path);
                $route.reload();
        }
    };
    
    return {
        template:   '<div><ol class="breadcrumb" ng-if="breadcrumbs.length > 0">' +
                    '<li><a href="" ng-click="backClicked()"><span class="glyphicon glyphicon-chevron-left breadcrumback btn btn-default"></span><a></li>'+
                    '<li ng-repeat="breadcrumb in breadcrumbs"><a href="#/{{choiceTreeSettings.path}}/{{breadcrumb.code}}">{{breadcrumb.name}}</a></li>' +
                    '</ol>' +
                    '<div class="list-group">' +
                    '    <a id="{{choice.code}}" ng-click="itemClicked(choice)" class="list-group-item" ng-repeat="choice in children | orderBy: \'name\'">' +
                    '        <span ng-if="singleselect === false" ng-class="(choice.checked) ? \'glyphicon glyphicon-check\' : \'glyphicon glyphicon-unchecked\' " ng-click="checkboxClicked(choice)"></span>' +
                    '                {{choice.name}} ' +
                    '        <span class="glyphicon glyphicon-chevron-right pull-right" style="margin-left: 30px"></span>   ' +
                    '               <span ng-if="choice.numChildren !== 0" class="badge" >{{choice.stock}}</span>'+
                    '    </a>' +
                    '</div></div>' ,
        replace: true,
        transclude: true,
        restrict: 'E',
        
        link: function(scope, elm, attrs) {
            checkScope(scope);
            
            scope.itemClicked = function(choice) {
                itemClicked(scope,choice);
            };
            scope.checkboxClicked = function(choice) {
                checkboxClicked(scope, choice);
            };
            scope.backClicked = function() {
                backClicked(scope);
            };

            scope.children = [];
            scope.treeid = '';
            scope.checkedlist = [];
            scope.breadcrumbs = [];
            rememberMe(scope);
            //scope.treeid = ($routeParams.parentid) ? $routeParams.parentid : '';   

            (sessionStorage.getItem(scope.id + 'Cache')) ? scope.checkedlist = JSON.parse(sessionStorage.getItem(scope.id + 'Cache')) : [];
            if (scope.treeid === '') sessionStorage.removeItem('choiceTreeBreadCrumbCache');
            (sessionStorage.getItem('choiceTreeBreadCrumbCache')) ? scope.breadcrumbs = JSON.parse(sessionStorage.getItem('choiceTreeBreadCrumbCache')) : [];
            for (var x=0; x < scope.breadcrumbs.length -1; x++){
                if (scope.breadcrumbs[x].code === scope.treeid) {
                    scope.breadcrumbs = scope.breadcrumbs.splice(0, x+1 );
                    break;
                }
            }

            fetchTree(scope, scope.treeid);

        }
    }    
});