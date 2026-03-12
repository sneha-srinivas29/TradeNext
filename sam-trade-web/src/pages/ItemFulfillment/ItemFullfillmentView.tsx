// import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
// import { useEffect, useState } from "react";
// import DashboardLayout from "@/components/Common/DashboardLayout";
// import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { type LineItem } from "@/components/Common/LineItemsTable";
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import Samunnati from "../../assets/Samunnati.jpg";

// interface ItemFulfillmentData {
//     contractId: string;
//     salesOrderNo: string;
//     purchaseOrderId: string;
//     supplierName: string;
//     supplierBillNumber: string;
//     proofOfShipment: File | null;
//     vehicleNumber: string;
//     eWaybill: File | null;
//     eWaybillNumber: string;
//     itemFulfillmentDate: string;
//     supplierBillDate: string;
//     lineItems: LineItem[];
//     status?: string;
// }

// const ItemFulfillmentView = () => {
//     const navigate = useNavigate();
//     const { id } = useParams();
//     const location = useLocation();
//     const stateData = location.state as ItemFulfillmentData | undefined;

//     const [itemFulfillmentData, setItemFulfillmentData] = useState<ItemFulfillmentData | null>(stateData || null);
//     const [isLoadingIF, setIsLoadingIF] = useState(false);

//     // Fetch Item Fulfillment data if not in state (coming from listing)
//     useEffect(() => {
//         const fetchItemFulfillment = async () => {
//             if (stateData) {
//                 // Data already available from state
//                 setItemFulfillmentData(stateData);
//                 return;
//             }

//             if (!id) {
//                 navigate("/item-fulfillments/listing");
//                 return;
//             }

//             setIsLoadingIF(true);

//             try {
//                 // API call to fetch Item Fulfillment by ID
//                 const response = await fetch(`/api/item-fulfillments/${id}`);

//                 if (!response.ok) {
//                     throw new Error("Item fulfillment not found");
//                 }

//                 const data: ItemFulfillmentData = await response.json();
//                 setItemFulfillmentData(data);
//             } catch (error) {
//                 console.error("Error fetching item fulfillment:", error);
//                 navigate("/item-fulfillments/listing");
//             } finally {
//                 setIsLoadingIF(false);
//             }
//         };

//         fetchItemFulfillment();
//     }, [id, stateData, navigate]);

//     // Show loading state
//     if (isLoadingIF) {
//         return (
//             <DashboardLayout userName="Sneha">
//                 <div className="flex items-center justify-center min-h-[400px]">
//                     <div className="flex flex-col items-center gap-3">
//                         <Loader2 className="w-8 h-8 animate-spin text-primary" />
//                         <p className="text-muted-foreground">Loading item fulfillment...</p>
//                     </div>
//                 </div>
//             </DashboardLayout>
//         );
//     }

//     // Show error if no data
//     if (!itemFulfillmentData) {
//         return null;
//     }

//     const calculateItemTotal = (item: LineItem) => {
//         return item.quantity * item.buyRate;
//     };

//     const subtotal = itemFulfillmentData.lineItems.reduce(
//         (sum, item) => sum + calculateItemTotal(item), 0
//     );

//     const taxAmount = itemFulfillmentData.lineItems.reduce((sum, item) => {
//         const itemTotal = calculateItemTotal(item);
//         return sum + (itemTotal * item.gstRate) / 100;
//     }, 0);

//     const grandTotal = subtotal + taxAmount;
//     const cgstAmount = taxAmount / 2;
//     const sgstAmount = taxAmount / 2;

//     const numberToWords = (num: number): string => {
//         const crores = Math.floor(num / 10000000);
//         const lakhs = Math.floor((num % 10000000) / 100000);
//         const thousands = Math.floor((num % 100000) / 1000);
//         let result: string[] = [];
//         if (crores > 0) result.push(`${crores} Crore${crores > 1 ? 's' : ''}`);
//         if (lakhs > 0) result.push(`${lakhs} Lakh${lakhs > 1 ? 's' : ''}`);
//         if (thousands > 0) result.push(`${thousands} Thousand`);

//         return result.join(' ') || 'Zero';
//     };

//     const isApproved = itemFulfillmentData.status?.toLowerCase() === "approved";

