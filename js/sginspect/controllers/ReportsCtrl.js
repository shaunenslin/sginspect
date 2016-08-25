coreApp.controller("ReportsCtrl", function ($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter) {
	$scope.Jobs = [];
	$scope.data = [];
	$scope.jobType = [
		{name: 'Audit Form', value: 'audit'},
		{name: 'Customer Visit Form', value: 'customervisit'},
		{name: 'Technical Report', value: 'technicalreport'},
		{name: 'Supplier Evaluation', value: 'supplierevaluation'},
		{name: 'After Service Inspection', value: 'afterserviceevaluation'}
	];
	
	function fetchJobs(){
		var url = Settings.url + "Get?method=SGI_FormHeaders_readlist&UserID='" + GlobalSvc.getUser().UserID  + "'";
		$http.get(url)
		.success(function(json){
			$scope.Jobs =json.map(function(e){
				e.JSON = JSON.parse(e.JSON);
				e.timeString = moment(e.FormDate).format('DD-MMM-YY')
				return e;
			});
			$scope.data = $scope.Jobs;
			sessionStorage.setItem('JobsCache', JSON.stringify(json));
			$scope.$emit('UNLOAD');
		})
		.error(function(err){
			$alert({content:"Error  fetching Jobs " + err, duration:5, placement:'top-right', type:'danger', show:true});

			$scope.$emit('UNLOAD');
		})
	}
	$scope.onClearClicked = function(){
		$scope.searchText = {"JobType": "", "UserID" :"", "startdate":"", "enddate":"", "ISO":""};
		$scope.Jobs = $scope.data;
	}
	$scope.onSearchClicked = function(){
		var search_results = [];
			$filter('filter')($scope.Jobs, function(e) {
		        if(e.UserID.includes($scope.searchText.UserID) || e.FormType.includes($scope.searchText.JobType) /*|| e.ExportedtoISO.includes($scope.searchText.ISO) */|| ($scope.searchText.startdate < e.FormDate && e.FormDate > $scope.searchText.enddate)){             
		            search_results.push(e);
		        }
	        	$scope.Jobs = search_results;
    		}); 
	}
	$scope.editClicked = function(){

	}

	function constructor(){
		$scope.$emit('heading',{heading: 'Search For Jobs' , icon : 'fa fa-search'});
		fetchJobs();
	}
	constructor();
});