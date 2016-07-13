coreApp.service('PricelistSvc', function($http, Settings, GlobalSvc, DaoSvc, DiscountSvc, OptionSvc){

    this.searchItems = [];
    this.acategories = [];
    this.categoryDescriptions = {};

    this.volumePrices = [];
    this.accountID = '';

    var $this = this;

    this.initDiscountSvc = function() {
        DiscountSvc.init();
    };

    this.onSuccessRead = function(item) {
        var product = toBigItem(item);
        this.searchItems.push(product);
    };

    this.searchLocal = function(account, searchstring, onError,onComplete, offset, rowsNumber){
        //it should search the local data the same as RapidJQ does
        //Move the DAO code to search( the pricelist into the PricelistSvc as this logic is specific

        if (this.accountID != JSON.parse(sessionStorage.getItem('companyCache')).AccountID) {
            this.volumePrices = [];
            this.accountID = JSON.parse(sessionStorage.getItem('companyCache')).AccountID;
        }

        this.searchItems = [];
        this.acategories = [];
        this.categoryDescriptions = {};

        var searchText = searchstring || '';

    	var searchWords = searchText.split(/[ ]+/);

        var sortBy = OptionSvc.getText('RTPriceListSortField', 'Description');

        DaoSvc.fetchPricelist(searchWords, sortBy,
            function(item) {
                var product = toBigItem(item);
                //if (product.CategoryName && $.inArray(product.CategoryName, $this.categories) < 0)
                    //$this.categories.push(product.CategoryName);
                $this.addCategory(product.CategoryName);
                $this.searchItems.push(product);

            }, onError,
            function (items) {
                if (onComplete) {
                    if (!$this.searchItems.length) {
                        onComplete([]);
                        return;
                    }

                    //onComplete($this.searchItems); return;

                    jQuery.each($this.searchItems, function(index, product) {


                        DiscountSvc.GetPrice(product, function(stockPrice) {
                            setTimeout(function() {
                                $this.applyDiscount(product, stockPrice);
                                $this.searchItems[index] = product;
                                if (index === $this.searchItems.length - 1)
                                    onComplete($this.searchItems);
                            },3);
                        }, function(err) {
                            setTimeout(function() {
                            if (index === $this.searchItems.length - 1)
                                onComplete($this.searchItems);
                            },3);
                        });
                    });
                }

            }, offset /*offset*/, rowsNumber /*g_numItemsPerPage*/, undefined /*g_pricelistInvoiceWarehouse*/);
    };

    this.searchMyRangeLocally = function(myRangeValue, onError, onSuccess) {

        if (this.accountID != JSON.parse(sessionStorage.getItem('companyCache')).AccountID) {
            this.volumePrices = [];
            this.accountID = JSON.parse(sessionStorage.getItem('companyCache')).AccountID;
        }

        this.searchItems = [];
        this.acategories = [];
        this.categoryDescriptions = {};
        this.errorOnLocalTemlates = false;

        DaoSvc.sqlFetchTemplateItems(myRangeValue, function(item) {
            // onSuccessRead
            var product = toBigItem(item);

            $this.searchItems.push(product);
        }, function(err) {
            // onError
            console.log('No template items found locally.');
            $this.errorOnLocalTemlates = true;
        }, function() {
            // onComplete
            setTimeout(function(){
                if ($this.errorOnLocalTemlates) {
                    // fetch items live
                    fetchLiveTemplateItems(myRangeValue, onError, onSuccess);
                } else {
                    if (onSuccess)
                        onSuccess($this.searchItems);
                }
            },5);

        });
    };

    function fetchLiveTemplateItems(myRangeValue, onError, onSuccess) {
        var url = (Settings.pricelistUrl ? Settings.pricelistUrl : Settings.url)  +
            'Orders/GetOrderItemsByType3?supplierID=' + GlobalSvc.getUser().SupplierID+'&accountID=' + (sessionStorage.getItem('companyCache') ? JSON.parse(sessionStorage.getItem('companyCache')).AccountID || GlobalSvc.getUser().RepID : GlobalSvc.getUser().RepID) +
            '&userID=' + GlobalSvc.getUser().UserID + '&orderType=' + myRangeValue + '&skip=0&top=300&format=json';
        console.log(url);
        $http({method: 'GET', url: url})
        .success(function(json, status, headers, config) {
            setTimeout(function() {
                if (!json.length) {
                    if (onError)
                        onError();
                    if (onSuccess)
                        onSuccess($this.searchItems);
                    return;
                }
                DaoSvc.putMany(json,
                    'OrderItems',
                    undefined,
                    function (tx) {
                        GlobalSvc.alert('Error on download, can\'t continue: ' + tx.message);
                        this.stopsync = true;
                        GlobalSvc.busy(false);
                    },
                    function() {
                        setTimeout(function() {
                            if (json.length) {
                                    $this.searchMyRangeLocally(myRangeValue, onError, onSuccess);
                            } else {
                                if (onError)
                                    onError();
                                if (onSuccess)
                                    onSuccess($this.searchItems);
                            }
                        }, 5);
                    });
            },5);

        })
        .error(function(data, status, headers, config) {
            console.log(status);
        });
    }

    this.fetchDeals = function(onSuccess, onError) {
        var url = Settings.url + 'Get?method=' + OptionSvc.getText('FetchDealsStoredProc', 'pricelist_dealsForAccount') + '&SupplierID=%27' + GlobalSvc.getUser().SupplierID + '%27&AccountID=%27' +
         JSON.parse(sessionStorage.getItem('companyCache')).AccountID + '%27';



        console.log(url);
        $http({method: 'GET', url: url})
           .success(onSuccess)
           .error(onError);
    }

    this.fetchDealItems = function(deal, onSuccess, onError) {

        var url = Settings.url + 'Get?method=' + OptionSvc.getText('FetchDealItemsStoredProc', 'pricelist_dealItems') + '&SupplierID=%27' + GlobalSvc.getUser().SupplierID + '%27&DealID=%27' + deal + '%27&AccountID=%27'+
            JSON.parse(sessionStorage.getItem('companyCache')).AccountID + '%27';

        var localOnSuccess = function(json) {
            var result = [];
            if (json && json.length) {
                jQuery.each(json, function(index, product) {
                    var item = toBigItemfromLive(json[index]);
                    result.push(item);

                    DiscountSvc.GetPrice(item, function(stockPrice) {
                        setTimeout(function() {
                            $this.applyDiscount(item, stockPrice);
                            result[index] = item;
                            if (index === result.length - 1)
                                onSuccess(result);
                        },3);
                    }, function(err) {
                        setTimeout(function() {
                        if (index === result.length - 1)
                            onSuccess(result);
                        },3);
                    });
                });
            } else {
                if (onSuccess) onSuccess([]);
            }

        };

        var localOnError = function(json) {
            console.log(JSON.stringify(json));
            if (onError) onError(json);
        };


        console.log(url);
        $http({method: 'GET', url: url})
           .success(localOnSuccess)
           .error(localOnError);

    };

    this.addCategory = function(category) {
        try {
            if (category && this.acategories.indexOf(category) == -1) {
                this.acategories.push(category);

                DaoSvc.index('ProductCategories2', category, 'index2', function(item) {
                    $this.categoryDescriptions[item.CategoryID] = item.Description;
                });
            }
        } catch (err){
            console.log(err.message);
        }
    };

    this.applyDiscount = function(item, stockPrice) {
        if (stockPrice.volumePrice && stockPrice.volumePrice[0]) {
            $this.volumePrices[stockPrice.volumePrice[0].ProductID] = stockPrice.volumePrice[stockPrice.volumePrice.length - 1];
            var volumePrice = stockPrice.volumePrice;
            var gross = 0;
            var nett = 0;
            var discount = 0;
            var type;

            var qty = item.Quantity || 1; //parseInt($('#quantity').attr('value')) || 0;
            var discID = ''; var comma = '';
            for (var i = 0; i < volumePrice.length; i++) {

            	var j = 1;

        	    // increase index according to quantity

            	while (j < 5) {

                    if (qty < volumePrice[i]['Qty' + j])
                            break;

                    j++;
            	}

                gross = parseFloat(volumePrice[i].Gross);
                nett  = parseFloat(volumePrice[i]['Nett' + j]);
                discount = parseFloat(volumePrice[i]['Discount' + j]);

                type = volumePrice[i]['Type'];
                discID += comma + volumePrice[i].ID;
                comma = ',';
            }

            if (/*g_pricelistMobileLiveStockDiscount && */(nett > gross))
                gross = nett;

            item.Discount = parseFloat(discount.toFixed(2));
            item.Nett = parseFloat(nett.toFixed(2));
            item.Gross = parseFloat(gross.toFixed(2));
            item.UserField15 = type;
            item.DiscountApplied = (volumePrice[0].ID != undefined && volumePrice[0].ID != null && volumePrice[0].ID != '');
            item.stockPrice = stockPrice;
            item.DiscountID = discID;

            //productdetailValue('discount', g_addCommas(discount.toFixed(2)) + '%');
            //$('#grossvalue').html(g_addCommas(gross.toFixed(2)));
            //productdetailValue('nett', g_addCommas(nett.toFixed(2)));
        }
    }

    function toBigItem(item) {
        var newItem = {};

        newItem.Barcode = item.barcode;
        newItem.CategoryName = item.categoryname;
		newItem.Description = item.Description;
		newItem.Discount = parseFloat(item.Discount.toFixed(2));
		newItem.Gross = parseFloat(item.Gross.toFixed(2));
		newItem.Nett = parseFloat(item.Nett.toFixed(2));
		newItem.Stock = item.Stock;
        newItem.SupplierID = item.SupplierID;
		newItem.ProductID = item.ProductID;
        newItem.PriceList = item.PriceList;
		newItem.Unit = item.unit; //parseInt(item.unit, 10);
		newItem.UserField01 = item.u1;
		newItem.UserField02 = item.u2;
		newItem.UserField03 = item.u3;
		newItem.UserField04 = item.u4;
		newItem.UserField05 = item.u5;
        newItem.Warehouse = item.Warehouse;

        return newItem;

    }

    function toBigItemfromLive(item) {
        var newItem = {};

        newItem.Barcode = item.b;
        newItem.CategoryName = item.cn;
		newItem.Description = item.des;
		newItem.Discount = parseFloat(item.d.toFixed(2));
		newItem.Gross = parseFloat(item.g.toFixed(2));
		newItem.Nett = parseFloat(item.n.toFixed(2));
		newItem.Stock = item.Stock;
        newItem.SupplierID = GlobalSvc.getUser().SupplierID;
		newItem.ProductID = item.id;
        newItem.PriceList = item.pl;
		newItem.Unit = item.unit; //parseInt(item.u, 10);
		newItem.UserField01 = item.u1;
		newItem.UserField02 = item.u2;
		newItem.UserField03 = item.u3;
		newItem.UserField04 = item.u4;
		newItem.UserField05 = item.u5;
		newItem.UserField06 = item.u6;
		newItem.UserField07 = item.u7;
		newItem.UserField08 = item.u8;
		newItem.UserField09 = item.u9;
		newItem.UserField10 = item.u10;

        return newItem;

    }

    this.addVolumePrice = function(volumePrice) {
        if (!this.volumePrices[volumePrice.ProductID]) {
            this.volumePrices[volumePrice.ProductID] = volumePrice;
        }
    }

    this.getVolumePriceByProductID = function(productID) {
        if (this.volumePrices[productID]) {
            return this.volumePrices[productID];
        }

        return null;
    }


});
