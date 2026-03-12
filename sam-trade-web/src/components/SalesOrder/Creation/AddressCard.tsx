import { type Address } from "@/components/SalesOrder/Creation/SearchableAddressSelect";

interface AddressCardProps {
  address: Address;
}

const AddressCard = ({ address }: AddressCardProps) => (
  <div className="mt-3 p-3 bg-green-50 dark:bg-primary/5 border border-green-200 dark:border-primary/20 rounded-lg text-sm space-y-0.5">
    <p className="font-semibold text-gray-800 dark:text-foreground">{address.name}</p>
    {address.street &&
      address.street.split("\n").map((line, i) => (
        <p key={i} className="text-gray-500 dark:text-muted-foreground text-xs">{line}</p>
      ))}
    {address.city    && <p className="text-gray-500 dark:text-muted-foreground text-xs">{address.city}</p>}
    {address.country && <p className="text-gray-500 dark:text-muted-foreground text-xs">{address.country}</p>}
    {address.phone   && <p className="text-gray-500 dark:text-muted-foreground text-xs">{address.phone}</p>}
  </div>
);

export default AddressCard;