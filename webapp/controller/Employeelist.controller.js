sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "../control/modules",
    "sap/ui/model/Sorter"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Fragment, MessageBox, Spreadsheet, exportLibrary, modules, Sorter) {
    "use strict";
    const EdmType = exportLibrary.EdmType;
    let _this;

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
            
            var oModel = new JSONModel("../model/employee.json");
            this.getView().setModel(oModel, "employee");
            // this.getView().getModel("employee").refresh(true);

            // 게시판 카운트 모델 생성
            const oCountModel = new JSONModel({ count: 0 });
            this.getView().setModel(oCountModel, "co");
            // this.getView().getModel("co").refresh(true);
            

            // 테이블에 리스트 카운트 넣어주기
            // let aSorters = [{}];
            let oBinding = this.byId("table").getBinding("items");
            
            if (oBinding != undefined && oBinding.aIndices != undefined) {
                this.getView().getModel("co").setProperty("/count", oBinding.aIndices.length);
            }
            // oBinding.sort(aSorters);
       
            // console.log(oBinding);
            // console.log(oBinding.aIndices);
            // console.log(oBinding.aIndices.length);
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
        },
        
        onExport : function () {
            // modules.log("onExport");
            console.log(this.byId("table").getBinding("items"));

            if(this.byId("table").getBinding("items") === undefined){
                MessageBox.alert("리스트를 먼저 조회해주세요.");
                return;
            }

            let aCols, oRowBinding, oSettings, oSheet, oTable;
    
            if (!this._oTable) {
                this._oTable = this.byId('table');
            }

            oTable = this._oTable;
            oRowBinding = oTable.getBinding('items');
            aCols = this.createColumnConfig();

            oSettings = {
                workbook: {
                    columns: aCols,
                    hierarchyLevel: 'Level'
                },
                dataSource: oRowBinding,
                fileName: 'emplist.xlsx',
                worker: false 
            };

            oSheet = new Spreadsheet(oSettings);
            oSheet.build().finally(function() {
                oSheet.destroy();
            });
        },

        createColumnConfig : function () {
            const aCols = [];

            aCols.push({
            property: '부서',
            type: EdmType.String
            });

            aCols.push({
            property: '직급',
            type: EdmType.String
            });

            aCols.push({
            property: '성명',
            type: EdmType.String
            });

            aCols.push({
            property: '사번',
            type: EdmType.String
            });

            aCols.push({
            property: '입사일',
            type: EdmType.String
            });

            aCols.push({
            property: '담당업무',
            type: EdmType.String
            });

            aCols.push({
            property: '연락처',
            type: EdmType.String
            });

            aCols.push({
            property: '이메일',
            type: EdmType.String
            });

            return aCols;
        },

        onSetFilter : function () {
            this.onEmpOpenSettings();
        },

        // filter button dialog 띄워주기
        onEmpOpenSettings : function () {
            const sDialogTab = "filter";
            
            if (!this.byId("filter")) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "jelink.ui5app.fragment.Filter",
                    controller: this
                }).then(function(oDialog){
                    this.getView().addDependent(oDialog);
                    oDialog.open(sDialogTab);
                }.bind(this));
            } else {
                this.byId("filter").open(sDialogTab);
            }
        },

        onConfirmOrderDialog : function (oEvent) {
            let mParams = oEvent.getParameters();           // 해당 이벤트가 발생한 시점의 정보
            let oBinding = this.byId("table").getBinding("items");      // table의 items 컬럼들값 (테이블의 행 정보)
            console.log(mParams);        

            // 정렬
            let sPathSort = mParams.sortItem.getKey();          // fragment.xml에서 지정한 sortItems의 key값
            let bDescendingSort = mParams.sortDescending;       // default value=> false

            let aSorters = [];
            aSorters.push(new Sorter(sPathSort, bDescendingSort));  // sortItems의 key값들을 오름차순으로 정렬할 배열
            
            this.getView().getModel("co").setProperty("/count", oBinding.aIndices.length);  // 행의 갯수를 담는 로직
            oBinding.sort(aSorters);    // 행을 정렬할 때 aSorters 배열을 가져와서 담음

            // 필터
            let aFilters = [];
            mParams.filterItems.forEach(function (oItem) {
                // console.log(oItem);
                var aSplit = oItem.getKey().split("___"),       // "__"의 앞과 뒤를 기준으로 string을 array형태로 만들어줌
                sPath = aSplit[0],
                sOperator = aSplit[1],
                sValue1 = aSplit[2],
                sValue2 = aSplit[3],
                oFilter = new Filter(sPath, sOperator, sValue1, sValue2);
                aFilters.push(oFilter);
            });

            // apply filter settings
            oBinding.filter(aFilters);

            // update filter bar
            this.byId("filterBar").setVisible(aFilters.length > 0);
            this.byId("filterLabel").setText(mParams.filterString);

            console.log(aFilters);

            // 그룹화
            // let sPathGroup, bDescendingGroup;
            // let vGroup,
            //     aGroups = [];

            // if (mParams.groupItem) {
            //     sPathGroup = mParams.groupItem.getKey();        // fragment.xml에서 지정한 groupItems의 key값
            //     bDescendingGroup = mParams.groupDescending;      // default value=> false

            //     // console.log(this);
            //     // vGroup = this.mGorupFunctions[sPathGroup];
            //     aGroups.push(new Sorter(sPathGroup, bDescendingGroup, vGroup));

            //     // apply the selected group settings
            //     oBinding.sort(aGroups);
            // } else if (this.groupReset) {
            //     oBinding.sort();
            //     this.groupReset = false;
            // }
        }
	});
});