import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GRNFormFields from "./Grnformfields";
import GRNLineItemsTable from "./Grnlineitemstable";
import { GRNFormData, LineItem } from "./Grn.types";

interface GRNCardProps {
    formData: GRNFormData;
    setFormData: React.Dispatch<React.SetStateAction<GRNFormData>>;
    lineItems: LineItem[];
    setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
    onSave: () => void;
}

const GRNCard: React.FC<GRNCardProps> = ({
    formData,
    setFormData,
    lineItems,
    setLineItems,
    onSave,
}) => {
    return (
        <Card className="w-full max-w-6xl mx-auto border-2 border-gray-200 shadow-lg">
            <CardHeader className="text-center border-b bg-white">
                <CardTitle className="text-2xl font-bold text-gray-900">
                    Goods Received Note
                </CardTitle>
            </CardHeader>

            <CardContent className="p-8 bg-white">
                {/* Form Fields Section */}
                <GRNFormFields formData={formData} setFormData={setFormData} />

                {/* Line Items Table Section */}
                <GRNLineItemsTable lineItems={lineItems} setLineItems={setLineItems} />

                {/* Save Button */}
                <div className="flex justify-center pt-4">
                    <Button
                        onClick={onSave}
                        className="bg-primary text-white px-20 py-6 rounded-md text-base font-medium shadow-sm"
                    >
                        Save Details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default GRNCard;