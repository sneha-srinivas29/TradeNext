

import { Trash2, Plus, AlertCircle } from "lucide-react";
import axios from "axios";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

/* ── Types ─────────────────────────────────────────────────────── */

export interface LineItem {
  id: number;
  productName: string;
  itemId: string;
  item_unique_id: string;
  hsn: string;
  hsnId: string;
  uom: string;
  uomId: string;
  uomOptions: { id: string; name: string; unitType: string; isBase: boolean }[];
  uomLoading: boolean;
  quantity: number;
  sellRate: number;
  buyRate: number;
  gstRate: number;
  description: string;
  quantityAvailable?: number;
}

interface LineItemsTableProps {
  lineItems: LineItem[];
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  onAddItem: () => void;
  items?: any[];
  itemsLoading?: boolean;
  /** Call this from parent's Save handler — returns true if valid */
  onValidate?: () => boolean;
}

const FIXED_GST = 18;

/* ── UOM API ───────────────────────────────────────────────────── */
const fetchUomOptions = async (itemId: string) => {
  try {
    const res = await axios.get("/api/proxy/trade/v1/get-uom", {
      params: { itemid: itemId },
    });
    const raw: any[] = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data) ? res.data.data : [];

    return raw
      .map((u: any) => ({
        id: String(u.unitID || u.UOM_internal_id || u.uom_internal_id || u.internalId || u.id || ""),
        name: String(u.unitname || u.UOM_name || u.uom_name || u.uomName || u.name || ""),
        isBase: Boolean(u.isbaseunit || u.is_base_unit || u.isBase || u.isBaseUnit || false),
        unitType: String(u.unittype || u.unit_type || u.unitType || ""),
      }))
      .filter((u) => u.id && u.name);
  } catch (err) {
    console.error("UOM API error:", err);
    return [];
  }
};

const resolveDefaultUnit = (opts: { id: string; name: string; unitType: string; isBase: boolean }[]) => {
  const baseUnits = opts.filter((u) => u.isBase);
  if (!baseUnits.length) return opts[0] ?? null;
  return baseUnits.find((u) => u.unitType?.toLowerCase() === "weight") ?? baseUnits[0];
};

const parseHsnDisplay = (raw: string): string =>
  String(raw || "").trim().match(/^\d+/)?.[0] ?? "";

/* ── Spinner ───────────────────────────────────────────────────── */
const Spinner = () => (
  <svg className="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

/* ── Validation helpers ─────────────────────────────────────────── */
interface ItemErrors {
  productName?: string;
  description?: string;
  quantity?: string;
  sellRate?: string;
  buyRate?: string;
}

const validateItem = (item: LineItem): ItemErrors => {
  const errors: ItemErrors = {};
  if (!item.productName) errors.productName = "Item is required";
  if (!item.description.trim()) errors.description = "Description is required";
  if (!item.quantity || item.quantity <= 0) errors.quantity = "Qty must be > 0";
  if (!item.sellRate || item.sellRate <= 0) errors.sellRate = "Required";
  if (!item.buyRate || item.buyRate <= 0) errors.buyRate = "Required";
  if (item.buyRate > 0 && item.sellRate > 0 && item.buyRate >= item.sellRate)
    errors.buyRate = "Buy rate must be less than sell rate";
  return errors;
};

/* ── UomCell ───────────────────────────────────────────────────── */
const UomCell = ({
  item,
  onUomChange,
}: {
  item: LineItem;
  onUomChange: (id: string, name: string) => void;
}) => {
  if (item.uomLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[100px]">
        <Spinner /> Loading…
      </div>
    );
  }

  const baseUnits = (item.uomOptions ?? []).filter((u) => u.isBase);

  if (!baseUnits.length) {
    return <div className="text-sm text-muted-foreground min-w-[80px]">{item.uom || "—"}</div>;
  }

  if (baseUnits.length === 1) {
    return <div className="text-sm font-medium min-w-[80px] whitespace-nowrap">{baseUnits[0].name}</div>;
  }

  return (
    <select
      value={item.uomId}
      onChange={(e) => {
        const selected = baseUnits.find((u) => u.id === e.target.value);
        if (selected) onUomChange(selected.id, selected.name);
      }}
      className="h-9 w-full min-w-[120px] px-2 border rounded-md text-sm bg-background outline-none focus:ring-1 focus:ring-ring"
    >
      {baseUnits.map((u) => (
        <option key={u.id} value={u.id}>{u.name}</option>
      ))}
    </select>
  );
};

