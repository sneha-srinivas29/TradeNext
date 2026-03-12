import { ItemFulfillment, StatusOption } from "./itemfulfillment.type";

export const statusOptions: StatusOption[] = [
  { label: "Order Init", value: "Order Init" },
  { label: "In Progress", value: "In Progress" },
  { label: "Completed", value: "Completed" },
];

export const itemFulfillments: ItemFulfillment[] = [
  { id: "IF001", soId: "SO1391", fulfillmentDate: "12-12-2023", fulfillmentAmount: "₹59,00,000", status: "Completed", salesInvoiceIds: ["IN001"], purchaseBillIds: ["PB001"] },
  { id: "IF002", soId: "SO1391", fulfillmentDate: "13-12-2023", fulfillmentAmount: "₹1,18,00,000", status: "Completed", salesInvoiceIds: ["IN002"], purchaseBillIds: ["PB002"] },
  { id: "IF003", soId: "SO1392", fulfillmentDate: "14-12-2023", fulfillmentAmount: "₹88,50,000", status: "In Progress", salesInvoiceIds: ["IN003"], purchaseBillIds: ["PB003"] },
  { id: "IF004", soId: "SO1393", fulfillmentDate: "15-12-2023", fulfillmentAmount: "₹59,00,000", status: "Completed", salesInvoiceIds: ["IN004"], purchaseBillIds: ["PB004"] },
  { id: "IF005", soId: "SO1393", fulfillmentDate: "16-12-2023", fulfillmentAmount: "₹1,18,00,000", status: "In Progress", salesInvoiceIds: ["IN005"], purchaseBillIds: ["PB005"] },
  { id: "IF006", soId: "SO1393", fulfillmentDate: "17-12-2023", fulfillmentAmount: "₹76,70,000", status: "Order Init", salesInvoiceIds: ["IN006"], purchaseBillIds: ["PB006"] },
  { id: "IF007", soId: "SO1394", fulfillmentDate: "18-12-2023", fulfillmentAmount: "₹94,40,000", status: "Completed", salesInvoiceIds: ["IN007"], purchaseBillIds: ["PB007"] },
  { id: "IF008", soId: "SO1394", fulfillmentDate: "19-12-2023", fulfillmentAmount: "₹2,47,80,000", status: "In Progress", salesInvoiceIds: ["IN008"], purchaseBillIds: ["PB008"] },
  { id: "IF009", soId: "SO1395", fulfillmentDate: "20-12-2023", fulfillmentAmount: "₹2,36,00,000", status: "Completed", salesInvoiceIds: ["IN009"], purchaseBillIds: ["PB009"] },
  { id: "IF010", soId: "SO1397", fulfillmentDate: "21-12-2023", fulfillmentAmount: "₹1,77,00,000", status: "Completed", salesInvoiceIds: ["IN010"], purchaseBillIds: ["PB010"] },
  { id: "IF011", soId: "SO1399", fulfillmentDate: "22-12-2023", fulfillmentAmount: "₹1,12,10,000", status: "In Progress", salesInvoiceIds: ["IN011"], purchaseBillIds: ["PB011"] },
];