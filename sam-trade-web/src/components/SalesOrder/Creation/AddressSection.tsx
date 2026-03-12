import { AlertCircle } from "lucide-react";
import SearchableAddressSelect, { type Address } from "@/components/SalesOrder/Creation/SearchableAddressSelect";
import AddressCard from "./AddressCard";

interface AddressSectionProps {
  // Billing
  billing:        Address;
  billingOptions: Address[];
  billingError?:  string;
  onBillingSelect: (a: Address) => void;

  // Shipping
  shipping:        Address;
  shippingOptions: Address[];
  shippingError?:  string;
  onShippingSelect: (a: Address) => void;
}

const AddressSection = ({
  billing, billingOptions, billingError, onBillingSelect,
  shipping, shippingOptions, shippingError, onShippingSelect,
}: AddressSectionProps) => (
  <div className="border border-gray-300 rounded-xl overflow-hidden bg-white dark:bg-card">
    <div className="bg-gray-100 dark:bg-muted/60 border-b border-gray-300 dark:border-border px-3 sm:px-5 py-3">
      <h2 className="text-sm font-bold text-gray-800 dark:text-foreground tracking-wide uppercase">
        Address Details
      </h2>
    </div>
    <div className="p-3 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing */}
        <div>
          <SearchableAddressSelect
            label="Customer Billing Address"
            options={billingOptions}
            value={billing}
            onSelect={onBillingSelect}
            onAddNew={() => {}}
          />
          {billingError && (
            <div className="flex items-center gap-1 mt-1.5">
              <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-500">{billingError}</p>
            </div>
          )}
          {billing?.name && <AddressCard address={billing} />}
        </div>

        {/* Shipping */}
        <div>
          <SearchableAddressSelect
            label="Customer Shipping Address"
            options={shippingOptions}
            value={shipping}
            onSelect={onShippingSelect}
            onAddNew={() => {}}
          />
          {shippingError && (
            <div className="flex items-center gap-1 mt-1.5">
              <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-500">{shippingError}</p>
            </div>
          )}
          {shipping?.name && <AddressCard address={shipping} />}
        </div>
      </div>
    </div>
  </div>
);

export default AddressSection;