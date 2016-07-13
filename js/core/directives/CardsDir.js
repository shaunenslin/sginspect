coreApp.directive("jsoncards", function(GlobalSvc, $http, $sce, DaoSvc, Settings, $location) {
    function fetchHttp (scope){
        scope.$emit('LOAD');

        var url = scope.url.indexOf('.json') !== -1 ? scope.url : GlobalSvc.url() + scope.url;
        $http({method: 'GET', url: url})
            .success(function(json) {
                if (angular.isArray(json)) {
                    if (scope.onfetch) {
                        var fnct = scope.onfetch();
                        if (fnct) json = fnct(json);
                    }
                    scope.json = json;
                    scope.$emit('UNLOAD');
                } else {
                    scope.errorMsg = 'No results found';
                    scope.json = [];
                }
            })
            .error(function(data, status, headers, config) {
                scope.errorMsg = 'Issue.' + data;
            });
    }


    return {
        restrict: "E",
        template:
            '<div  class="row">' +
            '  <div class="col-xs-6 col-sm-3" ng-repeat="row in json">'   +
            '   <div class="panel panel-default group-panel">' +
            '     <a ng-click="onClick($index)"  href="{{ hrefField ? json[$index][hrefField] : \'#/\' + href + \'/\' + json[$index][idField]  }}">' +
            '       <div class="panel-body cardBox">' +
            '          <div style="text-align:center" ng-if="json[$index+0].icon" ><span style="color:#494949;font-size:100px;margin-top:50px;" class="{{json[$index+0].icon}}"></span></div>' +
            '          <img class="imageCenter" ng-if="!json[$index+0].icon" src="{{json[$index+0].image}}"/> ' +
            '       </div>' +
            '       <div class="panel-footer text-center group-footer" style="color:#31373D;">{{json[$index][headingField]}}   </div>' +
            '     </a>' +
            '   </div>' +
            '  </div>' +
            '</div>',
        scope: {
            url: '@',
            onfetch: '&',
            headingField: '@',
            hrefField: '@',
            href: '@',
            idField: '@',
            defaultIcon: '@',
            errorMsg: '=',
            successMsg: '='
        },
        controller: function($scope, $element) {
            $scope.onClick = function(row){
                sessionStorage.setItem('currentCard', JSON.stringify($scope.json[row]));
            };

            if ($scope.url && $scope.url.length > 0 )
                fetchHttp($scope);


        }
    };
});
