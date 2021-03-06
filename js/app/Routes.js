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
    $routeProvider.when('/job/:mode', {templateUrl : "js/sginspect/view/mainMenu.html"});
    $routeProvider.when('/jobs/:mode', {templateUrl : "js/sginspect/view/listOpen.html"});
    $routeProvider.when('/reports', {templateUrl : "js/sginspect/view/reports.html"});
    $routeProvider.when('/reports/:mode/:id', {templateUrl : "js/sginspect/view/reports.html"});
    $routeProvider.when('/audit/:mode/:id', {templateUrl : "js/sginspect/view/auditReport.html"});
    $routeProvider.when('/supplierevaluation/:mode/:id', {templateUrl : "js/sginspect/view/supplierEvaluationReport.html"});
    $routeProvider.when('/afterserviceevaluation/:mode/:id', {templateUrl : "js/sginspect/view/afterServiceReport.html"});
    $routeProvider.when('/technicalreport/:mode/:id', {templateUrl : "js/sginspect/view/techReportReport.html"});
    $routeProvider.when('/customervisit/:mode/:id', {templateUrl : "js/sginspect/view/customerVisitReport.html"});

}

function TestCtrl($templateCache) {
   this.user = {name: 'Kevin'};
   console.log($templateCache.get('test.html'));
}

//angular.module("coreApp").controller('TestCtrl', TestCtrl);
