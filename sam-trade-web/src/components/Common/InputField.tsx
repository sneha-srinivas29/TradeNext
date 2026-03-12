import { Calendar } from "lucide-react";

interface InputFieldProps {
  label: string;
  value: string | File | null;
  onChange: (val: any) => void;
  placeholder?: string;
  type?: string;
  isFile?: boolean;
}

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  isFile = false,
}: InputFieldProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
      <label className="w-full sm:w-44 text-sm font-medium text-gray-700">
        {label}
      </label>

      {isFile ? (
        <label className="flex-1 cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
          <div className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 truncate">
            {(value as File)?.name || "Select File"}
          </div>
        </label>
      ) : type === "date" ? (
        <div className="flex-1 relative">
          <input
            type="date"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      ) : (
        <input
          type={type}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      )}
    </div>
  );
};

export default InputField;