//     return (
//         <DashboardLayout userName="Sneha">
//             {/* Breadcrumb & Back Button */}
//             <div className="flex flex-col mb-6">
//                 {/* Back Button */}
//                 <Button
//                     variant="ghost"
//                     onClick={() => {
//                         // If coming from preview, go back to preview
//                         if (stateData) {
//                             navigate("/item-fulfillments/preview", { state: itemFulfillmentData });
//                         } else {
//                             // If coming from listing, go back to listing
//                             navigate("/item-fulfillments/listing");
//                         }
//                     }}
//                     className="flex items-center gap-2 text-muted-foreground hover:text-foreground w-fit p-0 h-auto mb-2"
//                 >
//                     <ArrowLeft className="w-5 h-5" />
//                     Back
//                 </Button>

//                 {/* Breadcrumb */}
//                 <nav className="text-sm text-muted-foreground" aria-label="breadcrumb">
//                     <ol className="flex items-center gap-1 flex-wrap">
//                         <li className="flex items-center gap-1">
//                             <Link to="/" className="text-primary hover:underline">
//                                 Dashboard
//                             </Link>
//                             <ChevronRight className="h-4 w-4 text-muted-foreground" />
//                         </li>

//                         <li className="flex items-center gap-1">
//                             <Link to="/item-fulfillments/listing" className="text-primary hover:underline">
//                                 Item Fulfillments
//                             </Link>
//                             <ChevronRight className="h-4 w-4 text-muted-foreground" />
//                         </li>

//                         {stateData && (
//                             <>
//                                 <li className="flex items-center gap-1">
//                                     <Link
//                                         to="/item-fulfillments/create"
//                                         state={itemFulfillmentData}
//                                         className="text-primary hover:underline"
//                                     >
//                                         Create
//                                     </Link>
//                                     <ChevronRight className="h-4 w-4 text-muted-foreground" />
//                                 </li>

//                                 <li className="flex items-center gap-1">
//                                     <Link
//                                         to="/item-fulfillments/preview"
//                                         state={itemFulfillmentData}
//                                         className="text-primary hover:underline"
//                                     >
//                                         Preview
//                                     </Link>
//                                     <ChevronRight className="h-4 w-4 text-muted-foreground" />
//                                 </li>
//                             </>
//                         )}

//                         <li className="flex items-center gap-1">
//                             <span className="text-foreground font-medium">View</span>
//                         </li>
//                     </ol>
//                 </nav>
//             </div>

//             {/* Item Fulfillment Card */}
//             <Card className="max-w-4xl mx-auto">
//                 <CardContent className="p-6">
//                     {/* Header */}
//                     <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
//                         <div>
//                             <div className="flex items-center gap-3 mb-4">
//                                 <h1 className="text-2xl font-bold">Item Fulfillment</h1>
//                                 <Badge className={`status-badge ${isApproved ? 'status-approved' : 'status-pending'}`}>
//                                     {itemFulfillmentData.status || "Under Approval"}
//                                 </Badge>
//                             </div>

//                             <div className="space-y-2 text-sm">
//                                 {itemFulfillmentData.contractId && (
//                                     <div className="flex gap-8">
//                                         <span className="text-muted-foreground w-40">Contract ID</span>
//                                         <span className="font-medium">{itemFulfillmentData.contractId}</span>
//                                     </div>
//                                 )}

//                                 {itemFulfillmentData.salesOrderNo && (
//                                     <div className="flex gap-8">
//                                         <span className="text-muted-foreground w-40">Sales Order No</span>
//                                         <span>{itemFulfillmentData.salesOrderNo}</span>
//                                     </div>
//                                 )}

//                                 {itemFulfillmentData.purchaseOrderId && (
//                                     <div className="flex gap-8">
//                                         <span className="text-muted-foreground w-40">Purchase Order ID</span>
//                                         <span>{itemFulfillmentData.purchaseOrderId}</span>
//                                     </div>
//                                 )}

//                                 {itemFulfillmentData.supplierName && (
//                                     <div className="flex gap-8">
//                                         <span className="text-muted-foreground w-40">Supplier Name</span>
//                                         <span>{itemFulfillmentData.supplierName}</span>
//                                     </div>
//                                 )}

//                                 {itemFulfillmentData.supplierBillNumber && (
//                                     <div className="flex gap-8">
//                                         <span className="text-muted-foreground w-40">Supplier Bill Number</span>
//                                         <span>{itemFulfillmentData.supplierBillNumber}</span>
//                                     </div>
//                                 )}

