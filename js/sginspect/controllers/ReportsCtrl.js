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
		var url = Settings.url + "Get?method=SGI_FormHeaders_readlist&UserID='" + GlobalSvc.getUser().UserID  + "'&FormType=''&startdate=''&enddate=''" + "&ExportedtoISO=''";
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
		var url = Settings.url + "Get?method=SGI_FormHeaders_readlist&UserID='" + GlobalSvc.getUser().UserID  + "'&FormType=" + $scope.searchText.FormType + "&startdate=" + $scope.searchText.startdate + "&enddate=" +$scope.searchText.enddate + "&ExportedtoISO=" + $scope.searchText.ISO;
		$http.get(url)
		.success(function(json){
			$scope.Jobs = json;
			$scope.$emit('UNLOAD');
		})
		.error(function(err){
			$alert({content:"Error  Searching Jobs " + err, duration:5, placement:'top-right', type:'danger', show:true});
		})
	}
	$scope.editClicked = function(){

	}
	function getCSVData(scope){
        var headings = getCSVHeadings(scope);
        if (!headings) return;
        var data = [];
        // Add data
        for (var i = 0 ; i < scope.Jobs.length; i++){
            var newRow = {};
            for (var y = 0; y < headings.length; y++){
                newRow[headings[y]] = (typeof scope.Jobs[i] ===  'object')  ? scope.Jobs[i].JSON[headings[y]] :  scope.Jobs[i][headings[y]];
            }
            data.push(newRow);
        }
        scope.csvHeadings = headings;
        return data;
    }
	 $scope.getCsvData = function(){
        return getCSVData($scope);
    };

    function getCSVHeadings(scope){
        var headingFields = [];
        for (var prop in $scope.Jobs[0]){
            if ($scope.Jobs[0].hasOwnProperty(prop) && (prop.toLowerCase() === 'formtype' || prop.toLowerCase() === 'userid' || prop.toLowerCase() === 'formdate'|| prop.toLowerCase() === 'exportedtoiso')) headingFields.push(prop);
        }
        for (var prop in $scope.Jobs[0].JSON){
            if (prop.toLowerCase() === 'Customer' || prop.toLowerCase() === 'branch' || prop.toLowerCase() === 'latitude' || prop.toLowerCase() === 'longitude') headingFields.push(prop); 

        }
        return headingFields;
    }
    $scope.getcsvHeader = function(){
        return $scope.csvHeadings;
    };


	function constructor(){
		$scope.$emit('heading',{heading: 'Search For Jobs' , icon : 'fa fa-search'});
		fetchJobs();
	}
	constructor();
});