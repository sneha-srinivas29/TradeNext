import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/Common/DashboardLayout";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type LineItem } from "@/components/Common/LineItemsTable";
import { type Address } from "@/components/SalesOrder/Creation/SearchableAddressSelect";
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

interface PurchaseOrderData {
  contract: string;
  contractClass: string;
  salesOrderId: string;
  salesOrderDate: string;
  relationshipManager: string;
  memo: string;
  salesOrderFile: File | null;
  billing: Address;
  shipping: Address;
  vendor: Address;
  delivery: Address;
  lineItems: LineItem[];
  purchaseOrderNo: string;
  purchaseOrderDate: string;
  status?: string;
}

const PurchaseOrderView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const stateData = location.state?.purchaseOrderData as PurchaseOrderData | undefined;

  const [purchaseOrderData, setPurchaseOrderData] = useState<PurchaseOrderData | null>(stateData || null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Purchase Order data if not in state (coming from listing or SO view)
  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      if (stateData) {
        // Data already available from state
        setPurchaseOrderData(stateData);
        return;
      }

      if (!id) {
        navigate("/purchase-orders/listing");
        return;
      }

      setIsLoading(true);

      try {
        // API call to fetch PO by ID
        const response = await fetch(`/api/purchase-orders/${id}`);
        
        if (!response.ok) {
          throw new Error("Purchase order not found");
        }

        const data: PurchaseOrderData = await response.json();
        setPurchaseOrderData(data);
      } catch (error) {
        console.error("Error fetching purchase order:", error);
        navigate("/purchase-orders/listing");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseOrder();
  }, [id, stateData, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout userName="Sneha">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading purchase order...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error if no data
  if (!purchaseOrderData) {
    return null;
  }

  const calculateItemTotal = (item: LineItem) => {
    return item.quantity * item.buyRate;
  };

  const subtotal = purchaseOrderData.lineItems.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );

  const taxAmount = purchaseOrderData.lineItems.reduce((sum, item) => {
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

  return (
    <DashboardLayout userName="Sneha">
      {/* Breadcrumb & Back Button */}
      <div className="flex flex-col mb-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
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
              <Link to="/purchase-orders/listing" className="text-primary hover:underline">
                Purchase Orders
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </li>

            <li className="flex items-center gap-1">
              <span className="text-foreground font-medium">View</span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Order Card */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl font-bold">Purchase Order</h1>
                <Badge className="status-badge status-approved">
                  {purchaseOrderData.status || "Under Approval"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex gap-8">
                  <span className="text-muted-foreground w-32">Purchase Order No.</span>
                  <span className="font-medium">{purchaseOrderData.purchaseOrderNo}</span>
                </div>

                {purchaseOrderData.contract && (
                  <div className="flex gap-8">
                    <span className="text-muted-foreground w-32">Contract ID</span>
                    <span>{purchaseOrderData.contract}</span>
                  </div>
                )}

                {purchaseOrderData.salesOrderId && (
                  <div className="flex gap-8">
                    <span className="text-muted-foreground w-32">Sales Order ID</span>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal text-primary underline"
                      onClick={() => navigate(`/sales-orders/view/${purchaseOrderData.salesOrderId}`)}
                    >
                      {purchaseOrderData.salesOrderId}
                    </Button>
                  </div>
                )}

                {purchaseOrderData.salesOrderFile && (
                  <div className="flex gap-8">
                    <span className="text-muted-foreground w-32">Sales Order</span>
                    <a href="#" className="text-primary underline">
                      {purchaseOrderData.salesOrderFile.name}
                    </a>
                  </div>
                )}

                {purchaseOrderData.salesOrderDate && (
                  <div className="flex flex-col sm:flex-row sm:gap-8">
                    <span className="text-muted-foreground sm:w-32">Purchase Order Date</span>
                    <span className="text-primary">
                      {new Date(purchaseOrderData.salesOrderDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {purchaseOrderData.relationshipManager && (
                  <div className="flex flex-col sm:flex-row sm:gap-8">
                    <span className="text-muted-foreground sm:w-32">Relationship Manager</span>
                    <span className="text-primary">{purchaseOrderData.relationshipManager}</span>
                  </div>
                )}

                {purchaseOrderData.memo && (
                  <div className="flex gap-8">
                    <span className="text-muted-foreground w-32">Memo</span>
                    <span className="text-primary">{purchaseOrderData.memo}</span>
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

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-primary font-medium mb-3">Bill To</h4>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{purchaseOrderData.billing.name}</p>
                <p className="text-muted-foreground">{purchaseOrderData.billing.street}</p>
                <p className="text-muted-foreground">{purchaseOrderData.billing.city}</p>
                <p className="text-muted-foreground">{purchaseOrderData.billing.country}</p>
                <div className="flex gap-8 mt-3">
                  <span className="text-muted-foreground">Email</span>
                  <span>samunnati@company.com</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{purchaseOrderData.billing.phone}</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-muted-foreground">GSTIN/UIN</span>
                  <span>36AAEC11555P1Z6</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-primary font-medium mb-3">Ship To</h4>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{purchaseOrderData.shipping.name}</p>
                <p className="text-muted-foreground">{purchaseOrderData.shipping.street}</p>
                <p className="text-muted-foreground">{purchaseOrderData.shipping.city}</p>
                <p className="text-muted-foreground">{purchaseOrderData.shipping.country}</p>
                <div className="flex gap-8 mt-3">
                  <span className="text-muted-foreground">State Code</span>
                  <span>36</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{purchaseOrderData.shipping.phone}</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-muted-foreground">GSTIN/UIN</span>
                  <span>36AAEC11555P1Z6</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor */}
          <div className="bg-muted/30 rounded-lg p-4 mb-8">
            <h4 className="text-primary font-medium mb-3">Vendor</h4>
            <div className="text-sm space-y-1">
              <p className="font-semibold">{purchaseOrderData.vendor.name}</p>
              <p className="text-muted-foreground">{purchaseOrderData.vendor.street}</p>
              <p className="text-muted-foreground">{purchaseOrderData.vendor.city}</p>
              <p className="text-muted-foreground">{purchaseOrderData.vendor.country}</p>
              <div className="flex gap-8 mt-3">
                <span className="text-muted-foreground">Email</span>
                <span>vendor@supplier.com</span>
              </div>
              <div className="flex gap-8">
                <span className="text-muted-foreground">Phone</span>
                <span>{purchaseOrderData.vendor.phone}</span>
              </div>
              <div className="flex gap-8">
                <span className="text-muted-foreground">GSTIN/UIN</span>
                <span>36AAEC11555P1Z6</span>
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
                    <TableHead className="text-left text-white font-medium">Buy Rate</TableHead>
                    <TableHead className="text-left text-white font-medium">Sell Rate</TableHead>
                    <TableHead className="text-left text-white font-medium">GST Rate</TableHead>
                    <TableHead className="text-left text-white font-medium">CGST</TableHead>
                    <TableHead className="text-left text-white font-medium">SGST</TableHead>
                    <TableHead className="text-left text-white font-medium">IGST</TableHead>
                    <TableHead className="text-left text-white font-medium">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrderData.lineItems.map((item) => {
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
                        <TableCell>₹{item.buyRate.toLocaleString('en-IN')}</TableCell>
                        <TableCell>₹{item.sellRate.toLocaleString('en-IN')}</TableCell>
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
            {purchaseOrderData.lineItems.map((item) => {
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
                        <p className="text-xs text-muted-foreground">Buy Rate</p>
                        <p>₹{item.buyRate.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sell Rate</p>
                        <p>₹{item.sellRate.toLocaleString('en-IN')}</p>
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

export default PurchaseOrderView;