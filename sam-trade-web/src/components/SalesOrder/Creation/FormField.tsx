import { AlertCircle } from "lucide-react";

interface FormFieldProps {
  label:     string;
  required?: boolean;
  error?:    string;
  children:  React.ReactNode;
}

const FormField = ({ label, required, error, children }: FormFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-gray-600 dark:text-muted-foreground uppercase tracking-wider">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-center gap-1 mt-0.5">
        <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
        <p className="text-xs text-red-500">{error}</p>
      </div>
    )}
  </div>
);

export default FormField;