import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Printer, Edit, FileText } from "lucide-react";
import DashboardLayout from "@/components/Common/DashboardLayout";
import { useLocation, useNavigate } from "react-router-dom";

interface LineItem {
    id: number;
    productName: string;
    hsn: string;
    uom: string;
    shippedQty: number;
    receivedQty: number;
    rate: number;
    gst: number;
    total: number;
    description: string;
}

interface GRNData {
    grnRefId: string;
    saleInvoiceId: string;
    salesOrderNo: string;
    grnEntryDate: string;
    saleInvoiceDate: string;
    attachment: string | null;
    items: LineItem[];
    status: string;
}

const GRNPreview: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Get data from navigation state or use default empty data
    const grnData: GRNData = location.state?.grnData || {
        grnRefId: "",
        saleInvoiceId: "",
        salesOrderNo: "",
        grnEntryDate: "",
        saleInvoiceDate: "",
        attachment: null,
        items: [],
       
    };

    const lineItems: LineItem[] = grnData.items || [];

    const handleEdit = (): void => {
        console.log("Edit GRN");
        navigate("/grn-create", { state: { grnData } });
    };

    const handleDownload = (): void => {
        console.log("Download GRN");
        alert("Download functionality to be implemented");
    };

    const handlePrint = (): void => {
        window.print();
    };

    const handleApprove = (): void => {
        console.log("Approve GRN");
        
        // Update status to Approved
        const approvedData = {
            ...grnData,
            status: "Approved",
        };

        // Navigate to view page with approved data
        navigate("/grn-view", { state: { grnData: approvedData } });
    };

    const handleReject = (): void => {
        console.log("Reject GRN");
        
        // Update status to Rejected
        const rejectedData = {
            ...grnData,
            status: "Rejected",
        };

        // Navigate to view page with rejected data
        navigate("/grn-view", { state: { grnData: rejectedData } });
    };

    const handleBackToList = (): void => {
        navigate("/grn-listing"); // Adjust the route as needed
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case "Approved":
                return "bg-green-100 text-green-700 border-green-300";
            case "Rejected":
                return "bg-red-100 text-red-700 border-red-300";
            case "Pending Approval":
                return "bg-yellow-100 text-yellow-700 border-yellow-300";
            default:
                return "bg-gray-100 text-gray-700 border-gray-300";
        }
    };

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + (item.receivedQty * item.rate), 0);
    const totalGST = lineItems.reduce(
        (sum, item) => sum + (item.receivedQty * item.rate * item.gst / 100),
        0
    );
    const grandTotal = subtotal + totalGST;

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between print:hidden">
                <Button
                    variant="ghost"
                    onClick={handleBackToList}
                    className="flex items-center gap-2 text-base p-0 h-auto hover:bg-transparent"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="text-base font-bold">Back to GRN List</span>
                </Button>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleEdit}
                        className="flex items-center gap-2 hover:bg-blue-50"
                    >
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDownload}
                        className="flex items-center gap-2 hover:bg-blue-50"
                    >
                        <Download className="h-4 w-4" />
                        Download
                    </Button>
                   
                </div>
            </div>

            {/* Main Card */}
            <Card className="w-full max-w-7xl mx-auto  shadow-lg print:border-0 print:shadow-none">
                {/* Header Section */}
                <CardHeader className="text-center ">
                    <div className="space-y-3">
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Goods Received Note 
                        </CardTitle>
                        
                       
                    </div>
                </CardHeader>

                <CardContent className="p-8 bg-white">
                    {/* GRN Details Section */}
                    <div className="mb-10  p-8 rounded-xl border-b border-gray-200 print:border print:bg-white -mt-12">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 pb-2 border-b border-gray-300">
                            GRN Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          

                            {/* Sale Invoice ID */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-black">
                                    Sale Invoice ID
                                </label>
                                <p className="text-base font-semibold text-black">
                                    {grnData.saleInvoiceId}
                                </p>
                            </div>

                            {/* Sales Order No */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-black">
                                    Sales Order No.
                                </label>
                                <p className="text-base font-semibold text-black">
                                    {grnData.salesOrderNo }
                                </p>
                            </div>

                            {/* GRN Entry Date */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-black">
                                    GRN Entry Date
                                </label>
                                <p className="text-base font-semibold text-black">
                                    {formatDate(grnData.grnEntryDate)}
                                </p>
                            </div>

                            {/* Sale Invoice Date */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-black">
                                    Sale Invoice Date
                                </label>
                                <p className="text-base font-semibold text-black">
                                    {formatDate(grnData.saleInvoiceDate)}
                                </p>
                            </div>

                            {/* Attachment */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-black">
                                    Attachment
                                </label>
                                {grnData.attachment ? (
                                    <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                                        <FileText className="h-4 w-4" />
                                        <a
                                            href="#"
                                            className="text-sm font-medium underline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                console.log("Download attachment:", grnData.attachment);
                                            }}
                                        >
                                            {grnData.attachment}
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-sm text-black">No attachment</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Line Items</h3>

                        <div className="rounded-lg overflow-hidden border-1 border-gray-300 shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-primary">
                                        <TableHead className="text-white font-semibold text-sm h-12 w-[5%]">
                                            Item
                                        </TableHead>
                                        <TableHead className="text-white font-semibold text-sm h-12 w-[28%]">
                                            Description of Goods
                                        </TableHead>
                                        <TableHead className="text-white font-semibold text-sm text-center h-12 w-[8%]">
                                            UOM
                                        </TableHead>
                                        <TableHead className="text-white font-semibold text-sm text-center h-12 w-[10%]">
                                            Shipped Qty
                                        </TableHead>
                                        <TableHead className="text-white font-semibold text-sm text-center h-12 w-[10%]">
                                            Received Qty
                                        </TableHead>
                                        <TableHead className="text-white font-semibold text-sm text-center h-12 w-[8%]">
                                            Variance
                                        </TableHead>
                                        <TableHead className="text-white font-semibold text-sm text-right h-12 w-[11%]">
                                            Rate
                                        </TableHead>
                                        <TableHead className="text-white font-semibold text-sm text-center h-12 w-[7%]">
                                            GST %
                                        </TableHead>
                                        <TableHead className="text-white font-semibold text-sm text-right h-12 w-[13%]">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {lineItems.length > 0 ? (
                                        lineItems.map((item, index) => {
                                            const variance = item.shippedQty - item.receivedQty;
                                            const hasVariance = variance !== 0;

                                            const getVarianceColor = (): string => {
                                                if (variance === 0) return "text-green-600 bg-green-50";
                                                if (variance > 0) return "text-orange-600 bg-orange-50";
                                                return "text-red-600 bg-red-50";
                                            };

                                            return (
                                                <TableRow
                                                    key={item.id}
                                                    className="hover:bg-blue-50/30 border-b border-gray-200"
                                                >
                                                    <TableCell className="text-center font-semibold text-gray-700">
                                                        {index + 1}
                                                    </TableCell>

                                                    <TableCell className="py-5">
                                                        <div className="space-y-1">
                                                            <div className="font-semibold text-sm text-gray-900">
                                                                {item.productName || "-"}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                HSN Code:{" "}
                                                                <span className="font-medium">
                                                                    {item.hsn || "-"}
                                                                </span>
                                                            </div>
                                                            {item.description && (
                                                                <div className="text-xs text-gray-500 italic">
                                                                    {item.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-md">
                                                            {item.uom || "-"}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <span className="font-semibold text-sm text-gray-900">
                                                            {item.shippedQty}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <span className="font-bold text-sm text-blue-600">
                                                            {item.receivedQty}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <span
                                                            className={`inline-block px-2 py-1 text-sm font-semibold rounded-md ${getVarianceColor()}`}
                                                        >
                                                            {hasVariance
                                                                ? variance > 0
                                                                    ? `+${variance}`
                                                                    : variance
                                                                : "0"}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <span className="font-medium text-sm text-gray-900">
                                                            ₹
                                                            {item.rate.toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-md">
                                                            {item.gst}%
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        {item.total > 0 ? (
                                                            <span className="font-bold text-sm text-gray-900">
                                                                ₹
                                                                {item.total.toLocaleString("en-IN", {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="text-center py-8 text-gray-500"
                                            >
                                                No line items available
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="mb-8 flex justify-end">
                        <div className="w-full md:w-1/2 lg:w-1/3 bg-gray-50 border1 border-gray-100 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">
                                Summary
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">
                                        Subtotal
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        ₹
                                        {subtotal.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">
                                        Total GST
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        ₹
                                        {totalGST.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                                    <span className="text-base font-bold text-gray-800">
                                        Grand Total
                                    </span>
                                    <span className="text-lg font-bold text-primary">
                                        ₹
                                        {grandTotal.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Approval Actions */}
                    <div className="flex justify-center gap-4 pt-8 border-t print:hidden">
                      
                        <Button
                            onClick={handleApprove}
                            className="bg-primary text-white px-2 py-4 text-base font-semibold shadow-md"
                        >
                          Confirm and save
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default GRNPreview;