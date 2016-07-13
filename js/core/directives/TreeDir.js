
coreApp.directive("tree", function(RecursionSvc) {
    return {
        restrict: "E",
        scope: {family: '='},
        template: 
        '<p>{{ family.name }}{{test }}</p>'+
            '<ul>' + 
                '<li ng-repeat="child in family.children">' + 
                    '<tree family="child"></tree>' +
                '</li>' +
            '</ul>',
        compile: function(element) {
            return RecursionSvc.compile(element, function(scope, iElement, iAttrs, controller, transcludeFn){
                // Define your normal link function here.
                // Alternative: instead of passing a function,
                // you can also pass an object with 
                // a 'pre'- and 'post'-link function.
            });
        }
    }});



