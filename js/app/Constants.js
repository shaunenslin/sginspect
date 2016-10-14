coreApp.constant('Settings', {

    version: '2.06',
    showVersion: true,

	//SG Admin
    url: 'http://www.super-trade.co.za:8084/sgirest/index.php/',
    dotnetPostUrl: 'http://www.super-trade.co.za:8084/sgirest/post/post.aspx',
    isoGetUrl: 'http://www.super-trade.co.za:8084/sgiso/',
    supplierID: 'SGA',
    logo: 'img/fleetafrica_logo.png',
    splash:  'img/mustang.jpg',
    phpServer: true,
    allowRequestRegister: false,
    allowSelfRegister: true,
    allowTour: false,
    appName: 'SGInspect',
    navColor: '#ce180f',
    navBottom: 'solid #F3B82E',
    firstPage: '/admin',

    db: 'SGInspect',
    menuStyle: 'List',
    isIndexDB : false,
    isPhoneGap: false,
    navHeading: true,

    syncTables : [
        {table: 'Options', method: 'Sync2'},
        {table: 'DisplayFields', method: 'Sync2'},
        {table: 'SGISuppliers', method : 'supplieris_sync', generic: true},
        {table: 'SGIClient', method : 'Clients_Sync', generic: true}
    ],

    tableKeys : [
        {table : 'DisplayFields',       getKey : function(item){return item.SupplierID + item.ID + item.Name;}, index1 : function(item){return item.ID;}, index2 : function(item){return item.SortOrder;}, index3 : function(item){return item.SortOrder;} },
        {table : 'Options',             getKey : function(item){return item.SupplierID + item.Name;},       index1:function(item){return item.Name;}},
        {table : 'Unsent',              getKey : function(item){return item.keyf;}, index1 : function(item){return 'undefined';} /* PLEASE DO NOT REMOVE index1 function: when loading logout screen we're checking unsent items by counting them on index1 column. For some reason on iOS local SQL, when we are inserting undefined as value it is not recorded that way  */ },
        {table : 'SGIClient',           getKey : function(item){return item.ClientID;}, index1 : function(item){return item.ClientID;}, index2 : function(item){return item.Name;}},
        {table : 'SGISuppliers',        getKey : function(item){return item.SupplierID + item.Name;}, index1 : function(item){return item.SupplierID;}, index2 : function(item){return item.Name;}},
        {table : 'InProgress',          getKey : function(item){return item.FormID},index1:function(item){return item.FormType;}, index2 : function(item){return item.JSON.Path;}, index3:function(item){return item.JobType;}},
    ],

    workflow : {
        audit : [
            {route:'selectclient'},
            {route:'scanlicense'},
            {route:'vinmatch'},
            {route:'vinpicture'},
            {route:'licensephoto'},
            {route:'licensematch'},
            {route:'form'}
        ]
    }
});
