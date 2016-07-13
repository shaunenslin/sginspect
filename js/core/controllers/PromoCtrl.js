coreApp.controller('PromoCtrl',function($scope,$routeParams,$http,$alert,GlobalSvc,Settings, $modal, $filter){
	var user = GlobalSvc.getUser();
	$scope.promoEdit = {};
	$scope.promos = [];
	$scope.form = {};

    function fetchPromotions(){
        var url = Settings.url + 'GetStoredProc?StoredProc=usp_tpm_readlist&params=(' + user.SupplierID + ')';
        $http.get(url)
            .success(function(data){
                console.log(data);
                $scope.promos = data;
                $scope.$emit('UNLOAD');
            })
            .error(function(){
                $scope.$emit('LOAD');
                $scope.errorMsg = "Issue";
                console.log('error');
            });
    };

    function initPromotionSelectfield(){
        //this method initializes all the select fields in the view
        $scope.promoFields = {};
        $scope.promoFields.types = [{id: 'free', label:'Buy X get Y free'}, {id: 'discount', label:'Buy X get Y% discount'}];
        $scope.promoFields.ObjectPropertyAC = ['All','AccountID','BranchID','AccountGroup','Userfield01']; //Object Property fields for the Account Condition
        $scope.promoFields.ObjectPropertyPC = ['ProductID','CategoryName','Userfield01']; //Object Property fields for the Production Condition
        $scope.promoFields.priorities = [{id: 1, label: '1: High Priority'}, {id: 2, label: '2: Medium Priority'}, {id: 3, label: '3: Lower Priority'}, {id: 4, label: '4: Low Priority'}];
    };

    function fetchPromotion(){
        var url = Settings.url + 'GetStoredProc?StoredProc=usp_tpm_readsingle&params=(' + user.SupplierID + '|"' + $scope.id +'")';
        $http.get(url)
            .success(function(data){
                initPromotionSelectfield();
                $scope.promoEdit = data[0];
                $scope.promoEdit.Deleted = 0;
                //json comes as string from the server > converting it to use it in the view
                $scope.promoEdit.json = JSON.parse($scope.promoEdit.json);
                console.log(data);
                $scope.$emit('UNLOAD');
            })
            .error(function(){
                $scope.errorMsg = "Issue"
                console.log('error');
            });
    };

    function newObject(){
        initPromotionSelectfield();
        $scope.promoEdit.Deleted = 0;
        $scope.promoEdit = {};
        $scope.promoEdit.users = [];
        $scope.promoEdit.SupplierID = user.SupplierID;
        $scope.promoEdit.Description = "";
        $scope.promoEdit.FromDate = new Date();
        $scope.promoEdit.ToDate = new Date();
        $scope.promoEdit.SortOrder = 0;
        $scope.promoEdit.TPMID = "";
        $scope.promoEdit.json = {"mandatory" : false, "type": ""};
        $scope.promoEdit.json.values = [{"PromoProductID": "", "PromoDescription": "", "AccountGroup": "", "CategoryName":"", "BuyQty": 0, "FreeQty": 0}];
        $scope.promoEdit.json.accountConditions =  [{"ObjectProperty": "","TPMField": ""}];
        $scope.promoEdit.json.productConditions =  [{"ObjectProperty": "","TPMField": ""}];
        $scope.promoEdit.json.BuyQty ;
        $scope.promoEdit.json.FreeyQty;
        $scope.promoEdit.Rebate = false;
        $scope.promoEdit.json.noOtherDiscounts = true;
        $scope.promoEdit.json.mandatory = false;
		$scope.promoEdit.json.notAllowedWithDeal = false;
        $scope.promoEdit.Deleted = 0;
        $scope.$emit('UNLOAD');
    };

    $scope.save = function(){
        var success = function () {
        	$alert({content: 'Your changes have been saved OK.', duration:3, placement:'top-right', type:'success', show:true});
        };

        var error = function () {
            console.log('error');
        };

        var obj = $.extend( true, {}, $scope.promoEdit );
        if (!obj.TPMID) {
        	$alert({content: 'Please enter a TPM ID on the header tab.', duration:3, placement:'top-right', type:'error', show:true});
            return;
        }

        var fromDate = new Date(obj.FromDate);
        var toDate = new Date(obj.ToDate);
        obj.FromDate = fromDate.getFullYear()+'-'+ (fromDate.getMonth() + 1) +'-'+fromDate.getDate();
        obj.ToDate = toDate.getFullYear()+'-'+ (toDate.getMonth() + 1) +'-'+toDate.getDate();
        obj.json = JSON.stringify(obj.json);
        var url = Settings.url + 'StoredProcModify?StoredProc=usp_tpm_modify';
        GlobalSvc.postData(url,obj,success,error,'TPM','Modify',false,true);
    };

    $scope.deletePromo = function(){
        $scope.promoEdit.Deleted = 1;
        $scope.save();
    };

    $scope.removeRow = function(index, array){
    	array.splice(index,1);
    };

    /**
     * Called from promoSearch.html and either add or remove the selected account to the current List
     */
    $scope.rowClicked = function(index){
    	var item = $scope.searchResults[index];
    	item.chosen = !item.chosen;
    	if (item.chosen){
    		$scope.currentList.push({ID: item.ID, Label: item.Label, Attribute: $scope.currentAttribute });
    	} else {
    		for (var x=0; x< $scope.currentList.length; x++){
    			if (item.ID === $scope.currentList[x].ID) {
    				$scope.currentList.splice(x,1);
    			}
    		}
    	}
    };

    /**
     * Called from promoSearch.html modal
     */
    $scope.fetchPossibleValues = function(searchStr, attribute) {
    	$scope.$emit('LOAD');
    	var table = 'AccountID,AccountGroup,BranchID'.indexOf(attribute) !== -1 ? 'account' : 'product';
    	var url = Settings.url + "GetStoredProc?StoredProc=usp_tpm_" + table + "PossibleValues&params=(" + user.SupplierID + "|" + attribute + "|\'" + searchStr + "\')";
    	$scope.searchResults = [];
    	$http({method: 'GET', url: url})
        .success(function(json) {
            $scope.searchResults = checkForChosenRows(json);
            $scope.$emit('UNLOAD');
        })
        .error(function(data, status, headers, config) {
            $scope.errorMsg = data;
            $scope.$emit('UNLOAD');
        });
    };

    /**
     * check to see which search results are already selected and mark as yellow
     */
    function checkForChosenRows(json){
    	for (var x=0; x < json.length; x++){
    		var found = $filter('filter')($scope.currentList, {ID:json[x].ID});
    		if (found.length) json[x].chosen = true;
    	}
    	return json;
    };

    /**
     * Called when wanting to search for either accounts, accountgroups, products or product groups.
     * This will open a popup so allow for the searching of any of above fields and selecting to add to the promo
     */
    $scope.searchClicked = function(attribute, tablename, arrayname){
    	$scope.searchResults = [];
    	$scope.currentAttribute = attribute;
    	if (!$scope.promoEdit.json[tablename][0][arrayname]) $scope.promoEdit.json[tablename][0][arrayname] = [];
    	$scope.currentList = $scope.promoEdit.json[tablename][0][arrayname];
    	var mymodal = $modal({scope : $scope, template: 'js/core/modal/promoSearch.html', show: true});
    };

    function constructor(){
        if(!user.IsAdmin){
            $scope.errorMsg = 'You are not authorized to be on this page';
            return;
        }
        $scope.$emit('heading',{heading : 'Trade Promotions' , icon : 'glyphicon glyphicon-usd'});
        $scope.$emit('LOAD');
        if($routeParams.mode && $routeParams.id){
            $scope.mode = 'form';
            $scope.id = $routeParams.id;
            $scope.$emit('right',{label : 'Save' , icon : 'glyphicon glyphicon-floppy-save', onclick : $scope.save});
            $scope.$emit('left',{label : 'Back' , icon : 'glyphicon glyphicon-chevron-left', onclick : function(){window.history.back()}});
            if($routeParams.id === 'new'){
                newObject();
            }else{
                $scope.id = $routeParams.id;
                fetchPromotion();
            }
        }else{
            $scope.mode = 'list';
            $scope.$emit('right',{label : 'New Promotion' , icon : 'glyphicon glyphicon-plus', href : "#/promo/form/new" });
            fetchPromotions();
        }
    }
    constructor();
});
