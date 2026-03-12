import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { parse, isValid, format } from "date-fns";

interface DateRangePickerProps {
  fromDate:    string;
  toDate:      string;
  setFromDate: (v: string) => void;
  setToDate:   (v: string) => void;
}

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const parseFilterDate = (str: string): Date | null => {
  if (!str) return null;
  const d = parse(str, "dd-MM-yyyy", new Date());
  return isValid(d) ? d : null;
};
const toFilterValue  = (d: Date) => format(d, "dd-MM-yyyy");
const toDisplayLabel = (d: Date) => format(d, "dd MMM yyyy");

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function MiniCalendar({
  value, onChange, minDate, maxDate,
}: {
  value:    Date | null;
  onChange: (d: Date) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
}) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(value?.getFullYear()  ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth()     ?? today.getMonth());

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const currentYear = today.getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-[272px] select-none">
      <div className="flex items-center justify-between mb-3 gap-1">
        <button
          onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-lg leading-none shrink-0"
        >‹</button>

        <div className="flex items-center gap-1 flex-1 justify-center">
          <select
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            className="text-sm font-semibold text-gray-800 bg-transparent border-0 outline-none cursor-pointer
                       hover:bg-gray-100 rounded px-1 py-0.5 appearance-none text-center"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>

          <select
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="text-sm font-semibold text-gray-800 bg-transparent border-0 outline-none cursor-pointer
                       hover:bg-gray-100 rounded px-1 py-0.5 appearance-none text-center"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-lg leading-none shrink-0"
        >›</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400 py-0.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const cell       = new Date(viewYear, viewMonth, day);
          const isSelected = value ? sameDay(cell, value) : false;
          const isToday    = sameDay(cell, today);
          const disabled   = (minDate && cell < minDate) || (maxDate && cell > maxDate);

          return (
            <button
              key={idx}
              disabled={!!disabled}
              onClick={() => onChange(cell)}
              className={[
                "mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors",
                isSelected ? "bg-primary text-white font-semibold"
                : isToday  ? "border border-primary text-primary font-semibold hover:bg-primary/10"
                : disabled ? "text-gray-300 cursor-not-allowed"
                :            "text-gray-700 hover:bg-primary/10",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({ fromDate, toDate, setFromDate, setToDate }: DateRangePickerProps) {
  const [open, setOpen] = useState<"from" | "to" | null>(null);
  const ref             = useRef<HTMLDivElement>(null);

  const fromVal = parseFilterDate(fromDate);
  const toVal   = parseFilterDate(toDate);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Clear both dates — no default range
  const clearDates = () => {
    setFromDate("");
    setToDate("");
    setOpen(null);
  };

  const btnCls = (which: "from" | "to") => [
    "flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm transition-all whitespace-nowrap",
    open === which
      ? "border-primary ring-2 ring-primary/20 bg-white text-gray-800"
      : "border-gray-200 bg-white hover:border-primary/50 text-gray-700",
  ].join(" ");

  return (
    <div ref={ref} className="flex items-center gap-1.5 flex-wrap">

      <div className="relative shrink-0">
        <button onClick={() => setOpen(open === "from" ? null : "from")} className={btnCls("from")}>
          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="min-w-[80px] text-left text-sm">
            {fromVal ? toDisplayLabel(fromVal) : "From"}
          </span>
        </button>
        {open === "from" && (
          <div className="absolute top-full mt-1 left-0 z-50">
            <MiniCalendar
              value={fromVal}
              maxDate={toVal}
              onChange={(d) => { setFromDate(toFilterValue(d)); setOpen("to"); }}
            />
          </div>
        )}
      </div>

      <span className="text-xs text-gray-400 shrink-0">→</span>

      <div className="relative shrink-0">
        <button onClick={() => setOpen(open === "to" ? null : "to")} className={btnCls("to")}>
          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="min-w-[80px] text-left text-sm">
            {toVal ? toDisplayLabel(toVal) : "To"}
          </span>
        </button>
        {open === "to" && (
          <div className="absolute top-full mt-1 left-0 z-50">
            <MiniCalendar
              value={toVal}
              minDate={fromVal}
              onChange={(d) => { setToDate(toFilterValue(d)); setOpen(null); }}
            />
          </div>
        )}
      </div>

      {/* Show ✕ only when at least one date is selected */}
      {(fromVal || toVal) && (
        <button
          onClick={clearDates}
          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400
                     hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 text-xs"
          title="Clear date filter"
        >
          ✕
        </button>
      )}
    </div>
  );
}