/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function AppRoutes($routeProvider, DaoSvc){
    $routeProvider.when("/officialevents", {templateUrl:"views/officialEvents.html"});
    $routeProvider.when("/SgUsers",{templateUrl:"js/sginspect/view/SgUsers.html"});
    $routeProvider.when('/SgUsers/:mode/:id',{templateUrl : "js/sginspect/view/SgUsers.html"});
}

function TestCtrl($templateCache) {
   this.user = {name: 'Kevin'};
   console.log($templateCache.get('test.html'));
}

//angular.module("coreApp").controller('TestCtrl', TestCtrl);
