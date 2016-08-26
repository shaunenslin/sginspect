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
        var rows = {};
        var new_headings = [];
        // Add data
        for (var i = 0 ; i < scope.Jobs.length; i++){
            for (var y = 0; y < headings.length; y++){
                if (headings[y].toLowerCase() === 'customer' || headings[y].toLowerCase() === 'branch'){
                	newRow[headings[y]] = (!newRow[headings[y]]) ? scope.Jobs[i].JSON[headings[y]] : '';
                }
				rows = matchJsonToHeadings([headings[y]],scope.Jobs[i]).newRow;
				new_headings = matchJsonToHeadings([headings[y]],scope.Jobs[i], y).headings;     
            }
            data.push(rows);
        }
        scope.csvHeadings = new_headings;
        return data;
    }
	 $scope.getCsvData = function(){
        return getCSVData($scope);
    };

    function matchJsonToHeadings(prop, json){
    	var newHeadings = [];
    	if (prop === 'FormType'){ 
    		var field = 'Report Type';
    		switch (json[prop]){
    			case 'audit' :
    				newRow[field] = 'Audit Form';
    				newHeadings.push(field);
    				break;
    			case 'supplierevaluation':
    				newRow[field] = 'Supplier Evaluation'
    				newHeadings.push(field);
    				break;
    			case 'technicalreport' :
    				newHeadings.push(field);
    				newRow[field] = 'Technical Report'
    				break;
    			case 'afterserviceevaluation' :
    				newRow[field] = 'After Service Inspection';
    				newHeadings.push(field);
    				break;
    			case 'customervisit' : 
    				newRow[field] = 'Customer Visit';
    				newHeadings.push(field);
    				break;
    		}
    	}
    		newRow['Date Submitted'] =  moment(json.FormDate).format('DD-MMM-YY');
    		newRow['Technical Assessor'] = json.JSON.User_Name;
    		newRow['ExportedtoISO'] = (!json['ExportedtoISO']) ? 'No' : 'Yes';
    		newRow['Performed Location'] = json.JSON.Latitude + ' ' + json.JSON.Longitude;

    		newHeadings.push('Date Submitted');
    		newHeadings.push('Technical Assessor');
    		newHeadings.push('ExportedtoISO');
    		newHeadings.push('Performed Location');
    	return {"headings" : newHeadings, "newRow": newRow}; 
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