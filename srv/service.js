const cds = require('@sap/cds');
const { extractDocumentInformation } = require('./extract-document.js');
const axios = require('axios');
// Importing the Readable and PassThrough stream classes from the 'stream' module.
const { Readable, PassThrough } = require('stream');
const { requestUserToken } = require('@sap/xssec/lib/requests.js');

class invoiceService extends cds.ApplicationService {
    init() {
        const { Invoice,Attachments} = this.entities;
        // Defining an event handler for UPDATE operations on the Invoice entity.
        this.on('UPDATE', Invoice, async (req, next) => {
            req.data.content.on("data", dataChunk => {
                console.log(dataChunk);
            });
            // Retrieving the path from the request's internal request object.
            const url = req._.req.path;

            // Checking if the request path includes 'content' to handle media streams.
            if (url.includes('content')) {
                // Connecting to the database service.
                const db = await cds.connect.to("db");

                // Extracting the ID from the request payload.
                const id = req.data.ID;

                // Reading the existing invoice from the database based on the ID.
                const obj = await db.read(Invoice, id);

                // If no invoice is found, sending a 404 error response.
                if (!obj) {
                    req.reject(404, "No data found");
                    return;
                }

                // Updating the invoice object with the filename from the 'slug' header.
                obj.fileName = req.headers.slug;

                // Updating the invoice object with the media type from the 'content-type' header.
                obj.mediaType = req.headers['content-type'];

                // Setting the URL property for the invoice object.
                obj.url = `/invoice/Invoice(${id})/content`;

                // Creating a new PassThrough stream to handle the incoming data.
                const stream = new PassThrough();

                // Array to hold chunks of data as they are streamed.
                const chunks = [];
                // Event listener to collect chunks of data as they are streamed.
                stream.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                // Event listener for when the stream has ended.
                stream.on('end', async () => {
                    // Concatenating all chunks into a single Buffer and assigning to the invoice content.
                    obj.content = Buffer.concat(chunks);
                    await db.update(Invoice, id).with(obj);
                    console.log(obj);
                    // Updating the invoice record in the database with the new content.

                });

                // try {

                // Calling the function to extract document information and waiting for the result.
                // const extractionResult = await extractDocumentInformation(obj.fileName);

                // Storing the job ID and status from the extraction result in the invoice object.
                // obj.extractionJobId = extractionResult.id;
                // obj.status = extractionResult.status;

                // await db.update(Invoice, id).with(obj);
                // Piping the incoming data content into the PassThrough stream.
                req.data.content.pipe(stream);

                // Returning the extraction result.
                // return extractionResult;
                // } catch (error) {
                //     // Sending a 500 error response if there's an error during extraction.
                //     req.error(500, 'Failed to extract document information');
                // }
            } else next() // If the URL does not include 'content', continue with the next handler.

        })
       
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
                "url": `/Attachments/${newId}/content`,
                "mediaType": req.headers.slug
            };

            const oInsert = await INSERT.into(Attachments).entries(oEntryCreate);

            let oEntryUpdate = {
                "ID": newId,
                "fileName": req.data.fileName,
                "url": `Attachments/${newId}/content`,
                "content": req.data.content,
                "mediaType": req.headers.slug
            };

            const db = await cds.connect.to("db");
            let oResp = await db.update(Attachments, newId).with(oEntryUpdate);

            if (oResp == 1) {
                try {
                    const oData = await SELECT`*`.from(Attachments).where`ID=${oEntryUpdate.ID}`;
                    const { Invoices,InvoiceItems } = this.entities;
                    const extractionResult = await extractDocumentInformation(oData[0].content, Invoices, oData[0].fileName,InvoiceItems);
                    let jobId = extractionResult.id;
                } catch (error) {
                    req.error(500, 'Failed to extract document information');
                }
            } else {
                req.reject("500", "Entry cannot be created");
                return;
            }
        });
        return super.init();
    }
}

module.exports = { invoiceService }