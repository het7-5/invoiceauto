sap.ui.define([
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function(MessageBox, MessageToast) {
	"use strict";

	return {

		init: function(oComponent) {
			this._oComponent = oComponent;
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
		},

		error: function(sText, fnCallback) {
			var oMsgSettings = {
				id: "idMessageBoxError",
				icon: MessageBox.Icon.ERROR,
				title: this._oResourceBundle.getText("ERROR_TITLE"),
				actions: [MessageBox.Action.OK]
			};
			if (fnCallback && jQuery.isFunction(fnCallback)) {
				oMsgSettings.onClose = function(oAction) {
					this.setErrorOpen(false);
					if (oAction === "OK") {
						fnCallback();
					}
				}.bind(this);
			}
			MessageBox.error(sText, oMsgSettings);
		},

		warning: function(sText) {
			MessageBox.show(sText, {
				icon: MessageBox.Icon.WARNING,
				title: this._oResourceBundle.getText("WARNING_TITLE"),
				actions: [MessageBox.Action.OK]
			});
		},

		info: function(sText, fnCallback) {
			var oMsgSettings = {
				icon: MessageBox.Icon.INFORMATION,
				title: this._oResourceBundle.getText("INFO_TITLE"),
				actions: [MessageBox.Action.OK]
			};
			if (fnCallback && jQuery.isFunction(fnCallback)) {
				oMsgSettings.onClose = function(oAction) {
					if (oAction === "OK") {
						fnCallback();
					}
				};
			}
			MessageBox.show(sText, oMsgSettings);
		},

		confirm: function(sTitle, sText, sConfirmCustomAction, sCancelCustomAction, fnCallback, fnCancelCb) {
			var sConfirmAction, sCancelAction;
			if (sConfirmCustomAction) {
				sConfirmAction = sConfirmCustomAction;
			} else {
				sConfirmAction = "Proceed";
			}
			if (sCancelCustomAction) {
				sCancelAction = sCancelCustomAction;
			} else {
				sCancelAction = MessageBox.Action.CANCEL;
			}
			MessageBox.show(sText, {
				icon: MessageBox.Icon.QUESTION,
				title: sTitle,
				actions: [sConfirmAction, sCancelAction],
				onClose: function(oAction) {
					if (oAction === sConfirmAction) {
						fnCallback();
					} else if (oAction === sCancelAction) {
						if (fnCancelCb) {
							fnCancelCb();
						}
					}
				}
			});
		},

		success: function(sText, fnCallback) {
			MessageBox.show(sText, {
				icon: MessageBox.Icon.SUCCESS,
				title: this._oResourceBundle.getText("SUCCESS_TITLE"),
				actions: [MessageBox.Action.OK],
				onClose: fnCallback
			});
		},

		toast: function(sText, bPersistOnNav) {
			MessageToast.show(sText, {
				closeOnBrowserNavigation: bPersistOnNav
			});
		},

		refresh: function(sText, fnCallback) {
			MessageBox.show(sText, {
				icon: MessageBox.Icon.WARNING,
				title: this._oResourceBundle.getText("WARNING_TITLE"),
				actions: ["Refresh"],
				onClose: function(oAction) {
					if (oAction === "Refresh") {
						fnCallback();
					}
				}
			});
		}
	};
});