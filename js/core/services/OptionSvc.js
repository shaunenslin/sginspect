coreApp.service("OptionSvc", function(DaoSvc,UserCodeSvc, Settings, $http){
    this.options = JSON.parse(sessionStorage.getItem('optioninfo'));

    this.init = function(onComplete){
        var dbOpened = function(){
          DaoSvc.cursor('Options',
            function(json) {
                $this.options[json.Name] = json;
            },
            function(err){
                fetchOptionsHttp($this);
            },function(){
                optionsLoaded($this);
            }
          );
        };

        if(!$.isEmptyObject(this.options) ) {
          if (onComplete) setTimeout(function() { onComplete(); }, 13);
          return;
        }
        this.onComplete = onComplete;
        this.options = {};
        var $this = this;
        DaoSvc.openDB(dbOpened);
    };

    function optionsLoaded($this){
        this.options = $this.options;
        sessionStorage.setItem('optioninfo',JSON.stringify(this.options));
        UserCodeSvc.init();
        if ($this.onComplete) setTimeout(function() { $this.onComplete(); }, 13);
    }

    /*
     * Fetch Online if no offline options found
     */
    function fetchOptionsHttp($this){
        var user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) return;
        if (!user.SupplierID) return;

        var url = Settings.url + "Get?method=" + "&SupplierID="+ user.SupplierID;;
        $http({method: 'GET', url: url})
        .success(function(json) {
            for (var x=0; x< json.length; x++){
                $this.options[json[x].Name] = json[x];
            }
            optionsLoaded($this);
            console.log('Options built from HTTP');
            save(json);
        })
        .error(function(data, status, headers, config) {
            optionsLoaded($this);
        });
    }

    /*
     * Since we got options online, try save locally for next time
     */
    function save(jsonarray){
        try {
            DaoSvc.putMany(jsonarray,
                'Options',
                undefined,
                function (tx) {
                    console.log('Options updated ok from http');
                });
        } catch (err){
            console.log('Error updating options from http');
        }
    }

    this.getBoolean = function(Name, defaultVal){
        this.init();
        try {
            if (defaultVal !== true && defaultVal !== false){
                console.log('optionSvc.getBoolean for ' + Name + ' does not have a correct defaultVal, pelase correct, defaulting to false');
                defaultVal = false;
            }
            if (!this.options[Name]) return defaultVal;
            if (this.options[Name].Value.toUpperCase() === 'TRUE') return true;
            if (this.options[Name].Value.toUpperCase() === 'FALSE') return false;
            if (this.options[Name].Value === '1') return true;
            if (this.options[Name].Value === '0') return false;
            return defaultVal;
        } catch (err){
            return defaultVal;
        }
    };

    this.getText = function(Name, defaultVal){
        this.init();
        if (!this.options[Name]) return defaultVal;
        return this.options[Name].Value;
    };
});
