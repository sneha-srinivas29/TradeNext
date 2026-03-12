// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { DataTableRowActions } from "@/components/Common/DataTableRowActions";
// import {
//   ArrowUp, ArrowDown, ArrowUpDown,
//   ChevronLeft, ChevronRight,
//   RefreshCw, Clock,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { cn } from "@/lib/utils";
// import { SalesOrder } from "./useTableFilters";

// const statusClass = (status: string) => {
//   const s = (status || "").toLowerCase();
//   if (s.includes("approved") && !s.includes("pending"))
//     return "bg-primary/10 text-primary border-primary/20 font-medium";
//   if (s.includes("reject") || s.includes("cancel"))
//     return "bg-destructive/10 text-destructive border-destructive/20 font-medium";
//   return "bg-amber-50 text-amber-600 border-amber-200 font-medium";
// };

// const SortIcon = ({ columnKey, sortConfig }: {
//   columnKey: string;
//   sortConfig?: { key: string; direction: "asc" | "desc" } | null;
// }) => {
//   if (!sortConfig || sortConfig.key !== columnKey)
//     return <ArrowUpDown className="h-3.5 w-3.5 text-white/60" />;
//   return sortConfig.direction === "asc"
//     ? <ArrowUp className="h-3.5 w-3.5 text-white" />
//     : <ArrowDown className="h-3.5 w-3.5 text-white" />;
// };

// export interface SalesOrdersTableProps {
//   orders:           SalesOrder[];
//   currentPage:      number;
//   totalPages:       number;
//   totalCount:       number;
//   pageSize:         number;
//   onPageChange:     (page: number) => void;
//   onPageSizeChange: (size: number) => void;
//   onSort:           (key: string) => void;
//   sortConfig?:      { key: string; direction: "asc" | "desc" } | null;
//   lastUpdated:      Date | null;
//   isRefreshing:     boolean;
//   onRefresh:        () => void;
// }

// export const SalesOrdersTable = ({
//   orders, currentPage, totalPages, totalCount, pageSize,
//   onPageChange, onPageSizeChange, onSort, sortConfig,
//   lastUpdated, isRefreshing, onRefresh,
// }: SalesOrdersTableProps) => {
//   const navigate = useNavigate();

//   const goToView = (order: SalesOrder) =>
//     navigate(`/sales-orders/view/${order.internalId || order.id}`);

//   const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
//   const endEntry   = Math.min(currentPage * pageSize, totalCount);
//   const updatedFmt = lastUpdated
//     ? lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
//     : null;

//   return (
//     <div className="space-y-0">

//       {/* ── Desktop Table ─────────────────────────────────────────────── */}
//       <Card className="rounded-xl rounded-b-none border-b-0 shadow-sm p-0 hidden sm:block overflow-hidden">
//         <table className="w-full table-fixed text-sm">
//           <thead>
//             <tr className="bg-primary">
//               <th className="w-[11%] px-3 py-3 text-left font-semibold text-white cursor-pointer"
//                   onClick={() => onSort("id")}>
//                 <div className="flex items-center gap-1">SO No <SortIcon columnKey="id" sortConfig={sortConfig} /></div>
//               </th>
//               <th className="w-[21%] px-3 py-3 text-left font-semibold text-white">Customer</th>
//               <th className="w-[19%] px-3 py-3 text-left font-semibold text-white">Vendor</th>
//               <th className="w-[13%] px-3 py-3 text-left font-semibold text-white cursor-pointer"
//                   onClick={() => onSort("amount")}>
//                 <div className="flex items-center gap-1">Amount <SortIcon columnKey="amount" sortConfig={sortConfig} /></div>
//               </th>
//               <th className="w-[17%] px-3 py-3 text-left font-semibold text-white cursor-pointer"
//                   onClick={() => onSort("dateCreated")}>
//                 <div className="flex items-center gap-1">Date <SortIcon columnKey="dateCreated" sortConfig={sortConfig} /></div>
//               </th>
//               <th className="w-[13%] px-3 py-3 text-left font-semibold text-white">Status</th>
//               <th className="w-[6%]  px-3 py-3 text-left font-semibold text-white">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-100">
//             {orders.length === 0 ? (
//               <tr>
//                 <td colSpan={7} className="h-24 text-center text-muted-foreground">
//                   No sales orders found.
//                 </td>
//               </tr>
//             ) : (
//               orders.map((order) => (
//                 <tr key={order.internalId || order.id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-3 py-4 font-medium text-primary underline underline-offset-2 cursor-pointer truncate"
//                       onClick={() => goToView(order)}>
//                     {order.id}
//                   </td>
//                   <td className="px-3 py-4 truncate text-sm" title={order.customer}>{order.customer}</td>
//                   <td className="px-3 py-4 truncate text-sm" title={order.vendor}>{order.vendor}</td>
//                   <td className="px-3 py-4 font-medium text-sm">
//                     ₹{Number(order.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
//                   </td>
//                   <td className="px-3 py-4 text-sm text-muted-foreground truncate">{order.dateCreated}</td>
//                   <td className="px-3 py-4">
//                     <Badge variant="secondary"
//                            className={cn(statusClass(order.status), "truncate max-w-full block text-center text-xs")}>
//                       {order.status}
//                     </Badge>
//                   </td>
//                   <td className="px-3 py-4">
//                     <DataTableRowActions
//                       onView={() => goToView(order)}
//                       onItemFulfillment={() => navigate(`/item-fulfillments/listing/${order.internalId}`)}
//                       onEdit={() => console.log("Edit", order.id)}
//                       onCopy={() => navigator.clipboard.writeText(order.id)}
//                       onDelete={() => console.log("Delete", order.id)}
//                     />
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </Card>

