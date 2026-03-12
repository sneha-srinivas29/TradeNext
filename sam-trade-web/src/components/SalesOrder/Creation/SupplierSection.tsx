import { AlertCircle } from "lucide-react";
import SearchableAddressSelect, { type Address } from "@/components/SalesOrder/Creation/SearchableAddressSelect";
import AddressCard from "./AddressCard";

interface SupplierSectionProps {
  supplier:               Address;
  supplierOptions:        Address[];
  supplierError?:         string;
  onSupplierSelect:       (a: Address) => void;

  delivery:               Address;
  supplierAddressOptions: Address[];
  deliveryError?:         string;
  onDeliverySelect:       (a: Address) => void;
}

const SupplierSection = ({
  supplier, supplierOptions, supplierError, onSupplierSelect,
  delivery, supplierAddressOptions, deliveryError, onDeliverySelect,
}: SupplierSectionProps) => (
  <div className="border border-gray-300 rounded-xl overflow-hidden bg-white dark:bg-card">
    <div className="bg-gray-100 dark:bg-muted/60 border-b border-gray-300 dark:border-border px-3 sm:px-5 py-3">
      <h2 className="text-sm font-bold text-gray-800 dark:text-foreground tracking-wide uppercase">
        Supplier & Delivery Details
      </h2>
    </div>
    <div className="p-3 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier */}
        <div>
          <SearchableAddressSelect
            label="Supplier"
            options={supplierOptions}
            value={supplier}
            onSelect={onSupplierSelect}
            onAddNew={() => {}}
          />
          {supplierError && (
            <div className="flex items-center gap-1 mt-1.5">
              <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-500">{supplierError}</p>
            </div>
          )}
          {supplier?.name && <AddressCard address={supplier} />}
        </div>

        {/* Delivery */}
        <div>
          <SearchableAddressSelect
            label="Delivery Address"
            options={supplierAddressOptions}
            value={delivery}
            onSelect={onDeliverySelect}
            onAddNew={() => {}}
          />
          {deliveryError && (
            <div className="flex items-center gap-1 mt-1.5">
              <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-500">{deliveryError}</p>
            </div>
          )}
          {delivery?.name && <AddressCard address={delivery} />}
        </div>
      </div>
    </div>
  </div>
);

export default SupplierSection;