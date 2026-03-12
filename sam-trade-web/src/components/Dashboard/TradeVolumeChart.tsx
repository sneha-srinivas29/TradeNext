import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useState } from "react";

const dailyData = [
    { date: "Mon", trades: 12, value: 45 },
    { date: "Tue", trades: 19, value: 67 },
    { date: "Wed", trades: 8, value: 32 },
    { date: "Thu", trades: 25, value: 89 },
    { date: "Fri", trades: 15, value: 54 },
    { date: "Sat", trades: 5, value: 18 },
    { date: "Sun", trades: 3, value: 12 },
];

const weeklyData = [
    { date: "Week 1", trades: 45, value: 180 },
    { date: "Week 2", trades: 62, value: 245 },
    { date: "Week 3", trades: 38, value: 156 },
    { date: "Week 4", trades: 71, value: 298 },
];

const monthlyData = [
    { date: "Jan", trades: 120, value: 450 },
    { date: "Feb", trades: 180, value: 620 },
    { date: "Mar", trades: 95, value: 380 },
    { date: "Apr", trades: 210, value: 780 },
    { date: "May", trades: 165, value: 590 },
    { date: "Jun", trades: 245, value: 890 },
    { date: "Jul", trades: 188, value: 720 },
    { date: "Aug", trades: 275, value: 980 },
    { date: "Sep", trades: 198, value: 750 },
    { date: "Oct", trades: 320, value: 1120 },
    { date: "Nov", trades: 265, value: 945 },
    { date: "Dec", trades: 290, value: 1050 },
];

type TimeRange = "daily" | "weekly" | "monthly";

const TradeVolumeChart = () => {
    const [timeRange, setTimeRange] = useState<TimeRange>("monthly");
    const [metric, setMetric] = useState<"trades" | "value">("trades");

    const getData = () => {
        switch (timeRange) {
            case "daily":
                return dailyData;
            case "weekly":
                return weeklyData;
            case "monthly":
                return monthlyData;
        }
    };

    const data = getData();

    return (
        <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h3 className="font-semibold text-primary">
                        Trade Volume Over Time
                    </h3>
                    <p className="text-sm text-primary mt-1">
                        {metric === "trades"
                            ? "Number of trades"
                            : "Trade value (₹ Lakhs)"}
                    </p>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-3">
                    {/* Metric */}
                    <div className="flex bg-primary/10 rounded-lg p-1">
                        <button
                            onClick={() => setMetric("trades")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md ${metric === "trades"
                                ? "bg-primary text-primary-foreground"
                                : "text-primary hover:bg-primary/20"
                                }`}
                        >
                            Trades
                        </button>
                        <button
                            onClick={() => setMetric("value")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md ${metric === "value"
                                ? "bg-primary text-primary-foreground"
                                : "text-primary hover:bg-primary/20"
                                }`}
                        >
                            Value
                        </button>
                    </div>

                    {/* Time range */}
                    <div className="flex bg-primary/10 rounded-lg p-1">
                        {(["daily", "weekly", "monthly"] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${timeRange === range
                                    ? "bg-primary text-primary-foreground"
                                    : "text-primary hover:bg-primary/20"
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-2 rounded-lg bg-primary">
                    <p className="text-xs text-white">Peak Period</p>
                    <p className="text-sm font-semibold text-primary-foreground mt-0.5">
                        {timeRange === "monthly"
                            ? "October"
                            : timeRange === "weekly"
                                ? "Week 4"
                                : "Thursday"}
                    </p>
                </div>

                <div className="text-center p-2 rounded-lg bg-primary">
                    <p className="text-xs text-white">
                        Avg {metric === "trades" ? "Trades" : "Value"}
                    </p>
                    <p className="text-sm font-semibold text-primary-foreground mt-0.5">
                        {metric === "trades"
                            ? Math.round(
                                data.reduce((a, b) => a + b.trades, 0) / data.length
                            )
                            : `₹${Math.round(
                                data.reduce((a, b) => a + b.value, 0) / data.length
                            )}L`}
                    </p>
                </div>

                <div className="text-center p-2 rounded-lg bg-primary">
                    <p className="text-xs text-white">Trend</p>
                    <p className="text-sm font-semibold text-primary-foreground mt-0.5">
                        ↑ Growing
                    </p>
                </div>
            </div>

            {/* Area Chart */}
            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: "hsl(var(--primary))", fontSize: 12 }} />
                        <YAxis tick={{ fill: "hsl(var(--primary))", fontSize: 12 }} />
                        <Tooltip />

                        <Area
                            type="monotone"
                            dataKey={metric}
                            stroke="Gold"
                            strokeWidth={2}
                            fill="rgba(255, 215, 0, 0.3)"
                            dot={{ fill: "Gold", r: 4, strokeWidth: 0 }}
                            activeDot={{ r: 6, stroke: "white", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TradeVolumeChart;
