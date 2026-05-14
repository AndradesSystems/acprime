"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  parseISO,
} from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* =======================
    TYPES
======================= */

export type DateRange = {
  from: string;
  to: string;
};

type DateRangePickerProps = {
  value: DateRange;
  onApply: (range: DateRange) => void;
};

/* =======================
    COMPONENT
======================= */

const DateRangePicker = ({ value, onApply }: DateRangePickerProps) => {
  const [localRange, setLocalRange] = useState<DateRange>(value);

  const label = useMemo(() => {
    return `${format(parseISO(value.from), "dd/MM/yyyy")} - ${format(
      parseISO(value.to),
      "dd/MM/yyyy"
    )}`;
  }, [value]);

  /* =======================
      NAVIGATION LOGIC
  ======================= */

  const navigateMonth = (direction: "prev" | "next") => {
    // Baseamos a navegação na data que está atualmente no estado local
    const baseDate = parseISO(localRange.from);
    const newDate = direction === "prev" 
      ? subMonths(baseDate, 1) 
      : addMonths(baseDate, 1);

    setLocalRange({
      from: format(startOfMonth(newDate), "yyyy-MM-dd"),
      to: format(endOfMonth(newDate), "yyyy-MM-dd"),
    });
  };

  const setCurrentMonth = () => {
    const now = new Date();
    setLocalRange({
      from: format(startOfMonth(now), "yyyy-MM-dd"),
      to: format(endOfMonth(now), "yyyy-MM-dd"),
    });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex flex-col items-end">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Período Selecionado
        </span>
        <strong className="text-sm text-foreground font-mono">{label}</strong>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            className="bg-gradient-gold hover:opacity-90 text-white gap-2 shadow-lg"
          >
            <CalendarIcon className="w-4 h-4 text-black" />
            <span className="md:hidden text-xs text-black">{label}</span>
            <span className="hidden md:inline text-xs text-black">Alterar</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-104 p-4 space-y-4 bg-card border-white/10" align="end">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
             <h3 className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Navegar Período
             </h3>
          </div>

          
          {/* MANUAL INPUTS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Início</label>
              <Input
                type="date"
                className="h-8 text-[11px] bg-white/5 border-white/10 focus:ring-primary"
                value={localRange.from}
                onChange={(e) =>
                  setLocalRange({ ...localRange, from: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Fim</label>
              <Input
                type="date"
                className="h-8 text-[11px] bg-white/5 border-white/10 focus:ring-primary"
                value={localRange.to}
                onChange={(e) =>
                  setLocalRange({ ...localRange, to: e.target.value })
                }
              />
            </div>
          </div>

         {/* QUICK NAVIGATION ARROWS */}
          <div className="flex items-center justify-between gap-1.5">
            <Button
              variant="link"
              className="h-8 flex-1 border-white/10 hover:bg-white/5 hover:border-primary/50 text-[11px] font-bold gap-1 transition-all group"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Anterior
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary hover:bg-transparent"
              onClick={setCurrentMonth}
            >
              Atual
            </Button>

            <Button
              variant="link"
              className="h-8 flex-1 border-white/10 hover:bg-white/5 hover:border-primary/50 text-[11px] font-bold gap-1 transition-all group"
              onClick={() => navigateMonth("next")}
            >
              Próximo
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>


          {/* APPLY ACTION */}
          <Button
            className="w-full bg-gradient-gold text-white font-bold h-9 shadow-md"
            onClick={() => onApply(localRange)}
          >
            Confirmar Período
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;