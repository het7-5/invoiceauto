namespace app.ai.schema;

using {
    Currency,
    cuid
} from '@sap/cds/common';

entity Invoice : cuid {
    @Core.ContentDisposition.Filename: fileName
    @Core.MediaType                  : mediatype
    content         : LargeBinary;
    fileName        : String;

    @Core.IsMediaType                : true
    mediatype       : String;
    url             : String;
    extractionJobId : UUID;
    status          : String;
}

entity Invoices {
    key invoiceNo       : String;
        vendorNo        : String;
        companyName     : String;
        invoiceDate     : DateTime;
        poNumber        : String;
        panNo           : String;
        gstNo           : String;
        customername    : String;
        customerAddress : String;
        gstin           : String;
        grandTotal      : Decimal;
        status          : String;
        url             : String;
        paymentTerms    : String;
        bankAccountNo   : String;
        attachmentId:Integer;
        // bankDetails     : Association to many Banks
        //                       on bankDetails.invoiceNo = invoiceNo;
        invoiceItems    : Composition of many InvoiceItems
                              on invoiceItems.invoiceNo = $self;
        documents       : Association to many Attachments
                              on documents.ID = $self.attachmentId;
}

entity InvoiceItems {
    key invoiceItemId      : UUID;
        invoiceNo          : Association to Invoices;
        productCode        : String;
        productDescription : String;
        quantity           : Integer;
        baseAmount         : Decimal;
        taxes              : Decimal;
        total              : Decimal;
        currency           : Currency;
}


entity Attachments {
    key ID        : Integer;

        // @Core.MediaType                  : mediaType
        @Core.ContentDisposition.Filename: fileName
        content   : LargeString;
        mediaType : String @Core.IsMediaType;
        url       : String;
        fileName  : String;

}
