/*
 //
 //  Created by Spartak B 
 //  Copyright (c) 2011 Develocorp Inc. All rights reserved.
 //
 */

(function(cordova) {

  function NativeTable() {
    this.callBackFunction = null;
    this.rightCallBackFunction = null;
    this.backCallBackFunction = null;
    this.didShowTable = null;
    this.didHideTable = null;
  }

  NativeTable.prototype.createTable = function(params) {
    cordova.exec("NativeTable.createTable", params);
  };


  NativeTable.prototype.setTableData = function(tableData) {
    cordova.exec("NativeTable.setTableData", tableData);
  };
  
  NativeTable.prototype.showTable = function(cb) {
    this.didShowTable = cb;
    cordova.exec("NativeTable.showTable");
  };
  NativeTable.prototype._onTableShowComplete = function() {
    if(this.didShowTable)
    this.didShowTable();
  };
  
  NativeTable.prototype.hideTable = function(cb) {
    this.didHideTable = cb;
    cordova.exec("NativeTable.hideTable");
  };
  NativeTable.prototype._onTableHideComplete = function() {
    if(this.didHideTable)
    this.didHideTable();
  };

  NativeTable.prototype.setRowSelectCallBackFunction = function(callBkFunc) {
    this.callBackFunction = callBkFunc;
  };

  NativeTable.prototype.onRightButtonTap = function(callBkFunc) {
    this.rightCallBackFunction = callBkFunc;
  };
  
  NativeTable.prototype._onRightButtonTap = function() {
    if(this.rightCallBackFunction)
    this.rightCallBackFunction();
  };

  NativeTable.prototype.onBackButtonTap = function(callBkFunc) {
    this.backCallBackFunction = callBkFunc;
  };
  
  NativeTable.prototype._onBackButtonTap = function() {
    if(this.backCallBackFunction)
    this.backCallBackFunction();
  };

  NativeTable.prototype._onTableViewRowSelect = function(rowId) {
    if(this.callBackFunction)
    this.callBackFunction(rowId);
  };

  cordova.addConstructor(function() {
    if(!window.plugins) window.plugins = {};
    window.plugins.NativeTable = new NativeTable();
  });

})(window.cordova || window.Cordova);
