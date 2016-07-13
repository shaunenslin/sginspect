//var syncSvc = (function(){
//    var instance;
//    function instanceObj() {
coreApp.service('CartSvc', function(GlobalSvc, DaoSvc, OptionSvc, Settings, $modal, $http, $filter, DiscountSvc, PricelistSvc, $alert) {
    this.cartTotal = 0;
    this.availCredit;
    this.shoppingCart = [];
    this.overCreditLimit = false;
    this.basket;
    this.multilineDiscItems = {};
    this.multilineDiscQty = {};
    this.multilineItemPromoID = [];
    this.enableMultiLineDiscount = OptionSvc.getBoolean('EnableMultiLineDiscount',false);
    var $this = this;

    function getCartItem(item) {
        var result = undefined;
        for (var i = 0; i < $this.shoppingCart.length; ++i) {
            if (item.ProductID.trim() === $this.shoppingCart[i].ProductID.trim()) {
                result = $this.shoppingCart[i];
                break;
            }
        }
        return result;
    }

    this.getCartTotal = function(onComplete, onError){
        var cartTotal = 0;
        var key = sessionStorage.getItem('companyCache') ? JSON.parse(sessionStorage.getItem('companyCache')).AccountID || GlobalSvc.getUser().RepID : GlobalSvc.getUser().RepID;

        DaoSvc.indexsorted('ShoppingCart',
            key,
            'index1',
            'index2',
            function(json){
                if (json.Quantity) {
                    json.Value = (json.RepChangedPrice ? json.RepNett : json.Nett) *  json.Quantity;
                    cartTotal += json.Value;
                }
            },
            function(error){
                if (onError) onError(error);
            },
            function(){
               if (onComplete){
                    onComplete(cartTotal);
               }
            });
    };

    function getCartItem(item) {
        var result = undefined;
        for (var i = 0; i < $this.shoppingCart.length; ++i) {
            if (item.ProductID.trim() === $this.shoppingCart[i].ProductID.trim()) {
                result = $this.shoppingCart[i];
                break;
            }
        }
        return result;
    }

    this.modify = function(pricelist, onComplete){
        this.onComplete = onComplete;
        this.basket = {};

        for (var prop  in pricelist) {
            if (pricelist.hasOwnProperty(prop)) {
                pricelist[prop] = pricelist[prop] === null ? "" : pricelist[prop];
                if (pricelist[prop] !== "") this.basket[prop] = pricelist[prop];
            }
        }

        if (OptionSvc.getBoolean('musthavestock', false) && (!this.basket.Stock || this.basket.Stock < this.basket.Quantity)) {
            var msg = !this.basket.Stock ? 'Sorry, You can not order item with zero stock.' : 'Sorry, You can not order more than You have in stock.';
            $alert({ content: msg, duration: 4, placement: 'top-right', type: 'warning', show: true});
            var cartItem = getCartItem(this.basket);
            if (cartItem) {
                this.basket = cartItem;
            } else {
                delete this.basket.Quantity;
            }
            if (!this.availCredit) {
                $this.fromModify = true;
                this.fetchShoppingCart(this.onComplete);
                //this.onComplete(this.basket, this.shoppingCart);
            } else {
                this.fetchShoppingCart(this.checkAvailCredit);
            }
			return;
		}
        var orderType = sessionStorage.getItem('currentordertype') || 'Order';
        if  (orderType === 'stocktake') {
            this.basket.QtyInvoiced = this.basket.Stock - this.basket.Quantity;
        }
        this.basket.AccountID = (sessionStorage.getItem('companyCache') ? JSON.parse(sessionStorage.getItem('companyCache')).AccountID || GlobalSvc.getUser().RepID : GlobalSvc.getUser().RepID);
        this.basket.Type = this.basket.Type || sessionStorage.getItem('currentordertype');
        try {
            this.basket = this.calcVolumePrice(this.basket);
            this.basket.Value = (this.basket.RepChangedPrice ? this.basket.RepNett : this.basket.Nett) * this.basket.Quantity;
            $this.basket = this.basket;
            // if (this.enableMultiLineDiscount && this.applyDiscounts()) {
            //     recalcMultilineDiscounts(this.basket);
            //     this.save(this.basket);
            //     $this.fromModify = true;
            //     this.fetchShoppingCart(this.onComplete);
            //     return;
            // }
            this.save(this.basket);
            if (!this.availCredit) {
                $this.fromModify = true;
                this.fetchShoppingCart(this.onComplete);
                //this.onComplete(this.basket, this.shoppingCart);
            } else {
                this.fetchShoppingCart(this.checkAvailCredit);
            }
        } catch(err){
            console.log(err);
        }
    };

    this.save = function(basket){
        var keyf =  basket.AccountID + basket.ProductID + (basket.Type || sessionStorage.getItem('currentordertype'));
        DaoSvc.put(basket,'ShoppingCart',keyf,function(){},function(){});
    };

    /*
     * Update the local array or add new record, also calculate new cart total
     * @param {type} basket
     * @returns {undefined}
     */
    this.checkAvailCredit = function(){
        //if we dont have enough credit
        if ($this.availCredit < $this.cartTotal) {
            var canOrder = ($this.cartTotal - $this.basket.Value - $this.availCredit) / ($this.basket.RepChangedPrice ? $this.basket.RepNett : $this.basket.Nett) * -1;
            $this.cartTotal = $this.cartTotal - ($this.basket.Quantity - (canOrder | 0)) * ($this.basket.RepChangedPrice ? $this.basket.RepNett : $this.basket.Nett);
            $this.basket.Quantity = (canOrder | 0);
            var msg = '';
            if ($this.basket.Quantity === 0){
                msg = 'You have readed your credit limit of ' + $filter('currency')($this.availCredit,'R') + ' and cannot add more products to your shopping cart.';
                $this.delete($this.basket, true);
            } else {
                msg = 'You have reached your credit limit of ' + $filter('currency')($this.availCredit,'R') + ' and can only order up to ' + (canOrder | 0) + '.';

                $this.save($this.basket);
            }
            $modal({title: 'Credit Limit Reached', content: msg, show: true});
        }
        $this.onComplete($this.basket, $this.shoppingCart);
    };

    this.fetchAvailCredit = function(onComplete){
        var $this = this;
        if (!Settings.availableCreditUrl) return;
        if (Settings.availableCreditUrl === '') return;
        if (sessionStorage.getItem('availCredit')) this.availCredit = sessionStorage.getItem('availCredit');

        if (this.availCredit === undefined){
            var url = Settings.availableCreditUrl + '?supplierid=' + GlobalSvc.getUser().SupplierID +
                    '&accountid=' + (sessionStorage.getItem('companyCache') ? JSON.parse(sessionStorage.getItem('companyCache')).AccountID || GlobalSvc.getUser().RepID : GlobalSvc.getUser().RepID) + '&format=json';
            $http({method: 'GET', url: url})
            .success(function(json, status, headers, config) {
                $this.availCredit = json._AvailableCredit;
                $this.overCreditLimit = (this.availCredit - this.cartTotal > 0) ? false : true;
                var ret = {};
                ret.availCredit = $this.availCredit;
                ret.overCreditLimit = $this.overCreditLimit;
                sessionStorage.setItem('availCredit', $this.availCredit);
                if (onComplete) onComplete(ret);
            });
        } else {
            this.overCreditLimit = (this.availCredit - this.cartTotal > 0) ? false : true;
            var ret = {};
            ret.availCredit = $this.availCredit;
            ret.overCreditLimit = $this.overCreditLimit;
            if (onComplete) onComplete(ret);
        }
    };

    /*
     * Remove an item from the cart
     * @param {type} basket
     * @param {type} removeRow - true if row must be spliced from array, we dont want row spliced if in cart and busy typing
     * @returns {undefined}
     */
    this.delete = function(basket, removeRow, onComplete){
        var keyf =  (sessionStorage.getItem('companyCache') ? JSON.parse(sessionStorage.getItem('companyCache')).AccountID || GlobalSvc.getUser().RepID : GlobalSvc.getUser().RepID) + basket.ProductID + (basket.Type || sessionStorage.getItem('currentordertype'));

        var currentordertype = sessionStorage.getItem('currentordertype');
        if (OptionSvc.getBoolean('KeepZeroQtyInBasket', false) || ($.inArray(currentordertype, OptionSvc.getText('KeepZeroQtyInBasketForTypes','').split(',')) >= 0)) {
        	basket.Quantity = 0;
        	basket.Value = 0;
        	this.modify(basket, onComplete); return; //this.save(basket);
        } else {
            delete basket.RepChangedPrice;
            delete basket.RepNett;
            delete basket.RepDiscount;
        	DaoSvc.deleteItem('ShoppingCart',keyf);
        }
        //if (basket.Value) this.cartTotal -= basket.Value;
        var idx = -1;
        this.cartTotal = 0;
        for (var x=0; x < this.shoppingCart.length; x++){
            if (this.shoppingCart[x].ProductID === basket.ProductID){
                idx = x;
                if (OptionSvc.getBoolean('KeepZeroQtyInBasket', false) || ($.inArray(currentordertype, OptionSvc.getText('KeepZeroQtyInBasketForTypes','').split(',')) >= 0)) {
                	this.shoppingCart[idx].Quantity = 0;
                	this.shoppingCart[idx].Value = 0;
                } else {
                	delete this.shoppingCart[idx].Quantity;
                }
                //break;
            }
            if (this.shoppingCart[x].Quantity) this.cartTotal += this.shoppingCart[x].Quantity * (this.shoppingCart[x].RepChangedPrice ? this.shoppingCart[x].RepNett : this.shoppingCart[x].Nett);
        }
        if (removeRow) this.shoppingCart.splice(idx,1);
        this.fetchShoppingCart(onComplete);
        // return this.shoppingCart;
    };

    /*
     * Take volume discounts into account, so if user order more than x, then they get a lower price
     * @param {type} basket
     * @returns {unresolved}
     */
    this.calcVolumePrice = function(basket){
        if (!basket.liveprice) return basket;
        if (!basket.liveprice.volumePrice) return basket;

        var vps = basket.liveprice.volumePrice;
        for (var x=0; x<vps.length; x++){
            var vp = vps[x];
            if (basket.Quantity <= vp.Qty1 && vp.Qty1 > 0) {
                basket.Discount = vp.Discount1;
                basket.Nett = vp.Nett1;
            }
            if (basket.Quantity > vp.Qty1 &&  basket.Quantity <= vp.Qty2 && vp.Qty2 > 0) {
                basket.Discount = vp.Discount2;
                basket.Nett = vp.Nett2;
            }
            if (basket.Quantity > vp.Qty2 &&  basket.Quantity < vp.Qty3 && vp.Qty3 > 0) {
                basket.Discount = vp.Discount3;
                basket.Nett = vp.Nett3;
            }
            if (basket.Quantity > vp.Qty3 &&  basket.Quantity < vp.Qty4 && vp.Qty4 > 0) {
                basket.Discount = vp.Discount4;
                basket.Nett = vp.Nett4;
            }
        }
        return basket;
    };

    this.fetchShoppingCart = function(onComplete, onError){
        this.cartTotal = 0;
        this.shoppingCart = [];
        var $this = this;

        if (this.enableMultiLineDiscount) {
            var multiLineDiscountID = OptionSvc.getText('MultiLineDiscountID','');
            this.multilineDiscItems = {};
            this.multilineDiscQty = {};
            this.multilineItemPromoID = [];
        }
        var itemIndex = 0;
        var cartTotal_local = 0;
        var shoppingCart_local = [];
        var currentordertype = sessionStorage.getItem('currentordertype');

        var onSuccessRead = function(json) {
            if (json.Quantity || (OptionSvc.getBoolean('KeepZeroQtyInBasket', false)) || ($.inArray(currentordertype, OptionSvc.getText('KeepZeroQtyInBasketForTypes','').split(',')) >= 0)) {
                if (!json.Quantity && (OptionSvc.getBoolean('KeepZeroQtyInBasket', false) || ($.inArray(currentordertype, OptionSvc.getText('KeepZeroQtyInBasketForTypes','').split(',')) >= 0))) {
                    json.Quantity = 0;
                }
                if ($this.enableMultiLineDiscount && json.stockPrice && json.stockPrice.volumePrice[json.stockPrice.volumePrice.length - 1].ID === multiLineDiscountID) {
                    if (!$this.multilineDiscItems.hasOwnProperty(json.UserField05))
                        $this.multilineDiscItems[json.UserField05] = [];

                    if (!$this.multilineDiscQty.hasOwnProperty(json.UserField05))
                        $this.multilineDiscQty[json.UserField05] = 0;

                    $this.multilineDiscItems[json.UserField05][itemIndex] = json;
                    $this.multilineDiscQty[json.UserField05] += json.Quantity;

                    $this.multilineItemPromoID[itemIndex] = json.UserField05;
                }
                ++itemIndex;
                json.Value = (json.RepChangedPrice ? json.RepNett : json.Nett) *  json.Quantity;
//                            $this.cartTotal += json.Value;
//                            $this.shoppingCart.push(json);
                cartTotal_local += json.Value;
                shoppingCart_local.push(json);
            }
        };

        var onErrorRead = function(error) {
            if (onError) onError(error);
        };

        var onCompleteRead = function() {
            $this.fetchAvailCredit();
            if ($this.enableMultiLineDiscount && $this.applyDiscounts()) {
                recalcAllMultilineDiscounts(shoppingCart_local);
                cartTotal_local = 0;
                for (var i = 0; i < shoppingCart_local.length; ++i) {
                    cartTotal_local += shoppingCart_local[i].Value;
                }
            }
            $this.cartTotal = cartTotal_local;
            $this.shoppingCart = shoppingCart_local;
           if (onComplete && $this.fromModify){
                delete $this.fromModify;
                onComplete($this.shoppingCart,$this.basket);
           }else if(onComplete){
               onComplete($this.shoppingCart,$this.basket);
           }
        };
        if (OptionSvc.getBoolean('DoNotSortBasket', false)) {
            DaoSvc.index('ShoppingCart',
            		(sessionStorage.getItem('companyCache') ? JSON.parse(sessionStorage.getItem('companyCache')).AccountID || GlobalSvc.getUser().RepID : GlobalSvc.getUser().RepID),
                        'index1',
                        onSuccessRead,
                        onErrorRead,
                        onCompleteRead);
        } else {
            DaoSvc.indexsorted('ShoppingCart',
            		(sessionStorage.getItem('companyCache') ? JSON.parse(sessionStorage.getItem('companyCache')).AccountID || GlobalSvc.getUser().RepID : GlobalSvc.getUser().RepID),
                        'index1',
                        'index2',
                        onSuccessRead,
                        onErrorRead,
                        onCompleteRead);
        }

    };

    this.recalcCart = function(onError, onComplete) {
        // if (OptionSvc.getBoolean('EnableMultiLineDiscount',false)) {
        //     multilineDiscItems = {};
        //     multilineDiscQty = {};
        //     multilineItemPromoID = [];
        // }
        $this.fetchShoppingCart(function(){

            if ($this.shoppingCart.length === 0) {
                if (onComplete)
                    onComplete($this.shoppingCart);
            } else if (OptionSvc.getBoolean('LocalDiscounts',false)) {
                //g_busy(true);
                if (Settings.isIndexDB) {
                    discountRecalcShoppingCart();
                } else {
                    recalcLocalPricing(0, onError, onComplete);
                }
            } else if (OptionSvc.getBoolean('MobileLiveStockDiscount', false) && GlobalSvc.isOnline(false)) {
                //g_busy(true);
                recalcLivePricing(0, onError, onComplete);
            } else {
                if (onComplete)
                    onComplete($this.shoppingCart);
            }
        }, function(error) {
            if (onError)
                onError(error);
        });


    };

    function recalcLocalPricing(itemIndex, onError, onComplete) {

        if (itemIndex === $this.shoppingCart.length) {
            //g_busy(false);
            // if (OptionSvc.getBoolean('EnableMultiLineDiscount',false)) {
            //     shoppingCartRecalcMultilineDiscounts();
            // }
            if (onComplete)
                $this.fetchShoppingCart(onComplete, onError);

            return;
        }


        console.log('RECALCULATE SHOPPING CART LOCAL SQL - itemIndex: ' + itemIndex);

        var recalcLocalPricingOnSuccess = function(json) {
            if (json.volumePrice && json.volumePrice[0] && json.volumePrice[0].ID && DiscountSvc.applyDiscount(json.volumePrice[0].ID)) {
                //g_pricelistVolumePrices[currentItem.ProductID] = json.volumePrice[json.volumePrice.length - 1];
                PricelistSvc.addVolumePrice(json.volumePrice[json.volumePrice.length - 1]);
                calculateDiscount(true, json.volumePrice, itemIndex, onError, onComplete);
            } else {
                recalcLocalPricing(++itemIndex, onError, onComplete);
            }
        };

        var currentItem = $this.shoppingCart[itemIndex];
        DiscountSvc.GetPrice(currentItem,
        		recalcLocalPricingOnSuccess,
        		function (e) {
        			recalcLocalPricing(++itemIndex, onError, onComplete);
        		});
    }

    function calculateDiscount(isLocal, volumePrice, itemIndex, onError, onComplete) {

        var gross = 0;
        var nett = 0;
        var discount = 0;
        var type;

        var basketInfo = $this.shoppingCart[itemIndex];
        // var qty = Number($('#' + itemIndex).val() ? $('#' + itemIndex).val() : '0');
        var qty = basketInfo.Quantity;

        //shaun - added loop for multipe
        for (var i = 0; i< volumePrice.length; i++) {

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
        }

        if (nett > gross)
            gross = nett;

        // var dao = new Dao();
        // dao.get("BasketInfo", g_shoppingCartItemKeys[itemIndex], function(basketInfo) {
            basketInfo.Discount = discount;
            basketInfo.Nett = nett;
            basketInfo.Gross = gross;
            basketInfo.UserField15 = type;
            basketInfo.DiscountApplied = true;

            // if (g_enableMultiLineDiscount === 'true' &&
            //         volumePrice[volumePrice.length - 1].ID === g_multiLineDiscountID) {
            //     if (!g_shoppingCartMultilineDiscItems.hasOwnProperty(basketInfo.UserField05))
            //         g_shoppingCartMultilineDiscItems[basketInfo.UserField05] = [];
            //
            //     if (!g_shoppingCartMultilineDiscQty.hasOwnProperty(basketInfo.UserField05))
            //         g_shoppingCartMultilineDiscQty[basketInfo.UserField05] = 0;
            //
            //     g_shoppingCartMultilineDiscItems[basketInfo.UserField05][itemIndex] = basketInfo;
            //     g_shoppingCartMultilineDiscQty[basketInfo.UserField05] += basketInfo.Quantity;
            //
            //     g_shoppingCartMultilineItemPromoID[itemIndex] = basketInfo.UserField05;
            // }

            $this.save(basketInfo, basketInfo.Quantity);

            // $('#' + itemIndex + 'nett').text('' + g_roundToTwoDecimals(shoppingCartItemNett(basketInfo))); //$('#' + itemIndex + 'nett').text('' + basketInfo.Nett);
            // $('#' + itemIndex + 'total').text(g_roundToTwoDecimals(shoppingCartItemNett(basketInfo) / ((DaoOptions.getValue('DividePriceByUnit')  === 'true') && g_isPackSizeUnitValid(basketInfo.Unit) ? basketInfo.Unit : 1) * basketInfo.Quantity));

            //if (itemIndex === g_shoppingCartItemKeys.length - 1) {
                // g_shoppingCartTotalExcl = 0;
                // $.each($(".total") ,function() {
                //     var value = $(this).text().replace(',','');
                //     g_shoppingCartTotalExcl += parseFloat(value);
                // });
                //recalcTotals(basketInfo, basketInfo.Quantity);
            //}
            if (isLocal)
                recalcLocalPricing(++itemIndex, onError, onComplete);
            else
                recalcLivePricing(++itemIndex, onError, onComplete);
        // },undefined, undefined);

    }

    this.applyDiscounts = function() {
        var promoExclAccountGroup = OptionSvc.getText('PromoExclAccountGroup');
        if (!promoExclAccountGroup)
            return true;

        var currentAccount = JSON.parse(sessionStorage.getItem('companyCache'));

        if ($.inArray(currentAccount.AccountGroup, promoExclAccountGroup.split(',')) >= 0) {
            return false;
        } else
            return true;

    };

    function recalcLivePricing(itemIndex, onError, onComplete) {
        if (itemIndex === $this.shoppingCart.length) {
            //g_busy(false);
            // if (OptionSvc.getBoolean('EnableMultiLineDiscount',false)) {
            //     shoppingCartRecalcMultilineDiscounts();
            // }
            if (onComplete)
                $this.fetchShoppingCart(onComplete, onError);

            return;
        }

        var livePriceUrl = OptionSvc.getText('LivePriceURL','') ? OptionSvc.getText('LivePriceURL','') : Settings.pricelistUrl + 'prices/getprice3';

        var currentItem = $this.shoppingCart[itemIndex];

        var currentAccount = JSON.parse(sessionStorage.getItem('companyCache'));

        var url = livePriceUrl + '?supplierID=' + currentAccount.SupplierID + '&productID=' + currentItem.ProductID + '&accountid=' + currentAccount.AccountID.replace(/&/g, '%26') + '&branchid=' + currentAccount.BranchID + '&quantity=1&gross=' + currentItem.Gross + '&nett=' + currentItem.Nett +
                '&checkStock=false&checkPrice=true&format=json';

        console.log(url);

        var livePriceOnSuccess = function(json) {
            if (json.volumePrice && json.volumePrice[0] && json.volumePrice[0].ID && DiscountSvc.applyDiscount(json.volumePrice[0].ID)) {
                //g_pricelistVolumePrices[currentItem.ProductID] = json.volumePrice[json.volumePrice.length - 1];
                PricelistSvc.addVolumePrice(json.volumePrice[json.volumePrice.length - 1]);
                calculateDiscount(false, json.volumePrice, itemIndex, onError, onComplete);
            } else {
                shoppingCartRecalcLivePricing(++itemIndex);
            }
        };

        $http({method: 'GET', url: url, timeout: OptionSvc.getText('AjaxTimeout', '30000')})
        .success(function(json, status, headers, config) {
            livePriceOnSuccess(json);
        })
        .error(function(data, status, headers, config) {
            recalcLivePricing(++itemIndex, onError, onComplete);
        });
    }

    function recalcMultilineDiscounts(item) {
        var promoIDs = Object.keys($this.multilineDiscItems);
        $.each(promoIDs, function(pIndex, promoID) {
            if (promoID !== null) {
                var itemIndexes = Object.keys($this.multilineDiscItems[promoID]);
                $this.multilineDiscQty[promoID] = 0;
                $.each(itemIndexes, function(index, itemIndex) {
                    if (item.ProductID === $this.shoppingCart[itemIndex].ProductID) {
                        $this.multilineDiscQty[promoID] += item.Quantity;
                    } else {
                        $this.multilineDiscQty[promoID] += $this.shoppingCart[itemIndex].Quantity; // parseInt($('#' + itemIndex).val() ? $('#' + itemIndex).val() : '0',10) ;
                    }

                });

                if (!$this.multilineDiscQty[promoID]) return;
                itemIndexes = Object.keys($this.multilineDiscItems[promoID]);
                $.each(itemIndexes, function(index, itemIndex) {
                //for (var itemIndex in g_shoppingCartMultilineDiscItems) {
                    if ($this.multilineDiscItems[promoID].hasOwnProperty(itemIndex) && $this.shoppingCart[itemIndex].Quantity /* $('#' + itemIndex).val() && ($('#' + itemIndex).val() !== '0') */) {

                        var basketInfo = $this.shoppingCart[itemIndex];
                        var quantity = basketInfo.Quantity;



                        var volumePrice = PricelistSvc.getVolumePriceByProductID(basketInfo.ProductID); // g_pricelistVolumePrices[basketInfo.ProductID];

                        if (volumePrice) {

                            var j = 1;

                        // increase index according to quantity

                            while (j < 5) {

                                    if ($this.multilineDiscQty[promoID] < volumePrice['Qty' + j])
                                            break;

                                    j++;
                            }

                            var gross = parseFloat(volumePrice.Gross);
                            var nett  = parseFloat(volumePrice['Nett' + j]);
                            var discount = parseFloat(volumePrice['Discount' + j]);

                            if (/* g_pricelistMobileLiveStockDiscount && */ (nett > gross)) gross = nett;
                            basketInfo.Discount = discount;
                            basketInfo.Nett = nett;
                            basketInfo.Gross = gross;
                            item.Discount = discount;
                            item.Nett = nett;
                            item.Gross = gross;


                            if (OptionSvc.getText('SetRepBoolDiscountUF', '') && basketInfo[OptionSvc.getText('SetRepBoolDiscountUF', '')]) {
                                basketInfo.RepNett = nett;
                                basketInfo.RepDiscount = discount;
                                item.RepNett = nett;
                                item.RepDiscount = discount;
                            }


                        }
                        basketInfo.Value = (basketInfo.RepChangedPrice ? basketInfo.RepNett : basketInfo.Nett) * basketInfo.Quantity;
                        $this.save(basketInfo);



                    }
                });
            }
        });
    }

    function recalcAllMultilineDiscounts(items) {
        var promoIDs = Object.keys($this.multilineDiscItems);
        $.each(promoIDs, function(pIndex, promoID) {
            if (promoID !== null) {
                var itemIndexes = Object.keys($this.multilineDiscItems[promoID]);
                $this.multilineDiscQty[promoID] = 0;
                $.each(itemIndexes, function(index, itemIndex) {
                    $this.multilineDiscQty[promoID] += items[itemIndex].Quantity; // parseInt($('#' + itemIndex).val() ? $('#' + itemIndex).val() : '0',10) ;
                });

                if (!$this.multilineDiscQty[promoID]) return;
                itemIndexes = Object.keys($this.multilineDiscItems[promoID]);
                $.each(itemIndexes, function(index, itemIndex) {
                //for (var itemIndex in g_shoppingCartMultilineDiscItems) {
                    if ($this.multilineDiscItems[promoID].hasOwnProperty(itemIndex) && items[itemIndex].Quantity /* $('#' + itemIndex).val() && ($('#' + itemIndex).val() !== '0') */) {

                        var basketInfo = items[itemIndex];
                        var quantity = basketInfo.Quantity;



                        var volumePrice = PricelistSvc.getVolumePriceByProductID(basketInfo.ProductID); // g_pricelistVolumePrices[basketInfo.ProductID];

                        if (volumePrice) {

                            var j = 1;

                        // increase index according to quantity

                            while (j < 5) {

                                    if ($this.multilineDiscQty[promoID] < volumePrice['Qty' + j])
                                            break;

                                    j++;
                            }

                            var gross = parseFloat(volumePrice.Gross);
                            var nett  = parseFloat(volumePrice['Nett' + j]);
                            var discount = parseFloat(volumePrice['Discount' + j]);

                            if (/* g_pricelistMobileLiveStockDiscount && */ (nett > gross)) gross = nett;
                            basketInfo.Discount = discount;
                            basketInfo.Nett = nett;
                            basketInfo.Gross = gross;


                            if (OptionSvc.getText('SetRepBoolDiscountUF', '') && basketInfo[OptionSvc.getText('SetRepBoolDiscountUF', '')]) {
                                basketInfo.RepNett = nett;
                                basketInfo.RepDiscount = discount;
                            }


                        }

                        basketInfo.Value = (basketInfo.RepChangedPrice ? basketInfo.RepNett : basketInfo.Nett) * basketInfo.Quantity;

                        $this.save(basketInfo);



                    }
                });
            }
        });
    }

    this.checkMultiLineDiscounts = function(item) {
        var volumePrice = PricelistSvc.getVolumePriceByProductID(item.ProductID);
        var promoID = this.multilineDiscItems.hasOwnProperty(item.UserField05) ? item.UserField05 : null;

        if (volumePrice && promoID) {
            var j = 1;

        // increase index according to quantity

            while (j < 5) {

                    if ($this.multilineDiscQty[promoID] < volumePrice['Qty' + j])
                            break;

                    j++;
            }

            var gross = parseFloat(volumePrice.Gross);
            var nett  = parseFloat(volumePrice['Nett' + j]);
            var discount = parseFloat(volumePrice['Discount' + j]);

            if (/* g_pricelistMobileLiveStockDiscount && */ (nett > gross)) gross = nett;
            item.Discount = discount;
            item.Nett = nett;
            item.Gross = gross;


            if (OptionSvc.getText('SetRepBoolDiscountUF', '') && item[OptionSvc.getText('SetRepBoolDiscountUF', '')]) {
                item.RepNett = nett;
                item.RepDiscount = discount;
            }

            item.Value = (item.RepChangedPrice ? item.RepNett : item.Nett) * item.Quantity;
        }
    };
});
