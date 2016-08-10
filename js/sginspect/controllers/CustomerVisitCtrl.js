coreApp.controller('CustomerVisitCtrl', function($scope, GlobalSvc, DaoSvc, Settings, $http, $alert, $routeParams, $location, CaptureImageSvc, JsonFormSvc, OptionSvc, $filter){
	$scope.isPhoneGap = Settings.isPhoneGap;
    $scope.signature = {inspector : ""};
	/** The variable below is the svg represtion of an empty signature  **/
	var emptySignature = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4=";
	var Imgfiles = [];
    $scope.issuesDiscussed = [
                {name:"Driver error claims"},
                {name:"Services Overdue"},
                {name:"COF License Overdue"},
                {name:"Termination by agreement"},
                {name:"Other (Please Specify)"}]

    function newObject(){
		$scope.Form = {
			FormType: $routeParams.inspectiontype,
			ClientID: "",
			FormID: GlobalSvc.getGUID(),
			SupplierID  : "",
			UserID 		: GlobalSvc.getUser().UserID,
			FormDate	: moment().format('YYYY-MM-DD HH:mm:ss'),
			JSON 		: {
				"Customer" : undefined,
				"PartiesPresent" : undefined,
				"SpecialRequestDate" : undefined,
				"SpecialRequest" : undefined,
				"IssuesDiscussed" : undefined
			}
		}
	}

	$scope.onBackClicked = function(){
		$location.path("selectclient/customervisit/0");
	}

	$scope.fetchGPS = function(){
		$scope.$emit('LOAD');
		GlobalSvc.getGPS(function(position){
			$scope.Form.JSON.Latitude  = position ? position.coords.latitude : "";
			$scope.Form.JSON.Longitude = position ? position.coords.longitude : "";
			$alert({content:"GPS location captured successfully", duration:5, placement:'top-right', type:'success', show:true});
			$scope.$emit('UNLOAD');
			$scope.$apply();
		},function(error){
			$alert({content:"GPS location not captured. Please ensure your location settings are enabled ", duration:5, placement:'top-right', type:'danger', show:true});
			console.log( error);
			$scope.Form.JSON.Latitude = '';
			$scope.Form.JSON.Longitude = '';
			$scope.$emit('UNLOAD');
		});
	}


	/** This method create an svg image of the signature captured **/
	function createSignatureImage(datapair,type){
		var image = {};
		image.ID = $scope.Form.FormID + "_" + type;
		image.SupplierID = GlobalSvc.getUser().SupplierID;
		image.FileData = datapair[1];
		image.Type = datapair[0];
		if (image.Type.toLowerCase() == 'image/svg+xml;base64'){
			image.Name = image.Id + '.svgx';
		}
		return image;
	}

	$scope.saveSignature = function(){
		$scope.$emit('LOAD');
		if(!$scope.customervisitform.$valid){
			$alert({ content: "Please enter in all fields before continuing", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
		}
        if ($scope.Form.JSON.IssuesDiscussed === 'Other (Please Specify)' && !$scope.Form.JSON.IssueDescription ) {
            $alert({ content: "Please enter an Issue Comment.", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
        }
        if($scope.signature.inspector[1] === emptySignature || !$scope.signature.inspector){
            $alert({ content: "Please sign before you continue", duration: 5, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
            return;
        }


		saveForm();
	}

	function saveForm(){
		$scope.$emit('LOAD');
		//Create Unique Key For Signature(s) and/or image(s) in IF ELSE BLOCK
		var inspectorSignature =  createSignatureImage($scope.signature.inspector, 'Inspector');
		$scope.Form.JSON[inspectorSignature.ID] = inspectorSignature.FileData;

		var success = function(){
			$scope.$emit('UNLOAD');
			$alert({ content: "Your Customer Visit has been saved Ok.", duration: 5, placement: 'top-right', type: 'success', show: true});
			sessionStorage.removeItem('currentClientsCache');
			$location.path('/');
		}
		var error = function(err){
			$scope.$emit('UNLOAD');
			$alert({ content: "Error saving Customer Visit", duration: 5, placement: 'top-right', type: 'danger', show: true});
		}
		$scope.Form.JSON = JSON.stringify($scope.Form.JSON);
		var url = Settings.url + 'Post?method=SGIFormHeaders_modify';
		GlobalSvc.postData(url, $scope.Form, success, error, 'SGIFormHeaders', 'Modify', false, true);
	}

	function constructor(){
        $scope.$emit('heading',{heading: 'Customer Visit', icon : 'fa fa-check-square-o'});
		$scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: $scope.onBackClicked});
		$scope.$emit('right', {label: 'Save', icon: 'fa fa-save', onclick: $scope.saveSignature});
		$scope.Form =  JSON.parse(sessionStorage.getItem('currentForm'));
	}
	constructor();
});
