/*
coreApp.directive("busy", function() {
    return {
        restrict: "E",
        template: 
            '<div class="alert alert-warning load">' +
            '    <span class="glyphicon glyphicon-refresh font-size: 1.0em;"></span>&nbsp;&nbsp;<bold>Loading</bold>' +
            '</div>'
    };
});
*/

coreApp.directive("busy", function() {
    var ModalInstanceCtrl = function ($scope, $modalInstance, items) {};
    var modalInstance; 
    return {
        restrict: "E",
        template:
            '<div ng-if="(loading === true)" class="loading">' +
            '    <span class="fa fa-refresh fa-spin"></span>&nbsp;&nbsp;<bold>{{message}}</bold>' +
            '</div>',        
        scope: {
            loading: '=',
            message: '@'
        },  
        link: function(scope, element, attrs) {
            if (!scope.message) scope.message = 'Loading...';            
        }
    };
});

coreApp.directive("msgbox", function($modal) {
    var ModalInstanceCtrl = function ($scope, $modalInstance) {};
    var modalInstance; 
    
    function openSyncModal(){
        modalInstance = $modal.open({
            templateUrl: 'msgboxModal.html',
            controller: ModalInstanceCtrl,
            size: 'sm',
            resolve: {             
            }
        });
    };
    return {
        restrict: "E",
        template:
            '<script type="text/ng-template" id="msgboxModal.html">' +
            '        <div class="modal-header">' +
            '            <h3 class="modal-title">Im a modal!</h3>' +
            '        </div>' +
            '        <div class="modal-body">' +
            '        </div>' +
            '        <div class="modal-footer">' +
            '            <button class="btn btn-primary" ng-click="ok()">OK</button>' +
            '            <button class="btn btn-warning" ng-click="cancel()">Cancel</button>' +
            '        </div>' +
            '    </script>',        
        scope: {
            open: '=',
            message: '='
        },  
        link: {
            pre: function preLink(scope, iElement, iAttrs, controller) {
                scope.$watch('open', function(newValue, oldValue) {
                    if (newValue === oldValue) return;
                    if (newValue == true){
                        openSyncModal();
                    }
                });
            }                     
        }
    };
});

            //'<script type="text/ng-template" id="syncingModal.html">' +
            //'    <div class="modal-body">' +
            //'        <h4>{{message}}</h4>' +
            //'    </div>' +
            //'</script>',
