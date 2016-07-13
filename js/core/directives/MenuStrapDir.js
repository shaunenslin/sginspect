coreApp.directive("menustrap", function(DaoSvc) {
    DaoSvc.openDB();
    var mainmenuBld = [];
    function fetchTree(scope){
        var success = function(json){ 
            //createMenu(mainmenuBld, json);
            recurseParent(mainmenuBld, mainmenuBld, json);
        }; 

        var error = function(err){
            console.log('No Menu items found');
        };

        var complete = function(){
            scope.mainmenu = mainmenuBld;
            scope.$apply();
            
        };
        DaoSvc.indexsorted('Tree','mainmenu','index1','index3', 
            success, 
            error, 
            complete);    
    };
    
    /*
     * Recurse tree to find correct parent and add as child
     * @param {type} parent
     * @param {type} treeID
     * @param {type} json
     * @returns {undefined}
     */
    function recurseParent(mainmenuBld, parents, json){
        if (!parents) return;
        //add as top array, since this node has no parent
        if ((!json.ParentTreeID || json.ParentTreeID==='') && json.hasChildren ==='1' ){
            mainmenuBld.push(json);
            return;
        }
if (json.TreeID === 'Adm')
    console.log('in');
        if (parents.length===0) return;
        if (json.ParentTreeID==='NULL') return;

        for ( var x=0; x < parents.length; x++){
            var parent = parents[x];
            if (parent.TreeID === json.ParentTreeID){
                if (!parent.children) parent.children = [];
                parent.children.push(json);
                return;
            } else {
                if (parent.children) {                   
                    recurseParent(mainmenuBld,parent.children,json);
                }    
            }
        }
    };
    
    return {
        restrict: "E",
        //scope: {mainmenu: '='},
        template: 
            '<ul class="nav navbar-nav">' + 
            '   <li class="dropdown-toggle" data-toggle="dropdown" ng-repeat="child in mainmenu">' +
            '       <a  class="dropdown-toggle" data-toggle="dropdown">{{child.Description}}</a>' +
            '       <ul class="dropdown-menu multi-level" role="menu" aria-labelledby="dropdownMenu">' +
            '           <li ng-repeat="child2 in child.children" ng-class="child2.hasChildren===\'1\' ? \'dropdown-submenu\' : \'\' ">' +
            '               <a ng-click="itemClicked(child2)" href="{{child2.tips}}">{{child2.Description}}</a>' +
            '               <ul ng-if="child2.hasChildren===\'1\'" class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu">' +
            '                   <li ng-repeat="child3 in child2.children">' +
            '                       <a href="{{child3.tips}}">{{child3.Description}}</a>' +
            '                   </li>' +
            '               </ul>' +
            '           </li>' +
            '       </ul>' +
            '   </li>' +
            '</ul>', 
        link: {  
            pre: function preLink(scope, iElement, iAttrs, controller) { 
                scope.itemClicked = function(child){
                    localStorage.setItem('currentTree',JSON.stringify(child));
                };
                scope.$watch('mainmenu.length', function(newValue, oldValue) {
                        if (newValue === oldValue) return;
                        console.log('wohoo');
                }, true);        
            },
            post: function postLink(scope, iElement, iAttrs, controller) { 
            fetchTree(scope);
                //console.log(scope.mainmenu);
            }
        }    
         
    };
});

