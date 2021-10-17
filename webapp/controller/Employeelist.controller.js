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

            var oCategory = new JSONModel("../model/category.json");
            this.getView().setModel(oCategory, "category");

            // 입사년도 필터링을 위한 값 추출
            // var oModeData = this.getView().getModel("employee");
            // console.log(oModeData);
            // for (var i = 0; i <) {

            // }
            // var aDateSplit = this.getView().getModel("employee").getProperty("/")[hiredDate];
            // console.log(aDateSplit);

            // 게시판 카운트 모델 생성
            const oCountModel = new JSONModel({ count: 0 });
            this.getView().setModel(oCountModel, "co");
            // this.getView().getModel("co").refresh(true);
            
            // 테이블에 리스트 카운트 넣어주기
            let oBinding = this.byId("table").getBinding("items");
            
            if (oBinding != undefined && oBinding.aIndices != undefined) {
                this.getView().getModel("co").setProperty("/count", oBinding.aIndices.length);
            }

            // 그룹화 : 선택한 property를 저장하는 변수 
            this.mGroupFunctions = {
                // 부서
                department: function (oContext) {
                    var department = oContext.getProperty("department");
                    return {
                        key: department,
                        text: department
                    };
                },
                // 직급
                position: function (oContext) {
                    var position = oContext.getProperty("position");
                    return {
                        key: position,
                        text: position
                    };
                },
                // 입사년도
                hiredYear: function (oContext) {
                    var hiredYear = oContext.getProperty("hiredYear");
                    return {
                        key: hiredYear,
                        text: hiredYear
                    }
                }
            }
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
            var input1 = this.getView().byId("input1").getSelectedKey();
            var input2 = this.getView().byId("input2").getSelectedKey();
            var input3 = this.getView().byId("input3").getValue();
            var input4 = this.getView().byId("input4").getValue();
            var input5 = this.getView().byId("input5").getDateValue();
            var input6 = this.getView().byId("input6").getValue();
            var input7 = this.getView().byId("input7").getValue();
            var input8 = this.getView().byId("input8").getValue();

            var oModelData = this.getView().getModel("employee").getProperty("/");
            
            oModelData.push({
                department: input1,
                position: input2,
                name: input3,
                id: input4,
                hiredDate: input5,
                task: input6,
                phoneNumber: input7,
                email: input8
            });

            this.getView().getModel("employee").refresh(true);

            // 테이블에 리스트 카운트 넣어주기
            let oBinding = this.byId("table").getBinding("items");
            
            if (oBinding != undefined && oBinding.aIndices != undefined) {
                this.getView().getModel("co").setProperty("/count", oBinding.aIndices.length);
            }
            
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
			// if (oEvent.getParameters().refreshButtonPressed) {
			// 	// Search field's 'refresh' button has been pressed.
			// 	// This is visible if you select any master list item.
			// 	// In this case no new search is triggered, we only
			// 	// refresh the list binding.
            //     // this.onRefresh();
                
			// } else {
			// 	var aTableSearchState = [];
			// 	var sQuery = oEvent.getParameter("query");

			// 	if (sQuery && sQuery.length > 0) {
            //         if (oEvent.getSource().getSelectedKey("name")) {
            //             aTableSearchState = [new Filter("name", FilterOperator.Contains, sQuery)];
            //         }
			// 	}
			// 	this._applySearch(aTableSearchState);
            // }
            
            var inputValue = this.getView().byId("searchField").getValue();
            this._applySearch(inputValue);

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
		_applySearch: function (sSearchValue) {
			var oTable = this.byId("table"),
                oViewModel = this.getModel("employee");
                
            var aFilters = [];
            var aFilterSet = [];        // 검색바 입력에 맞는 조건들의 배열

            // 검색바 입력에 따라 조건처리
            var aNameFilter = [new Filter({path: "name", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false})];
            var aIdFilter = [new Filter({path: "id", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false})];
            var aPhoneNumFilter = [new Filter({path: "phoneNumber", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false})];
            var aEmailFilter = [new Filter({path: "email", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false})];

            // 검색조건 선택값에 따라 조건처리
            if (this.byId("selectedItems").getSelectedKey() === "name") {
                aFilterSet.push(new Filter({filters: aNameFilter}));
            } else if (this.byId("selectedItems").getSelectedKey() === "id") {
                aFilterSet.push(new Filter({filters: aIdFilter}));
            } else if (this.byId("selectedItems").getSelectedKey() === "phoneNumber") {
                aFilterSet.push(new Filter({filters: aPhoneNumFilter}));
            } else if (this.byId("selectedItems").getSelectedKey() === "email") {
                aFilterSet.push(new Filter({filters: aEmailFilter}));
            } else if (this.byId("selectedItems").getSelectedKey() === "all") {
                aFilterSet.push(new Filter({
                    filters: [
                        new Filter({path: "department", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false}),
                        new Filter({path: "position", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false}),
                        new Filter({path: "name", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false}),
                        new Filter({path: "id", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false}),
                        new Filter({path: "hiredDate", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false}),
                        new Filter({path: "task", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false}),
                        new Filter({path: "phoneNumber", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false}),
                        new Filter({path: "email", operator: FilterOperator.Contains, value1: sSearchValue, caseSensitive: false})
                    ],
                    and: false
                }));
            }

            // aFilters.push(new Filter({filters: aFilterSet}));
            oTable.getBinding("items").filter(aFilterSet);
            
			// changes the noDataText of the list in case there are no filter results
			if (oTable.getBinding("items").length !== 0) {
                // oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("emplistNoDataWithSearchText"));
                oViewModel.setProperty("/tableNoDataText", "데이터가  없습니다.");
            }
            
            // 테이블에 리스트 카운트 넣어주기
            let oBinding = this.byId("table").getBinding("items");
            
            if (oBinding != undefined && oBinding.aIndices != undefined) {
                this.getView().getModel("co").setProperty("/count", oBinding.aIndices.length);
            }
        },
        
        onExport : function () {
            if(this.byId("table").getBinding("items") === undefined){
                MessageBox.alert("리스트를 먼저 조회해주세요.");
                return;
            }

            let aCols, oRowBinding, oSettings, oSheet, oTable;
    
            if (!this._oTable) {
                this._oTable = this.byId('table');
            }

            oTable = this._oTable;
            oRowBinding = oTable.getBinding("items");
            aCols = this.createColumnConfig();

            oSettings = {
                workbook: {
                    columns: aCols,
                    hierarchyLevel: "Level"
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
            property: 'department',
            type: EdmType.String
            });

            aCols.push({
            property: 'position',
            type: EdmType.String
            });

            aCols.push({
            property: 'name',
            type: EdmType.String
            });

            aCols.push({
            property: 'id',
            type: EdmType.String
            });

            aCols.push({
            property: 'hiredDate',
            type: EdmType.String
            });

            aCols.push({
            property: 'task',
            type: EdmType.String
            });

            aCols.push({
            property: 'phoneNumber',
            type: EdmType.String
            });

            aCols.push({
            property: 'email',
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

        resetGroupDialog: function (oEvent) {
            this.groupReset = true;
        },

        onConfirmOrderDialog : function (oEvent) {
            let mParams = oEvent.getParameters();           // 해당 이벤트가 발생한 시점의 정보 (filter, group, sort의 정보를 모두 가지고 있음)
            let oBinding = this.byId("table").getBinding("items");      // table의 items 컬럼들값 (테이블의 행 정보)       

            // 정렬
            let sPath = mParams.sortItem.getKey();          // fragment.xml에서 지정한 sortItems의 key값
            let bDescending = mParams.sortDescending;       // default value=> false

            let aSorters = [];
            aSorters.push(new Sorter(sPath, bDescending));  // sortItems의 key값들을 오름차순으로 정렬할 배열
            
            this.getView().getModel("co").setProperty("/count", oBinding.aIndices.length);  // 행의 갯수를 담는 로직
            // oBinding.sort(aSorters);    // 행을 정렬할 때 aSorters 배열을 가져와서 담음

            // 필터
            let aFilters = [];
            mParams.filterItems.forEach(function (oItem) {
                // oItem.getKey() : fragment에서 설정한 key값을 가져옴
                var aSplit = oItem.getKey().split("___"),       // "___"의 앞과 뒤를 기준으로 string을 array형태로 만들어줌
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

            // 그룹화
            let vGroup,
                aGroups = [];

            if (mParams.groupItem) {
                sPath = mParams.groupItem.getKey();
                bDescending = mParams.groupDescending;

                vGroup = this.mGroupFunctions[sPath];
                aGroups.push(new Sorter(sPath, bDescending, vGroup));

                // apply the selected group settings
                oBinding.sort(aGroups);
            } else {
                // 그룹화가 되어 있는 상태라면 sort의 기능은 실행불가
                oBinding.sort(aSorters);
                this.groupReset = true;
            }

            // 테이블에 리스트 카운트 넣어주기            
            if (oBinding != undefined && oBinding.aIndices != undefined) {
                this.getView().getModel("co").setProperty("/count", oBinding.aIndices.length);
            }
        }
	});
});