//                                 {itemFulfillmentData.itemFulfillmentDate && (
//                                     <div className="flex gap-8">
//                                         <span className="text-muted-foreground w-40">Item Fulfillment Date</span>
//                                         <span className="text-primary">
//                                             {new Date(itemFulfillmentData.itemFulfillmentDate).toLocaleDateString('en-US', {
//                                                 year: 'numeric',
//                                                 month: 'short',
//                                                 day: 'numeric'
//                                             })}
//                                         </span>
//                                     </div>
//                                 )}

//                                 {itemFulfillmentData.supplierBillDate && (
//                                     <div className="flex gap-8">
//                                         <span className="text-muted-foreground w-40">Supplier Bill Date</span>
//                                         <span className="text-primary">
//                                             {new Date(itemFulfillmentData.supplierBillDate).toLocaleDateString('en-US', {
//                                                 year: 'numeric',
//                                                 month: 'short',
//                                                 day: 'numeric'
//                                             })}
//                                         </span>
//                                     </div>
//                                 )}

//                                 {itemFulfillmentData.vehicleNumber && (
//                                     <div className="flex gap-8">
//                                         <span className="text-muted-foreground w-40">Vehicle Number</span>
//                                         <span>{itemFulfillmentData.vehicleNumber}</span>
//                                     </div>
//                                 )}

//                                 {itemFulfillmentData.eWaybillNumber && (
//                                     <div className="flex gap-8">
//                                         <span className="text-muted-foreground w-40">E-WayBill Number</span>
//                                         <span>{itemFulfillmentData.eWaybillNumber}</span>
//                                     </div>
//                                 )}

//                                 {itemFulfillmentData.proofOfShipment && (
//                                     <div className="flex gap-8">
//                                         <span className="text-muted-foreground w-40">Proof of Shipment</span>
//                                         <a href="#" className="text-primary underline">
//                                             {itemFulfillmentData.proofOfShipment.name}
//                                         </a>
//                                     </div>
//                                 )}

//                                 {itemFulfillmentData.eWaybill && (
//                                     <div className="flex gap-8">
//                                         <span className="text-muted-foreground w-40">E-Waybill</span>
//                                         <a href="#" className="text-primary underline">
//                                             {itemFulfillmentData.eWaybill.name}
//                                         </a>
//                                     </div>
//                                 )}
//                             </div>
//                         </div>

//                         <div className="text-right space-y-4">
//                             <div className="flex items-center gap-2 justify-end">
//                                 <img className="w-40 h-8" src={Samunnati} alt="Samunnati Logo" />
//                             </div>
//                         </div>
//                     </div>

//                     {/* Products Table - Desktop */}
//                     <div className="hidden lg:block border border-border rounded-lg overflow-hidden mb-6">
//                         <div className="overflow-x-auto">
//                             <Table>
//                                 <TableHeader className="table-header">
//                                     <TableRow>
//                                         <TableHead className="text-left text-white font-medium">Description of Goods</TableHead>
//                                         <TableHead className="text-left text-white font-medium">UOM</TableHead>
//                                         <TableHead className="text-left text-white font-medium">QTY</TableHead>
//                                         <TableHead className="text-left text-white font-medium">Sell Rate</TableHead>
//                                         <TableHead className="text-left text-white font-medium">Buy Rate</TableHead>
//                                         <TableHead className="text-left text-white font-medium">GST Rate</TableHead>
//                                         <TableHead className="text-left text-white font-medium">CGST</TableHead>
//                                         <TableHead className="text-left text-white font-medium">SGST</TableHead>
//                                         <TableHead className="text-left text-white font-medium">IGST</TableHead>
//                                         <TableHead className="text-left text-white font-medium">Total</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {itemFulfillmentData.lineItems.map((item) => {
//                                         const itemTotal = calculateItemTotal(item);
//                                         const itemTax = (itemTotal * item.gstRate) / 100;
//                                         const itemCGST = itemTax / 2;
//                                         const itemSGST = itemTax / 2;
//                                         const itemGrandTotal = itemTotal + itemTax;

