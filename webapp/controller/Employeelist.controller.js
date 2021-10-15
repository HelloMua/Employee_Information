sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Fragment) {
	"use strict";

	return BaseController.extend("jelink.ui5app.controller.Employeelist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the emplist controller is instantiated.
		 * @public
		 */
		onInit : function () {
			var oViewModel;

			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				emplistTableTitle : this.getResourceBundle().getText("emplistTableTitle"),
				shareOnJamTitle: this.getResourceBundle().getText("emplistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailemplistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailemplistMessage", [location.href]),
				tableNoDataText : this.getResourceBundle().getText("tableNoDataText")
			});
			this.setModel(oViewModel, "emplistView");

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished : function (oEvent) {
			// update the emplist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("emplistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("emplistTableTitle");
			}
			this.getModel("emplistView").setProperty("/emplistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress : function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
        },
        
        /**
         * 사원정보 추가 다이얼로그 오픈
         */
        onEmpAddDialogOpen : function(){
            var oView = this.getView();

            if (!this.empAddDialog) {
				this.empAddDialog = Fragment.load({
					id: oView.getId(),
					name: "jelink.ui5app.fragment.EmployeeAddDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
                    oView.addDependent(oDialog);

                    // oDialog.attachBeforeOpen(function (oEvent) {
                        
                    // }.bind(this));

					return oDialog;
				});
			} 
			this.empAddDialog.then(function(oDialog) {
                oDialog.open();

                // oDialog.attachAfterOpen(function(){
                // 여기서 인풋필드 초기화 해보세요
                // });
            });
        },
        
        onCreateEmployee: function(){
            /**
             * 어제 했던 push 방식으로 추가
             */
            this.getView().byId("empDialog").close();
        },

        onCancelEmployee: function(){
            this.getView().byId("empDialog").close();
        },

		/**
		 * Event handler for navigating back.
		 * Navigate back in the browser history
		 * @public
		 */
		onNavBack : function() {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},


		onSearch : function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("ID", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh : function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
        },

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject : function (oItem) {
			var that = this;

			oItem.getBindingContext().requestCanonicalPath().then(function (sObjectPath) {
				that.getRouter().navTo("object", {
					objectId_Old: oItem.getBindingContext().getProperty("ID"),
					objectId : sObjectPath.slice("/Mitigations".length) // /Products(3)->(3)
				});
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
        */
		_applySearch: function(aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("emplistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("emplistNoDataWithSearchText"));
			}
		}

	});
});