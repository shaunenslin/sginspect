coreApp.service('DiscountSvc', function(Settings, GlobalSvc, DaoSvc, OptionSvc){
    // Public

    /*
     * Discounts.GetPrice(item, oncomplete);
     */

    this.GetPrice = function(item, oncomplete, onerror) {
        if (Settings.isIndexDB) {
                //GetIndexDBPrice(item, oncomplete, onerror);
        } else {
                GetSQLDBPrice(item, oncomplete, onerror);
        }
    };

    this.init = function() {
        readDiscounts();
    };

    function readDiscounts() {
        g_discounts = [];
        g_discountsDictionary = {};
        g_discountConditions = [];

        currentAccount = JSON.parse(sessionStorage.getItem('companyCache'));

        DaoSvc.cursor('Discount', function (discount) {

                 g_discounts.push(discount);
                 g_discountsDictionary[discount.DiscountID] = discount;

         }
         , undefined, undefined);
         DaoSvc.cursor('DiscountCondition', function (discountCondition) {

             g_discountConditions.push(discountCondition);

         }
         , undefined, undefined);
    }

    // Private

    // var trustedGross;
    // var trustedNett;
    // var trustedDiscount;
    // var trustedItem;
    var oncomplete;
    var onerror;
    var currentAccount = JSON.parse(sessionStorage.getItem('companyCache'));

    function GetSQLDBPrice(item, poncomplete, ponerror) {
        var trustedGross;
        var trustedNett;
        var trustedDiscount;
        var trustedItem;
        oncomplete = poncomplete;
        onerror = ponerror;

        var sql = getSQL(item);
        if (!sql) {
            if (ponerror) ponerror('There is no definitions for discounts and discount conditions so there is no need to search for discount values.');
            return;
        }
        var pricelistPriceSQL = "SELECT * FROM Pricelists WHERE index1='" + currentAccount.Pricelist + "' and index3='" + item.ProductID.trim() + "' ";
        //DaoSvc.execSQL(sql, function(items){
        DaoSvc.execSQL(pricelistPriceSQL, function(trItem) {
            trustedGross = parseFloat(trItem[0].Gross.toFixed(2));
            trustedNett = parseFloat(trItem[0].Nett.toFixed(2));
            trustedDiscount = parseFloat(trItem[0].Discount.toFixed(2));
            trustedItem = trItem[0];
            var stockPrice = {};
            DaoSvc.execSQL(sql, function(items){
                stockPrice.volumePrice = GetDiscount3(g_discountsDictionary, items, undefined, undefined, item.ProductID.trim(), trustedGross, trustedNett, trustedDiscount);



                //*** Only if we applying more that one discount do we do this.
                if (stockPrice.volumePrice.length > 1) {
                    for (var i = 0; i < stockPrice.volumePrice.length; ++i) {
                        var vp = stockPrice.volumePrice[i];
                        //*** when applying multiple discounts to a product, the gross gets decreased. The issue then is that the wrong price is sent to .mobi
                        //*** So once the logic is done, we will do two things.
                        //** 1. We set the gross back to the original gross
                        if ($.inArray(vp.ID, OptionSvc.getText('ApplyToGrossFromDiscounts','').split(',')) >= 0) trustedGross = vp.Gross;
                        vp.Gross = trustedGross;
                        //*** 2. the discount will now reflect only the last discount.
                        //***    so we will now recalc the disocunt between the original gross and the new nett and then give us the discount between them

                        if (vp.Nett1 > 0) {
                            vp.Discount1 = (trustedGross - vp.Nett1) / trustedGross * 100;
                        } else {
                            vp.Discount1 = 0;
                        }

                        if (vp.Nett2 > 0) {
                            vp.Discount2 = (trustedGross - vp.Nett2) / trustedGross * 100;
                        } else {
                            vp.Discount2 = 0;
                        }

                        if (vp.Nett3 > 0) {
                            vp.Discount3 = (trustedGross - vp.Nett3) / trustedGross * 100;
                        } else {
                            vp.Discount3 = 0;
                        }

                        if (vp.Nett4 > 0) {
                            vp.Discount4 = (trustedGross - vp.Nett4) / trustedGross * 100;
                        } else {
                            vp.Discount4 = 0;
                        }

                    }
                }

                if (poncomplete)
                    poncomplete(stockPrice);

            },function(error) {
                // ponerror(error);
                console.log(error);
                var liveinfo = getNewVolumePrice();
                liveinfo.ID = null;
                liveinfo.skipRest = true;
                liveinfo.SortOrder = 0;
                liveinfo.Gross = trustedGross;
                liveinfo.ProductID = item.ProductID;
                liveinfo.ApplyToGross = false;
                liveinfo.OverwriteDiscount = false;
                liveinfo.Type = 'PRICE';
                liveinfo.Deal = null;
                liveinfo.Discount1 = 0;
                liveinfo.Discount2 = 0;
                liveinfo.Discount3 = 0;
                liveinfo.Discount4 = 0;
                liveinfo.Nett1 = trustedNett;
                liveinfo.Nett2 = 0;
                liveinfo.Nett3 = 0;
                liveinfo.Nett4 = 0;
                liveinfo.Qty1 = 9999999;
                liveinfo.Qty2 = 0;
                liveinfo.Qty3 = 0;
                liveinfo.Qty4 = 0;
                stockPrice.volumePrice = [];
                stockPrice.volumePrice.push(liveinfo);

                if (poncomplete)
                    poncomplete(stockPrice);
            });
        }, function(err){
            ponerror(err);
        });
    }

    function GetDiscount3(hashDiscounts, lstDiscValues, supplierID, accountid, productid, trGross, trNett, trDiscount) {
        var bfound = false;
        var liveinfo = {};
        var prevDiscountid = "";
        var cntVolDisc = 0;
        var x = 0;
        var lst = [];
        var trustedValues = {};
        trustedValues.Gross = trGross;
        trustedValues.Nett = trNett;
        trustedValues.Discount = trDiscount;


        //*** loop through all the kinds of discounts
        for (var i = 0; i < g_discounts.length; ++i) {
            var disc = g_discounts[i];
            //*** loop through each discountvalues for the discount
            cntVolDisc = 1;   //This is counter for volume discounts
            x = 0;
            for (var j = 0; j < lstDiscValues.length; ++j) {
                var discountValue = lstDiscValues[j];
                if (disc.DiscountID === discountValue.DiscountID) {
                    //*** pick up all records to be applied
                    if (cntVolDisc === 1) {
                        liveinfo = getNewVolumePrice();
                        liveinfo.ID = disc.DiscountID;
                        liveinfo.skipRest = disc.SkipRest;
                        liveinfo.SortOrder = disc.SortOrder;
                        liveinfo.Gross = trustedValues.Gross;
                        liveinfo.ProductID = productid;
                        liveinfo.ApplyToGross = disc.ApplyToGross;
                        liveinfo.OverwriteDiscount = disc.OverwriteDiscount;
                        liveinfo.Type = disc.Type;
                        bfound = CalcPriceOrDiscount(disc, discountValue, trustedValues, 1, liveinfo, bfound, discountValue.QtyHigh, liveinfo.Deal);
                        liveinfo.Gross = trustedValues.Gross; //** in case applytogross was ticked
                        liveinfo.Deal = discountValue.Deal;
                        lst.push(liveinfo);
                    }
                    //*** now pick up any further quantity discounts
                    if (cntVolDisc === 2) bfound = CalcPriceOrDiscount(disc, discountValue, trustedValues, 2, liveinfo, bfound, discountValue.QtyHigh, liveinfo.Deal);
                    if (cntVolDisc === 3) bfound = CalcPriceOrDiscount(disc, discountValue, trustedValues, 3, liveinfo, bfound, discountValue.QtyHigh, liveinfo.Deal);
                    if (cntVolDisc === 4) bfound = CalcPriceOrDiscount(disc, discountValue, trustedValues, 4, liveinfo, bfound, discountValue.QtyHigh, liveinfo.Deal);

                    if (disc.SkipRest && !HasOtherVolDiscounts(lstDiscValues, x)) {
                        console.log("Skip rest");
                        break;
                    }
                    cntVolDisc = cntVolDisc + 1;
                }
                x = x + 1;
            }
            if (bfound && disc.SkipRest)
                break;
        }
        if (bfound) {
//            console.log("Discount/Price calulated as " & liveinfo.toString());
            return lst;
        } else {
            liveinfo = getNewVolumePrice();
            liveinfo.Gross = trustedGross;
            liveinfo.Nett1 = trustedNett;
            liveinfo.ProductID = productid;
            liveinfo.Discount1 = trustedDiscount;
            liveinfo.ApplyToGross = false;
            liveinfo.OverwriteDiscount = false;
            liveinfo.Type = "PRICE";
            liveinfo.Qty1 = 9999;
            lst.push(liveinfo);
            return lst;
        }
    }

    //function CalcPriceOrDiscount(disc, discountValue, tr_gross, tr_nett, nett, Discount, bfound, QtyHigh, Qty, Deal) {
    function CalcPriceOrDiscount(disc, discountValue, trValues, index, liveinfo, bfound, QtyHigh, Deal) {
        liveinfo['Qty' + index] = QtyHigh;
        Deal = discountValue.Deal;
        if (disc.Type === 'PRICE') {
            if (disc.OverwriteDiscount) {
                liveinfo['Nett' + index] = discountValue.Price;
            } else {
                liveinfo['Nett' + index] = trValues.Gross - discountValue.Price;
            }
            bfound = true;
        } else if (disc.Type === 'DISCOUNT') {
            if (disc.OverwriteDiscount) {
                liveinfo['Nett' + index] = trValues.Gross - (trValues.Gross * (discountValue.Discount / 100));
            } else {
                liveinfo['Nett' + index] = trValues.Nett - (trValues.Nett * (discountValue.Discount / 100));
            }

            liveinfo['Discount' + index] = discountValue.Discount;
            bfound = true;
        }
        if (bfound) {
            if (disc.ApplyToGross) {
                trValues.Gross = liveinfo['Nett' + index];
                liveinfo['Discount' + index] = 0;
            }
        }

        return bfound;
    }

    function getSQL(item) {

        var sql = '';
        var union = '';

        for (var j=0; j < g_discounts.length; ++j) {
            var discountInfo = g_discounts[j]

            sql = sql + union + "SELECT dv.* FROM DiscountValues dv WHERE dv.index1='" + discountInfo.DiscountID + "'";
            for (var x = 0; x < g_discountConditions.length; ++x) {
                var discountConditionInfo = g_discountConditions[x];
                if (discountInfo.DiscountID !== discountConditionInfo.DiscountID)
                    continue;

                if (x < (g_discountConditions.length - 1)) {
                    if (g_discountConditions[x + 1].OrCond) {
                        sql += " AND ( ";    //*** next condition is an or, so add a braket
                    } else if (g_discountConditions[x].OrCond) {
                        sql += " OR ";       //*** this condition is an or
                    } else {
                        sql += " AND ";      //*** all others are and
                    }
                } else {
                    sql += " AND ";
                }

                if (discountConditionInfo.InCond) {
                    var findInArray = discountConditionInfo.RTObject === "#Account" ?
                        currentAccount[discountConditionInfo.RTAttribute].replace(/'/g,'').split(',') : item[discountConditionInfo.RTAttribute].replace(/'/g,'').split(',');
                    sql += ' ( ';
                    var orStr = '';
                    for (var i=0; i < findInArray.length; ++i) {
                        sql += orStr + " dv.[json] like '%\"" + discountConditionInfo.DiscountField + "\":\"" + findInArray[i] + "\"%' ";
                        orStr = " OR "
                    }
                    sql += " )";
                } else {
                    var rtAttribute = discountConditionInfo.RTObject === "#Account" ? currentAccount[discountConditionInfo.RTAttribute] : item[discountConditionInfo.RTAttribute];
                    sql += " dv.[json] like '%\"" + discountConditionInfo.DiscountField + "\":\"" + rtAttribute + "\"%' ";
                }

                if (g_discountConditions[x].OrCond) {
                    sql += " ) ";   //*** close the bracket if this was the or
                }
            }
            //*** sql &= " and " & quantity & " >= qtylow and " & quantity & " <= qtyhigh " 'commented out as we want all rows returned to calculate volume discounts
            var mom = moment();
            var today = mom.format('YYYY-MM-DD');
            sql += " AND  dv.index3 <= '" + today + "' AND dv.index4 >= '" + today + "' ";
            union = " UNION ";
        }
//        console.log(sql);
        return sql;
    }

    function HasOtherVolDiscounts(lstDiscValues, x) {
        if (x === lstDiscValues.length - 1) return false;
        var thisDiscountID, nextDiscountID;
        thisDiscountID = lstDiscValues[x].DiscountID;
        nextDiscountID = lstDiscValues[x + 1].DiscountID;
        if (thisDiscountID === nextDiscountID) {
            return true;
        } else {
            return false;
        }
    }

    function getNewVolumePrice() {
        var volumePrice = {};
        volumePrice.ApplyToGross = false;
        volumePrice.Deal = undefined;
        volumePrice.Discount1 = 0;
        volumePrice.Discount2 = 0;
        volumePrice.Discount3 = 0;
        volumePrice.Discount4 = 0;
        volumePrice.Gross = 0;
        volumePrice.ID = undefined;
        volumePrice.Nett1 = 0;
        volumePrice.Nett2 = 0;
        volumePrice.Nett3 = 0;
        volumePrice.Nett4 = 0;
        volumePrice.OverwriteDiscount = false;
        volumePrice.ProductID = undefined;
        volumePrice.Qty1 = 0;
        volumePrice.Qty2 = 0;
        volumePrice.Qty3 = 0;
        volumePrice.Qty4 = 0;
        volumePrice.skipRest = true;
        volumePrice.SortOrder = 0;
        volumePrice.Type = 0;

        return volumePrice;

    }

    // function GetIndexDBPrice(item, oncomplete, onerror) {
    //     productdetailFetchLocalDiscount();
    // }

    this.applyDiscount = function(discountID) {
        var promoExclAccountGroup = OptionSvc.getText('PromoExclAccountGroup', '');
        if (!promoExclAccountGroup)
            return true;

        var currenrCompany = JSON.parse(sessionStorage.getItem('companyCache'));
        var promoExclDicountsOption = OptionSvc.getText('PromoExclDiscounts', '');
        var promoExclDicounts = promoExclDicountsOption ? promoExclDicountsOption.split(',') : [];

        if ($.inArray(currenrCompany.AccountGroup, promoExclAccountGroup.split(',')) >= 0 && $.inArray(discountID, promoExclDicounts) >= 0)
            return false;
        else
            return true;
    }

});
var g_discounts = [];
var g_discountsDictionary = {};
var g_discountConditions = [];