//                                         return (
//                                             <TableRow key={item.id}>
//                                                 <TableCell>
//                                                     <div className="font-medium">{item.productName}</div>
//                                                     <div className="text-xs text-muted-foreground">HSNCode: {item.hsn}</div>
//                                                     {item.description && (
//                                                         <div className="text-xs text-muted-foreground mt-1">
//                                                             {item.description}
//                                                         </div>
//                                                     )}
//                                                 </TableCell>
//                                                 <TableCell>{item.uom}</TableCell>
//                                                 <TableCell>{item.quantity}</TableCell>
//                                                 <TableCell>₹{item.sellRate.toLocaleString('en-IN')}</TableCell>
//                                                 <TableCell>₹{item.buyRate.toLocaleString('en-IN')}</TableCell>
//                                                 <TableCell>{item.gstRate}%</TableCell>
//                                                 <TableCell>₹{itemCGST.toLocaleString('en-IN')}</TableCell>
//                                                 <TableCell>₹{itemSGST.toLocaleString('en-IN')}</TableCell>
//                                                 <TableCell>-</TableCell>
//                                                 <TableCell className="font-medium">₹{itemGrandTotal.toLocaleString('en-IN')}</TableCell>
//                                             </TableRow>
//                                         );
//                                     })}
//                                 </TableBody>
//                             </Table>
//                         </div>
//                     </div>

//                     {/* MOBILE CARDS */}
//                     <div className="lg:hidden space-y-4 mb-6">
//                         {itemFulfillmentData.lineItems.map((item) => {
//                             const itemTotal = calculateItemTotal(item);
//                             const itemTax = (itemTotal * item.gstRate) / 100;
//                             const itemCGST = itemTax / 2;
//                             const itemSGST = itemTax / 2;
//                             const itemGrandTotal = itemTotal + itemTax;

//                             return (
//                                 <Card key={item.id}>
//                                     <CardContent className="p-4 space-y-4 text-sm">
//                                         <div>
//                                             <h3 className="font-semibold">{item.productName}</h3>
//                                             <p className="text-xs text-muted-foreground">HSNCode: {item.hsn}</p>
//                                             {item.description && (
//                                                 <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
//                                             )}
//                                         </div>

//                                         <div className="grid grid-cols-2 gap-3">
//                                             <div>
//                                                 <p className="text-xs text-muted-foreground">UOM</p>
//                                                 <p>{item.uom}</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-xs text-muted-foreground">Quantity</p>
//                                                 <p>{item.quantity}</p>
//                                             </div>

//                                             <div>
//                                                 <p className="text-xs text-muted-foreground">Sell Rate</p>
//                                                 <p>₹{item.sellRate.toLocaleString('en-IN')}</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-xs text-muted-foreground">Buy Rate</p>
//                                                 <p>₹{item.buyRate.toLocaleString('en-IN')}</p>
//                                             </div>

//                                             <div>
//                                                 <p className="text-xs text-muted-foreground">GST</p>
//                                                 <p>{item.gstRate}%</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-xs text-muted-foreground">IGST</p>
//                                                 <p>-</p>
//                                             </div>

//                                             <div>
//                                                 <p className="text-xs text-muted-foreground">CGST</p>
//                                                 <p>₹{itemCGST.toLocaleString('en-IN')}</p>
//                                             </div>
//                                             <div>
//                                                 <p className="text-xs text-muted-foreground">SGST</p>
//                                                 <p>₹{itemSGST.toLocaleString('en-IN')}</p>
//                                             </div>
//                                         </div>

//                                         <Separator />
//                                         <div className="flex justify-between font-semibold">
//                                             <span>Total</span>
//                                             <span className="text-primary">₹{itemGrandTotal.toLocaleString('en-IN')}</span>
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             );
//                         })}
//                     </div>

