import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertCircle, MessageCircle, X, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/Common/DashboardLayout";
import { format, isToday, isYesterday } from "date-fns";
import { useNavigate } from "react-router-dom";

// salesOrders mock data to generate notifications
export const salesOrders = [
  { id: "SO1393", customer: "Suguna India", vendor: "Rudra India", amount: "₹5,90,00,000", poId: "Pending", stage: "Approved", invoices: "Pending", bills: "Pending" },
  { id: "SO1394", customer: "Suguna India", vendor: "Tesla India", amount: "₹34,30,00,000", poId: "Pending", stage: "pending", invoices: "Pending", bills: "Pending" },
  { id: "SO1216", customer: "Suguna India", vendor: "Sneha Foods", amount: "₹5,00,0000", poId: "Pending", stage: "pending", invoices: "Pending", bills: "Pending" },
  { id: "SO4234", customer: "Suguna India", vendor: "Goyal Enterprise", amount: "₹23,00,0000", poId: "Pending", stage: "Approved", invoices: "Pending", bills: "Pending" },
  { id: "SO3434", customer: "Suguna India", vendor: "Emerald", amount: "₹7,00,0000", poId: "Pending", stage: "Approved", invoices: "Pending", bills: "Pending" },
  { id: "SO7673", customer: "Suguna India", vendor: "Nestle", amount: "₹5,90,00,0000", poId: "Pending", stage: "Approved", invoices: "Pending", bills: "Pending" },
  { id: "SO8124", customer: "Suguna India", vendor: "Shine Agro", amount: "₹2,30,00,0000", poId: "Pending", stage: "pending", invoices: "Pending", bills: "Pending" },
  { id: "SO2323", customer: "Suguna India", vendor: "Parle Biscuit", amount: "₹10,03,00,000", poId: "Pending", stage: "Approved", invoices: "Pending", bills: "Pending" },
];

interface Notification {
  id: number;
  type: "trade" | "alert" | "message";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

// Generate notifications from salesOrders
const generateNotifications = (): Notification[] => {
  let idCounter = 1;
  const notifications: Notification[] = [];

  salesOrders.forEach((order) => {
    // Trade executed notification
    notifications.push({
      id: idCounter++,
      type: "trade",
      title: `Order Executed - ${order.id}`,
      description: `${order.vendor} processed your order of ${order.amount}. Stage: ${order.stage}`,
      timestamp: new Date(Date.now() - Math.random() * 2 * 86400000).toISOString(),
      read: Math.random() > 0.5,
    });

    // Alert for pending PO or invoice
    if (order.poId === "Pending" || order.invoices === "Pending") {
      notifications.push({
        id: idCounter++,
        type: "alert",
        title: `Action Required - ${order.id}`,
        description: `PO: ${order.poId}, Invoice: ${order.invoices} for ${order.vendor}`,
        timestamp: new Date(Date.now() - Math.random() * 2 * 86400000).toISOString(),
        read: Math.random() > 0.5,
      });
    }

    // Optional message
    notifications.push({
      id: idCounter++,
      type: "message",
      title: `Message from ${order.vendor}`,
      description: `Follow-up on your order ${order.id}.`,
      timestamp: new Date(Date.now() - Math.random() * 2 * 86400000).toISOString(),
      read: Math.random() > 0.5,
    });
  });

  return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const typeConfig = {
  trade: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  alert: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  message: {
    icon: MessageCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(generateNotifications());
  const [filter, setFilter] = useState<"all" | "trade" | "alert" | "message">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const removeNotification = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter((n) => n.type === filter);

  const groupedByDate = filteredNotifications.reduce((acc: Record<string, Notification[]>, n) => {
    const key = isToday(new Date(n.timestamp))
      ? "Today"
      : isYesterday(new Date(n.timestamp))
      ? "Yesterday"
      : format(new Date(n.timestamp), "dd MMM yyyy");
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            }
            disabled={unreadCount === 0}
            className="hidden sm:flex"
          >
            Mark all as read
          </Button>
        </div>

        {/* Filter Tabs */}
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className="rounded-full"
              >
                All
                <Badge variant="secondary" className="ml-2 rounded-full">
                  {notifications.length}
                </Badge>
              </Button>
              <Button
                variant={filter === "trade" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("trade")}
                className="rounded-full"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Orders
                <Badge variant="secondary" className="ml-2 rounded-full">
                  {notifications.filter((n) => n.type === "trade").length}
                </Badge>
              </Button>
              <Button
                variant={filter === "alert" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("alert")}
                className="rounded-full"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Alerts
                <Badge variant="secondary" className="ml-2 rounded-full">
                  {notifications.filter((n) => n.type === "alert").length}
                </Badge>
              </Button>
              <Button
                variant={filter === "message" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("message")}
                className="rounded-full"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Messages
                <Badge variant="secondary" className="ml-2 rounded-full">
                  {notifications.filter((n) => n.type === "message").length}
                </Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
              {Object.entries(groupedByDate).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <h3 className="font-semibold text-lg mb-1">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                Object.entries(groupedByDate).map(([date, items]) => (
                  <div key={date} className="border-b last:border-b-0">
                    <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 sm:px-6 py-2 border-b">
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                        {date}
                      </h3>
                    </div>
                    <div className="divide-y divide-border/50">
                      {items.map((n) => {
                        const config = typeConfig[n.type];
                        const Icon = config.icon;
                        
                        return (
                          <div
                            key={n.id}
                            className={`group relative flex items-start gap-3 sm:gap-4 p-4 sm:p-6 cursor-pointer hover:bg-muted/50 transition-all ${
                              !n.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                            }`}
                            onClick={() => toggleRead(n.id)}
                          >
                            {/* Unread indicator */}
                            {!n.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                            )}

                            {/* Icon */}
                            <div className={`flex-shrink-0 p-2 sm:p-2.5 rounded-full border ${config.bgColor} ${config.borderColor} mt-1`}>
                              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${config.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-sm sm:text-base line-clamp-1">
                                  {n.title}
                                </h4>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {!n.read && (
                                    <Badge 
                                      variant="secondary" 
                                      className="h-5 px-2 text-xs bg-primary/10 text-primary border-primary/20"
                                    >
                                      New
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => removeNotification(n.id, e)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {n.description}
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(n.timestamp), "hh:mm a")}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs capitalize"
                                >
                                  {n.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>

            {/* Mobile Mark All as Read */}
            {unreadCount > 0 && (
              <div className="sm:hidden border-t p-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                  }
                >
                  Mark all as read
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}