//       {/* ── Mobile Cards ──────────────────────────────────────────────── */}
//       <div className="sm:hidden space-y-3">
//         {orders.length === 0 ? (
//           <div className="text-center py-16 text-zinc-400 text-sm">No sales orders found.</div>
//         ) : orders.map((order) => (
//           <div key={order.internalId || order.id} onClick={() => goToView(order)}
//                className="cursor-pointer active:scale-[0.985] transition-transform duration-150">
//             <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
//               <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-primary/10">
//                 <div className="flex items-center gap-2">
//                   <div className="w-1.5 h-5 rounded-full bg-primary" />
//                   <span className="text-[15px] font-bold text-black">{order.id}</span>
//                 </div>
//                 <Badge variant="secondary"
//                        className={cn(statusClass(order.status), "text-[11px] px-2.5 py-0.5 rounded-full font-semibold border")}>
//                   {order.status}
//                 </Badge>
//               </div>
//               <div className="px-4 py-3 space-y-3">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="min-w-0">
//                     <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Customer</p>
//                     <p className="text-[13px] font-semibold text-black truncate">{order.customer || "—"}</p>
//                   </div>
//                   <div className="min-w-0">
//                     <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Vendor</p>
//                     <p className="text-[13px] font-semibold text-black truncate">{order.vendor || "—"}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-end justify-between pt-2.5 border-t border-gray-200">
//                   <div>
//                     <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Amount</p>
//                     <p className="text-[20px] font-black text-black leading-none">
//                       ₹{Number(order.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
//                     </p>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Date</p>
//                     <p className="text-[12px] font-semibold text-black">{order.dateCreated || "—"}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* ── Bottom bar ────────────────────────────────────────────────── */}
//       <div className="flex items-center justify-between gap-2 px-4 py-2.5
//                       bg-white border border-gray-200 rounded-b-xl shadow-sm
//                       flex-wrap sm:flex-nowrap">

//         {/* Left: Showing + Updated */}
//         <div className="flex items-center gap-3 shrink-0 flex-wrap">
//           <p className="text-sm text-muted-foreground whitespace-nowrap">
//             Showing <strong>{startEntry}–{endEntry}</strong> of <strong>{totalCount}</strong> orders
//           </p>
//           {updatedFmt && (
//             <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground
//                             bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
//               <Clock className="w-3 h-3 shrink-0" />
//               Updated: <strong className="ml-0.5">{updatedFmt}</strong>
//             </div>
//           )}
//         </div>

//         {/* Right: Show · Refresh · Pages */}
//         <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">

//           {/* Show entries selector */}
//           <div className="flex items-center gap-1 mr-1">
//             <span className="text-xs text-muted-foreground hidden sm:inline">Show</span>
//             <Select value={String(pageSize)}
//                     onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1); }}>
//               <SelectTrigger className="h-8 w-[60px] text-xs">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="10">10</SelectItem>
//                 <SelectItem value="25">25</SelectItem>
//                 <SelectItem value="50">50</SelectItem>
//                 <SelectItem value="100">100</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Refresh */}
//           <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}
//                   className="h-8 gap-1.5 text-xs px-2.5 mr-2">
//             <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
//             <span className="hidden sm:inline">{isRefreshing ? "Refreshing…" : "Refresh"}</span>
//           </Button>

//           {/* Pagination */}
//           <Button variant="outline" size="sm" className="h-8 w-8 p-0"
//                   onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
//             <ChevronLeft className="h-4 w-4" />
//           </Button>