//                     {/* Summary */}
//                     <div className="space-y-2 text-sm">
//                         <div className="flex justify-between">
//                             <span className="text-muted-foreground">Amount</span>
//                             <span>₹{subtotal.toLocaleString('en-IN')}</span>
//                         </div>
//                         <div className="flex justify-between">
//                             <span className="text-muted-foreground">SGST</span>
//                             <span>₹{sgstAmount.toLocaleString('en-IN')}</span>
//                         </div>
//                         <div className="flex justify-between">
//                             <span className="text-muted-foreground">CGST</span>
//                             <span>₹{cgstAmount.toLocaleString('en-IN')}</span>
//                         </div>
//                         <div className="flex justify-between">
//                             <span className="text-muted-foreground">IGST</span>
//                             <span>N/A</span>
//                         </div>
//                         <div className="flex justify-between">
//                             <span className="text-muted-foreground">Tax (+)</span>
//                             <span>₹{taxAmount.toLocaleString('en-IN')}</span>
//                         </div>
//                         <div className="flex justify-between text-primary font-medium">
//                             <span></span>
//                             <span>₹{grandTotal.toLocaleString('en-IN')}</span>
//                         </div>
//                         <Separator className="my-2" />
//                         <div className="pt-2">
//                             <div className="flex justify-between text-lg font-bold">
//                                 <span>Amount Total</span>
//                                 <span>₹{grandTotal.toLocaleString('en-IN')}</span>
//                             </div>
//                             <p className="text-muted-foreground text-xs mt-1 text-right">
//                                 {numberToWords(grandTotal)}
//                             </p>
//                         </div>
//                     </div>
//                 </CardContent>
//             </Card>
//         </DashboardLayout>
//     );
// };

// export default ItemFulfillmentView;



import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/Common/DashboardLayout";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type LineItem } from "@/components/Common/LineItemsTable";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Samunnati from "../../assets/Samunnati.jpg";

interface ItemFulfillmentData {
    id?: string;
    tranid?: string;
    contractId: string;
    salesOrderNo: string;
    purchaseOrderId: string;
    supplierName: string;
    supplierBillNumber: string;
    proofOfShipment: File | null;
    vehicleNumber: string;
    eWaybill: File | null;
    eWaybillNumber: string;
    itemFulfillmentDate: string;
    supplierBillDate: string;
    lineItems: LineItem[];
    status?: string;
}

