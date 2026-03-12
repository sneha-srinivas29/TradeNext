
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Upload } from "lucide-react";
import { GRNFormData } from "./Grn.types";

interface GRNFormFieldsProps {
  formData: GRNFormData;
  setFormData: React.Dispatch<React.SetStateAction<GRNFormData>>;
}

const GRNFormFields: React.FC<GRNFormFieldsProps> = ({ formData, setFormData }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      custrecord_grn_milestone_attachment: file,
    }));
  };

  const handleInputChange = (field: keyof GRNFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-10">
      
      {/* LEFT COLUMN */}
      <div className="space-y-6">

        {/* Customer */}
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-gray-600 whitespace-nowrap">
            Customer ID
          </Label>
          <Input
            value={formData.custrecord_sam_grn_customer}
            onChange={(e) =>
              handleInputChange("custrecord_sam_grn_customer", e.target.value)
            }
            placeholder="Enter Customer ID"
            className="flex-1 border-gray-300"
          />
        </div>

        {/* Vendor */}
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-gray-600 whitespace-nowrap">
            Vendor ID
          </Label>
          <Input
            value={formData.custrecord_sam_grn_vendor}
            onChange={(e) =>
              handleInputChange("custrecord_sam_grn_vendor", e.target.value)
            }
            placeholder="Enter Vendor ID"
            className="flex-1 border-gray-300"
          />
        </div>

        {/* GRN Document Number */}
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-gray-600 whitespace-nowrap">
            GRN Document No
          </Label>
          <Input
            value={formData.custrecord_grn_document_reference_number}
            onChange={(e) =>
              handleInputChange(
                "custrecord_grn_document_reference_number",
                e.target.value
              )
            }
            placeholder="Enter GRN Document Number"
            className="flex-1 border-gray-300"
          />
        </div>

        {/* Bill Reference Number */}
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-gray-600 whitespace-nowrap">
            Bill Reference No
          </Label>
          <Input
            value={formData.custrecord_grn_biill_refernce_number}
            onChange={(e) =>
              handleInputChange(
                "custrecord_grn_biill_refernce_number",
                e.target.value
              )
            }
            placeholder="Enter Bill Reference Number"
            className="flex-1 border-gray-300"
          />
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">

        {/* GRN Date */}
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-gray-600 whitespace-nowrap">
            GRN Date
          </Label>
          <div className="relative flex-1">
            <Input
              type="date"
              value={formData.custrecord_grn_document_date}
              onChange={(e) =>
                handleInputChange("custrecord_grn_document_date", e.target.value)
              }
              className="border-gray-300 pr-10"
            />
            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Bill Date */}
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-gray-600 whitespace-nowrap">
            Bill Date
          </Label>
          <Input
            type="date"
            value={formData.custrecord_grn_bill_date}
            onChange={(e) =>
              handleInputChange("custrecord_grn_bill_date", e.target.value)
            }
            className="flex-1 border-gray-300"
          />
        </div>

        {/* Invoice Date */}
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-gray-600 whitespace-nowrap">
            Invoice Date
          </Label>
          <Input
            type="date"
            value={formData.custrecord_original_invoice_date}
            onChange={(e) =>
              handleInputChange(
                "custrecord_original_invoice_date",
                e.target.value
              )
            }
            className="flex-1 border-gray-300"
          />
        </div>

        {/* Invoice ID */}
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-gray-600 whitespace-nowrap">
            Invoice ID
          </Label>
          <Input
            value={formData.custrecord_grn_invoice}
            onChange={(e) =>
              handleInputChange("custrecord_grn_invoice", e.target.value)
            }
            placeholder="Enter Invoice ID"
            className="flex-1 border-gray-300"
          />
        </div>

        {/* Attachment */}
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-gray-600 whitespace-nowrap">
            GRN Attachment
          </Label>
          <div className="flex-1">
            <Input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
            >
              <span className="text-sm text-gray-600">
                {formData.custrecord_grn_milestone_attachment
                  ? "File Selected"
                  : "Upload File"}
              </span>
              <Upload className="h-4 w-4 text-gray-400" />
            </label>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GRNFormFields;