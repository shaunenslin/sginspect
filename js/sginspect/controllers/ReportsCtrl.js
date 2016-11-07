coreApp.controller("ReportsCtrl", function ($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter) {
	$scope.jobType = [
		{name: 'Audit Form', value: 'audit'},
		{name: 'Customer Visit Form', value: 'customervisit'},
		{name: 'Technical Report', value: 'technicalreport'},
		{name: 'Supplier Evaluation', value: 'supplierevaluation'},
		{name: 'After Service Inspection', value: 'afterserviceevaluation'}
	];
	$scope.isoOptions = [{'name': 'Yes', value: 1}, {'name': 'No', value: 0}];
	var newHeadings = ['Report Type', 'Technical Assessor', 'Date Submitted', 'Customer', 'Branch', 'Supplier', 'Performed Location', 'ExportedtoISO'];
	$scope.data = [];
	$scope.splitArr = [];
    $scope.newArr = [];
    $scope.idx = 0;
    $scope.searchText = {"JobType": "", "UserID" :"", "startdate":"", "enddate":"", "ISO":"", "SearchString":""};
    $scope.users = [];
    $scope.currentDate = new Date();


	function fetchJobs(){
		if(sessionStorage.getItem('currentSearchResultCache')){
			$scope.splitArr = JSON.parse(sessionStorage.getItem('currentSearchResultCache'));
			$scope.idx = parseInt(sessionStorage.getItem('currIdx'));
			$scope.searchText = JSON.parse(sessionStorage.getItem('searchTextCache'));
			$scope.show = $scope.splitArr[$scope.idx].length > 0 ? true : false;
			$scope.$emit('UNLOAD');
			return;
		}
		var url = Settings.url + "Get?method=SGI_FormHeaders_readlist&startdate=" + moment().format('YYYYMMDD') + "&enddate=" + moment().format('YYYYMMDD') + "&UserID='" + GlobalSvc.getUser().UserID  + "'&FormType=&ExportedtoISO=&SearchString=";
		$http.get(url)
		.success(function(json){
			$scope.Jobs =json.map(function(e){
				e.JSON = (e.JSON && typeof(e.JSON) === 'string')? (JSON.parse(e.JSON)) : e.JSON;
				e.timeString = moment(e.FormDate).format('DD-MMM-YY');
				return e;
			});
			$scope.splitArr = arraySplit($scope.Jobs);
			$scope.show = json.length > 0 ? true : false;
			$scope.$emit('UNLOAD');
		})
		.error(function(err){
			$alert({content:"Error  fetching Jobs ", duration:5, placement:'top-right', type:'danger', show:true});
			$scope.$emit('UNLOAD');
		})
	}
	function fetchUsers(){
    	if (sessionStorage.getItem( "UsersCache")) {
    		$scope.users = JSON.parse(sessionStorage.getItem( "UsersCache"));
    		$scope.$emit('UNLOAD');
    	} else {
	        var url = Settings.url + "Get?method=usp_user_readlist&SupplierID="+ GlobalSvc.getUser().SupplierID;
	        console.log(url);
	        $http.get(url).success(function(data){
	            $scope.users = (GlobalSvc.getUser().IsAdmin) ? data :  $filter('filter')(data, {IsAdmin: false});
	            $scope.$emit('UNLOAD');
	            sessionStorage.setItem( "UsersCache",JSON.stringify($scope.users) );
	        });
    	}
    }

	function arraySplit(data){
        var newArr = [];
        while(data.length !== 0){
            var splitArr = data.splice(0, 25);
            newArr.push(splitArr);
        }
        return newArr;
    };

    $scope.paginate = function(change){
        changedVal = $scope.idx + change;
        if(changedVal < 0 || changedVal >= $scope.splitArr.length) return;
        $scope.idx = changedVal;
    }
    $scope.navigatetoReportMap = function(idx){
    	if (!$scope.splitArr[$scope.idx][idx].JSON.Latitude) return;
    		sessionStorage.setItem('currentReportCache', JSON.stringify($scope.splitArr[$scope.idx][idx]));
    		$location.path('reports/map/' + $scope.splitArr[$scope.idx][idx].FormID);
    }
    function fetchMapPosition(){
    	$scope.Report = JSON.parse(sessionStorage.getItem('currentReportCache'));
    	$scope.CentreLong = $scope.Report.JSON.Longitude;
    	$scope.CentreLat =  $scope.Report.JSON.Latitude;
    	$scope.$emit('UNLOAD');
    }
    
	$scope.onClearClicked = function(){
		$scope.searchText = {"JobType": "", "UserID" :"", "startdate":"", "enddate":"", "ISO":"", "SearchString":""};
	}
	$scope.onSearchClicked = function(){
		if (!$scope.searchText.startdate || !$scope.searchText.enddate){
			$alert({content:"Date range required!" , duration:5, placement:'top-right', type:'danger', show:true});
			return;

		}
		sessionStorage.removeItem('currentSearchResultCache');
		sessionStorage.removeItem('currIdx');
		var searchStr = $scope.searchText.SearchString ? $scope.searchText.SearchString : '';
		var userid = $scope.searchText.UserID ? $scope.searchText.UserID : '';
		$scope.searchText.JobType = ($scope.searchText.JobType === null) ? '' : $scope.searchText.JobType; 
		$scope.searchText.UserID =  ($scope.searchText.UserID === null) ? '' : $scope.searchText.UserID;
		$scope.searchText.ISO = ($scope.searchText.ISO === null) ? '' : $scope.searchText.ISO;
		var url = Settings.url + "Get?method=SGI_FormHeaders_readlist&startdate=" + moment($scope.searchText.startdate).format("YYYYMMDD") + "&enddate=" + moment($scope.searchText.enddate).format("YYYYMMDD") + "&UserID='" + userid  + "'&FormType=" + $scope.searchText.JobType   + "&ExportedtoISO=" + $scope.searchText.ISO + "&SearchString=" + searchStr;
		$http.get(url)
		.success(function(json){
			$scope.Jobs =json.map(function(e){
				e.JSON = (e.JSON && typeof(e.JSON) === 'string')? (JSON.parse(e.JSON)) : e.JSON;
				e.timeString = moment(e.FormDate).format('DD-MMM-YY');
				return e;
			});
			sessionStorage.setItem('searchTextCache', JSON.stringify($scope.searchText));
			$scope.splitArr = arraySplit($scope.Jobs);
			sessionStorage.setItem('currentSearchResultCache', JSON.stringify($scope.splitArr));
			sessionStorage.setItem('currIdx', $scope.idx);
			sessionStorage.setItem('currentSearchItems', JSON.stringify($scope.searchText));
			$scope.show = $scope.splitArr.length > 0 ? true : false;
			$scope.$emit('UNLOAD');
		})
		.error(function(err){
			$alert({content:"Error  Searching Jobs " + err, duration:5, placement:'top-right', type:'danger', show:true});
		})
	}
	$scope.editClicked = function(idx){
		sessionStorage.setItem('currentReportCache', JSON.stringify($scope.splitArr[$scope.idx][idx]));
		$location.path($scope.splitArr[$scope.idx][idx].FormType + '/report/' + $scope.splitArr[$scope.idx][idx].FormID);
	}
	
    function onBackClicked(){
    	sessionStorage.removeItem('currentReportCache');
    	$location.path('/reports')
    }

	function constructor(){
		$scope.$emit('LOAD');
		if (!$routeParams.mode && !$routeParams.id){
			$scope.$emit('heading',{heading: 'Search For Jobs' , icon : 'fa fa-search'});
			$scope.mode = 'list';
			fetchJobs();
			fetchUsers();
		} else{
			$scope.$emit('heading',{heading: 'Report Map' , icon : 'fa fa-map-marker'});
			$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){onBackClicked();}});
			$scope.mode = 'map';
			fetchMapPosition ();
		}
	}
	constructor();
});