import { Upload } from "lucide-react";
import FormField from "./FormField";

interface ContractOption {
  id: string; code: string; customerId: string;
  originId: string; className: string; customerEmail: string;
}

interface GstOption { id: string; number: string; }

interface GeneralInfoSectionProps {
  // Contract
  contract:         string;
  contractOptions:  ContractOption[];
  contractClass:    string;
  contractError?:   string;
  onContractChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onContractBlur:   () => void;

  // PO fields
  purchaseOrderID:       string;
  purchaseOrderIDError?: string;
  onPurchaseOrderIDChange: (v: string) => void;
  onPurchaseOrderIDBlur:   () => void;

  purchaseOrderDate:       string;
  purchaseOrderDateError?: string;
  onPurchaseOrderDateChange: (v: string) => void;
  onPurchaseOrderDateBlur:   () => void;

  purchaseOrderFile:       File | null;
  purchaseOrderFileError?: string;
  onPurchaseOrderFileChange: (f: File | null) => void;
  onPurchaseOrderFileBlur:   () => void;

  // Other fields
  relationshipManager:       string;
  relationshipManagerError?: string;
  onRelationshipManagerChange: (v: string) => void;
  onRelationshipManagerBlur:   () => void;

  memo:       string;
  memoError?: string;
  onMemoChange: (v: string) => void;
  onMemoBlur:   () => void;

  // GST
  gstOptions:           GstOption[];
  selectedCustomerGst:  string;
  gstError?:            string;
  onGstChange:          (v: string) => void;
  onGstBlur:            () => void;

  // Styles
  inputCls:    (hasError?: boolean) => string;
  readonlyCls: string;
}

const GeneralInfoSection = ({
  contract, contractOptions, contractClass, contractError,
  onContractChange, onContractBlur,
  purchaseOrderID, purchaseOrderIDError, onPurchaseOrderIDChange, onPurchaseOrderIDBlur,
  purchaseOrderDate, purchaseOrderDateError, onPurchaseOrderDateChange, onPurchaseOrderDateBlur,
  purchaseOrderFile, purchaseOrderFileError, onPurchaseOrderFileChange, onPurchaseOrderFileBlur,
  relationshipManager, relationshipManagerError, onRelationshipManagerChange, onRelationshipManagerBlur,
  memo, memoError, onMemoChange, onMemoBlur,
  gstOptions, selectedCustomerGst, gstError, onGstChange, onGstBlur,
  inputCls, readonlyCls,
}: GeneralInfoSectionProps) => (
  <div className="border border-gray-300 rounded-xl overflow-hidden bg-white dark:bg-card">
    <div className="bg-gray-100 dark:bg-muted/60 border-b border-gray-300 dark:border-border px-3 sm:px-5 py-3">
      <h2 className="text-sm font-bold text-gray-800 dark:text-foreground tracking-wide uppercase">
        Order Details
      </h2>
    </div>
    <div className="p-3 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">

        {/* Left column */}
        <div className="space-y-5">
          <FormField label="Contract" required error={contractError}>
            <select
              value={contract}
              onBlur={onContractBlur}
              onChange={onContractChange}
              className={inputCls(!!contractError)}
            >
              <option value="">Select Contract</option>
              {contractOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Contract Class">
            <input type="text" value={contractClass} readOnly className={readonlyCls} />
          </FormField>

          <FormField label="Purchase Order ID" required error={purchaseOrderIDError}>
            <input
              type="text"
              value={purchaseOrderID}
              onBlur={onPurchaseOrderIDBlur}
              onChange={(e) => onPurchaseOrderIDChange(e.target.value)}
              placeholder="Enter PO ID"
              className={inputCls(!!purchaseOrderIDError)}
            />
          </FormField>

          <FormField label="Relationship Manager" required error={relationshipManagerError}>
            <input
              type="text"
              value={relationshipManager}
              onBlur={onRelationshipManagerBlur}
              onChange={(e) => onRelationshipManagerChange(e.target.value)}
              placeholder="Enter RM name"
              className={inputCls(!!relationshipManagerError)}
            />
          </FormField>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <FormField label="Purchase Order Date" required error={purchaseOrderDateError}>
            <input
              type="date"
              value={purchaseOrderDate}
              onBlur={onPurchaseOrderDateBlur}
              onChange={(e) => onPurchaseOrderDateChange(e.target.value)}
              className={inputCls(!!purchaseOrderDateError)}
            />
          </FormField>

          <FormField label="PO Document" required error={purchaseOrderFileError}>
            <label className="cursor-pointer">
              <input
                type="file"
                required
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.png"
                onBlur={onPurchaseOrderFileBlur}
                onChange={(e) => onPurchaseOrderFileChange(e.target.files?.[0] || null)}
              />
              <div className={`${inputCls(!!purchaseOrderFileError)} flex items-center gap-2 hover:bg-gray-50`}>
                <Upload className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className={`truncate ${purchaseOrderFile ? "text-gray-900" : "text-gray-400"}`}>
                  {purchaseOrderFile ? purchaseOrderFile.name : "Upload PO document…"}
                </span>
              </div>
            </label>
          </FormField>

          <FormField label="Memo" required error={memoError}>
            <textarea
              rows={1}
              value={memo}
              onBlur={onMemoBlur}
              onChange={(e) => onMemoChange(e.target.value)}
              placeholder="Enter memo or additional notes"
              className={`${inputCls(!!memoError)} resize-none`}
            />
          </FormField>

          <FormField label="Select GST" required error={gstError}>
            <select
              value={selectedCustomerGst}
              onBlur={onGstBlur}
              onChange={(e) => onGstChange(e.target.value)}
              className={inputCls(!!gstError)}
            >
              <option value="">Select GST number</option>
              {gstOptions.map((g) => (
                <option key={g.id} value={g.id}>{g.number}</option>
              ))}
            </select>
          </FormField>
        </div>

      </div>
    </div>
  </div>
);

export default GeneralInfoSection;