const ItemFulfillmentView = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const stateData = location.state as ItemFulfillmentData | undefined;

    const [itemFulfillmentData, setItemFulfillmentData] = useState<ItemFulfillmentData | null>(stateData || null);
    const [isLoadingIF, setIsLoadingIF] = useState(false);

    // Fetch Item Fulfillment data if not in state (coming from listing)
    useEffect(() => {
        const fetchItemFulfillment = async () => {
            if (stateData) {
                setItemFulfillmentData(stateData);
                return;
            }

            if (!id) {
                navigate("/item-fulfillments/listing");
                return;
            }

            setIsLoadingIF(true);

            try {
                const response = await fetch(`/api/item-fulfillments/${id}`);

                if (!response.ok) {
                    throw new Error("Item fulfillment not found");
                }

                const data: ItemFulfillmentData = await response.json();
                setItemFulfillmentData(data);
            } catch (error) {
                console.error("Error fetching item fulfillment:", error);
                navigate("/item-fulfillments/listing");
            } finally {
                setIsLoadingIF(false);
            }
        };

        fetchItemFulfillment();
    }, [id, stateData, navigate]);

    // Show loading state
    if (isLoadingIF) {
        return (
            <DashboardLayout userName="Sneha">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Loading item fulfillment...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Show error if no data
    if (!itemFulfillmentData) {
        return null;
    }

    const calculateItemTotal = (item: LineItem) => {
        return item.quantity * item.buyRate;
    };

    const subtotal = itemFulfillmentData.lineItems.reduce(
        (sum, item) => sum + calculateItemTotal(item), 0
    );

    const taxAmount = itemFulfillmentData.lineItems.reduce((sum, item) => {
        const itemTotal = calculateItemTotal(item);
        return sum + (itemTotal * item.gstRate) / 100;
    }, 0);

    const grandTotal = subtotal + taxAmount;
    const cgstAmount = taxAmount / 2;
    const sgstAmount = taxAmount / 2;

    const numberToWords = (num: number): string => {
        const crores = Math.floor(num / 10000000);
        const lakhs = Math.floor((num % 10000000) / 100000);
        const thousands = Math.floor((num % 100000) / 1000);
        let result: string[] = [];
        if (crores > 0) result.push(`${crores} Crore${crores > 1 ? 's' : ''}`);
        if (lakhs > 0) result.push(`${lakhs} Lakh${lakhs > 1 ? 's' : ''}`);
        if (thousands > 0) result.push(`${thousands} Thousand`);

        return result.join(' ') || 'Zero';
    };

    const isApproved = itemFulfillmentData.status?.toLowerCase() === "approved";

    return (
        <DashboardLayout userName="Sneha">
            {/* Breadcrumb & Back Button */}
            <div className="flex flex-col mb-6">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => {
                        if (stateData) {
                            navigate("/item-fulfillments/preview", { state: itemFulfillmentData });
                        } else {
                            navigate("/item-fulfillments/listing");
                        }
                    }}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground w-fit p-0 h-auto mb-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </Button>

                {/* Breadcrumb */}
                <nav className="text-sm text-muted-foreground" aria-label="breadcrumb">
                    <ol className="flex items-center gap-1 flex-wrap">
                        <li className="flex items-center gap-1">
                            <Link to="/" className="text-primary hover:underline">
                                Dashboard
                            </Link>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </li>

                        <li className="flex items-center gap-1">
                            <Link to="/item-fulfillments/listing" className="text-primary hover:underline">
                                Item Fulfillments
                            </Link>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </li>

                        {stateData && (
                            <>
                                <li className="flex items-center gap-1">
                                    <Link
                                        to="/item-fulfillments/create"
                                        state={itemFulfillmentData}
                                        className="text-primary hover:underline"
                                    >
                                        Create
                                    </Link>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </li>

                                <li className="flex items-center gap-1">
                                    <Link
                                        to="/item-fulfillments/preview"
                                        state={itemFulfillmentData}
                                        className="text-primary hover:underline"
                                    >
                                        Preview
                                    </Link>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </li>
                            </>
                        )}

                        <li className="flex items-center gap-1">
                            <span className="text-foreground font-medium">View</span>
                        </li>
                    </ol>
                </nav>
            </div>

            {/* Item Fulfillment Card */}
            <Card className="max-w-4xl mx-auto">
                <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                        <div>
                            {/* Title + Status Badge */}
                            <div className="flex items-center gap-3 mb-4">
                                <h1 className="text-2xl font-bold">Item Fulfillment</h1>
                                <Badge className={`status-badge ${isApproved ? 'status-approved' : 'status-pending'}`}>
                                    {itemFulfillmentData.status || "Under Approval"}
                                </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                                {/* IF Number (tranid from API response) */}
                                {itemFulfillmentData.tranid && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">IF Number</span>
                                        <span className="font-bold text-primary">{itemFulfillmentData.tranid}</span>
                                    </div>
                                )}

                                {itemFulfillmentData.contractId && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">Contract ID</span>
                                        <span className="font-medium">{itemFulfillmentData.contractId}</span>
                                    </div>
                                )}

                                {itemFulfillmentData.salesOrderNo && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">Sales Order No</span>
                                        <span>{itemFulfillmentData.salesOrderNo}</span>
                                    </div>
                                )}

                                {itemFulfillmentData.purchaseOrderId && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">Purchase Order ID</span>
                                        <span>{itemFulfillmentData.purchaseOrderId}</span>
                                    </div>
                                )}

                                {itemFulfillmentData.supplierName && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">Supplier Name</span>
                                        <span>{itemFulfillmentData.supplierName}</span>
                                    </div>
                                )}

                                {itemFulfillmentData.supplierBillNumber && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">Supplier Bill Number</span>
                                        <span>{itemFulfillmentData.supplierBillNumber}</span>
                                    </div>
                                )}

                                {itemFulfillmentData.itemFulfillmentDate && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">Item Fulfillment Date</span>
                                        <span className="text-primary">
                                            {new Date(itemFulfillmentData.itemFulfillmentDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}

                                {itemFulfillmentData.supplierBillDate && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">Supplier Bill Date</span>
                                        <span className="text-primary">
                                            {new Date(itemFulfillmentData.supplierBillDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}

                                {itemFulfillmentData.vehicleNumber && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">Vehicle Number</span>
                                        <span>{itemFulfillmentData.vehicleNumber}</span>
                                    </div>
                                )}

                                {itemFulfillmentData.eWaybillNumber && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">E-WayBill Number</span>
                                        <span>{itemFulfillmentData.eWaybillNumber}</span>
                                    </div>
                                )}

                                {itemFulfillmentData.proofOfShipment && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">Proof of Shipment</span>
                                        <a href="#" className="text-primary underline">
                                            {itemFulfillmentData.proofOfShipment.name}
                                        </a>
                                    </div>
                                )}

                                {itemFulfillmentData.eWaybill && (
                                    <div className="flex gap-8">
                                        <span className="text-muted-foreground w-40">E-Waybill</span>
                                        <a href="#" className="text-primary underline">
                                            {itemFulfillmentData.eWaybill.name}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-right space-y-4">
                            <div className="flex items-center gap-2 justify-end">
                                <img className="w-40 h-8" src={Samunnati} alt="Samunnati Logo" />
                            </div>
                        </div>
                    </div>

                    {/* Products Table - Desktop */}
                    <div className="hidden lg:block border border-border rounded-lg overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="table-header">
                                    <TableRow>
                                        <TableHead className="text-left text-white font-medium">Description of Goods</TableHead>
                                        <TableHead className="text-left text-white font-medium">UOM</TableHead>
                                        <TableHead className="text-left text-white font-medium">QTY</TableHead>
                                        <TableHead className="text-left text-white font-medium">Sell Rate</TableHead>
                                        <TableHead className="text-left text-white font-medium">Buy Rate</TableHead>
                                        <TableHead className="text-left text-white font-medium">GST Rate</TableHead>
                                        <TableHead className="text-left text-white font-medium">CGST</TableHead>
                                        <TableHead className="text-left text-white font-medium">SGST</TableHead>
                                        <TableHead className="text-left text-white font-medium">IGST</TableHead>
                                        <TableHead className="text-left text-white font-medium">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {itemFulfillmentData.lineItems.map((item) => {
                                        const itemTotal = calculateItemTotal(item);
                                        const itemTax = (itemTotal * item.gstRate) / 100;
                                        const itemCGST = itemTax / 2;
                                        const itemSGST = itemTax / 2;
                                        const itemGrandTotal = itemTotal + itemTax;

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-medium">{item.productName}</div>
                                                    <div className="text-xs text-muted-foreground">HSNCode: {item.hsn}</div>
                                                    {item.description && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{item.uom}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>₹{item.sellRate.toLocaleString('en-IN')}</TableCell>
                                                <TableCell>₹{item.buyRate.toLocaleString('en-IN')}</TableCell>
                                                <TableCell>{item.gstRate}%</TableCell>
                                                <TableCell>₹{itemCGST.toLocaleString('en-IN')}</TableCell>
                                                <TableCell>₹{itemSGST.toLocaleString('en-IN')}</TableCell>
                                                <TableCell>-</TableCell>
                                                <TableCell className="font-medium">₹{itemGrandTotal.toLocaleString('en-IN')}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="lg:hidden space-y-4 mb-6">
                        {itemFulfillmentData.lineItems.map((item) => {
                            const itemTotal = calculateItemTotal(item);
                            const itemTax = (itemTotal * item.gstRate) / 100;
                            const itemCGST = itemTax / 2;
                            const itemSGST = itemTax / 2;
                            const itemGrandTotal = itemTotal + itemTax;

                            return (
                                <Card key={item.id}>
                                    <CardContent className="p-4 space-y-4 text-sm">
                                        <div>
                                            <h3 className="font-semibold">{item.productName}</h3>
                                            <p className="text-xs text-muted-foreground">HSNCode: {item.hsn}</p>
                                            {item.description && (
                                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">UOM</p>
                                                <p>{item.uom}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Quantity</p>
                                                <p>{item.quantity}</p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">Sell Rate</p>
                                                <p>₹{item.sellRate.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Buy Rate</p>
                                                <p>₹{item.buyRate.toLocaleString('en-IN')}</p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">GST</p>
                                                <p>{item.gstRate}%</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">IGST</p>
                                                <p>-</p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">CGST</p>
                                                <p>₹{itemCGST.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">SGST</p>
                                                <p>₹{itemSGST.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>

                                        <Separator />
                                        <div className="flex justify-between font-semibold">
                                            <span>Total</span>
                                            <span className="text-primary">₹{itemGrandTotal.toLocaleString('en-IN')}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount</span>
                            <span>₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">SGST</span>
                            <span>₹{sgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">CGST</span>
                            <span>₹{cgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">IGST</span>
                            <span>N/A</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax (+)</span>
                            <span>₹{taxAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-primary font-medium">
                            <span></span>
                            <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="pt-2">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Amount Total</span>
                                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-muted-foreground text-xs mt-1 text-right">
                                {numberToWords(grandTotal)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default ItemFulfillmentView;