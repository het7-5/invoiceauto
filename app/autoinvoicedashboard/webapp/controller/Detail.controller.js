sap.ui.define([
	"autoinvoicedashboard/controller/BaseController",
	"autoinvoicedashboard/model/messenger",
	"sap/ui/core/BusyIndicator"
], function (BaseController, messenger, BusyIndicator) {
	"use strict";

	return BaseController.extend("autoinvoicedashboard.controller.Detail", {
		onInit() {
			this.getRouter().getRoute("Detail").attachPatternMatched(this.onObjectMatched, this);
		},

		onObjectMatched(oEvent) {
			var oArgs = oEvent.getParameter("arguments"),
				sPath = oArgs.invoicePath;
			this.fetchInvoiceDetails(sPath);
		},
		fetchInvoiceDetails: function (sPath) {
			if (sPath) {
				var oModel = this.getModel(),
					oViewModel = this.getModel("viewModel");

				BusyIndicator.show();
				$.get({
					url: oModel.sServiceUrl + sPath + "?$expand=invoiceItems",
					success: function (oData) {
						BusyIndicator.hide();
						oViewModel.setProperty("/InvoiceDetails", oData);
					}.bind(this),
					error: function (oError) {
						BusyIndicator.hide();
						oViewModel.setProperty("/InvoiceDetails", {});
						var oMsgDetail = null;
						if (oError.responseText) {
							oMsgDetail = JSON.parse(oError.responseText);
							messenger.error(oMsgDetail.error.message.value);
						} else {
							messenger.error("Error while reading the task detail. Please try again later");
						}
					}.bind(this)
				});

			}
		},
		handleBackBtnPress: function (oEvent) {
			this.onNavBack();
		},
		onCreateInvoiceBtnPress: function (oEvent) {
			var oResourceBundle = this.getResourceBundle(),
				sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
				sText = oResourceBundle.getText("CONFIRM_TXT_CREATE_INVOICE");
			messenger.confirm(sTitle, sText, "Confirm", null, function () {
				this.createInvoice();
			}.bind(this));
		},

		createInvoice: function () {
			var oResourceBundle = this.getResourceBundle(),
				oModel = this.getModel("supplierModel"),
				oPayload = this.createInvoicePayload();
			BusyIndicator.show();
			oModel.create("/A_SupplierInvoice", oPayload, {
				success: function (oData) {
					BusyIndicator.hide();
					messenger.success(oResourceBundle.getText("INVOICE_CREATE_SUCCESS_MSG",oData.SupplierInvoice));
				}.bind(this),
				error: function (oError) {
					BusyIndicator.hide();
					var oMsgDetail = null
					if (oError.statusCode === "400" && oError.responseText) {
						oMsgDetail = JSON.parse(oError.responseText);
						messenger.error(oMsgDetail.error.message.value);
					} else {
						messenger.error(oResourceBundle.getText("ERR_ODATA_FAIL_MSG"));
					}	
				}.bind(this)
			});
		}
	});
});