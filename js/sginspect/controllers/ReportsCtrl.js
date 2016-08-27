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
	 var newRow = {};
	var newHeadings = ['Report Type', 'Technical Assessor', 'Date Submitted', 'Customer', 'Branch', 'Supplier', 'Performed Location', 'ExportedtoISO'];

	function fetchJobs(){
		var url = Settings.url + "Get?method=SGI_FormHeaders_readlist&UserID='" + GlobalSvc.getUser().UserID  + "'&FormType=''&startdate=''&enddate=''" + "&ExportedtoISO=''";
		$http.get(url)
		.success(function(json){
			$scope.Jobs =json.map(function(e){
				e.JSON = JSON.parse(e.JSON);
				e.timeString = moment(e.FormDate).format('DD-MMM-YY');
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
        headings = getCSVHeadings(scope);
        if (!headings) return;
        var data = [];
        // Add data
        for (var i = 0 ; i < scope.Jobs.length; i++){
        	var rows = {};
				rows = matchJsonToHeadings(scope.Jobs[i]) ? matchJsonToHeadings(scope.Jobs[i]) : [];
            data.push(rows);
        }
        scope.csvHeadings = newHeadings;
        return data;
    }
	 $scope.getCsvData = function(){
        return getCSVData($scope);
    };

    function matchJsonToHeadings(json){
    		var field = 'Report Type';
    		switch (json.FormType){
    			case 'audit' :
    				newRow[newHeadings[0]] = 'Audit Form';
    				break;
    			case 'supplierevaluation':
    				newRow[newHeadings[0]] = 'Supplier Evaluation'
    				break;
    			case 'technicalreport' :
    				newRow[newHeadings[0]] = 'Technical Report'
    				break;
    			case 'afterserviceevaluation' :
    				newRow[newHeadings[0]] = 'After Service Inspection';
    				break;
    			case 'customervisit' : 
    				newRow[newHeadings[0]] = 'Customer Visit';
		    		break;
    	}
    	newRow[newHeadings[1]] = json.JSON.User_Name;
		newRow[newHeadings[2]] =  moment(json.FormDate).format('DD-MMM-YY');
		newRow[newHeadings[3]] = json.JSON.Customer;
		newRow[newHeadings[4]] = json.JSON.branch ? json.JSON.Branch : '';
		newRow[newHeadings[5]] = json.JSON.branch ? json.JSON.Branch : '';
		newRow[newHeadings[6]] = json.JSON.Latitude + ' ' + json.JSON.Longitude;
		newRow[newHeadings[7]] = (!json['ExportedtoISO']) ? 'No' : 'Yes';
		return  newRow; 
    }

    function getCSVHeadings(scope){
        var headingFields = [];
        for (var prop in $scope.Jobs[0]){
        	// props used to fetch corresponding data  from object
            if ($scope.Jobs[0].hasOwnProperty(prop) && (prop.toLowerCase() === 'formtype' || prop.toLowerCase() === 'formdate'|| prop.toLowerCase() === 'exportedtoiso')) headingFields.push(prop);
            if (prop.toLowerCase() === 'userid') headingFields.push('User_Name');
        }
        for (var prop in $scope.Jobs[0].JSON){
            if (prop.toLowerCase() === 'customer' || prop.toLowerCase() === 'branch' || prop.toLowerCase() === 'latitude' || prop.toLowerCase() === 'longitude') headingFields.push(prop); 

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