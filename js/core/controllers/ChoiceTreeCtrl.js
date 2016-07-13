//TODO - remember scope
//TODO - mouse less

function ChoiceTreeCtrl($scope,$location,DaoSvc, GlobalSvc, $routeParams) {
    $scope.checkedlist = [];
    $scope.id = ''; //functree';
    $scope.table = ''; //Functlocations';
    $scope.code = '';
    $scope.description = '';
    $scope.returnPath = sessionStorage.getItem('choiceTreeReturnPath');
    
    function clearCache(){
        sessionStorage.removeItem('choiceTreeReturnPath');
        sessionStorage.removeItem('choiceTreeDefaultData');
        sessionStorage.removeItem('choiceTreeCacheID');
        sessionStorage.removeItem('choiceTreeBreadCrumbCache');       
    };
    
    /*
     * Clear all selections
     */
    $scope.clearClicked = function(){
        $scope.checkedlist = [];
        for (var x=0; x < $scope.children.length; x++){
            $scope.children[x].checked = false;
        }
        sessionStorage.removeItem('functreeCache');
        var workFilterCache = JSON.parse(localStorage.getItem('workFilterCache'));
        workFilterCache.funclocField = '';
        localStorage.setItem('workFilterCache', JSON.stringify(workFilterCache));
        $scope.$apply();
    };
    
    $scope.backBtnClicked = function(){       
        if ($scope.treeid === ''){
            clearCache();
            $location.path($scope.returnPath);
        } else {
            window.history.back();
        }    
    };
    
    $scope.chooseClicked = function(){
        //Now get previous json object from sessionstorage and update the field
        var json = JSON.parse(sessionStorage.getItem(sessionStorage.getItem('choiceTreeCacheID')));
        var comma = '';
        json[$scope.id] = '';
        for (var x=0; x < $scope.checkedlist.length; x++){
            json[$scope.id] += comma + $scope.checkedlist[x];
            comma = ',';
        }
        //Resave session object and go back. The previous screen should use it in the constructor
        sessionStorage.setItem(sessionStorage.getItem('choiceTreeCacheID'), JSON.stringify(json));
        clearCache();
        $location.path($scope.returnPath);
    };   
    
    var constructor = function(){
        $scope.id = ($routeParams.id) ? $routeParams.id : '';
        $scope.table = $routeParams.table;
        var defaultData = JSON.parse(sessionStorage.getItem('choiceTreeDefaultData'));
        $scope.code = defaultData.code;
        $scope.description = defaultData.description;
        $scope.multiselect = defaultData.multiselect;
    };
    constructor(); 
} 