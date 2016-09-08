coreApp.controller("ReportsCtrl", function ($scope, $routeParams, DaoSvc, $location, $alert, $http, GlobalSvc, Settings, $route, $filter) {
	$scope.jobType = [
		{name: 'Audit Form', value: 'audit'},
		{name: 'Customer Visit Form', value: 'customervisit'},
		{name: 'Technical Report', value: 'technicalreport'},
		{name: 'Supplier Evaluation', value: 'supplierevaluation'},
		{name: 'After Service Inspection', value: 'afterserviceevaluation'}
	];
	var newHeadings = ['Report Type', 'Technical Assessor', 'Date Submitted', 'Customer', 'Branch', 'Supplier', 'Performed Location', 'ExportedtoISO'];
	$scope.data = [];
	$scope.splitArr = [];
    $scope.newArr = [];
    $scope.idx = 0;
    $scope.searchText = {"JobType": "", "UserID" :"", "startdate":"", "enddate":"", "ISO":""};


	function fetchJobs(){
		var url = Settings.url + "Get?method=SGI_FormHeaders_readlist&startdate=''" + "&enddate=''&UserID='" + GlobalSvc.getUser().UserID  + "'&FormType=''" + "&ExportedtoISO=''&SearchString=''";
		$http.get(url)
		.success(function(json){
			$scope.Jobs =json.map(function(e){
				e.JSON = (e.JSON && typeof(e.JSON) === 'string')? (JSON.parse(e.JSON)) : e.JSON;
				e.timeString = moment(e.FormDate).format('DD-MMM-YY');
				return e;
			});
			$scope.splitArr = arraySplit($scope.Jobs);
			$scope.data = $scope.Jobs;
			sessionStorage.setItem('JobsCache', JSON.stringify(json));
			$scope.show = true;
			$scope.$emit('UNLOAD');
		})
		.error(function(err){
			$alert({content:"Error  fetching Jobs ", duration:5, placement:'top-right', type:'danger', show:true});
			$scope.$emit('UNLOAD');
		})
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
		$scope.searchText = {"JobType": "", "UserID" :"", "startdate":"", "enddate":"", "ISO":""};
		$scope.Jobs = $scope.data;
	}
	$scope.onSearchClicked = function(){
		if (!$scope.searchText.startdate){
			$alert({content:"Date range required !", duration:5, placement:'top-right', type:'danger', show:true});
			return;
		}
		var url = Settings.url + "Get?method=SGI_FormHeaders_readlist&UserID='" + GlobalSvc.getUser().UserID  + "'&FormType=" + $scope.searchText.JobType + "&startdate='" + moment($scope.searchText.startdate).format('YYYY-MM-DD') + "'&enddate='" + moment($scope.searchText.enddate).format('YYYY-MM-DD') + "'&ExportedtoISO=" + $scope.searchText.ISO;

		// var url = Settings.url + "Get?method=SGI_FormHeaders_readlist&UserID='" + GlobalSvc.getUser().UserID  + "'&FormType=" + $scope.searchText.JobType + "&startdate=" + moment($scope.searchText.startdate).format("DD-MMM-YY HH:mm") + "&enddate=" + moment($scope.searchText.enddate).format("DD-MMM-YY HH:mm") + "&ExportedtoISO=" + $scope.searchText.ISO;
		$http.get(url)
		.success(function(json){
			$scope.Jobs = json;
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
	function getCSVData(scope){
        headings = getCSVHeadings(scope);
        if (!headings) return;
        var data = [];
        var Jobs = $scope.splitArr[0];
        var arrayCount = 0;
        while (arrayCount < $scope.splitArr.length){
        	Jobs = Jobs.concat($scope.splitArr[arrayCount]);
        	arrayCount++;

        }
        // Add data
        for (var i = 0 ; i < Jobs.length; i++){
        	var row = {};
			row = matchJsonToHeadings(Jobs[i]);
            data.push(row);
        }
        scope.csvHeadings = newHeadings;
        return data;
    }
	 $scope.getCsvData = function(){
        return getCSVData($scope);
    };

    function matchJsonToHeadings(json){
    	var newRow = {};
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
		newRow[newHeadings[4]] = json.JSON.Branch ? json.JSON.Branch : '';
		newRow[newHeadings[5]] = json.JSON.Branch ? json.JSON.Branch : '';
		newRow[newHeadings[6]] = json.JSON.Latitude ? (json.JSON.Latitude + ' ' + json.JSON.Longitude) : '';
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
        for (var prop in $scope.splitArr[0].JSON){
            if (prop.toLowerCase() === 'customer' || prop.toLowerCase() === 'branch' || prop.toLowerCase() === 'latitude' || prop.toLowerCase() === 'longitude') headingFields.push(prop); 

        }
        return headingFields;
    }
    $scope.getcsvHeader = function(){
        return $scope.csvHeadings;
    };
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
		} else{
			$scope.$emit('heading',{heading: 'Report Map' , icon : 'fa fa-map-marker'});
			$scope.$emit('left',{label: 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick: function(){onBackClicked();}});
			$scope.mode = 'map';
			fetchMapPosition ();
		}
	}
	constructor();
});