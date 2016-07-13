coreApp.service("UserCodeSvc", function(DaoSvc){
    this.userExit = JSON.parse(sessionStorage.getItem('userExit'));

    this.init = function(){

        if(!$.isEmptyObject(this.userExit) ) return;

        this.userExit = {};
        DaoSvc.openDB();
        var $this = this;
        DaoSvc.cursor('UserCode',
            function(json) {
                $this.userExit[json.UserExitID] = json;
            },
            function(err){
                this.userExit = [];
                sessionStorage.setItem('userExit','[]');
            },function(){
                this.userExit = $this.userExit;
                sessionStorage.setItem('userExit',JSON.stringify(this.userExit));
            }
        );
    };

    this.getCode = function(userExitID){
        this.init();
        if (!this.userExit[userExitID]) return undefined;
        return this.userExit[userExitID].Code;
    };

});
