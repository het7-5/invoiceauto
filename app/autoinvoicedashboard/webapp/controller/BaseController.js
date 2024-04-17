jQuery.sap.require("jquery.sap.storage");
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/Fragment",
	"sap/ui/core/message/Message",
	"sap/ui/core/format/DateFormat",
	"sap/ui/Device",
	"sap/m/ListMode",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"autoinvoicedashboard/model/messenger"
], function (Controller, History, Fragment, Message, DateFormat, Device, ListMode, JSONModel, Filter, FilterOperator, messenger) {
	"use strict";

	return Controller.extend("invoicedashboard.controller.BaseController", {

		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/* =========================================================== */
		/* Model Methods                                              */
		/* =========================================================== */

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Clears model and specific property if provided
		 * @param {string} sModelName Model name
		 * @param {string} sProperty  Property
		 * @public
		 */
		clearModel: function (sModelName, sProperty) { },

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Returns the control instace based on provided id in the calling view
		 * @param   {string}              sId Id of Control
		 * @returns {sap.ui.core.Control} Instance of control in calling view
		 * @public
		 */
		/*byId: function(sId) {
			return this.getView().byId(sId);
		},*/
		/**
		 * Navigates back to one step if history is available otherwise takes you to app homepage
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();
			window.history.go(-1);
		},

		/**
		 * gets the content density class as per the device
		 * @public
		 * @returns {string} density css class based on device
		 */
		getContentDensityClass: function () {
			return this.getOwnerComponent().getContentDensityClass();
		},

		/* =========================================================== */
		/* Dialog Methods                                              */
		/* =========================================================== */

		/**
		 * method which returns the Busy dialog instance
		 * @param   {string}       sTitle optional parameter
		 * @param   {string}       sText  optional parameter
		 * @returns {sap.m.Dialog} - Busy Dialog Instance
		 */
		getBusyDialog: function (sTitle, sText) {
			if (!this._oBusyDialog) {
				// Create dialog using fragment factory
				this._oBusyDialog = sap.ui.xmlfragment(this._getBusyDialogId(),
					"invoicedashboard.fragment.BusyDialog", this);

				// Connect dialog to view
				this.getView().addDependent(this._oBusyDialog);
			}
			if (sTitle || sTitle === null) {
				this._oBusyDialog.setTitle(sTitle);
			}
			if (sText || sTitle === null) {
				this._oBusyDialog.setText(sText);
			}
			return this._oBusyDialog;
		},

		/**
		 * method to create the Id for Busy dialog
		 * @returns {string} - ID of fragment
		 * @private
		 */
		_getBusyDialogId: function () {
			return this.createId("assetBusyDialogFrag");
		},

		/**
		 * Returns Fragment control based on provided fragment and control id
		 * @param   {string}              sFragId    Fragment ID
		 * @param   {string}              sControlId Control ID
		 * @returns {sap.ui.core.Control} Control inside fragment id
		 * @public
		 */
		getFragmentControlById: function (sFragId, sControlId) {
			return this.byId(Fragment.createId(sFragId, sControlId));
		},

		/**
		 * Uses createid method to get the control inside fragment
		 * @param {string} sFragId    fragment id
		 * @param {string} sControlId control id
		 */
		getFragmentControlByCreateId: function (sFragId, sControlId) {
			return this.byId(Fragment.createId(this.createId(sFragId), sControlId));
		},

		/* =========================================================== */
		/* Date & Formatting Methods                                   */
		/* =========================================================== */

		/**
		 * Parses the provided date to local timezone
		 * @param   {object} oDate Javascript date object that needs to be parsed
		 * @param {string} sPattern	pattern for the timezone to fetch
		 * @returns {object} Parsed date as Javascript with local timezone
		 * @private
		 */
		parseDate: function (oDate, sPattern) {
			if (!sPattern) {
				sPattern = "yyyy-MM-dd'T'hh:mm:ss.SSSXXX";
			}
			var oDateFormat = DateFormat.getDateInstance({
				pattern: sPattern
			});
			return oDateFormat.parse(oDateFormat.format(oDate), true);
		},

		/**
		 * Parses the provided date to local timezone
		 * @param   {object} oDate Javascript date object that needs to be parsed
		 * @param {string} sPattern	pattern for the timezone to fetch
		 * @returns {object} Format date as Javascript with local string
		 * @private
		 */
		formatDate: function (oDate, sPattern) {
			if (!sPattern) {
				sPattern = "yyyy-MM-dd'T'hh:mm:ss.SSSXXX";
			}
			var oDateFormat = DateFormat.getDateInstance({
				pattern: sPattern
			});
			return oDateFormat.format(oDate);
		},

		/**
		 * Parses the provided date to local timezone
		 * @param   {object} oDate Javascript date object that needs to be parsed
		 * @param {string} sPattern	pattern for the timezone to fetch
		 * @returns {object} Format date as Javascript with local string
		 * @private
		 */
		formatABAPDate: function (sDate) {
			var sResultDate = "";
			if (sDate) {
				sResultDate = sDate.replaceAll("/", "");
			}
			return sResultDate;
		},

		/**
		 * Parses the provided date to local timezone
		 * @param   {object} oDate    Javascript date object that needs to be parsed
		 * @param {string} sPattern	pattern for the timezone to fetch
		 * @returns {object} Parsed date as Javascript with local timezone
		 *                            @private
		 */
		parseFormattedDate: function (oDate, sPattern) {
			if (!sPattern) {
				sPattern = "yyyy-MM-dd'T'hh:mm:ss.SSSXXX";
			}
			var oDateFormat = DateFormat.getDateInstance({
				pattern: sPattern
			});
			return oDateFormat.format(oDate);
		},

		/**
		 * Error handler for read call
		 * @param {object} oError  error object for the AJAX call
		 * @private
		 */
		_onODataReadFail: function (oError) {
			var oResourceBundle = this.getResourceBundle(),
				oMsgDetail = null;
			if (oError.statusCode === "400" && oError.responseText) {
				oMsgDetail = JSON.parse(oError.responseText);
				messenger.error(oMsgDetail.error.message.value);
			} else {
				try {
					messenger.error(oResourceBundle.getText("ERR_ODATA_FAIL_MSG", [oError.response.statusCode, oError.response.message]));
				} catch (e) {
					messenger.error(oResourceBundle.getText("ERR_ODATA_FAIL_MSG"));
				}
			}
		},
		createInvoicePayload: function () {
			return {
				"FiscalYear": "2024",
				"CompanyCode": "Z320",
				"DocumentDate": "2024-04-04T00:00:00",
				"PostingDate": "2024-04-10T00:00:00",
				"SupplierInvoiceIDByInvcgParty": "TEST",
				"InvoicingParty": "4100005",
				"DocumentCurrency": "USD",
				"InvoiceGrossAmount": "505.00",
				"UnplannedDeliveryCost": "0.00",
				"DocumentHeaderText": "",
				"ManualCashDiscount": "0.00",
				"PaymentTerms": "",
				"CashDiscount1Percent": "0.000",
				"CashDiscount1Days": "0",
				"CashDiscount2Percent": "0.000",
				"CashDiscount2Days": "0",
				"NetPaymentDays": "0",
				"PaymentBlockingReason": "",
				"AccountingDocumentType": "RE",
				"BPBankAccountInternalID": "",
				"SupplierInvoiceStatus": "5",
				"IndirectQuotedExchangeRate": "0.00000",
				"DirectQuotedExchangeRate": "60.00000",
				"StateCentralBankPaymentReason": "",
				"SupplyingCountry": "",
				"PaymentMethod": "",
				"PaymentMethodSupplement": "",
				"PaymentReference": "",
				"InvoiceReference": "",
				"InvoiceReferenceFiscalYear": "0000",
				"FixedCashDiscount": "",
				"UnplannedDeliveryCostTaxCode": "",
				"UnplndDelivCostTaxJurisdiction": "",
				"UnplndDeliveryCostTaxCountry": "",
				"AssignmentReference": "",
				"SupplierPostingLineItemText": "",
				"TaxIsCalculatedAutomatically": true,
				"BusinessPlace": "",
				"BusinessSectionCode": "",
				"BusinessArea": "",
				"SupplierInvoiceIsCreditMemo": "",
				"PaytSlipWthRefSubscriber": "",
				"PaytSlipWthRefCheckDigit": "",
				"PaytSlipWthRefReference": "",
				"TaxDeterminationDate": null,
				"TaxReportingDate": null,
				"TaxFulfillmentDate": null,
				"InvoiceReceiptDate": null,
				"DeliveryOfGoodsReportingCntry": "",
				"SupplierVATRegistration": "",
				"IsEUTriangularDeal": false,
				"SuplrInvcDebitCrdtCodeDelivery": "",
				"SuplrInvcDebitCrdtCodeReturns": "",
				"SupplierInvoiceOrigin": "A",
				"ReverseDocument": "",
				"ReverseDocumentFiscalYear": "0000",
				"IsReversal": false,
				"IsReversed": false,
				"IN_GSTPartner": "4100005",
				"IN_GSTPlaceOfSupply": "25",
				"IN_InvoiceReferenceNumber": "",
				"to_SuplrInvcItemPurOrdRef": []
			}
		}
	});
});