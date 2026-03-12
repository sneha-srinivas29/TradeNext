// import * as React from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft } from "lucide-react";
// import DashboardLayout from "@/components/Common/DashboardLayout";
// import GRNCard from "../../components/GRN/Create/Grncard";
// import { GRNFormData, LineItem } from "../../components/GRN/Create/Grn.types";

// const CreateGRN: React.FC = () => {
//     const navigate = useNavigate();

//    const [formData, setFormData] = React.useState<GRNFormData>({
//   saleInvoiceId: "",
//   salesOrderNo: "",
//   grnRefId: "",
//   grnEntryDate: "",
//   saleInvoiceDate: "",
//   attachment: null,
// });

//     const [lineItems, setLineItems] = React.useState<LineItem[]>([{
//   id: 1,
//   productName: "",
//   hsn: "",
//   uom: "",
//   shippedQty: 0,
//   receivedQty: 0,
//   rate: 0,
//   gst: 18,
//   total: 0,
//   description: "",
// }]);
//     const handleSave = (): void => {
//         const payload = {
//             ...formData,
//             attachment: formData.attachment?.name || null,
//             items: lineItems,
//         };

//         console.log("GRN Payload =>", payload);
        
//         // Pass data to preview page via navigation state
//         navigate("/grn-preview", { 
//             state: { 
//                 grnData: payload 
//             } 
//         });
//     };

//     return (
//         <DashboardLayout>
//             {/* Header */}
//             <div className="mb-6">
//                 <Button 
//                     variant="ghost" 
//                     className="flex items-center gap-2 text-base p-0 h-auto hover:bg-transparent"
//                 >
//                     <ArrowLeft className="h-5 w-5" />
//                     <span className="text-base font-bold">GRN Details</span>
//                 </Button>
//             </div>

//             {/* Main Card Component */}
//             <GRNCard
//                 formData={formData}
//                 setFormData={setFormData}
//                 lineItems={lineItems}
//                 setLineItems={setLineItems}
//                 onSave={handleSave}
//             />
//         </DashboardLayout>
//     );
// };

// export default CreateGRN;