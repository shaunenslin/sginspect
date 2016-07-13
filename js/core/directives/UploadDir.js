
coreApp.directive('upload', function(GlobalSvc, $http, Settings) {
    function convert(scope){
        scope.butLabel = 'Reading data...';
        var lines = scope.data.split('\n');
        
        if (lines.length < 3){
            alert('no data found :-(');
            return;
        }
        
        var objects = [];
        
        scope.headings = lines[0].split(',');
        for (var x=1; x<lines.length; x++){
            var obj = {};
            var fields = lines[x].split(',');
            if (fields.length < 2) continue;
            for (var y=0; y<fields.length; y++){
                var heading = scope.headings[y];
                var value = fields[y];
                //remove CRLF
                if (heading.charCodeAt(heading.length-1) === 13) 
                    heading = heading.substring(0,heading.length-1);
                if (value.charCodeAt(value.length-1) === 13) 
                    value = value.substring(0,value.length-1);
                obj[heading] = value;
            }
            objects.push(obj);
        }
        //Create result headings
        scope.resultheadings = [];
        scope.resultheadings.push('status');
        scope.resultheadings.push('msg');
        for (var y=0; y<scope.headings.length; y++){
            scope.resultheadings.push(scope.headings[y]);
        }
        scope.results = [];
        sendRow(0, objects, scope);

    };
    
    function sendRow(idx, objects, scope){
        if (idx >= objects.length){
            alert('finished');
            scope.$apply();
            scope.butLabel = 'Upload';
            return;
        }
        scope.butLabel = 'Sending row ' + (idx + 1) + ' of ' + objects.length ;
        scope.$apply();
        save(idx, objects, scope);
    };
    
    function save (idx, objects, scope){
        var url = '';
        //var type = CurrentRoute.index === 'new' ? 'insert' : 'update';
        var url = GlobalSvc.resturl() + 'View/ModifyAll?table=' + scope.table + '&type=insert';
        console.log(url);
        var data = GlobalSvc.sanitiseData(objects[idx]);
        var result = {};
        for (prop in objects[idx]){
            result[prop] = objects[idx][prop];
        }
        GlobalSvc.postData(
            url,
            data,
            function(){
                result.status = 'OK';
                result.msg = '';  
                
                scope.results.push(result);
                idx += 1;
                sendRow(idx, objects, scope);
            },
            function(err, err2, err3, err4){
                var all = err.getAllResponseHeaders();
                var errText = err.responseText;
                result.status = 'ERROR';
                result.msg = getError(err.responseText);                        
                scope.results.push(result);
                idx += 1;
                sendRow(idx, objects, scope);
            },
            scope.table,
            'ModifyAll'    
        );        
    };
    
    function getError(msg){
        if (msg.indexOf('[ODBC SQL Server Driver]') > 0) {
            var newmsg = msg.substring(msg.indexOf('[ODBC SQL Server Driver]'));
            newmsg = newmsg.substring(0,newmsg.indexOf('</div>'));
            return newmsg;
        } else {
            return msg;
        }
    }
    
    return {
        restrict: "E",
        scope: {
            label: '@',
            table: '@',
            afterUpload: '='
        },
        template: 
            '<h3>{{label}}</h3><input type="file" id="file" name="file"/>' + 
            '<button ng-click="upload()" class="btn btn-primary" style="margin:3px;">Upload <span class="glyphicon glyphicon-chevron-up"></span></button>' +
            '<div>' + 
            '   <table class="table table-striped table-hover table-bordered"">' + 
            '       <tr>' +
            '           <th ng-repeat="field in resultheadings">{{field}}</th>' +
            '       </tr>' +
            '       <tr ng-repeat="row in results">' +
            '           <td ng-repeat="field in resultheadings">{{row[field]}}</td>' +
            '       </tr>' +
            '   </table>' +
            '</div>',
        link: function(scope, element, attrs) {
            scope.butLabel = 'Upload';
            scope.upload = function(){                
                var f = document.getElementById('file').files[0], 
                        r = new FileReader();
                r.onloadend = function(e){
                    scope.data = e.target.result;
                    convert(scope);
                };
                r.readAsBinaryString(f);
            };
        }
    };});