//           {Array.from({ length: totalPages }, (_, i) => i + 1)
//             .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
//             .reduce<(number | "...")[]>((acc, p, idx, arr) => {
//               if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
//               acc.push(p);
//               return acc;
//             }, [])
//             .map((p, i) =>
//               p === "..." ? (
//                 <span key={`e-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
//               ) : (
//                 <Button key={p} size="sm" className="h-8 w-8 p-0 text-xs"
//                         variant={currentPage === p ? "default" : "outline"}
//                         onClick={() => onPageChange(p as number)}>
//                   {p}
//                 </Button>
//               )
//             )}

//           <Button variant="outline" size="sm" className="h-8 w-8 p-0"
//                   onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
//             <ChevronRight className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableRowActions } from "@/components/Common/DataTableRowActions";
import {
  ArrowUp, ArrowDown, ArrowUpDown,
  ChevronLeft, ChevronRight,
  RefreshCw, Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SalesOrder } from "./useTableFilters";

const statusClass = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s.includes("approved") && !s.includes("pending"))
    return "bg-primary/10 text-primary border-primary/20 font-medium";
  if (s.includes("reject") || s.includes("cancel"))
    return "bg-destructive/10 text-destructive border-destructive/20 font-medium";
  return "bg-amber-50 text-amber-600 border-amber-200 font-medium";
};

const SortIcon = ({ columnKey, sortConfig }: {
  columnKey: string;
  sortConfig?: { key: string; direction: "asc" | "desc" } | null;
}) => {
  if (!sortConfig || sortConfig.key !== columnKey)
    return <ArrowUpDown className="h-3.5 w-3.5 text-white/60" />;
  return sortConfig.direction === "asc"
    ? <ArrowUp className="h-3.5 w-3.5 text-white" />
    : <ArrowDown className="h-3.5 w-3.5 text-white" />;
};

