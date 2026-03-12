import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus } from "lucide-react";

export interface Address {
    address: any;
    id: number;
    name: string;
    street: string;
    city: string;
    country: string;
    phone: string;
}

interface SearchableAddressSelectProps {
    label: string;
    options: Address[];
    value: Address | null;
    onSelect: (address: Address) => void;
    onAddNew: () => void;
}

const SearchableAddressSelect = ({
    label,
    options,
    value,
    onSelect,
    onAddNew,
}: SearchableAddressSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(
        (opt) =>
            opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opt.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}
            </label>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between"
            >
                <span className="truncate text-gray-900">
                    {value?.name || "Select address"}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                    onSelect(opt);
                                    setIsOpen(false);
                                    setSearchQuery("");
                                }}
                                className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${value?.id === opt.id ? "bg-blue-50" : ""
                                    }`}
                            >
                                <div className="font-medium text-sm text-gray-900">{opt.name}</div>
                                <div className="text-xs text-gray-600">{opt.city}</div>
                            </button>
                        ))}

                        {filteredOptions.length === 0 && (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No results found
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => {
                                onAddNew();
                                setIsOpen(false);
                                setSearchQuery("");
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Address
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableAddressSelect;