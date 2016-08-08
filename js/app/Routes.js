/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function AppRoutes($routeProvider, DaoSvc){
    $routeProvider.when("/menu", {templateUrl : "js/sginspect/view/maiMenu.html"});
    $routeProvider.when("/officialevents", {templateUrl:"views/officialEvents.html"});
    $routeProvider.when("/SgUsers",{templateUrl:"js/sginspect/view/SgUsers.html"});
    $routeProvider.when('/SgUsers/:mode/:id',{templateUrl : "js/sginspect/view/SgUsers.html"});
    $routeProvider.when("/Clients",{templateUrl:"js/sginspect/view/Clients.html"});
    $routeProvider.when('/Clients/:mode/:id',{templateUrl : "js/sginspect/view/Clients.html"});
    $routeProvider.when("/Suppliers",{templateUrl:"js/sginspect/view/Suppliers.html"});
    $routeProvider.when('/Suppliers/:mode/:id',{templateUrl : "js/sginspect/view/Suppliers.html"});
    $routeProvider.when('/afterserviceevaluation', {templateUrl : "js/sginspect/view/afterServiceInspection.html"});
    $routeProvider.when('/audit', {templateUrl : "js/sginspect/view/auditForm.html"});
    $routeProvider.when('/selectclient/:inspectiontype/:screennum', {templateUrl : "js/sginspect/view/selectClient.html"});
    $routeProvider.when('/scanlicense/:inspectiontype/:screennum', {templateUrl : "js/sginspect/view/selectClient.html"});
    $routeProvider.when('/vinpicture/:inspectiontype/:screennum', {templateUrl : "js/sginspect/view/selectClient.html"});
    $routeProvider.when('/vinmatch/:inspectiontype/:screennum', {templateUrl : "js/sginspect/view/selectClient.html"});
    $routeProvider.when('/licensephoto/:inspectiontype/:screennum', {templateUrl : "js/sginspect/view/selectClient.html"});
    $routeProvider.when('/licensematch/:inspectiontype/:screennum', {templateUrl : "js/sginspect/view/selectClient.html"});
    $routeProvider.when('/customervisit',{templateUrl : "js/sginspect/view/customerVisit.html"});
    $routeProvider.when('/supplierevaluation/:mode',{templateUrl : "js/sginspect/view/supplierEvaluation.html"});
    $routeProvider.when('/technicalreport/',{templateUrl : "js/sginspect/view/technicalReport.html"});
}

function TestCtrl($templateCache) {
   this.user = {name: 'Kevin'};
   console.log($templateCache.get('test.html'));
}

//angular.module("coreApp").controller('TestCtrl', TestCtrl);
