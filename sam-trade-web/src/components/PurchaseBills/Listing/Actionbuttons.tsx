import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

interface ActionButtonsProps {
  onDownload: () => void;
  onUpload: () => void;
  compact?: boolean;
}

const ActionButtons = ({ 
  onDownload, 
  onUpload,
  compact = false 
}: ActionButtonsProps) => {
  return (
    <>
      {/* Download Button */}
      <Button
        size="sm"
        variant="outline"
        className="h-9 shadow-sm"
        onClick={onDownload}
      >
        <Download className="h-4 w-4" />
      </Button>

      {/* Upload Button */}
      <Button
        size="sm"
        variant="outline"
        className="h-9 shadow-sm"
        onClick={onUpload}
      >
        <Upload className="h-4 w-4" />
      </Button>
    </>
  );
};

export default ActionButtons;