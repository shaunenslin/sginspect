coreApp.constant('Settings', {


     //DEMO - RapidAdmin Settings
    /*
    dbName:             'Core',
    url:                'http://api.rapidtrade.biz/rest/' ,//'http://www.super-trade.co.za:8084/rest/', 'http://api.rapidtrade.biz/rest/' ,
    dynamoUrl:          'http://api.rapidtrade.biz/rest/' ,
    phpServer:          true,
    allowRequestRegister: false,
    allowSelfRegister:  true,
    allowTour:          false,
    appName:            'AngularCore',
    navColor:           '#31373B',
    supplierID:         'DEMO',
    logo:               'img/logo.png',
    splash:             'http://www.rapidtrade.biz/splash/GSCNZ/splash3.jpg',
    dotnetPostUrl:      'http://api.rapidtrade.biz/rest/post/post.aspx',
    imageUrl:           'http://app1.rapidtrade.biz/rest/Files/GetProductImage',
    */

    version: '1.66',
    showVersion: true,



	//SG Admin
    url: 'http://www.super-trade.co.za:8084/rest/index.php/',
    supplierID: 'SGA',
    logo: 'http://www.sgadmin.co.za/logo/SG-Admin-sm.png',
    splash:  'img/groupbg.jpg',
    phpServer: false,
    allowRequestRegister: false,
    allowSelfRegister: true,
    allowTour: false,
    appName: 'SGInspect',
    navColor: '#31373B',
    firstPage: '/admin',

    db: 'SGInspect',
    menuStyle: 'List',
    isIndexDB : false,
    isPhoneGap: false,
    navHeading: true,

    syncTables : [
        {table: 'Options', method: 'Sync2'},
        {table: 'Tree', method: 'Sync'},
        {table: 'DisplayFields', method: 'Sync2'},
        {table: 'SGISuppliers', alternateLink : "http://www.super-trade.co.za:8084/rest/index.php/GetStoredProc/Sync?StoredProc=supplieris_sync&Params=(0)&table=SGISuppliers"},
        {table: 'SGIClients', alternateLink : "http://www.super-trade.co.za:8084/rest/index.php/GetStoredProc/Sync?StoredProc=Clients_Sync&Params=(0)&table=SGIClient"}    

    ],

    tableKeys : [
        {table : 'DisplayFields',       getKey : function(item){return item.SupplierID + item.ID + item.Name;}, index1 : function(item){return item.ID;}, index2 : function(item){return item.SortOrder;}, index3 : function(item){return item.SortOrder;} },
        {table : 'Options',             getKey : function(item){return item.SupplierID + item.Name;},       index1:function(item){return item.Name;}},
        {table : 'Tree',                getKey : function(item){return item.SupplierID + item.TreeID;},     index1:function(item){return item.Group;}, index2:function(item){return item.ParentTreeID;}, index3:function(item){return item.SortOrder;}},
        {table : 'Unsent',              getKey : function(item){return item.keyf;}, index1 : function(item){return 'undefined';} /* PLEASE DO NOT REMOVE index1 function: when loading logout screen we're checking unsent items by counting them on index1 column. For some reason on iOS local SQL, when we are inserting undefined as value it is not recorded that way  */ },
        {table : 'SGIClients',          getKey : function(item){return item.ClientID;}, index1 : function(item){return item.ClientID;}, index2 : function(item){return item.Name;}}, 
        {table : 'SGISuppliers',        getKey : function(item){return item.SupplierID + item.Name;}, index1 : function(item){return item.SupplierID;}, index2 : function(item){return item.Name;}}
    ],

    workflow : { 
        audit : [
            {route:'selectclient'},
            {route:'scanlicense'},
            {route:'vinpicture'},
            {route:'vinmatch'},
            {route:'licensephoto'},
            {route:'licensematch'},
            {route:'auditform'}
        ]
    }
});

//url: 'http://www.dedicatedsolutions.co.za:8082/rest2/',