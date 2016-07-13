coreApp.controller("ProfileCtrl", function ($scope, GlobalSvc, $modal, Settings, $http, $alert) {
    $scope.user = GlobalSvc.getUser();
    $scope.$emit('heading',{heading: 'My Profile' , icon : 'glyphicon glyphicon-user'});
    $scope.saveLabel = 'Save Password';
    $scope.loading = false;
    $scope.passwordObj = {
        currentpassword: '',
        newpassword: '',
        repeatpassword: ''
    };
        
    $scope.changePasswordClicked = function(){
        $scope.myModal = $modal({scope: $scope, template: 'js/core/modal/changePassword.html', show : 'false', keyboard: false, backdrop: 'static'});        
    };

    $scope.saveUser = function(){
        $scope.$emit('LOAD');
        
        var url = Settings.url + 'GetStoredProc?StoredProc=usp_user_modifyDetails&params=(\'' + $scope.user.UserID + '\'|\'' + $scope.user.Name + '\'|\'' + $scope.user.Tel + '\')';
        $http({method: 'GET', url: url})
        .success(function(json, status, headers, config) {
            var obj = json[0];
	    var status = Boolean(obj.status);
	    if (status) {
                $alert({ content:  'Your details have been changed', duration: 4, placement: 'top-right', type: 'success', show: true});
                localStorage.setItem('currentUser',JSON.stringify($scope.user));
            } else {
	        $alert({ content:  'Your details have not been changed', duration: 4, placement: 'top-right', type: 'danger', show: true});
	    }
            $scope.$emit('UNLOAD');
        })
        .error(function(data, status, headers, config) {
            $alert({ content:  'Your details have not been changed', duration: 4, placement: 'top-right', type: 'danger', show: true});
            $scope.$emit('UNLOAD');
        });
    };

    $scope.saveClicked = function(){
        
        delete $scope.errorMsg;
        delete $scope.successMsg;
        
        if ($scope.passwordObj.newpassword !== $scope.passwordObj.repeatpassword) {
            $scope.errorMsg = 'Your new passwords need to be the same';
            return;
        }
        
        $scope.loading = true;
        $scope.saveLabel = 'Saving....';
        var url = Settings.url + 'GetStoredProc?StoredProc=usp_user_modifyPassword&params=(\'' + $scope.user.UserID + '\'|\'' + $scope.passwordObj.currentpassword + '\'|\'' + $scope.passwordObj.newpassword + '\')';
        $http({method: 'GET', url: url})
        .success(function(json, status, headers, config) {
            var obj = json[0];
	    var status = Boolean(obj.status);
	    if (status) {
                $scope.successMsg = 'Your password has been changed';
	    } else {
	        $scope.errorMsg = obj.msg;
	    }
            $scope.saveLabel = 'Save Password';
            $scope.loading = false;
        })
        .error(function(data, status, headers, config) {
            $scope.errorMsg = 'Issue.';
            $scope.saveLabel = 'Save Password';
            $scope.loading = false;
        });        
    };
    
    $scope.constructor = function(){
        $scope.$emit('right',{label: 'Save' , icon : 'glyphicon glyphicon-floppy-save', onclick:  $scope.saveUser});
    };
    $scope.constructor();
});