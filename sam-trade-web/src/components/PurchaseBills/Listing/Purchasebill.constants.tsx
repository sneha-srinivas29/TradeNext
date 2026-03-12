import { PurchaseBill, StatusOption } from "./Purchasebill.types";

export const statusOptions: StatusOption[] = [
  { label: "Order Init", value: "Order Init" },
  { label: "Approved", value: "Approved" },
  { label: "Pending", value: "Pending" },
  { label: "Rejected", value: "Rejected" },
];

export const purchaseBills: PurchaseBill[] = [
  { id: "PB1322", contract: "C130430", ifId: "IF1322", poId: "PO1322", invoice: "IN1322", billAmount: "₹1,00,00,000.00", taxAmount: "₹18,00,000.00", totalBillAmount: "₹1,18,00,000.00", status: "Order Init" },
  { id: "PB1323", contract: "C130431", ifId: "IF1323", poId: "PO1323", invoice: "IN1323", billAmount: "₹2,50,00,000.00", taxAmount: "₹45,00,000.00", totalBillAmount: "₹2,95,00,000.00", status: "Approved" },
  { id: "PB1324", contract: "C130432", ifId: "IF1324", poId: "PO1324", invoice: "IN1324", billAmount: "₹1,75,00,000.00", taxAmount: "₹31,50,000.00", totalBillAmount: "₹2,06,50,000.00", status: "Pending" },
  { id: "PB1325", contract: "C130433", ifId: "IF1325", poId: "PO1325", invoice: "IN1325", billAmount: "₹3,20,00,000.00", taxAmount: "₹57,60,000.00", totalBillAmount: "₹3,77,60,000.00", status: "Rejected" },
  { id: "PB1326", contract: "C130434", ifId: "IF1326", poId: "PO1326", invoice: "IN1326", billAmount: "₹90,00,000.00", taxAmount: "₹16,20,000.00", totalBillAmount: "₹1,06,20,000.00", status: "Approved" },
  { id: "PB1327", contract: "C130435", ifId: "IF1327", poId: "PO1327", invoice: "IN1327", billAmount: "₹4,10,00,000.00", taxAmount: "₹73,80,000.00", totalBillAmount: "₹4,83,80,000.00", status: "Order Init" },
  { id: "PB1328", contract: "C130436", ifId: "IF1328", poId: "PO1328", invoice: "IN1328", billAmount: "₹1,35,00,000.00", taxAmount: "₹24,30,000.00", totalBillAmount: "₹1,59,30,000.00", status: "Pending" },
  { id: "PB1329", contract: "C130437", ifId: "IF1329", poId: "PO1329", invoice: "IN1329", billAmount: "₹2,80,00,000.00", taxAmount: "₹50,40,000.00", totalBillAmount: "₹3,30,40,000.00", status: "Approved" },
  { id: "PB1330", contract: "C130438", ifId: "IF1330", poId: "PO1330", invoice: "IN1330", billAmount: "₹5,50,00,000.00", taxAmount: "₹99,00,000.00", totalBillAmount: "₹6,49,00,000.00", status: "Order Init" },
  { id: "PB1331", contract: "C130439", ifId: "IF1331", poId: "PO1331", invoice: "IN1331", billAmount: "₹1,95,00,000.00", taxAmount: "₹35,10,000.00", totalBillAmount: "₹2,30,10,000.00", status: "Pending" },
];