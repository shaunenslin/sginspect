coreApp.controller("GroupsCtrl", function ($scope, GlobalSvc, JsonFormSvc, Settings, $routeParams, $http,$modal,$route,$alert,$location,$window) {
    /*
     * Called from inside cards directive to add final
     */
    $scope.timelines = [];
    $scope.leaderboard = [];
    $scope.members = [];
    $scope.period = $scope.period === undefined ? 'm' : $scope.period;
    $scope.requestCounter = 0;
    $scope.view = '';
    $scope.user = GlobalSvc.getUser();
    $scope.events = [];
    $scope.calendarView = 'month';
    $scope.calendarDay = new Date();
    $scope.inviteEmail = '';
    window.scrollTo(0, 0);

    $scope.onfetch = function(json){
        var size = getSize();
        for (var x=0; x< json.length; x++){
            var row = json[x];
            if (row.ImageURL) {
                row.image = row.ImageURL;
            } else {
                row.image = 'img/groups.png';
            }
        }

        // add an extra add record
        json.push({
            Area: "",
            GroupID: 'join',
            Name: "Join a Group",
            SupplierID: GlobalSvc.getUser().SupplierID,
            image: "img/add.png",
            Tel: ""
        }
        );
        return json;
    };

    function getSize(){
        try {
            var size = ($window.outerWidth===0) ? $window.innerWidth : $window.outerWidth;
            if ((size > 750 && size < 840) || size < 350)
            //var size = $window.outerWidth;
            //if (size > 750 && size < 840)
                return 110;
            else
                return 150;
        } catch (err){
            return 110;
        }
    }

    function fetchGroupImage(ID){
            var key = ID;
            if (sessionStorage.getItem(key)) {
                $scope.groupIMG = sessionStorage.getItem(key);
                $scope.$apply();
                return;
            }

            var url = Settings.imageUrl + '?id=GROUP' + key + '&supplierID=' + GlobalSvc.getUser().SupplierID + '&width=150&height=150';
            $http({method: 'GET', url: url})
                .success(function(json) {
                    if (json.indexOf('Not Found') === -1){
                        $scope.groupIMG = url;
                        sessionStorage.setItem(key, url);
                        $scope.$apply();
                    } else {
                        delete $scope.groupIMG;
                    }
                })
                .error(function(data, status, headers, config) {
                    delete $scope.groupIMG;
                });
    }

    function fetchTimeline(){
        $scope.view = 'dashboard';
        $scope.timelines = [];
        var url = Settings.url + 'GetStoredProc?StoredProc=social_timeline_readlist&params=('+ GlobalSvc.getUser().SupplierID +'|'+ $scope.currentGroup.GroupID +')';
        $http({method : 'GET', url : url}).success(function(data){
            for (var x=0; x<data.length; x++) data[x].date = GlobalSvc.parseDate(data[x].DateTime);
            $scope.timelines = data;
        }).error(function(err){
            console.log(err);
        });
    }

    $scope.inviteUsers = function(){
        $scope.invite = {
            SupplierID: GlobalSvc.getUser().SupplierID,
            GroupID: $routeParams.id,
            //UserID: '',
            IsAdmin: 0,
            Accepted: 1,
            NeedsInvite: 1
        };
        $scope.buttonText = 'Send';
        $scope.MessageModal = $modal({scope: $scope, template: 'js/core/modal/inviteModal.html', show: true});
    };

    $scope.saveInvite = function(){
        $scope.buttonText = 'Please Wait';
        var url = GlobalSvc.resturl() + 'View/ModifyAll?table=GroupUsers&type=insert';
        GlobalSvc.postData(url, $scope.invite,
            function(){
                $scope.invite.UserID = '';
                $scope.buttonText = 'Send';
                $alert({ content:  'Invitation has been sent', duration: 3, placement: 'top-right', type: 'success', show: true});
                fetchmembers();
                $scope.$apply();
            },
            function(err){
                $scope.buttonText = 'Send';
                alert({ content:   err, duration: 5, placement: 'top-right', type: 'danger', show: true});
                $scope.$apply();
        },
        'Groups','insert',false,true);
    };

    $scope.newMessageClicked = function(){
        $scope.MessageModal = $modal({scope: $scope, template: 'js/core/modal/messageModal.html', show: true});
        $scope.message = {
            SupplierID : GlobalSvc.getUser().SupplierID,
            CreatedBy  : GlobalSvc.getUser().UserID,
            CreatedOn  : new Date(),
            Message    : "",
            GroupID    : $scope.currentGroup.GroupID,
            ID : 0
        };
    };

    $scope.saveMessage = function(){
       delete $scope.errorMsg;
       delete $scope.successMsg;
       var url = GlobalSvc.resturl() + 'View/ModifyAll?table=GroupMessages&type=insert';
       GlobalSvc.postData(url,
           $scope.message,
           function(){
               $route.reload();
               $scope.MessageModal.$promise.then($scope.MessageModal.hide);
               $scope.$emit('UNLOAD');
               $alert({ content:   'Your message was sent...', duration: 5, placement: 'top-right', type: 'success', show: true});
               $scope.$apply();
           },

           function(err){
               $scope.$emit('UNLOAD');
               $scope.MessageModal.$promise.then($scope.MessageModal.hide);
               $alert({ content:   'Error sending message...', duration: 5, placement: 'top-right', type: 'danger', show: true});
               $scope.$apply();
       },
       'GroupsMessages','INSERT',false,true);
    };

    $scope.fetchleaderboard = function(period){
        $scope.$emit('LOAD');
        period = period === undefined ? $scope.period : period;
        $scope.leaderboard = [];
        delete $scope.errorMsg;
        var url = Settings.url + 'GetStoredProc?StoredProc=social_leaderboard&params=('+ GlobalSvc.getUser().SupplierID +'|'+ $scope.currentGroup.GroupID +"|'"+GlobalSvc.getTodaysDate()+"'|" + period + ")";
        $http({method : 'GET', url : url}).success(function(data){
            $scope.$emit('UNLOAD');
            if(data.length <= 0){
                $scope.errorMsg = "There are no records for this period";
                return;
            }
            $scope.leaderboard = data;
        }).error(function(err){
            console.log(err);
        });
    };

    function fetchmembers(){
        var url = Settings.url + 'GetStoredProc?StoredProc=social_groupmembers_readlist&params=('+GlobalSvc.getUser().SupplierID+'|'+ $scope.currentGroup.GroupID+')';
        console.log($scope.view);
        $scope.members = [];
        $scope.requestCounter = 0;
        $scope.view = 'members';
        $http({method : 'GET' , url : url}).success(function(data){
            console.log(data);
            for(var i = 0; i < data.length; i++){
                if(!data[i].Accepted){
                    $scope.requestCounter++;
                 }
            }
            $scope.members = data;
        });
    }

    function fetchCurrentGroupRequests(){

        var url = Settings.url + "GetStoredProc?StoredProc=social_mygroups_readlist&params=(" + GlobalSvc.getUser().SupplierID + "|'"+GlobalSvc.getUser().UserID+"')" ;
        $http({method : 'GET', url : url }).success(function(data){
            for(var i = 0; i < data.length; i++){
                if(data[i].GroupID === parseInt($routeParams.id)){
                    var size = getSize();
                    if (data[i].image) {
                        data[i].image = Settings.imageUrl + '?id=' + data[i].image + '&supplierID=' + GlobalSvc.getUser().SupplierID + '&width=' + size + '&height=' + size;
                    } else {
                        data[i].image = 'img/groups.png';
                    }
                    $scope.currentGroup = data[i];
                    if($scope.currentGroup.isAdmin){
                        $scope.$emit('right',{label: 'Edit' , icon : 'fa fa-paint-brush', href : '#/groupedit/'+$scope.currentGroup.GroupID});
                    }
                    $scope.$emit('left',{label: 'Back' , icon : 'fa fa-chevron-left', onclick: function(){window.history.back();} });
                    sessionStorage.setItem('currentCard', JSON.stringify(data[i]));
                    fetchmembers();
                    break;
                }
            }
        });
    }

    function savemembers(idx){
        var type = '';
        var postObj = {
            SupplierID : GlobalSvc.getUser().SupplierID,
            GroupID : $scope.members[idx].GroupID,
            UserID : $scope.members[idx].UserID
        };
        if($scope.members[idx].Deleted === true){
            if(!confirm("Are you sure want to remove this person?")) return;
            type = 'delete';
            postObj.Accepted = false;
        }else{
            type = 'update';
            postObj.Accepted = true;
        };
        var url = Settings.url + 'View/ModifyAll?table=GroupUsers&type='+type;
        GlobalSvc.postData(url,
           postObj,
           function(){
               $scope.$emit('UNLOAD');
               $scope.requestCounter = $scope.requestCounter === 0 ? $scope.requestCounter : $scope.requestCounter - 1;
               if(!$scope.members[idx].Deleted){
                    $scope.members[idx].Accepted = true;
                    //$scope.successMsg = $scope.members[idx].Name + ' has been accepted into the group';
                    $alert({ content:  $scope.members[idx].Name + ' has been accepted into the group', duration: 3, placement: 'top-right', type: 'success', show: true});
                }else{
                   $alert({ content:  $scope.members[idx].Name + ' has been removed from the group', duration: 3, placement: 'top-right', type: 'info', show: true});
                   $scope.members.splice(idx,1);
                }
               //$route.reload();
               $scope.$apply();
           },
           function(err){
               $scope.$emit('UNLOAD');
               $scope.errorMsg = data;
               $scope.$apply();
       },
       'GroupUsers',type,false,true);
    };

    $scope.memberapproved = function(idx){
        savemembers(idx);
    };

    $scope.memberremoved = function(idx){
        $scope.members[idx].Deleted = true;
        savemembers(idx);
    };

    $scope.memberClicked =  function(groupID, userID, tab){
        //if($scope.members[idx].Accepted === false) return;
        sessionStorage.setItem('myCheckinBackURL','/groups' + '/' + groupID + '/' + tab);
        $location.path('/mycheckins/' + userID);
    };
    $scope.groupClicked = function(){
    	(localStorage.removeItem('currentGroupID'));
    	(localStorage.removeItem('currentGroup'));
    	$location.replace("#/groups");
    };
    function fetchEvents(){
        var url = Settings.url + "GetStoredProc?StoredProc=social_events_readlist&params=("+GlobalSvc.getUser().SupplierID+"|" + $scope.currentGroup.GroupID + ")";
        $http({method : 'GET', url : url}).success(function(json){
            var eventObj = {};
            for(var i = 0; i < json.length; i++){
                var DateObject = GlobalSvc.getSplitDate(json[i].DueDate);
                eventObj.title = DateObject.hours + ':' + ((DateObject.minutes > 9) ? DateObject.minutes : '0'+DateObject.minutes ) + ((DateObject.hours > 12) ? 'pm' : 'am'  ) + ' - ' + json[i].Subject ;
                eventObj.starts_at = new Date(DateObject.yyyy,(DateObject.mm - 1),DateObject.dd,DateObject.hours,DateObject.minutes,DateObject.seconds,0);
                var splitDuration = [0,0];
                //this deals with the Spliting of Hours and Minutes of the Duration to add on to the End Time
                if (json[i].Duration.toString().indexOf('.') !== -1)
                    splitDuration = json[i].Duration.toString().split('.');
                else
                    splitDuration[0] = json[i].Duration;
                console.log(splitDuration);
                eventObj.ends_at = new Date(DateObject.yyyy,(DateObject.mm - 1),DateObject.dd,(DateObject.hours + parseInt(splitDuration[0]) ),(DateObject.minutes + parseInt(splitDuration[1])),DateObject.seconds,0);
                eventObj.type = 'info';
                eventObj.allDay = false;
                eventObj.event = json[i];
                $scope.events.push(eventObj);
                eventObj = {};
            };
        }).error(function(err){
            errorMsg = "Issue " + err;
        });
    }

    $scope.newEventClicked = function(){
        $scope.eventtype = 'new';
        $scope.eventModal = $modal({scope: $scope, template: 'js/core/modal/newEventModal.html', show: true});
        $scope.event = {
            SupplierID : GlobalSvc.getUser().SupplierID,
            CreatedBy  : GlobalSvc.getUser().UserID,
            CreatedOn  : moment(),
            DueDate    : '',
            Duration   : 0,
            GroupID    : $scope.currentGroup.GroupID,
            EventID    : GlobalSvc.getGUID(),
            Notes: "",
            Repeat: 0,
            RepeatPeriod: "",
            Subject: "",
            duetime : new Date(),
            duedate : new Date()
        };
    };

    $scope.saveEvent = function(){
        var type = '';
        if($scope.event.Deleted === true){
            if(!confirm("Are you sure you want to delete this event?")) return;
            type = 'delete';
            $scope.event.DueDate = GlobalSvc.getTodaysDate();
        }else{
            type = 'update';
            if($scope.event.Subject === ""){$scope.errMsg = "Please enter an event name"; return;};
            if($scope.event.Notes === ""){ $scope.errMsg = "Please enter an event description"; return;};
            if($scope.event.Duration === 0 || $scope.event.Duration < 0){ $scope.errMsg = "Please enter the event's duration  Duration such as 1.23 for 1 hour 23 minutes"; return;};
            if(isNaN($scope.event.Duration)){ $scope.errMsg = "Please enter the a numeric value for Duration such as 1.23 for 1 hour 23 minutes"; return;};
            var DueDate = moment($scope.event.duedate);
            var DueTime = moment($scope.event.duetime);
            $scope.event.duedate = DueDate.format('YYYY-MM-DD');
            $scope.event.duetime = DueTime.format('HH:mm:ss');
            $scope.event.DueDate = ($scope.event.duedate + ' ' + $scope.event.duetime);
            $scope.event.CreatedOn = moment($scope.event.CreatedOn).format('YYYY-MM-DD HH:mm:ss') ;

        }
        delete $scope.event.duedate;
        delete $scope.event.duetime;
        delete $scope.errorMsg;
        delete $scope.successMsg;
        var url = GlobalSvc.resturl() + 'View/ModifyAll?table=GroupEvents&type='+type;
        GlobalSvc.postData(url,
            $scope.event,
            function(){
                $route.reload();
                $scope.eventModal.$promise.then($scope.eventModal.hide);
                $scope.$emit('UNLOAD');
                var successMsg = '';
                if($scope.event.Deleted){
                    successMsg = 'Event Deleted OK';
                }else{
                    successMsg = 'Event Saved OK';
                }
                $alert({ content:   successMsg, duration: 5, placement: 'top-right', type: 'success', show: true});
                $scope.$apply();
               },
            function(err){
                $scope.$emit('UNLOAD');
                var errmsg = '';
                if($scope.event.Deleted){
                     errmsg = 'Error Deleting Event...';
                }else{
                     errmsg = 'Error Saving Event...';
                }
                $alert({ content:   errmsg, duration: 5, placement: 'top-right', type: 'danger', show: true});
                $scope.$apply();
            },
       'GroupsEvents','MODIFY',false,true);
    };

    $scope.deleteEvent = function(){
        $scope.event.Deleted = true;
        $scope.saveEvent();
    };

    $scope.eventClicked = function(event) {
        /*
         * Safari works the date object differntly
         * You first Need to Remive the Milliseconds, Split The Date from the time,
         * Split the date, rearrange the date to mm/dd/yyyy for reason known to safare
         * then concatinate the Date and time back together
         *
         */
        //$scope.$emit('LOAD');
        $scope.event  = event.event;
        $scope.eventtype = $scope.event.Subject;
        var change_date = $scope.event.DueDate.split('.')[0];
        var splitDate = change_date.split(" ");
        var DateFormatArray = splitDate[0].split("-");
        change_date = DateFormatArray[1] + "/" + DateFormatArray[2] + "/" + DateFormatArray[0] + " " + splitDate[1];
        var date = new Date(change_date);
        $scope.event.duedate = date;
        $scope.event.duetime = date,
        $scope.eventModal = $modal({scope: $scope, template: 'js/core/modal/newEventModal.html', show: true})
        //$scope.$emit('LOAD');
        console.log($scope.event);
    };

    function constructor(){
        window.scrollTo(0, 0);
        $scope.groupIMG = 'none';
        if ($routeParams.id && !$routeParams.requests) {
        	localStorage.setItem('currentGroupID', $routeParams.id);
        	if(!localStorage.getItem('currentGroup')){
        		localStorage.setItem('currentGroup', sessionStorage.getItem('currentCard'));
        	}
            $scope.mode = 'form';
            $scope.view = $routeParams.view === undefined ? 'dashboard' : $routeParams.view;
            $scope.currentGroup = JSON.parse(localStorage.getItem('currentGroup'));
            $scope.$emit('bottom-left',{label: 'Groups' , icon : 'fa fa-chevron-left', onclick: function(){(localStorage.removeItem('currentGroup'));(localStorage.removeItem('currentGroupID'));location.replace("#/groups");} });
            if($scope.currentGroup.isAdmin){
                $scope.$emit('right',{label: 'Edit' , icon : 'fa fa-paint-brush', href : '#/groupedit/'+ $routeParams.id});
            }
            $scope.$emit('heading',{heading: $scope.currentGroup.Name , icon : 'fa fa-users'});
            if($routeParams.view === 'members'){
                $scope.view = 'dashboard';
                $scope.$emit('LOAD');
                fetchmembers();
            }else if($routeParams.view === 'events'){
                //initCalendar();
                fetchEvents();
            }else{
                $scope.view = 'dashboard';
                fetchTimeline();
            }
        } else if($routeParams.requests){
              $scope.mode = 'form';
              $scope.view = 'members';
              fetchCurrentGroupRequests();
        } else {
        	if(localStorage.getItem('currentGroupID')){
        		$location.path('/groups/' + localStorage.getItem('currentGroupID'));
        		return;
        	 }
            $scope.mode = 'list';
            $scope.$emit('heading',{heading: 'My Groups' , icon : 'fa fa-users'});
            $scope.$emit('right',{label: 'Create Group' , icon : 'fa fa-plus-circle', href : '#/groupedit/new'});
        }

    }
    constructor();
});
