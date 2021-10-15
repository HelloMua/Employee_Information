sap.ui.define([
    "sap/ui/core/mvc/Controller", 
    "sap/ui/model/json/JSONModel", 
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../control/modules",
    "sap/ui/core/Fragment",
    'sap/ui/export/Spreadsheet',
    'sap/ui/export/library',
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
  ], function (Controller, JSONModel, MessageBox, Filter, FilterOperator, modules, Fragment, Spreadsheet, exportLibrary, Sorter, MessageToast) {
    "use strict"
    const EdmType = exportLibrary.EdmType;
    let _this;

    return Controller.extend("jelink.gilro.tutorial.controller.ex1", {
        // 로그
        log : function (message) {
            console.log(" === "+message+" === ");
        }

    })
})