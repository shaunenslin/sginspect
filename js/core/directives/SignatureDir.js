coreApp.directive('signature', function(GlobalSvc, $http, Settings) {
	return {
        restrict: 'E',
        template: '<div class="btn btn-primary" style="margin-bottom: 5px" ng-click="reset()">Reset</div>',
        scope: {
            //sig: '=',
            width: '@',
            height: '@',
            color: '@',
            bgColor: '@',
            lineWidth: '@',
            cssclass: '@',
            value: '=ngModel'
        },
        link: function($scope, $element) {

			console.log('jSignatureDirective: link');
			console.dir($scope);

			/*
			width   Defines the width of the canvas. Numerical value without % or px    250
			height  Defines the height of the canvas. Numerical value without % or px   150
			color   Defines the color of the strokes on the canvas. Accepts any color hex values.   #000
			background-color    Defines the background color of the canvas. Accepts any color hex values.   #fff
			lineWidth   Defines the thickness of the lines. Accepts any positive numerical value    1
			cssclass    Defines a custom class for the canvas.  None
			*/

            $scope.initialized = false;

            var options = {
                width:                  $scope.width,
                height:                 $scope.height,
                color:                  $scope.color,
                'background-color':     $scope.bgColor,
                lineWidth:              ($scope.lineWidth ? parseInt($scope.lineWidth, 10) : 1),
                cssclass:               $scope.cssclass
            };

            $scope.initialize = function () {
                if(!$scope.initialized) {
                    $element.jSignature(options);
                    $scope.initialized = true;
                    $element.on('mouseup', function(e) {
                    	$scope.getData();
                    });
					$element.on('touchend touchcancel', function(e) {
                    	$scope.getData();
                    });
                }
            };

            $scope.reset = function() {
            	console.log('reset!!!');
                $element.jSignature('reset');
                $scope.getData();
            };

            $scope.getData = function() {
            	console.log('getData!!!');
            	var datapair = $element.jSignature('getData', 'svgbase64');
            	$scope.value = datapair;
            	console.dir(datapair);
                $scope.$apply();
            };

            $scope.setData = function(sig) {
            	console.log('setData!!!');
                // var datapair = ['image/jsignature;svgbase64'];
                // datapair[1] = 'base30,2A0Z101100001110000000';
				//
                // if (sig) {
                //     datapair[1] = sig;
                // }
                // console.log(datapair);
                // $element.jSignature('setData', 'data:' + datapair.join(','));
                $scope.$apply();
            };


            $scope.initialize();
            $scope.setData();


            $scope.$watch('sig', function (sig) {
                if(sig) {
                	console.log('watch if ' + sig);
                    $scope.setData(sig);
                    return;
                }
                console.log('watch else');

            });
//
//            $scope.$watch('jSignature', function () {
//                //if (value)
//                    $scope.getData();
//                }) ;


        }
    };

});
