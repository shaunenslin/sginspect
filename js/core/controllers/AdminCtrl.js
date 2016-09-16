
coreApp.controller("AdminMenuCtrl", function ($scope) {
	function constructor(){
		$scope.$emit('heading',{heading: 'Administration' , icon : 'glyphicon glyphicon-wrench'});
	}
	constructor();
});




