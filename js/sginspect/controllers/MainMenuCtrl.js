coreApp.controller("MainMenuCtrl", function ($scope) {
	function constructor(){
		$scope.$emit('heading',{heading: 'Menu' , icon : 'fa fa-bars'});
		sessionStorage.removeItem('currentFormID')
	}
	constructor();
});