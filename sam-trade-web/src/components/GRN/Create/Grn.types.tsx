

export interface LineItem {
  id: number;
  custrecord_sam_grn_item: string;
  custrecord_sam_grn_received_quantity: string;
}

export interface GRNFormData {
  custrecord_sam_grn_customer: string; // contract ID
  custrecord_sam_grn_vendor: string; // supplier ID
  custrecord_grn_milestone_attachment: File | null; // attachment
  custrecord_grn_document_date: string; // GRN date
  custrecord_grn_biill_refernce_number: string; // bill ID
  custrecord_grn_bill_date: string; // bill date
  custrecord_grn_document_reference_number: string; // GRN document number
  custrecord_original_invoice_date: string; // invoice date
  custrecord_grn_invoice: string; // invoice ID
}

export interface GRNPayload
  extends Omit<GRNFormData, "custrecord_grn_milestone_attachment"> {
  custrecord_grn_milestone_attachment: string | null;
  recmachcustrecord_sam_grn_reference: {
    custrecord_sam_grn_item: string;
    custrecord_sam_grn_received_quantity: string;
  }[];
}