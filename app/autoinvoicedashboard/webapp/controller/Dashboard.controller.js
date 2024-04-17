sap.ui.define([
	"autoinvoicedashboard/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"autoinvoicedashboard/model/messenger"
], function (BaseController, Filter, FilterOperator, messenger) {
	"use strict";

	return BaseController.extend("autoinvoicedashboard.controller.Dashboard", {
		onAfterRendering: function () {
		},
		onListItemPress: function (oEvent) {
			var oViewModel = this.getModel(),
				sPath = oEvent.getSource().getBindingContext().getPath();

			if (sPath) {
				sPath = sPath.substring(1);
				this.getRouter().navTo("Detail", {
					invoicePath: sPath
				});
			}
		},
		onSearch: function (oEvent) {
			var sInvoiceNum = this.byId("idInvoiceNumberInput").getValue(),
				sVendorNum = this.byId("idVendorNumberInput").getValue(),
				sCompanyName = this.byId("idCompanyNameInput").getValue(),
				sDate1 = this.byId("idDatePicker").getDateValue(),
				sDate2 = this.byId("idDatePicker").getSecondDateValue(),
				sPoNumber = this.byId("idPoNumInput").getValue(),
				oTable = this.byId("idInvoiceTable"),
				aFilters = [];

			if (sInvoiceNum) {
				aFilters.push(new Filter({
					path: "invoiceNo",
					operator: FilterOperator.Contains,
					value1: sInvoiceNum,
					caseSensitive: false
				}));
			}
			if (sVendorNum) {
				aFilters.push(new Filter({
					path: "vendorNo",
					operator: FilterOperator.Contains,
					value1: sVendorNum,
					caseSensitive: false
				}));
			}
			if (sCompanyName) {
				aFilters.push(new Filter({
					path: "companyName",
					operator: FilterOperator.Contains,
					value1: sCompanyName,
					caseSensitive: false
				}));
			}
			if (sDate1 && sDate2) {
				aFilters.push(new Filter({
					path: "invoiceDate",
					operator: FilterOperator.BT,
					value1: this.parseFormattedDate(sDate1),
					value2: this.parseFormattedDate(sDate2)
				}));
			}
			if (sPoNumber) {
				aFilters.push(new Filter({
					path: "poNumber",
					operator: FilterOperator.Contains,
					value1: sPoNumber,
					caseSensitive: false
				}));
			}
			oTable.getBinding("items").filter(aFilters);
			if (aFilters.length === 0) {
				this.byId("idInvoiceTable").bindAggregation("items", "/Invoices", this.byId("_IDGenColumnListItem1"));
			}
		},
		handleDownloadPress: function (oEvent) {
			var oModel = this.getModel(),
				oResourceBundle = this.getResourceBundle(),
				sPath = oEvent.getSource().getAggregation("customData")[0].getValue();;
			if (sPath) {
				var sServiceUrl = window.location.origin + "/" + oModel.sServiceUrl + sPath;
				window.open(sServiceUrl);
			} else {
				messenger.error(oResourceBundle.getText("NO_FILE_FOUND"));
			}
		}
	});
});