const cds = require('@sap/cds');
const call_service = require('./utils/CallService');
const core = require('@sap-cloud-sdk/core');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const { extractDocumentInformation } = require('./extract-document.js');
const axios = require('axios');
// Importing the Readable and PassThrough stream classes from the 'stream' module.
const { Readable, PassThrough } = require('stream');
const { requestUserToken } = require('@sap/xssec/lib/requests.js');

class invoiceService extends cds.ApplicationService {
    init() {
        const { Invoice, Attachments } = this.entities;
       
        this.on('getVendor', async (req) => {
       
            const dest = await core.getDestination("DIM_8002");
            let response = await executeHttpRequest(dest, {
      
                method: 'GET',
                proxy: {
                    "host": "127.0.0.1",
                    "port": 8887,
                    // "host": dest.proxyConfiguration.host,
                    // "port": dest.proxyConfiguration.port,
                    "protocol": "http"
                },
                url:  '/sap/opu/odata/sap/ZSCP_SAMPLE_CONFIRMATION_SRV/Vendor_DetailsSet'
            });
            
            return {value:response.data.d.results};
      
        });

        this.on("InvoiceDocument", async function (req) {
            const { Attachments } = this.entities;
            if (!req.data.content) {
                req.reject("404", "Request missing file content");
                return;
            }
            let { ID } = await SELECT.one`max(ID) as ID`.from(Attachments);
            let newId = ID + 1;
            let oEntryCreate = {
                "ID": newId,
                "fileName": req.data.fileName,
                "url": `/Attachments/${newId}`,
                "mediaType": req.headers.slug
            };

            const oInsert = await INSERT.into(Attachments).entries(oEntryCreate);

            let oEntryUpdate = {
                "ID": newId,
                "fileName": req.data.fileName,
                "url": `Attachments/${newId}`,
                "content": req.data.content,
                "mediaType": req.headers.slug
            };

            const db = await cds.connect.to("db");
            let oResp = await db.update(Attachments, newId).with(oEntryUpdate);

            if (oResp == 1) {
                try {
                    const oData = await SELECT`*`.from(Attachments).where`ID=${oEntryUpdate.ID}`;
                    const { Invoices, InvoiceItems } = this.entities;
                    const extractionResult = await extractDocumentInformation(oData[0].content, Invoices, oData[0].fileName, InvoiceItems,oEntryUpdate.ID);
                    let jobId = extractionResult.id;
                } catch (error) {
                    req.error(500, 'Failed to extract document information');
                }
            } else {
                req.reject("500", "Entry cannot be created");
                return;
            }
        });

        this.on("updateStatus", async (req) => {
            let invoiceNumber = req.data.invoiceNumber;
            const { Invoices } = this.entities;
            if (invoiceNumber) {
                let qUpdate = await UPDATE(Invoices, invoiceNumber).with({ status: 'Approved' });
                if (qUpdate === 1) {
                    const destServiceInstanceName = "invoiceauto-destination-service"; //invoiceauto-destination-service
                    const destination = "DIM_8002";
                    let headers = {};

                    let connDetails = await call_service.getConnectivity("cpapp-connectivity"); //cpapp-connectivity
                    headers = connDetails.httpHeader ? connDetails.httpHeader : {};
                    headers['Content-Type'] = 'application/json';
                    headers['Accept'] = 'application/json';
                    let oServiceCall;
                    let destDetails = await call_service.getDestination(destServiceInstanceName, destination);
                    let params = {};
                    params["sap-client"] = destDetails["sap-client"];
                    if (destDetails["CloudConnectorLocationId"]) { headers['SAP-Connectivity-SCC-Location_ID'] = destDetails["CloudConnectorLocationId"]; }
                    let xheaders = headers;                         //added
                    xheaders["x-csrf-token"] = 'fetch';             //added
                    xheaders.Authorization = await call_service.makeBasicCred(destDetails.User, destDetails.Password);


                    let xsrfToken = {
                        method: "GET",
                        url: destDetails.URL + "/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/",
                        headers: xheaders,
                        params: params,
                        proxy: {
                            host: connDetails.onpremise_proxy_host,
                            port: connDetails.onpremise_proxy_port
                        }
                    };
                    let response = await axios.request(xsrfToken);
                    // 5500008074 - 3 Way PO
                    // 5500007227 - PO
                    let oPayload = await createInvoicePayload("5500007227");
                    headers['x-csrf-token'] = response.headers["x-csrf-token"];
                    headers['Cookie'] = response.headers["set-cookie"];
                    headers.Authorization = await call_service.makeBasicCred(destDetails.User, destDetails.Password);
                    let mobileNo = '7990450842';
                    const oResponse = await call_service.makeAxiosCall({
                        method: "POST",
                        url: destDetails.URL + "/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/A_SupplierInvoice",
                        headers: headers,
                        data: oPayload,
                        params: {
                            "sap-client": params["sap-client"]
                        },
                        proxy: {
                            host: connDetails.onpremise_proxy_host,
                            port: connDetails.onpremise_proxy_port
                        }
                    }).then(async (response) => {
                        return (response.data.d.SupplierInvoice);
                    }).catch(async (error) => {
                        return (error.error.message);
                    });
                    if (oResponse?.value) {
                        return {
                            "supplierInvoiceNumber": "",
                            "error": oResponse.value
                        }
                    }else{
                        return {
                            "supplierInvoiceNumber": oResponse,
                            "error":""
                        }
                    }

                }
            }
        });
        return super.init();
    }
}
async function createInvoicePayload(poNumber) {
    return {
        "SupplierInvoice": "",
        "FiscalYear": "2024",
        "CompanyCode": "SE02",
        "DocumentDate": "/Date(1729743994000)/",
        "PostingDate": "/Date(1729743994000)/",
        "CreationDate": "/Date(1729743994000)/",
        "SupplierInvoiceIDByInvcgParty": poNumber,
        "InvoicingParty": "9800000011",
        "DocumentCurrency": "INR",
        "InvoiceGrossAmount": "10.00",
        "UnplannedDeliveryCost": "0.00",
        "DocumentHeaderText": "",
        "ManualCashDiscount": "0.00",
        "PaymentTerms": "",
        "DueCalculationBaseDate": "/Date(1729743994000)/",
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
        "DirectQuotedExchangeRate": "1.00000",
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
        "TaxIsCalculatedAutomatically": false,
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
        "SupplierInvoiceOrigin": "",
        "ReverseDocument": "",
        "ReverseDocumentFiscalYear": "0000",
        "IsReversal": false,
        "IsReversed": false,
        "IN_GSTPartner": "9800000011",
        "IN_GSTPlaceOfSupply": "TN",
        "IN_InvoiceReferenceNumber": "",
        "ZZ1_SupplierLabel_MIH": "",
        "ZZ1_SupplierLabel_MIHF": 3,
        "to_SuplrInvcItemPurOrdRef": [
            {
                "SupplierInvoice": "",
                "FiscalYear": "2024",
                "SupplierInvoiceItem": "1",
                "PurchaseOrder": poNumber,
                "PurchaseOrderItem": "10",
                "Plant": "SE10",
                "ReferenceDocument": "",
                "ReferenceDocumentFiscalYear": "0000",
                "ReferenceDocumentItem": "0",
                "IsSubsequentDebitCredit": "",
                "TaxCode": "V0",
                "TaxJurisdiction": "",
                "DocumentCurrency": "INR",
                "SupplierInvoiceItemAmount": "10.00",
                "PurchaseOrderQuantityUnit": "EA",
                "QuantityInPurchaseOrderUnit": "110",
                "PurchaseOrderPriceUnit": "EA",
                "QtyInPurchaseOrderPriceUnit": "110",
                "SuplrInvcDeliveryCostCndnType": "",
                "SuplrInvcDeliveryCostCndnStep": "0",
                "SuplrInvcDeliveryCostCndnCount": "0",
                "SupplierInvoiceItemText": "",
                "FreightSupplier": "",
                "IsNotCashDiscountLiable": false,
                "PurchasingDocumentItemCategory": "0",
                "ProductType": "1",
                "ServiceEntrySheet": "",
                "ServiceEntrySheetItem": "0",
                "TaxCountry": "",
                "IN_HSNOrSACCode": "",
                "IN_CustomDutyAssessableValue": "0.00"
            }
        ]
    }
}
module.exports = { invoiceService }