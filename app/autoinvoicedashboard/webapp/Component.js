/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "autoinvoicedashboard/model/models",
        "autoinvoicedashboard/model/messenger"
    ],
    function (UIComponent, Device, models, messenger) {
        "use strict";

        return UIComponent.extend("autoinvoicedashboard.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
                this.setModel(models.createViewModel(), "viewModel");

                //initialize messenger
                messenger.init(this);
            }
        });
    }
);