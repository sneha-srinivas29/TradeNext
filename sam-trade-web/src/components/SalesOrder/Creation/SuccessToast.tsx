import { Check } from "lucide-react";

interface SuccessToastProps {
  show: boolean;
}

const SuccessToast = ({ show }: SuccessToastProps) => {
  if (!show) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
      <div className="bg-white/20 rounded-full p-1">
        <Check className="h-4 w-4" />
      </div>
      <div>
        <p className="font-semibold text-sm">Saved!</p>
        <p className="text-xs opacity-90">Sales order saved successfully</p>
      </div>
    </div>
  );
};

export default SuccessToast;