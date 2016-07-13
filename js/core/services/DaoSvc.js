//var daoSvc = (function(){
coreApp.service("DaoSvc", function(Settings,$rootScope){

    //var instance;
    //function instanceObj() {
    this.openeded = false;
    var g_pricelistSortField = 'Description';

    this.getKey = function(table, item){
        if (!this.idx) this.idx = this.findIndex(Settings.tableKeys,'table',table);
        if (this.idx === -1) {
            alert('Problem, you need Settins.tableKeys defined to define keys and indexes for table ' + table);
            return;
        }
        var tbl = Settings.tableKeys[this.idx];
        //var tbl = Settings.tableKeys[this.idx];
        return tbl.getKey(item);
    };

    this.getIndex = function(table, index, item){
        if (!this.idx) this.idx = this.findIndex(Settings.tableKeys,'table',table);
        var tmp_idx = this.findIndex(Settings.tableKeys,'table',table);
        //if (this.idx === -1) {
            //alert('Problem, you need Settins.tableKeys defined to define keys and indexes for table ' + table);
         //   return;
        //}
        var tbl = Settings.tableKeys[tmp_idx];
        //if no index defined, return nothing
        if (!tbl['index' + index]) return undefined;
        //else runt the index<X> function
        return tbl['index' + index](item);
    };

    this.get = function (table, key, ponsuccessread, ponerror, poncomplete) {
        if (g_indexedDB)
            this.idbget(table, key, ponsuccessread, ponerror, poncomplete);
        else
            this.sqlget(table, key, ponsuccessread, ponerror, poncomplete);
    };

        /*
             * pass in a jsonobject and
             */
    this.put = function (json, table, key, ponsuccesswrite, ponerror, poncomplete) {
        if ((table === 'productCategories2') && (!json.p))
                json.p = 'PC';

        delete this.idx; //needed so we refresh durning getIndex  ()
        if (g_indexedDB)
            this.idbput(json, table, key, ponsuccesswrite, ponerror, poncomplete);
        else
            this.sqlput(json, table, key, ponsuccesswrite, ponerror, poncomplete);
    };

    /*
    * pass in a jsonobject and
    */
    this.putMany = function (items, table, ponsuccesswrite, ponerror, poncomplete) {
        if (table==='DisplayFields') items = this.tempCorrection(items);
        if (!items) return;
        if (items.length===0) return;

        var idx = this.findIndex(Settings.tableKeys,'table',table);
        if (idx === -1) {
            alert('Problem, you need Settins.tableKeys defined to define keys and indexes for table ' + table);
            return;
        }
        var tbl = Settings.tableKeys[idx];
        for (var x=0; x<items.length; x++){
            var item = items[x];
            //check for deleted as a string and convert to boolean
            if (item.Deleted){
                if (item.Deleted === "0") item.Deleted = false;
                if (item.Deleted === "1") item.Deleted = true;
            }
            if (!item.key) item.key = tbl.getKey(item);
        }
       delete this.idx;
        if (g_indexedDB)
            this.idbputMany(items, table, ponsuccesswrite, ponerror, poncomplete);

        else
            this.sqlputMany(items, table, ponsuccesswrite, ponerror, poncomplete);
    };

    /*
     * Below only needed till PHP is fixed
     * @param {type} items
     * @returns {unresolved}
     */
    this.tempCorrection = function (items){
        for (var x=0; x<items.length; x++){
            if (items[x].Visible==='0') items[x].Visible = false;
            else if (items[x].Visible==='1') items[x].Visible = true;

            if (items[x].ReadOnly==='0') items[x].ReadOnly = false;
            else if (items[x].ReadOnly==='1') items[x].ReadOnly = true;

            if (items[x].Mandatory==='0') items[x].Mandatory = false;
            else if (items[x].Mandatory==='1') items[x].Mandatory = true;

            if (!isNaN(parseInt(items[x].SortOrder))) items[x].SortOrder = parseInt(items[x].SortOrder);
        }
        return items;
    };

    this.index = function (table, key, idx, ponsuccessread, ponerror, poncomplete) {
        if (g_indexedDB)
            this.idbindex(table, key, idx, ponsuccessread, ponerror, poncomplete);
        else
            this.sqlindex(table, key, idx, ponsuccessread, ponerror, poncomplete);
    };

    this.indexsorted = function (table, key, idx, sortidx, ponsuccessread, ponerror, poncomplete) {
        if (g_indexedDB)
                //TODO: implement an idbindexsorted then we can implement below. for indexeddb we just call index for now
            this.idbindexsorted(table, key, idx,sortidx, ponsuccessread, ponerror, poncomplete);
        else
            this.sqlindexsorted(table, key, idx, sortidx, ponsuccessread, ponerror, poncomplete);
    };


    this.cursor = function (table, ponsuccessread, ponerror, poncomplete) {
        if (g_indexedDB)
            this.idbcursor(table, ponsuccessread, ponerror, poncomplete);
        else
            this.sqlcursor(table, ponsuccessread, ponerror, poncomplete);
    };

    this.count = function (table, key, index,  poncomplete, ponerror) {
        if (g_indexedDB)
            this.idbcount(table, key, index,  poncomplete, ponerror);
        else
            this.sqlcount(table, key, index,  poncomplete, ponerror);
    };

    this.fetchRoutesByDate = function (selectedDate, userid, ponsuccessread, ponerror, poncomplete) {
        if (g_indexedDB) {
            this.idFetchRoutesByDate(selectedDate, userid, ponsuccessread, ponerror, poncomplete);
        } else {
            this.sqlFetchRoutesByDate(selectedDate, userid, ponsuccessread, ponerror, poncomplete);
        };
    };

    this.fetchDeliveryDetails = function (podID, accountID, ponsuccessread, ponerror, poncomplete) {
        if (g_indexedDB) {
            this.idFetchDeliveryDetails(podID, accountID, ponsuccessread, ponerror, poncomplete);
        } else {
            this.sqlFetchDeliveryDetails(podID, accountID, ponsuccessread, ponerror, poncomplete);
        };
    };

    this.fetchPricelist = function (searchText, sortBy, ponsuccessread, ponerror, poncomplete, offset, limit, warehouse) {

    	try {

    		g_pricelistSortField = 'Description';
    		if (g_indexedDB)
    			//TODO: implement offset / limit in indexeddb
    			this.idbFetchPricelist(searchText, sortBy, ponsuccessread, ponerror, poncomplete, offset, limit, warehouse);
    		else
    			this.sqlFetchPricelist(searchText, sortBy, ponsuccessread, ponerror, poncomplete, offset, limit, warehouse);

    	} catch (e) {

    		g_pricelistSortField = 'Description';
    		(g_indexedDB ? this.idbFetchPricelist : this.sqlFetchPricelist)(searchText, sortBy, ponsuccessread, ponerror, poncomplete, offset, limit, warehouse);
    	}
    };

    /*
    * The first method called and is opens the database for the page
    */
    this.openDB = function (pdbopened) {
       var isIE = function() {
           var tmp = document.documentMode;
           // Try to force this property to be a string.
           try{
                   document.documentMode = "";
           } catch(e){
           }
           // If document.documentMode is a number, then it is a read-only property, and so
           // we have IE 8+.
           // Otherwise, if conditional compilation works, then we have IE < 11.
           // Otherwise, we have a non-IE browser.
           result = typeof document.documentMode === "number" ? !0 : eval("/*@cc_on!@*/!1");
           // Switch back the value to be unobtrusive for non-IE browsers.
           try {
               document.documentMode = tmp;
           }catch(e){
           }
           return result;
       };

       g_indexedDB = false;
       //if (isIE()) g_indexedDB = true;
    //    if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
    //      g_indexedDB = true;
    //    } else if (navigator.appName === "Netscape" && navigator.vendor !== 'Google Inc.') {
    //      g_indexedDB = true; //Edge
    //    }

        // Firefox 1.0+
        var isFirefox = typeof InstallTrigger !== 'undefined';
        // Internet Explorer 6-11
        var isIE = /*@cc_on!@*/false || !!document.documentMode;
        // Edge 20+
        var isEdge = !isIE && !!window.StyleMedia;

        g_indexedDB = isFirefox || isIE || isEdge;
        console.log('Opening ' + (g_indexedDB ? 'indexedDB!' : 'WebSQL!'));

       if (g_indexedDB)
           this.idbopenDB(pdbopened);
       else
           this.sqlopenDB(pdbopened);
       this.openeded = true;
    };

    /*
         * d
         */
    this.deleteDB = function (pondbdeleted) {
        var seq = localStorage.getItem('sequenceNumber');
        var seqday = localStorage.getItem('sequenceDay');

        if (g_indexedDB)
            this.idbdeleteDB(pondbdeleted);
        else
            this.sqldeleteDB(pondbdeleted);

        //reset sequence number
        if (seq) localStorage.setItem('sequenceNumber',seq);
        if (seqday) localStorage.setItem('sequenceDay',seqday);
    };

    this.clear = function (table) {
        if (g_indexedDB)
            this.idbclear(table);
        else
            this.sqlclear(table);
    };
    this.deleteItem = function (table, key, idx, ponerror, poncomplete) {
        if (g_indexedDB)
            this.idbdeleteItem(table, key, idx, ponerror, poncomplete);
        else
            this.sqldeleteItem(table, key, idx, ponerror, poncomplete);
    };

    this.clearBasket = function (table, accountID, type, ponerror, poncomplete) {
        if (g_indexedDB)
            this.idbclearBasket(table, accountID, type, ponerror, poncomplete);
        else
            this.sqlclearBasket(table, accountID, type, ponerror, poncomplete);
    };

     /***************** Indexed DB ********************************************************************************
         * this method is used to read the database.
         * to be be consistent for indexeddb and websql we will trigger an event when we have read the data
         *************************************************************************************************************/
    this.idbget = function (table, key, ponsuccessread, ponerror, poncomplete) {
        //TODO - fix this...
        if (table === 'tree') table = 'Tree';


        //get the local user and enter the userid on the screen
        var objectStore = this.db.transaction(table).objectStore(table);
        var request = objectStore.get(key);
        request.onerror = function (event) {
            ponerror("No record found");
        };
        request.onsuccess = function (event) {
            if (event.target.result === undefined) {
                if (ponerror !== undefined)
                        ponerror("No record found");
            } else {
                if (ponsuccessread !== undefined)
                        ponsuccessread(event.target.result);
            }
        };
    };

    /*
         * pass in a jsonobject and
         */
    /*
         * pass in a jsonobject and
         */
    this.idbputMany = function (json, table, ponsuccesswrite, ponerror, poncomplete) {
        var $this = this;
        this.idbputManyRecurse(0, json, table, ponsuccesswrite, ponerror, poncomplete, $this);
    };

    this.idbputManyRecurse = function (idx, json, table, ponsuccesswrite, ponerror, poncomplete, $this) {
        if (idx === json.length) {
            if (poncomplete) poncomplete();
            return;
        }
        var item = json[idx];
        //var key = $this.getKeyField(item, table); --handled in parent function
        if (item.Deleted){
            if (item.Deleted === "0") item.Deleted = false;
            if (item.Deleted === "1") item.Deleted = true;
        }

        if (!item.key || item.key === undefined) item.key = $this.getKey(table,item);
console.log(table + ' key: ' + item.key);
        if (item.Deleted || item.del)
            $this.idbput(json[idx], table, item.key,
                function(){
                    idx += 1;
                    $this.idbputManyRecurse(idx, json, table, ponsuccesswrite, ponerror, poncomplete, $this);
                },
                ponerror, undefined);
        else
            $this.idbput(json[idx],
                table,
                item.key,
                function(){
                    idx += 1;
                    $this.idbputManyRecurse(idx, json, table, ponsuccesswrite, ponerror, poncomplete, $this);
                },
                ponerror, undefined);
    };


   /*
    * pass in a jsonobject and
    */
    this.idbput = function (json, table, keyf, ponsuccesswrite, ponerror, poncomplete) {
        var $this = this;
        // for index range purposes
        json.key = keyf;
        try {
            json.index1 = $this.getIndex(table,1,json);//getsqlIndex1(table, json);
            if(json.index1 === null){
               json.index1 = "";
            }
        } catch (err){
            console.log('index1 not defined correctly for ' + table);
        }

        try {
            json.index2 = $this.getIndex(table,2,json);//getsqlIndex1(table, json);
            if(json.index2 === null){
               json.index2 = "";
            }
        } catch (err){
            console.log('index2 not defined correctly for ' + table);
        }

        try {
            json.index3 = $this.getIndex(table,3,json);//getsqlIndex1(table, json);
            if(json.index3 === null){
               json.index3 = "";
            }
        } catch (err){
            console.log('index3 not defined correctly for ' + table);
        }

        try {
            json.index4 = $this.getIndex(table,4,json);//getsqlIndex1(table, json);
            if(json.index4 === null || json.index4 === undefined){
               json.index4 = "";
            }
        } catch (err){
            console.log('index4 not defined correctly for ' + table);
        }

        if ('Pricelists' === table)
                json[g_pricelistSortField] = 'PL:' + json.pl + ';' + g_pricelistSortField.toUpperCase() + ':' + json[g_pricelistSortField];

        var transaction;

        try {
            transaction = this.db.transaction(table, 'readwrite');
        } catch (err) {
            if (ponerror !== undefined)
                ponerror("error getting database");
            return;
        }

        transaction.oncomplete = function (event) {
            if (poncomplete !== undefined)
                poncomplete();
        };

        transaction.onerror = function (event) {
            if (ponerror !== undefined)
                ponerror(event);
        };

        var objectStore = transaction.objectStore(table);
        //json.key = key;

        try {
            var request = objectStore.put(json);
            request.onsuccess = function (event) {
                if (ponsuccesswrite !== undefined)
                    ponsuccesswrite();
            };
        } catch (err){
            console.log(err.toString());
        }
    };

    this.idbindexsorted = function (table, key, idx, sortidx, ponsuccessread, ponerror, poncomplete) {
        $this = this;
        $this.idbresult = [];
        $this.sortidx = sortidx;
        $this.sort = function(a,b){
            if (a[$this.sortidx] < b[$this.sortidx])
                return -1;
            else
                return 1;
        };
        var transaction = $this.db.transaction(table, "readwrite");
        //in complete, we need to sort before returning
        transaction.oncomplete = function (event) {
            $this.idbresult.sort($this.sort);
            for (var x=0; x < $this.idbresult.length; x++){
                if (ponsuccessread !== undefined) ponsuccessread($this.idbresult[x]);
            }
            if (poncomplete !== undefined) poncomplete();
        };
        transaction.onerror = function (event) {
            if (ponerror !== undefined)
                ponerror(event);
        };
        var noResult = true;
        var objectStore = transaction.objectStore(table);
        var index = objectStore.index(idx);
        var singleKeyRange = IDBKeyRange.only(key);
        index.openCursor(singleKeyRange).onsuccess = function (event) {

            var cursor = event.target.result;
            if (cursor) {
                noResult = false;
                $this.idbresult.push(cursor.value);
                // cursor.key is a name, like "Bill", and cursor.value is the whole object.
                //if (ponsuccessread !== undefined)
                //        ponsuccessread(cursor.value);
                cursor['continue']();
            } else if (ponerror && noResult) {
                ponerror(key);
            }

        };
    };

    this.idbindex = function (table, key, idx, ponsuccessread, ponerror, poncomplete) {

        if(key === null || key === "null"){
           key = "";
        }

        var transaction = this.db.transaction(table, "readwrite");
        transaction.oncomplete = function (event) {
            if (poncomplete !== undefined)
                poncomplete();
        };
        transaction.onerror = function (event) {
            if (ponerror !== undefined)
                ponerror(event);
        };
        var noResult = true;
        var objectStore = transaction.objectStore(table);
        var index = objectStore.index(idx);
        var singleKeyRange = IDBKeyRange.only(key);
        index.openCursor(singleKeyRange).onsuccess = function (event) {
            console.log('in');
            //var cursor = event.target.result;
            if (event.target.result) {
                noResult = false;
                // cursor.key is a name, like "Bill", and cursor.value is the whole object.
                if (ponsuccessread !== undefined)
                        ponsuccessread(event.target.result.value);
                event.target.result['continue']();
            } else if (ponerror && noResult) {
                ponerror(key);
            }

        };
    };

    this.idbcount = function (table, key, idx, poncomplete ,ponerror ) {
        var transaction = this.db.transaction(table, "readwrite");
        var counter = 0;
        transaction.oncomplete = function (event) {
            if (poncomplete !== undefined)
                poncomplete(counter);
        };
        transaction.onerror = function (event) {
            if (ponerror !== undefined)
                ponerror(event);
        };
        var noResult = true;
        var objectStore = transaction.objectStore(table);
        var index = objectStore.index(idx);
        var singleKeyRange = IDBKeyRange.only(key);
        index.openCursor(singleKeyRange).onsuccess = function (event) {
            console.log('in');
            var cursor = event.target.result;
            if (cursor) {
                console.log(cursor.value);
                counter += 1;
                cursor['continue']();
            } else if (ponerror && noResult) {
                ponerror(key);
            }

        };
    };

    this.idbcursor = function (table, ponsuccessread, ponerror, poncomplete) {
        var transaction = this.db.transaction(table, "readwrite");
        // Do something when all the data is added to the database.
        transaction.oncomplete = function (event) {
            if (poncomplete !== undefined)
                poncomplete();
        };

        transaction.onerror = function (event) {
            if (ponerror !== undefined)
                ponerror(event);
        };

        var objectStore = transaction.objectStore(table);
        objectStore.dao = this;
        /*if (key !== undefined) {
            var keyfrom = key;
            var keyto = key + '}}}';
            var boundKeyRange = IDBKeyRange.bound(keyfrom, keyto);
            objectStore.openCursor(boundKeyRange).onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    //$(document).trigger('rowreadOK',cursor.value);
                    if (ponsuccessread !== undefined)
                        ponsuccessread(cursor.value);
                    cursor['continue']();
                };
            };
        } else {*/
            objectStore.openCursor().onsuccess = function (event) {
                //var cursor = event.target.result;
                /* (cursor) {
                    //$(document).trigger('rowreadOK',cursor.value);
                    if (ponsuccessread !== undefined)
                        ponsuccessread(cursor.value);
                    cursor['continue']();
                };*/
                if (event.target.result) {
                    //$(document).trigger('rowreadOK',cursor.value);
                    if (ponsuccessread !== undefined)
                        ponsuccessread(event.target.result.value);
                    event.target.result['continue']();
                }
            };
        //};
    };

    /*
         * The first method called and is opens the database for the page
         */
    this.idbopenDB = function (pdbopened) {
        var $this = this;
        window.indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.indexedDB;
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

        var request = window.indexedDB.open(Settings.db, 24);
        request.onerror = function (event) {
            //g_alert("Error opening database");
            console.log("Error opening database");
        };

        request.onupgradeneeded = function (event) {
            console.log('upgrade needed');
            localStorage.clear();
            sessionStorage.clear();
            $this.db = event.target.result;
            $this.idbcreateTables($this, pdbopened);
        };

        request.onsuccess = function (event) {
            console.log("Database opened");
            $this.db = request.result;
            if (pdbopened) pdbopened();
        };
    };

    this.idbcreateTables = function($this, pdbopened){
        console.log('create tables');
        var objectStore;
        for(var i = 0; i < Settings.tableKeys.length; i++){
            try {
                $this.db.deleteObjectStore(Settings.tableKeys[i].table);
            } catch (error){
                console.log('could not delete table ' + error.toString());
            }
            try {
                objectStore = $this.db.createObjectStore(Settings.tableKeys[i].table, { keyPath: "key" });
            } catch (error) {
                console.log("Table Already exists " + Settings.tableKeys[i].table);
            }
            try {
                objectStore.createIndex("index1", "index1", { unique: false });
            } catch (error) {
                console.log("index 1 already exists" + error.toString());
            }
            try {
                objectStore.createIndex("index2", "index2", { unique: false });
            } catch (error) {
                console.log("index 1 already exists");
            }
            try {
                objectStore.createIndex("index3", "index3", { unique: false });
            } catch (error) {
                console.log("index 1 already exists");
            }
            console.log(Settings.tableKeys + " All OK " + Settings.tableKeys[i].table);
        }
        if (pdbopened) pdbopened();
    };


    this.idbdeleteDB = function (pondbdeleted) {
        localStorage.clear();
        sessionStorage.clear();
        var $this = this;
        var objectStoreLength = this.db.objectStoreNames.length;
        console.log(objectStoreLength);

        var clearObjectStore = function($this,x){
            if(x === objectStoreLength){
                if (pondbdeleted !== undefined) {
                    pondbdeleted();
                }else{
                    return;
                }
            }

            var table = db.objectStoreNames.item(x);
            var transaction = db.transaction(table, 'readwrite');
            try {
                var objectStore = transaction.objectStore(table);
                var objectStoreRequest = objectStore.clear();

                objectStoreRequest.onsuccess = function(event){
                    console.log("Success Clear:" + $this.db.objectStoreNames[x]);
                    x = x + 1;
                    clearObjectStore($this,x);
                };

                objectStoreRequest.onerror = function(error){
                    console.log("Error In Clear The DB");
                    x = x + 1;
                    clearObjectStore($this,x);
                };
                //$this.db.deleteObjectStore(objectStore);
            } catch (error) {
                console.log(error.toString());
                x = x + 1;
                clearObjectStore($this,x);
            }
        };

        //this.idbopenDB(function (){
        var DBOpenRequest = window.indexedDB.open(Settings.url, 24);

        DBOpenRequest.onsuccess = function(event) {
            //var db = DBOpenRequest.result;
            db = DBOpenRequest.result;
            clearObjectStore($this,0);
        };

        DBOpenRequest.oncomplete = function(){
            if (pondbdeleted !== undefined)
                    pondbdeleted();
        };



            /*var clearObjectStore = function($this,x){
                if(x > objectStoreLength){
                    if (pondbdeleted !== undefined) {
                        pondbdeleted();
                    }else{
                        return;
                    }
                }
                var table = $this.db.objectStoreNames.item(x);
                var transaction = $this.db.transaction(table, 'readwrite');
                try {
                    var objectStore = transaction.objectStore(table);
                    var objectStoreRequest = objectStore.clear();

                    objectStoreRequest.onSuccess = function(){
                        x = x + 1;
                        clearObjectStore($this,x);
                    };


                    //$this.db.deleteObjectStore(objectStore);
                } catch (error) {
                    console.log(error.toString());
                    x = x + 1;
                    clearObjectStore($this,x);
                }
            };
            clearObjectStore($this,0);*/


            /*for (var x = 0; x < $this.db.objectStoreNames.length; x++) {
                var table = $this.db.objectStoreNames.item(x);
                var transaction = $this.db.transaction(table, 'readwrite');
                try {
                    var objectStore = transaction.objectStore(table);
                    objectStore.clear();
                    //$this.db.deleteObjectStore(objectStore);
                } catch (error) {
                    console.log(error.toString());
                    //g_alert(error.toString());
                }
            }*/

            //if (pondbdeleted !== undefined)
                //    pondbdeleted();
        //});

    };

    this.idbclear = function (table) {
        poncomplete = this.oncomplete;
        var transaction = this.db.transaction(table, 'readwrite');
        transaction.oncomplete = function (event) {
            if (poncomplete !== undefined)
                poncomplete();
        };
        var objectStore = transaction.objectStore(table);
        objectStore.clear();

    };

    this.idbdeleteItem = function (table, key, idx, ponerror, poncomplete) {
        var transaction = this.db.transaction(table, 'readwrite');
        transaction.oncomplete = function (event) {
            if (poncomplete !== undefined)
                poncomplete();
        };

        var objectStore = transaction.objectStore(table);
        objectStore.dao = this;

        if (idx) {
            var index = objectStore.index(idx);
            var singleKeyRange = IDBKeyRange.only(key);
            var $this = this;
            index.openCursor(singleKeyRange).onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    $this.db.transaction(table, 'readwrite').objectStore(table)['delete'](cursor.value.key);
                    cursor['continue']();
                }
            };
        } else {
            this.db.transaction(table, 'readwrite').objectStore(table)['delete'](key);
        }
        /*
        //poncomplete = this.oncomplete;
        var transaction = this.db.transaction(table, 'readwrite');

        transaction.oncomplete = function (event) {
            if (poncomplete !== undefined)
                poncomplete();
        };
        var objectStore = transaction.objectStore(table);

        var request = objectStore.get(key);
        request.onerror = function (event) {
            ponerror("No record found");
        };
        objectStore['delete'](key);
        */
    };

    this.idbclearBasket = function (table, accountID, type, ponerror, poncomplete) {
        var transaction = this.db.transaction(table, 'readwrite');
        transaction.oncomplete = function (event) {
            if (poncomplete !== undefined)
                poncomplete();
        };

        var objectStore = transaction.objectStore(table);
        objectStore.dao = this;
        objectStore.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                if (cursor.value.AccountID === accountID && cursor.value.Type === type) {
                    db.transaction(table, 'readwrite').objectStore(table)['delete'](cursor.value.key);
                }

                cursor['continue']();
            }
        };

    };


    /**************************************** Web SQL **********************************************
     *
     ***********************************************************************************************/
    /*
     * this method is used to read the database.
     * to be be consistent for indexeddb and websql we will trigger an event when we have read the data
     */
    this.sqlget = function (table, key, ponsuccessread, ponerror, poncomplete) {
        this.db.transaction(function (tx) {
            tx.executeSql('SELECT [json] FROM ' + table + ' where keyf = ?',
                            [key],
                            function (tx, results) {
                                if (ponsuccessread !== undefined) {
                                    try {
                                        ponsuccessread(JSON.parse(results.rows.item(0).json));
                                    } catch (error) {
                                        if (ponerror !== undefined)
                                                ponerror("No record found");
                                    }
                                }
                            },
                            function (tx, e) {
                                if (ponerror !== undefined)
                                        ponerror();
                            });
        });
    };

    /*
     * pass in a jsonobject and
     */
    /*
     * pass in a jsonobject and
     */
    this.sqlput = function (item, table, keyf, ponsuccesswrite, ponerror, poncomplete){
        var $this = this;
        delete $this.idx;
        this.db.transaction(function (tx) {
            var idx = $this.findIndex(Settings.tableKeys,'table',table);
            var tbl = Settings.tableKeys[idx];
            var sql = 'INSERT or REPLACE INTO ' + table + '(keyf, json, index1, index2, index3, index4)' + 'VALUES (?,?,?,?,?,?)';
            tx.executeSql(sql,
                    [(item.key ? item.key : keyf ), JSON.stringify(item), $this.getIndex(table,1,item), $this.getIndex(table,2,item), $this.getIndex(table,3,item), $this.getIndex(table,4,item)],
                    function (tx, results) {
                        if (ponsuccesswrite !== undefined)
                                ponsuccesswrite();
                    },
                    function (tx, e) {
                        if (ponerror !== undefined)
                                ponerror(tx, e);
                    });
        });
    };

    /*
     * pass in a jsonobject and
     */
    this.sqlputMany = function (items, table, ponsuccesswrite, ponerror, poncomplete) {
        if (!items) return;
        var $this = this;

        this.db.transaction(function (tx) {
            for (var x=0; x<items.length;x++) {
                var item = items[x];
                if ((table === 'productcategories2') && (!item.p)) item.p = 'PC';
                var idx = $this.findIndex(Settings.tableKeys,'table',table);
                var tbl = Settings.tableKeys[idx];

                if (item.Deleted || item.del) {
                    $this.deleteItem(table, item.key, undefined, undefined, undefined);
                } else {
                    var sql = 'INSERT or REPLACE INTO ' + table + '(keyf, json, index1, index2,index3, index4) VALUES (?,?,?,?,?,?)';
                    tx.executeSql(sql, [item.key, JSON.stringify(item), $this.getIndex(table,1,item), $this.getIndex(table,2,item), $this.getIndex(table,3,item), $this.getIndex(table,4,item)]);
                }
            }
        },

        function (tx) {
            if (ponerror !== undefined) ponerror(tx);
        },
        function (){
            if (poncomplete !== undefined) poncomplete();
        });

    };

    /*
    * Builds a key field for each table type
    *
    this.getKeyField = function (item, table) {
        var keyf = '';
        switch (table) {
            case "DisplayFields":
                keyf = item.SupplierID + item.ID + item.Name;
                break;
            case "Options":
                keyf = item.SupplierID + item.Name;
                break;
            case "productcategories2":
                keyf = item.s + item.c;
                break;
            case "Tree":
                keyf = item.SupplierID + item.TreeID;
                break;
            case "ActivityTypes":
                keyf = item.SupplierID + item.EventID;
                break;
            case "productcategories2":
                keyf = item.s + item.c;
                break;
            case "WorkOrders" :
                keyf = item.orderidField;
                break;
            case "Functlocations" :
                keyf = item.functlocationField;
                break;
            case "ReasonCodes" :
                keyf = item.grdtxField;
                break;
        }
        return keyf.trim();
    };
        */

    //todo - turn these into proper functions
    /*function getsqlIndex1(table, item) {
        try {
            switch (table) {
                case 'productcategories2':
                    return item.p;
                    break;
                case 'DisplayFields':
                    return item.ID;
                    break;
                case 'Tree':
                    return item.Group;
                    break;
                case 'ShoppingCart':
                    return item.AccountID;
                    break;
                case 'ActivityTypes':
                    return item.EventID;
                    break;
                case 'WorkOrders' :
                    return item.orderTypeField;
                    break;
                case 'Functlocations' :
                    return item.supflocField;
                    break;
                case 'WorkItems' :
                    return item.activityField;
                    break;
                case 'ReasonCodes' :
                    return item.grundField;
                    break;
            }
        } catch (error) {
            return '';
        };
    };

    function getsqlIndex2(table, item) {
        try {
            switch (table) {
                case 'productcategories2':
                    return item.c;
                    break;
                case 'DisplayFields':
                    return item.SortOrder;
                    break;
                case 'Tree':
                    return item.ParentTreeID;
                    break;
                case 'ShoppingCart':
                    return item.ProductID;
                    break;
                 case 'WorkOrders':
                    return item.pmacttypeField;
                    break;
                case 'Functlocations' :
                    return item.funclocField;
                    break;
                case 'WorkItems' :
                    return item.workOrderID;
                    break;
                case 'ReasonCodes' :
                    return item.mandtField;
                    break;
            }
        } catch (error) {
            return '';
        };
    };

    function getsqlIndex3(table, item) {
        try {
            switch (table) {
                case 'productcategories2':
                    return item.des;
                case 'Tree':
                    return item.SortOrder;
                    break;
                case 'ShoppingCart':
                    return item.Description;
                    break;
                case 'WorkOrders' :
                    return item.funclocField;
                    break;
                case 'ReasonCodes' :
                    return item.werksField;
                    break;
            }
        } catch (error) {
            return '';
        };
    };

    function getsqlIndex4(table, item) {
        try {
            return '';
        } catch (error) {
            return '';
        };
    };

    function getsqlIndex4(table, item) {
        try {
            return '';
        } catch (error) {
            return '';
        };
    };*/

    function checkindex (idx){
        if (idx !== 'index1' && idx !== 'index2' && idx !== 'index3' && idx !== 'index4') {
                idx = 'index1'; // index can only be either Index1 or Index2. so default to index1 of not valid
                console.log('Issue with this index used, defaulting to index1');
        }
        return idx;
    }



    this.sqlindex = function (table, key, idx, ponsuccessread, ponerror, poncomplete) {

        var sqlstmt = (key) ? 'SELECT [json] FROM ' + table + ' where ' + checkindex(idx) + '= ?' : 'SELECT [json] FROM ' + table + ' where ' + checkindex(idx) + ' is ?';

        this.db.transaction(function (tx) {
            //tx.executeSql('SELECT [json] FROM ' + table + ' where ' + checkindex(idx) + '= ?', [key], function (tx, results) {
              tx.executeSql(sqlstmt, [key], function (tx, results) {
                if (ponsuccessread !== undefined) {
                    try {
                        var len = results.rows.length, i;
                        if (!len) {
                                ponerror(key);
                        }
                        for (i = 0; i < len; i++) {
                            ponsuccessread(JSON.parse(results.rows.item(i).json));
                        }
                        if (poncomplete !== undefined)
                                poncomplete();
                    } catch (error) {
                        if (ponerror !== undefined)

                                ponerror("No record found");
                    }
                }
            });
        });
    };

    this.sqlindexsorted = function (table, key, idx, sortidx, ponsuccessread, ponerror, poncomplete) {
        this.db.transaction(function (tx) {
            tx.executeSql('SELECT [json] FROM ' + table + ' where ' + checkindex(idx) + '= ? order by ' + checkindex(sortidx), [key], function (tx, results) {
                if (ponsuccessread !== undefined) {
                    try {
                        var len = results.rows.length, i;
                        if (!len) {
                                ponerror(key);
                        }
                        for (i = 0; i < len; i++) {
                            ponsuccessread(JSON.parse(results.rows.item(i).json));
                        }
                        if (poncomplete !== undefined)
                                poncomplete();
                    } catch (error) {
                        if (ponerror !==  undefined)
                                ponerror("No record found");
                    }
                }
            });
        });
    };

    this.sqlcount = function (table, key, idx, poncomplete, ponerror) {
        if (idx !== 'index1' && idx !== 'index2' && idx !== 'index3' && idx !== 'index4') {
                idx = 'index1'; // index can only be either Index1 or Index2. so default to index1 of not valid
                console.log('Issue with this index used, defaulting to index1');
        }
        this.db.transaction(function (tx) {
            tx.executeSql('SELECT count(keyf) as cnt FROM ' + table + ' where ' + idx + '= ?', [key], function (tx, results) {
                if (poncomplete !== undefined) {
                    try {
                        var len = results.rows.item(0).cnt;
                        if (len > 0)
                                poncomplete(len);
                        else
                                ponerror(0);
                    } catch (error) {
                        if (ponerror !== undefined)
                                ponerror("No record found");
                    }
                }
            });
        });
    };


    this.sqlcursor = function (table, ponsuccessread, ponerror, poncomplete) {
        this.db.transaction(function (tx) {
            tx.executeSql('SELECT [json] FROM ' + table, [], function (tx, results) {
                if (ponsuccessread !== undefined) {
                    try {
                        var len = results.rows.length, i;
                        for (i = 0; i < len; i++) {
                            ponsuccessread(JSON.parse(results.rows.item(i).json));
                        }
                        if (poncomplete !== undefined) {
                            if (len > 0)
                                poncomplete(len);
                            else
                                ponerror(0);
                        }

                    } catch (error) {
                        if (ponerror !== undefined)
                                ponerror("No record found");
                    }
                }
            });
        });
    };


    /*
     * The first method called and is opens the database for the page
     */
    this.sqlopenDB = function (onComplete) {
        this.db = openDatabase(Settings.db, '', 'MM database', 2 * 5000 * 5000);
        this.db.transaction(function (tx) {
            for(var i = 0; i < Settings.tableKeys.length; i++){
                    var createString = 'CREATE TABLE IF NOT EXISTS '+ Settings.tableKeys[i].table + ' (keyf, json, index1, index2, index3, index4, primary key (keyf))';
                   tx.executeSql(createString);
            }
        });
        if (onComplete) onComplete();
    };

    this.sqldeleteDB = function (pondbdeleted) {
        localStorage.clear();
        sessionStorage.clear();
        this.db.transaction(function (tx) {
            tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' and name <> '__WebKitDatabaseInfoTable__'", [], function (tx, results) {
                try {
                    var len = results.rows.length, i;
                    for (i = 0; i < len - 1; i++) {
                        var dropString = 'drop table if EXISTS '+ results.rows.item(i).name;
                        tx.executeSql(dropString);
                    }
                    if (pondbdeleted !== undefined) {
                        pondbdeleted();
                    }
                } catch (error) {
                    if (ponerror !== undefined)
                            ponerror("No record found");
                }
            });
        });
        if (pondbdeleted !== undefined) pondbdeleted();
    };

    this.sqlclear = function (table, poncomplete, ponerror) {
        this.db.transaction(function (tx) {
            tx.executeSql('delete FROM ' + table, [], function (tx, results) {
                if (poncomplete !== undefined) {
                    poncomplete();
                };
            });
        });
    };

    this.sqldeleteItem = function (table, key, idx, ponerror, poncomplete) {
        this.db.transaction(function (tx) {
            if (idx) if (idx.length===0) idx = undefined;
            if (idx) {
                tx.executeSql('delete FROM ' + table + ' where index1 = ?', [key], function (tx, results) {
                    if (poncomplete !== undefined) {
                        poncomplete();
                    };
                });
            } else {
                tx.executeSql('delete FROM ' + table + ' where keyf = ?', [key], function (tx, results) {
                    if (poncomplete !== undefined) {
                        poncomplete();
                    };
                });
            }
        });
    };

    this.findIndex = function (array, property, value){
        if (array===undefined) return -1;
        for (var x=0; x < array.length; x++){
            if (array[x][property] === value){
                //console.log('findindex ' + property + ':' + value + x);
                return x;
            }
        }
        return -1;
    };

    this.sqlFetchRoutesByDate =  function(selectedDate, userid, ponsuccessread, ponerror, poncomplete) {
        var query = 'SELECT distinct r.json, ' +
                    ' (SELECT count(*) FROM Orders where index3 = r.index1 and json like \'%"CreateDate":"' + selectedDate + '%\' and (index4=\'\' or ' +
                    ' index4=\'' + userid + '\' )) as numOfRouts, ord.index4 as UserID FROM Route r' +
                    ' inner join Orders ord on ord.index3 = r.index1 ' +
                    ' where ord.json like \'%"CreateDate":"' + selectedDate + '%\'';
            /* select only rautes for current user and selected date */
        console.log(query);

        this.db.transaction(function (tx) {
            tx.executeSql(query,[],
                function (tx, results) {
                    try {
                        var res = [];
                        //if (ponsuccessread) {
                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; ++i) {

                                var item = results.rows.item(i);
                                var route = JSON.parse(item.json);
                                route.numOfRouts = item.numOfRouts;
                                route.UserID = item.UserID;
                                res.push(route);
                            //ponsuccessread(route);
                            }
                        }
                        if (!results.rows.length && ponerror)
                            ponerror("No record found");

                        if (poncomplete)
                            poncomplete(res);

                    } catch (error) {

                        if (ponerror)
                            ponerror("No record found");
                    };
                });
            });
    };
	this.sqlFetchRouteDeliveries =  function(routeID, selectedDate, ponsuccessread, ponerror, poncomplete) {
        var query = 'SELECT distinct ord.json FROM Orders ord' +
                    ' where ord.json like \'%"RequiredByDate":"' + selectedDate + '%\' and index3 = \'' + routeID + '\'';

        console.log(query);

        this.db.transaction(function (tx) {

            tx.executeSql(query,[],
                function (tx, results) {
                    try {
                        var res = [];
                        //if (ponsuccessread) {
                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; ++i) {



                                var item = results.rows.item(i);
                                var deliv = JSON.parse(item.json);

                                res.push(deliv);
                                //ponsuccessread(route);
                            }
                        }

                        if (!results.rows.length && ponerror)
                            ponerror("No record found");

                        if (poncomplete)
                            poncomplete(res);

                    } catch (error) {

                        if (ponerror)
                            ponerror(error);
                    };
                });
            });
    };

    this.sqlFetchDeliveryDetails = function (podID, accountID, ponsuccessread, ponerror, poncomplete) {
        var query = 'SELECT distinct oi.json FROM OrderItems oi' +
                    ' where oi.index2=\'' + podID + '\' ';

        console.log(query);

        this.db.transaction(function (tx) {

            tx.executeSql(query,[],
                function (tx, results) {
                    try {
                        var res = [];
                        //if (ponsuccessread) {
                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; ++i) {



                                var item = results.rows.item(i);
                                var delivItem = JSON.parse(item.json);

                                res.push(delivItem);
                                //ponsuccessread(route);
                            }
                        }

                        if (!results.rows.length && ponerror)
                            ponerror("No record found");

                        if (poncomplete)
                            poncomplete(res);

                    } catch (error) {

                        if (ponerror)
                            ponerror("No record found");
                    };
                });
            });
    };

    this.idFetchDeliveryDetails = function (podID, accountID, ponsuccessread, ponerror, poncomplete) {
        var transaction = this.db.transaction('OrderItems');

        var delivResult = [];

        // Do something when all the data is added to the database.
        transaction.oncomplete = function (event) {

            if (poncomplete)
                poncomplete(delivResult);
        };

        transaction.onerror = function (event) {

            if (ponerror)
                ponerror(event);
        };

        var objectStore = transaction.objectStore('OrderItems');
        //var index = objectStore.index();

        objectStore.openCursor().onsuccess = function (event) {

            var cursor = event.target.result;

            if (cursor) {

                var pID = cursor.value.OrderID;
                var accID = cursor.value.AccountID;


                if (pID === podID && accID === accountID)
                    delivResult.push(cursor.value);




                cursor['continue']();

            } else if (ponerror) {

                ponerror("No record found.");
            }
        };
    };

    this.sqlFetchPricelist = function(searchWords, sortBy, ponsuccessread, ponerror, poncomplete, offset, limit, warehouse) {

        isBarCodeSearch = (searchWords.length == 1) && (searchWords[0].indexOf('b":"') != -1);

        this.db.transaction(function (tx) {
        	//var query = 'SELECT json FROM Pricelists WHERE index1 = ? AND ';
        	var includeCategoryToggle = 'off'; // (sessionStorage.getItem('expandcategory')) ? 'on' : 'off';
        	var query = '';
        	if (includeCategoryToggle != 'on') {
                    query = 'select p.json, b.json as BasketInfo, s.index3 as Stock from Pricelists p ' +
                            'left outer join ShoppingCart b on p.index3 = b.index2 and b.index1 = ? ' +
                            (Settings.vanandWareOrder ? 'inner' : 'left outer') + ' join stock s on s.index1 = p.index3 and s.index2 = ? ' +
                            'WHERE p.index1 = ? AND ';
                    for (var i = 0; i < searchWords.length; ++i) {

                            query += 'p.json like \'%' + searchWords[i].replace(' ', '%') + '%\'';
                            if (i < searchWords.length - 1)
                                    query += ' AND ';
                    }
        	} else {
        		// this search will include all other products in the products category
        		query = 'select p.json, b.json as BasketInfo, s.index3 as Stock  ' +
						' from Pricelists p  ' +
						' left outer join ShoppingCart b on p.index3 = b.index2 and b.index1 = ?  ' +
						(Settings.vanandWareOrder ? 'inner' : 'left outer') + ' join stock s on s.index1 = p.index3 and s.index2 = ?  ' +
						' WHERE p.index1 = ?  ' +
						'   AND p.index4 in ( ' +
						'       select distinct p.index4 ' +
						'       from Pricelists p  where ' +
						'p.json like \'%';

        		for (var i = 0; i < searchWords.length; ++i) {
	        		query +=  searchWords[i];
	        		if (i < searchWords.length - 1)
            			query += ' ';
	        	}
	        	query += '%\')';
        	}

        	// limit 50 offset 0
        	query += ' ORDER BY p.' + (sortBy === 'ProductID' ? 'index3' : 'index2') + ' limit ' + limit + ' offset ' + offset;
        	console.log(query);
            var currentAccount = JSON.parse(sessionStorage.getItem('companyCache'));
            tx.executeSql(query,[currentAccount.AccountID, warehouse ? warehouse : currentAccount.BranchID, currentAccount.Pricelist],
            		function (tx, results) {
		                try {

                            if (results.rows.length==0 && ponerror)
		                		ponerror("No record found");

		                	if (ponsuccessread)
		                        for (var i = 0; i < results.rows.length; ++i) {
                                    //if (g_pricelistItemsOnPage < g_pricelistCurrentPricelistPage * g_numItemsPerPage - offset) {
                                        //if (g_pricelistItemsOnPage >= (g_pricelistCurrentPricelistPage - 1) * g_numItemsPerPage - offset) {
		                                    var product = JSON.parse(results.rows.item(i).json);
		                                    var barcode = searchWords[0].slice(4, searchWords[0].length);

                                            product.BasketInfo = JSON.parse(results.rows.item(i).BasketInfo || '{}');
                                            product.Stock = results.rows.item(i).Stock; // || '';


		                                    if ((!isBarCodeSearch) || (isBarCodeSearch && (product.b == barcode)))
		                                        ponsuccessread(product);
				                		//} else {
				                		//	++g_pricelistItemsOnPage;
				                		//}
				                	//} else {
				                	//	break;
				                	//}
		                        }



		                	if (poncomplete)
	                        	poncomplete();

		                } catch (error) {

		                    if (ponerror)
		                    	ponerror("No record found");
		                };
            		});
        });
    };

    this.idbFetchPricelist = function (searchWords, ponsuccessread, ponerror, poncomplete, offset, limit, warehouse) {

        var currentAccount = JSON.parse(sessionStorage.getItem('companyCache'));

    	var isProductFound = function(product) {

    	    if (product.del)
    	        return false;
            var isFound = true;

            if (!((searchWords.length == 1) && ('' == searchWords[0]))) {

            	// if there are search words

                var productId = new String(product.id).toLowerCase();
                var description = new String(product[g_pricelistSortField]).toLowerCase();

                for (var i = 0; i < searchWords.length; ++i) {

                    word = searchWords[i].toLowerCase();

                    isFound = isFound && ((productId.indexOf(word) != -1) || (description.indexOf(word) != -1));

                    if (!isFound)
                            break;
                }
            }

            return isFound;
    	};

    	var transaction = db.transaction('Pricelists', 'readonly');

        transaction.oncomplete = function (event) {

            if (poncomplete)
            	poncomplete();
        };

        transaction.onerror = function (event) {

            if (ponerror)
            	ponerror(event);
        };

        var objectStore = transaction.objectStore('Pricelists');
        var index = objectStore.index(g_pricelistSortField);

        var indexFieldPrefix = 'PL:' + currentAccount.Pricelist + ';' + g_pricelistSortField.toUpperCase() + ':';
    var keyRange = IDBKeyRange.bound(indexFieldPrefix, indexFieldPrefix + '}}}');

        index.openCursor(keyRange).onsuccess = function (event) {

        	if (g_pricelistItemsOnPage < g_pricelistCurrentPricelistPage * g_numItemsPerPage) {

	        	var cursor = event.target.result;

	        	if (cursor) {

	        		cursor.value[g_pricelistSortField] = cursor.value[g_pricelistSortField].replace(indexFieldPrefix, '');

	        		if (isProductFound(cursor.value)) {

		        		if (g_pricelistItemsOnPage >= (g_pricelistCurrentPricelistPage - 1) * g_numItemsPerPage) {

                                            if (ponsuccessread)
                                                ponsuccessread(cursor.value);

		        		} else {

                                            ++g_pricelistItemsOnPage;
		        		}
	        		}

	                cursor['continue']();

	            } else if (ponerror) {

	                ponerror("No record found.");
	            }
        	}
        };
    };

    this.execSQL = function (sql, onsuccess, onerror) {

        this.db.transaction(function (tx) {

            tx.executeSql(sql,[],
                function (tx, results) {
                    try {
                        var res = [];
                        //if (ponsuccessread) {
                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; ++i) {

                                var item = results.rows.item(i);
                                var jsonObj = JSON.parse(item.json);

                                res.push(jsonObj);
                                //ponsuccessread(route);
                            }
                        }

                        if (!results.rows.length && onerror)
                            onerror("No record found");

                        if (results.rows.length && onsuccess)
                            onsuccess(res);

                    } catch (error) {

                        if (onerror)
                            onerror("No record found: error");
                    };
                });
            });
    };

    this.sqlFetchTemplateItems = function(template, ponsuccessread, ponerror, poncomplete) {

        var currentCompany = JSON.parse(sessionStorage.getItem('companyCache'));

        var query = 'select oi.json, b.index3 as Basket, s.index3 as Stock from OrderItems oi' +
                    ' left outer join shoppingcart b on oi.index3 = b.index2 and b.index1 = \'' + currentCompany.AccountID + '\'' +
                    ' left outer join stock s on s.index1 = oi.index3 and s.index2 = \'' + currentCompany.BranchID + '\'' +
                    ' where oi.index2 = \'' + currentCompany.AccountID + '-' + template + '\'';

        console.log(query);

        this.db.transaction(function (tx) {

            tx.executeSql(query,[],
                function (tx, results) {
                    try {
                        if (ponsuccessread) {

                            for (var i = 0; i < results.rows.length; ++i) {

                                var item = results.rows.item(i);
                                var product = JSON.parse(item.json);

                                product.BasketQty = item.Basket;
                                product.Stock = item.Stock;

                                ponsuccessread(product);
                            }
                        }

                        if (!results.rows.length && ponerror)
                            ponerror("No record found");

                        if (poncomplete)
                            poncomplete();

                    } catch (error) {

                        if (ponerror)
                            ponerror("No record found");
                    };
                });
            });
    };
/*
    };
    return {
        getInstance: function(){
              if(!instance){
                  instance = new instanceObj;
              }
              return instance;
        }
    };
*/
});
//})();
