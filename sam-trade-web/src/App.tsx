
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider } from "@/contexts/Authcontext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import Home                   from "./pages/Home";
import Login                  from "./pages/Login";
import Signup                 from "./pages/Signup";
import Dashboard              from "./pages/Dashboard/Dashboard";
import ContractSelection      from "./pages/ContractSelection";
import SalesOrders            from "./pages/SalesOrder/SalesOrderListing";
import CreateSalesOrder       from "./pages/SalesOrder/CreateSalesOrder";
import SalesOrderView         from "./pages/SalesOrder/SalesOrderView";
import SalesOrderPreview      from "./pages/SalesOrder/SalesOrderPreview";
import PurchaseOrderListing   from "./pages/PurchaseOrder/PurchaseOrderListing";
import PurchaseOrderView      from "./pages/PurchaseOrder/PurchaseOrderView";
import ItemFulfillmentListing from "./pages/ItemFulfillment/ItemFulFillmentListing";
import CreateItemFulfillment  from "./pages/ItemFulfillment/CreateItemFulfillment";
import ItemFulfillmentPreview from "./pages/ItemFulfillment/ItemFulfillmentPreview";
import ItemFulfillmentview    from "./pages/ItemFulfillment/ItemFullfillmentView";
import SalesInvoicesListing   from "./pages/SalesInvoice/SalesInvoiceListing";
import PurchaseBillsListing   from "./pages/PurchaseBills/PurchaseBillsListing";
// import CreateGrn              from "./pages/GoodsRecieveNote/CreateGrn";
import GrnListing             from "./pages/GoodsRecieveNote/GRNListing";
import GRNPreview             from "./pages/GoodsRecieveNote/GRNPreview";
import GRNView                from "./pages/GoodsRecieveNote/GRNView";
import UserProfile            from "./pages/UserProfile";
import Notification           from "./pages/Notification";
import NotFound               from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            5 * 60 * 1000,
      gcTime:               10 * 60 * 1000,
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SidebarProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition:   true,
              v7_relativeSplatPath: true,
            }}
          >
            <AuthProvider>
              <Routes>

                {/* ── PUBLIC ───────────────────────────────────────────────── */}
                <Route path="/"          element={<Home />} />
                <Route path="/login"     element={<Login />} />
                <Route path="/signup"    element={<Signup />} />
                <Route path="/about"     element={<Home />} />
                <Route path="/contact"   element={<Home />} />
                <Route path="/solutions" element={<Home />} />
                <Route path="/impact"    element={<Home />} />
                <Route path="/partners"  element={<Home />} />

                {/* ── PROTECTED ────────────────────────────────────────────── */}
                <Route element={<ProtectedRoute />}>

                  <Route path="/dashboard"          element={<Dashboard />} />
                  <Route path="/contract-selection" element={<ContractSelection />} />

                  {/* ── Sales Orders ─────────────────────────────────────── */}
                  <Route path="/sales-orders/listing" element={<SalesOrders />} />
                  <Route path="/sales-orders/create"  element={<CreateSalesOrder />} />
                  <Route path="/sales-orders/preview" element={<SalesOrderPreview />} />

                  {/*   /view/new MUST be declared before /view/:id
                      React Router v6 matches in order — without this, "new"
                      would be treated as a dynamic :id param */}
                  <Route path="/sales-orders/view/new" element={<SalesOrderView />} />
                  <Route path="/sales-orders/view/:id" element={<SalesOrderView />} />

                  {/*   Catch bare /view (no segment) → redirect instead of 404 */}
                  <Route path="/sales-orders/view" element={<Navigate to="/sales-orders/listing" replace />} />

                  {/* ── Purchase Orders ──────────────────────────────────── */}
                  <Route path="/purchase-orders/listing"  element={<PurchaseOrderListing />} />
                  <Route path="/purchase-orders/view/:id" element={<PurchaseOrderView />} />

                  {/* ── Item Fulfillment ─────────────────────────────────── */}
                  <Route path="/item-fulfillments/listing"       element={<ItemFulfillmentListing />} />
                  <Route path="/item-fulfillments/listing/:soId" element={<ItemFulfillmentListing />} />
                  <Route path="/item-fulfillments/create"        element={<CreateItemFulfillment />} />
                  <Route path="/item-fulfillments/preview"       element={<ItemFulfillmentPreview />} />
                  <Route path="/item-fulfillment/view"           element={<ItemFulfillmentview />} />

                  {/* ── Sales Invoices ───────────────────────────────────── */}
                  <Route path="/sales-invoices" element={<SalesInvoicesListing />} />

                  {/* ── Purchase Bills ───────────────────────────────────── */}
                  <Route path="/purchase-bills/listing" element={<PurchaseBillsListing />} />

                  {/* ── GRN ──────────────────────────────────────────────── */}
                  {/* <Route path="/grn-create"  element={<CreateGrn />} /> */}
                  <Route path="/grn-listing" element={<GrnListing />} />
                  <Route path="/grn-preview" element={<GRNPreview />} />
                  <Route path="/grn-view"    element={<GRNView />} />

                  {/* ── Misc ─────────────────────────────────────────────── */}
                  <Route path="/profile"      element={<UserProfile />} />
                  <Route path="/notification" element={<Notification />} />

                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />

              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;