const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { Readable } = require('stream');

const documentExtractionService = {
  url: 'https://aiservices-dox.cfapps.eu10.hana.ondemand.com',
  // OAuth endpoint from your service key:
  authUrl: 'https://etp-data-intelligence-ro56rww1.authentication.eu10.hana.ondemand.com/oauth/token',
  // Client ID and Secret from your service key:
  clientId: 'sb-ce6caa6f-a063-412b-812c-188d279a76a3!b437280|na-f20548c0-157d-417b-8bbb-1c9f35ecfb2d!b20821',
  clientSecret: '21118790-fe49-4267-a63d-68845220606a$CHMXc3dmgTx1ZlmmhkflWid6mcMJX9xfJXGJptxw6io='
};

// Function to handle the document information extraction.
async function extractDocumentInformation(filePath, Entity, fileName, EntityItems, EntityBanks) {
  // FormData is used for 'multipart/form-data' which is required for file uploads.
  const formData = new FormData();
  //convert Base64 String to Binary 
  const binaryData = Buffer.from(filePath, 'base64');
  formData.append('file', binaryData, fileName);
  formData.append('options', `{
        "extraction": {
        "headerFields": [
            "documentNumber",
            "taxId",
            "purchaseOrderNumber",
            "shippingAmount",
            "netAmount",
            "senderAddress",
            "senderName",
            "grossAmount",
            "currencyCode",
            "receiverContact",
            "documentDate",
            "taxAmount",
            "taxRate",
            "receiverName",
            "receiverAddress",
            "paymentTerms",
            "senderBankAccount"
        ],
        "lineItemFields": [
            "description",
            "netAmount",
            "quantity",
            "unitPrice",
            "materialNumber"
        ]
    },
    "documentType": "invoice",
    "receivedDate": "2020-02-17",
    "enrichment": {},
    "clientId": "default"
  }`
  );

  // Authentication is done via OAuth client credentials you get from the service key.
  // The function to retrieve the token is not shown here but it's necessary.
  const token = await getOAuthToken(); // Implement this function based on the service key details.

  // Construct the headers, including the OAuth token.
  const formHeader = formData.getHeaders();
  const headers = {
    formHeader,
    'Authorization': `Bearer ${token}`,
  };

  try {
    // Post the document to the Document Information Extraction API.
    const response = await axios.post(
      `${documentExtractionService.url}/document-information-extraction/v1/document/jobs`,
      formData,
      { headers }
    );
    const jobId = response.data.id;
    
    const oToken = await getOAuthToken();
    const Invoice = Entity;
    const InvoiceItems = EntityItems;
    const Banks = EntityBanks;
    
    if(jobId){
      var oDummy ={};
      oDummy.invoiceNo= (Math.floor(Math.random() * 1000)).toString();
      oDummy.status="Pending";
      const oInsert = await INSERT.into(Invoice).entries(oDummy);
    }
    const data = setInterval(async function () {

      const response = await axios.get(`${documentExtractionService.url}/document-information-extraction/v1/document/jobs/${jobId}`,
        { "headers": { 'Authorization': `Bearer ${oToken}` } });

      if (response.data.status === 'DONE') {
        console.log(response);

        const oExtract = response.data.extraction;
        const headerData = oExtract.headerFields;
        const lineItemsData = oExtract.lineItems[0];

        let oEntry = {};
        let oLineEntries = [];
        let oBankEntries = [];
        let oMiscs = {};
        oMiscs.taxes=0;
        for (let i = 0; i < oExtract.headerFields.length; i++) {

          if (headerData[i].name === "documentNumber") {
            oEntry.invoiceNo = headerData[i].value;
          }
          if (headerData[i].name === "senderName") {
            oEntry.vendorNo = headerData[i].value;
          }
          if (headerData[i].name === "senderName") {
            oEntry.companyName = headerData[i].value;
          }
          if (headerData[i].name === "documentDate") {
            oEntry.invoiceDate = headerData[i].value;
          }
          if (headerData[i].name === "receiverName") {
            oEntry.customername = headerData[i].value;
          }
          if (headerData[i].name === "receiverAddress") {
            oEntry.customerAddress = headerData[i].value;
          }
          if (headerData[i].name === "grossAmount") {
            oEntry.grandTotal = headerData[i].value;
          }
          if (headerData[i].name === "taxID") {
            oEntry.gstNo = headerData[i].value;
          }
          if (headerData[i].name === "purchaseOrderNumber") {
            oEntry.poNumber = headerData[i].value;
          }
          if (headerData[i].name === "paymentTerms") {
            oEntry.paymentTerms = headerData[i].value;
          }
          if (headerData[i].name === "senderBankAccount") {
            oEntry.bankAccountNo = headerData[i].value;
          }
          if (headerData[i].name === "currencyCode") {
            oMiscs.currency = headerData[i].value;
          }
          
          if (headerData[i].name === "taxAmount") {
           
              oMiscs.taxes = oMiscs.taxes + headerData[i].value;
           
          }
        }
        for (let i = 0; i < oExtract.lineItems.length; i++) {
          let oTemp = {};
          oTemp.invoiceNo_invoiceNo = oEntry.invoiceNo;
          oTemp.currency_code = oMiscs?.currency;
          oTemp.taxes = oMiscs?.taxes;
          if (lineItemsData[i].name === "netAmount") {
            oTemp.baseAmount = lineItemsData[i].value;
          }
          if (lineItemsData[i].name === "description") {
            oTemp.productDescription = lineItemsData[i].value;
          }
          if (lineItemsData[i].name === "quantity") {
            oTemp.quantity = lineItemsData[i].value;
          }
          oLineEntries.push(oTemp);
        }
        await DELETE.from(Invoice).where`invoiceNo=${oDummy.invoiceNo}`;
        oEntry.status="Completed";
        const oInsert = await INSERT.into(Invoice).entries(oEntry);
        
        if (oLineEntries.length > 0) {
          const oInsertitems = await INSERT.into(InvoiceItems).entries(oLineEntries);
        }

        clearInterval(data);
      }
    }, 5000);
    return response.data; // The extracted information is returned from the API.
  } catch (error) {
    console.error('Error extracting document information:', error.response ? error.response.data : error);
    throw error;
  }
}

// This would be a separate function to get an OAuth token using the client credentials.
// Function to get an OAuth token using the Client Credentials flow.

async function getOAuthToken() {
  const tokenResponse = await axios.post(
    documentExtractionService.authUrl,
    new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': documentExtractionService.clientId,
      'client_secret': documentExtractionService.clientSecret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return tokenResponse.data.access_token; // This is the token you'll use in the 'Authorization' header.
}

module.exports = { extractDocumentInformation };