/* ── NumInput with validation ───────────────────────────────────── */
const NumInput = ({
  value,
  onChange,
  max,
  error,
  placeholder = "0",
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  error?: string;
  placeholder?: string;
}) => (
  <div className="space-y-0.5 min-w-[90px]">
    <Input
      type="number"
      min={0}
      max={max}
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      className={`h-9 text-sm text-right w-full ${error ? "border-red-500 focus-visible:ring-red-400" : ""}`}
    />
    {error ? (
      <p className="text-xs text-red-500 flex items-center gap-0.5">
        <AlertCircle className="h-3 w-3 flex-shrink-0" />{error}
      </p>
    ) : max !== undefined && max > 0 ? (
      <p className="text-xs text-muted-foreground text-right">max {max.toLocaleString("en-IN")}</p>
    ) : null}
  </div>
);

/* ── Main Component ─────────────────────────────────────────────── */
const LineItemsTable = ({
  lineItems,
  setLineItems,
  onAddItem,
  items: catalogItems = [],
  itemsLoading: propLoading = false,
}: LineItemsTableProps) => {

  // Track which items have been "touched" (attempted save)
  const [showErrors, setShowErrors] = React.useState(false);

  /* expose validate via ref if needed — parent can trigger by calling save */
  const validate = () => {
    setShowErrors(true);
    return lineItems.every((item) => Object.keys(validateItem(item)).length === 0);
  };

  const handleProductChange = async (index: number, selectedName: string) => {
    const found = catalogItems.find(
      (it: any) => String(it.itemname || it.ItemName || it.name || "") === selectedName
    );

    if (!found) {
      setLineItems((prev) => prev.map((li, i) => i !== index ? li : { ...li, productName: selectedName }));
      return;
    }

    const itemId = String(found.itemid || found.id || "");
    const hsn = parseHsnDisplay(String(found.hsncode || found.hsn || ""));
    const hsnId = String(found.hsncodeid || "");
    const quantityAvailable = Number(found.quantityavailable ?? 0);

    setLineItems((prev) =>
      prev.map((li, i) =>
        i !== index ? li : {
          ...li,
          productName: selectedName,
          itemId,
          hsn,
          hsnId,
          uom: "",
          uomId: "",
          uomOptions: [] as { id: string; name: string; unitType: string; isBase: boolean }[],
          uomLoading: true,
          gstRate: FIXED_GST,
          quantityAvailable,
        }
      )
    );

    if (itemId) {
      const opts = await fetchUomOptions(itemId);
      const best = resolveDefaultUnit(opts);
      setLineItems((prev) =>
        prev.map((li, i) =>
          i !== index ? li : {
            ...li,
            uomOptions: opts,
            uom: best?.name || "",
            uomId: best?.id || "",
            uomLoading: false,
          }
        )
      );
    } else {
      setLineItems((prev) =>
        prev.map((li, i) => i !== index ? li : { ...li, uomLoading: false })
      );
    }
  };

  const handleUomChange = (index: number, id: string, name: string) => {
    setLineItems((prev) =>
      prev.map((li, i) => i !== index ? li : { ...li, uomId: id, uom: name })
    );
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((li, i) => {
        if (i !== index) return li;
        const isNum = ["quantity", "sellRate", "buyRate", "gstRate"].includes(field as string);
        return { ...li, [field]: isNum ? Math.max(0, Number(value) || 0) : value };
      })
    );
  };

  const removeLineItem = (id: number) => {
    if (lineItems.length > 1) setLineItems((p) => p.filter((li) => li.id !== id));
  };

  const calcAmount = (item: LineItem) => item.quantity * item.sellRate;
  const totalAmount = lineItems.reduce((s, i) => s + calcAmount(i), 0);

  const renderProductOptions = () => {
    if (propLoading) return <option disabled>Loading items...</option>;
    if (!catalogItems.length) return <option disabled>No items available</option>;
    return catalogItems.map((it: any, idx: number) => {
      const name = String(it.itemname || it.ItemName || it.name || "");
      const id = String(it.itemid || it.id || idx + 1);
      return <option key={id} value={name}>{name}</option>;
    });
  };

  // ── render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Order Information</h3>
        <Button variant="outline" size="sm" onClick={onAddItem}>
          <Plus className="h-4 w-4 mr-1" /> New Item
        </Button>
      </div>

      {/* ── DESKTOP TABLE ──────────────────────────────────────── */}
      <div className="hidden md:block">
        <ScrollArea className="w-full rounded-xl border border-gray-200">
          <table className="w-full border-collapse" style={{ minWidth: "1000px" }}>
            <thead>
              <tr className="bg-primary">
                {[
                  { label: "#", w: "48px" },
                  { label: "Item", w: "180px" },
                  { label: "Description", w: "160px" },
                  { label: "HSN", w: "110px" },
                  { label: "UOM", w: "120px" },
                  { label: "Qty", w: "110px" },
                  { label: "Sell Rate", w: "120px" },
                  { label: "Buy Rate", w: "120px" },
                  { label: "GST %", w: "70px" },
                  { label: "Amount", w: "130px" },
                  { label: "", w: "48px" },
                ].map(({ label, w }) => (
                  <th
                    key={label}
                    style={{ width: w, minWidth: w }}
                    className="text-left text-white text-sm font-semibold px-3 py-3 whitespace-nowrap"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => {
                const errors = showErrors ? validateItem(item) : {};
                const amount = calcAmount(item);

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    {/* # */}
                    <td className="px-3 py-3 text-sm text-gray-500 align-top pt-4">{index + 1}</td>

                    {/* Item */}
                    <td className="px-3 py-3 align-top">
                      <select
                        value={item.productName}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        disabled={propLoading}
                        className={`h-9 w-full px-2 border rounded-md text-sm outline-none focus:border-primary bg-background
                          ${errors.productName ? "border-red-500" : "border-gray-300"}`}
                      >
                        <option value="">{propLoading ? "Loading..." : "Select item"}</option>
                        {renderProductOptions()}
                      </select>
                      {errors.productName && (
                        <p className="text-xs text-red-500 mt-0.5 flex items-center gap-0.5">
                          <AlertCircle className="h-3 w-3" />{errors.productName}
                        </p>
                      )}
                    </td>

                    {/* Description */}
                    <td className="px-3 py-3 align-top">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Enter description"
                        className={`h-9 text-sm w-full ${errors.description ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                      />
                      {errors.description && (
                        <p className="text-xs text-red-500 mt-0.5 flex items-center gap-0.5">
                          <AlertCircle className="h-3 w-3" />{errors.description}
                        </p>
                      )}
                    </td>

                    {/* HSN */}
                    <td className="px-3 py-3 align-top pt-4">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {item.hsn || "—"}
                      </span>
                    </td>

                    {/* UOM */}
                    <td className="px-3 py-3 align-top pt-4">
                      <UomCell item={item} onUomChange={(id, name) => handleUomChange(index, id, name)} />
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-3 align-top">
                      <NumInput
                        value={item.quantity}
                        onChange={(v) => updateItem(index, "quantity", v)}
                        max={item.quantityAvailable}
                        error={errors.quantity}
                      />
                    </td>

                    {/* Sell Rate */}
                    <td className="px-3 py-3 align-top">
                      <NumInput
                        value={item.sellRate}
                        onChange={(v) => updateItem(index, "sellRate", v)}
                        error={errors.sellRate}
                        placeholder="₹ 0"
                      />
                    </td>

                    {/* Buy Rate */}
                    <td className="px-3 py-3 align-top">
                      <NumInput
                        value={item.buyRate}
                        onChange={(v) => updateItem(index, "buyRate", v)}
                        error={errors.buyRate}
                        placeholder="₹ 0"
                      />
                      {/* Hint when no error yet */}
                      {!errors.buyRate && item.sellRate > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          &lt; ₹{item.sellRate.toLocaleString("en-IN")}
                        </p>
                      )}
                    </td>

                    {/* GST % */}
                    <td className="px-3 py-3 align-top pt-4">
                      <span className="text-sm font-medium text-gray-700">18%</span>
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-3 align-top pt-3 text-right">
                      <p className="text-sm font-bold text-gray-900">
                        ₹{amount.toLocaleString("en-IN")}
                      </p>
                      {item.uom && item.sellRate > 0 && (
                        <p className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                          {item.quantity} {item.uom} × ₹{item.sellRate.toLocaleString("en-IN")}
                        </p>
                      )}
                    </td>

                    {/* Delete */}
                    <td className="px-2 py-3 align-top pt-3">
                      <button
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                        className="h-8 w-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={9} className="px-3 py-3 text-right text-sm font-bold text-gray-800">
                  Total Amount
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="text-base font-bold text-gray-900">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </td>
                <td />
              </tr>
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* ── MOBILE CARDS ───────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {lineItems.map((item, index) => {
          const errors = showErrors ? validateItem(item) : {};
          return (
            <div key={item.id} className="border border-gray-200 rounded-xl p-3 space-y-3 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800">Item {index + 1}</span>
                <button
                  onClick={() => removeLineItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="h-8 w-8 flex items-center justify-center rounded-md text-red-400 hover:bg-red-50 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {/* Item */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Item Name {errors.productName && <span className="text-red-500">*</span>}
                  </Label>
                  <select
                    value={item.productName}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    disabled={propLoading}
                    className={`h-9 w-full px-2 border rounded-lg text-sm outline-none bg-white
                      ${errors.productName ? "border-red-400" : "border-gray-300"}`}
                  >
                    <option value="">{propLoading ? "Loading..." : "Select Product"}</option>
                    {renderProductOptions()}
                  </select>
                  {errors.productName && <p className="text-xs text-red-500 mt-0.5">{errors.productName}</p>}
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Description {errors.description && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="Description"
                    className={`h-9 text-sm ${errors.description ? "border-red-400" : ""}`}
                  />
                  {errors.description && <p className="text-xs text-red-500 mt-0.5">{errors.description}</p>}
                </div>

                {/* HSN + UOM */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">HSN</Label>
                    <Input value={item.hsn || ""} readOnly placeholder="HSN"
                      className="h-9 text-sm bg-gray-50 text-gray-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">UOM</Label>
                    <div className="mt-0">
                      <UomCell item={item} onUomChange={(id, name) => handleUomChange(index, id, name)} />
                    </div>
                  </div>
                </div>

                {/* Qty + GST */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Quantity</Label>
                    <Input
                      type="number" min={0}
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(index, "quantity", e.target.value === "" ? 0 : Number(e.target.value))}
                      className={`h-9 text-sm ${errors.quantity ? "border-red-400" : ""}`}
                    />
                    {errors.quantity
                      ? <p className="text-xs text-red-500 mt-0.5">{errors.quantity}</p>
                      : item.quantityAvailable && item.quantityAvailable > 0
                        ? <p className="text-xs text-gray-400">max {item.quantityAvailable.toLocaleString("en-IN")}</p>
                        : null}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">GST Rate (%)</Label>
                    <div className="h-9 flex items-center text-sm font-medium text-gray-700">18%</div>
                  </div>
                </div>

                {/* Sell + Buy Rate */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Sell Rate (₹)</Label>
                    <Input
                      type="number" min={0}
                      value={item.sellRate || ""}
                      placeholder="₹ 0"
                      onChange={(e) => updateItem(index, "sellRate", e.target.value === "" ? 0 : Number(e.target.value))}
                      className={`h-9 text-sm ${errors.sellRate ? "border-red-400" : ""}`}
                    />
                    {errors.sellRate && <p className="text-xs text-red-500 mt-0.5">{errors.sellRate}</p>}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Buy Rate (₹)</Label>
                    <Input
                      type="number" min={0}
                      value={item.buyRate || ""}
                      placeholder="₹ 0"
                      onChange={(e) => updateItem(index, "buyRate", e.target.value === "" ? 0 : Number(e.target.value))}
                      className={`h-9 text-sm ${errors.buyRate ? "border-red-400" : ""}`}
                    />
                    {errors.buyRate
                      ? <p className="text-xs text-red-500 mt-0.5">{errors.buyRate}</p>
                      : item.sellRate > 0
                        ? <p className="text-xs text-gray-400">&lt; ₹{item.sellRate.toLocaleString("en-IN")}</p>
                        : null}
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Amount</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">₹{calcAmount(item).toLocaleString("en-IN")}</span>
                    {item.uom && item.sellRate > 0 && (
                      <p className="text-xs text-gray-400">
                        {item.quantity} {item.uom} × ₹{item.sellRate.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile total */}
        <div className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-800">Total Amount</span>
            <span className="font-bold text-base text-gray-900">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Expose validate for parent */}
      {/* Parent calls: tableRef.current?.validate() — or pass setShowErrors up */}
    </div>
  );
};

/* ── Re-export validate helper so parent (CreateSalesOrder) can call it ── */
export { validateItem };
export type { ItemErrors };

import React from "react";
export default LineItemsTable;