coreApp.directive("timeline", function(GlobalSvc, $http, DaoSvc, Settings, $location) {
    function fetchHttp (scope){
        scope.$emit('LOAD');
        var url = GlobalSvc.url() + 'GetStoredProc?StoredProc=social_get_notifications&params=('+scope.supplierid+'|'+scope.groupid+')';
        $http({method: 'GET', url: url})
            .success(function(json) {
                if (angular.isArray(json)) {
                    scope.timeline = json;
                    scope.$emit('UNLOAD');
                } else {
                    scope.errorMsg = 'No results found';
                    scope.json = [];
                }
            })
            .error(function(data, status, headers, config) {
                scope.errorMsg = 'Issue.' + data;
            });
    };

    return {
        restrict: "E",
        template:
        +'<div class="list-group" >'+
        +    '<a href="#" class="list-group-item" ng-repeat="row in timeline">'+
        +   '<p><span  style="font-size: 18px; padding-right: 10px" class="{{row.icon}}"> </span> {{row.message}}</p>'+
        +    '</a>'+
        +'</div>',

        scope: {
            supplierid : '@',
            groupid : '@'
        },
        controller: function($scope, $element) {
            if ( $scope.supplierid && $scope.groupid)
                fetchHttp($scope);
        }
    };
});