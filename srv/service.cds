using {app.ai.schema as schema} from '../db/schema';

service invoiceService {

    entity Invoice      as projection on schema.Invoice;
    entity Invoices     as projection on schema.Invoices;
    entity InvoiceItems as projection on schema.InvoiceItems;
    // entity Banks        as projection on schema.Banks;
    entity Attachments  as projection on schema.Attachments;
    

    action InvoiceDocument(fileName : String, content : LargeString) returns array of {
        Status : String;
        JobId : String;
    };
    action updateStatus(invoiceNumber : String) returns {
        supplierInvoiceNumber:String;
        error:String;
    };
    action getVendor() returns {value:String};
}
