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
			this.getView().setBusy(true);
			var oModel = this.getModel(),
				oResourceBundle = this.getResourceBundle(),
				sPath = oEvent.getSource().getAggregation("customData")[0].getValue();;
			if (sPath) {

				$.get({
					url: oModel.sServiceUrl + sPath,
					success: function (oData) {

						var sContent = oData.content;
						var sUrl = "";
						if (sContent.includes("data:application/pdf")) {
							sUrl = sContent;
						} else {
							sUrl = `data:${oData.mediaType};base64,` + sContent;
						}
						this.getView().setBusy(false);
						var win = window.open();
						
						win.document.write('<iframe src="' + sUrl +
							'" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>'
						);
						win.document.title =oData.fileName;
						// let uint8Array = new Uint8Array(oData.value.data),
						// 	blob = new Blob([uint8Array], { type: 'application/octet-stream' }),
						// 	link = document.createElement('a');
						// link.href = window.URL.createObjectURL(blob);
						// link.download = 'filename.pdf';
						// document.body.appendChild(link);
						// this.getView().setBusy(false);
						// link.click();
						// document.body.removeChild(link);


					}.bind(this),
					error: function (oError) {
						this.getView().setBusy(false);
						messenger.error("Error while downloading the file");

					}.bind(this)
				});
				// var sServiceUrl = window.location.origin +  oModel.sServiceUrl + sPath;
				// window.open(sServiceUrl);
			} else {
				messenger.error(oResourceBundle.getText("NO_FILE_FOUND"));
			}
		}
	});
});