export interface SalesOrdersTableProps {
  orders:           SalesOrder[];
  currentPage:      number;
  totalPages:       number;
  totalCount:       number;
  pageSize:         number;
  onPageChange:     (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSort:           (key: string) => void;
  sortConfig?:      { key: string; direction: "asc" | "desc" } | null;
  lastUpdated:      Date | null;
  isRefreshing:     boolean;
  onRefresh:        () => void;
}

export const SalesOrdersTable = ({
  orders, currentPage, totalPages, totalCount, pageSize,
  onPageChange, onPageSizeChange, onSort, sortConfig,
  lastUpdated, isRefreshing, onRefresh,
}: SalesOrdersTableProps) => {
  const navigate = useNavigate();

  const goToView = (order: SalesOrder) =>
    navigate(`/sales-orders/view/${order.internalId || order.id}`);

  // ── Raise Fulfillment: pre-fill IF form with SO data, lock items ──
  const handleRaiseFulfillment = (order: SalesOrder) => {
    navigate("/item-fulfillments/create", {
      state: {
        fromSalesOrder: true,
        contractId:    (order as any).contractId  ?? "",
        salesOrderNo:  order.id                   ?? "",
        lineItems: ((order as any).lineItems ?? []).map((li: any) => ({
          id:                Date.now() + Math.random(),
          itemId:            li.itemId            ?? li.item        ?? "",
          productName:       li.productName       ?? li.name        ?? "",
          hsn:               li.hsn               ?? "",
          hsnId:             li.hsnId             ?? "",
          uom:               li.uom               ?? "MT",
          uomId:             li.uomId             ?? "",
          uomOptions:        [],
          uomLoading:        false,
          description:       li.description       ?? "",
          quantity:          Number(li.quantity   ?? 0),
          sellRate:          Number(li.sellRate   ?? li.custcol_item_sale_rate  ?? 0),
          buyRate:           Number(li.buyRate    ?? li.custcol_sam_actual_rate ?? 0),
          gstRate:           Number(li.gstRate    ?? 18),
          quantityAvailable: Number(li.quantityAvailable ?? li.quantity ?? 0),
        })),
      },
    });
  };

  const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry   = Math.min(currentPage * pageSize, totalCount);
  const updatedFmt = lastUpdated
    ? lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="space-y-0">

      {/* ── Desktop Table ─────────────────────────────────────────────── */}
      <Card className="rounded-xl rounded-b-none border-b-0 shadow-sm p-0 hidden sm:block overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-primary">
              <th className="w-[11%] px-3 py-3 text-left font-semibold text-white cursor-pointer"
                  onClick={() => onSort("id")}>
                <div className="flex items-center gap-1">SO No <SortIcon columnKey="id" sortConfig={sortConfig} /></div>
              </th>
              <th className="w-[21%] px-3 py-3 text-left font-semibold text-white">Customer</th>
              <th className="w-[19%] px-3 py-3 text-left font-semibold text-white">Vendor</th>
              <th className="w-[13%] px-3 py-3 text-left font-semibold text-white cursor-pointer"
                  onClick={() => onSort("amount")}>
                <div className="flex items-center gap-1">Amount <SortIcon columnKey="amount" sortConfig={sortConfig} /></div>
              </th>
              <th className="w-[17%] px-3 py-3 text-left font-semibold text-white cursor-pointer"
                  onClick={() => onSort("dateCreated")}>
                <div className="flex items-center gap-1">Date <SortIcon columnKey="dateCreated" sortConfig={sortConfig} /></div>
              </th>
              <th className="w-[13%] px-3 py-3 text-left font-semibold text-white">Status</th>
              <th className="w-[6%]  px-3 py-3 text-left font-semibold text-white">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="h-24 text-center text-muted-foreground">
                  No sales orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.internalId || order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-4 font-medium text-primary underline underline-offset-2 cursor-pointer truncate"
                      onClick={() => goToView(order)}>
                    {order.id}
                  </td>
                  <td className="px-3 py-4 truncate text-sm" title={order.customer}>{order.customer}</td>
                  <td className="px-3 py-4 truncate text-sm" title={order.vendor}>{order.vendor}</td>
                  <td className="px-3 py-4 font-medium text-sm">
                    ₹{Number(order.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-4 text-sm text-muted-foreground truncate">{order.dateCreated}</td>
                  <td className="px-3 py-4">
                    <Badge variant="secondary"
                           className={cn(statusClass(order.status), "truncate max-w-full block text-center text-xs")}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-4">
                    <DataTableRowActions
                      onView={() => goToView(order)}
                      onItemFulfillment={() => handleRaiseFulfillment(order)}  
                      onEdit={() => console.log("Edit", order.id)}
                      onCopy={() => navigator.clipboard.writeText(order.id)}
                      onDelete={() => console.log("Delete", order.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* ── Mobile Cards ──────────────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 text-sm">No sales orders found.</div>
        ) : orders.map((order) => (
          <div key={order.internalId || order.id}
               className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            {/* Header row — navigate to view on tap */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-primary/10 cursor-pointer active:bg-primary/10"
                 onClick={() => goToView(order)}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-primary" />
                <span className="text-[15px] font-bold text-black">{order.id}</span>
              </div>
              <Badge variant="secondary"
                     className={cn(statusClass(order.status), "text-[11px] px-2.5 py-0.5 rounded-full font-semibold border")}>
                {order.status}
              </Badge>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-3" onClick={() => goToView(order)}>
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Customer</p>
                  <p className="text-[13px] font-semibold text-black truncate">{order.customer || "—"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Vendor</p>
                  <p className="text-[13px] font-semibold text-black truncate">{order.vendor || "—"}</p>
                </div>
              </div>
              <div className="flex items-end justify-between pt-2.5 border-t border-gray-200">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Amount</p>
                  <p className="text-[20px] font-black text-black leading-none">
                    ₹{Number(order.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Date</p>
                  <p className="text-[12px] font-semibold text-black">{order.dateCreated || "—"}</p>
                </div>
              </div>
            </div>

            {/* Mobile action — Raise Fulfillment button */}
            <div className="px-4 pb-3 pt-1 border-t border-gray-100">
              <button
                onClick={(e) => { e.stopPropagation(); handleRaiseFulfillment(order); }}
                className="w-full text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 active:bg-primary/15 rounded-lg py-2 transition-colors"
              >
                Raise Fulfillment
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5
                      bg-white border border-gray-200 rounded-b-xl shadow-sm
                      flex-wrap sm:flex-nowrap">

        {/* Left: Showing + Updated */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Showing <strong>{startEntry}–{endEntry}</strong> of <strong>{totalCount}</strong> orders
          </p>
          {updatedFmt && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground
                            bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
              <Clock className="w-3 h-3 shrink-0" />
              Updated: <strong className="ml-0.5">{updatedFmt}</strong>
            </div>
          )}
        </div>

        {/* Right: Show · Refresh · Pages */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">

          <div className="flex items-center gap-1 mr-1">
            <span className="text-xs text-muted-foreground hidden sm:inline">Show</span>
            <Select value={String(pageSize)}
                    onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1); }}>
              <SelectTrigger className="h-8 w-[60px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}
                  className="h-8 gap-1.5 text-xs px-2.5 mr-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRefreshing ? "Refreshing…" : "Refresh"}</span>
          </Button>

          <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                  onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
              ) : (
                <Button key={p} size="sm" className="h-8 w-8 p-0 text-xs"
                        variant={currentPage === p ? "default" : "outline"}
                        onClick={() => onPageChange(p as number)}>
                  {p}
                </Button>
              )
            )}

          <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                  onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};