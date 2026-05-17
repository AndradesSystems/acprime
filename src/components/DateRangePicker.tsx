"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  parseISO,
  setMonth as fnsSetMonth,
  setYear as fnsSetYear,
  getYear,
  getMonth,
} from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, CalendarDays, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
    CONSTANTS
======================= */

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

/* =======================
    COMPONENT
======================= */

const DateRangePicker = ({ value, onApply }: DateRangePickerProps) => {
  const [localRange, setLocalRange] = useState<DateRange>(value);
  
  // Controla se exibe os inputs customizados dentro do mobile
  const [showMobileCustom, setShowMobileCustom] = useState(false);

  const baseDate = useMemo(() => parseISO(localRange.from), [localRange.from]);
  const currentYear = getYear(baseDate);
  const currentMonthIdx = getMonth(baseDate);

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

  const handleQuickSelect = (monthIdx: number, year: number) => {
    let targetDate = fnsSetYear(new Date(), year);
    targetDate = fnsSetMonth(targetDate, monthIdx);

    const newRange = {
      from: format(startOfMonth(targetDate), "yyyy-MM-dd"),
      to: format(endOfMonth(targetDate), "yyyy-MM-dd"),
    };

    setLocalRange(newRange);
    setShowMobileCustom(false); // Reseta a aba personalizada se clicar num mês cheio
    onApply(newRange);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex flex-col items-end">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Período Selecionado
        </span>
        <strong className="text-sm text-foreground font-mono">{label}</strong>
      </div>

      <Popover onOpenChange={(open) => { if (!open) setShowMobileCustom(false); }}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            className="bg-gradient-gold hover:opacity-90 text-white gap-2 shadow-lg h-9 md:h-8"
          >
            <CalendarIcon className="w-4 h-4 text-black" />
            <span className="md:hidden text-xs text-black font-semibold">{label}</span>
            <span className="hidden md:inline text-xs text-black">Alterar</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent 
          className="w-[calc(100vw-2rem)] max-w-[360px] md:w-104 p-4 space-y-4 bg-card border-white/10" 
          align="end"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
             <h3 className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Selecione o Período
             </h3>
          </div>

          {/* =======================================================
              INTERFACE MOBILE: GRID RÁPIDO + EXPANSOR PERSONALIZADO
             ======================================================= */}
          <div className="block md:hidden space-y-3">
            
            {/* Só renderiza o grid se NÃO estiver na tela personalizada */}
            {!showMobileCustom ? (
              <>
                {/* Controle do Ano Corrente */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zinc-400"
                    onClick={() => handleQuickSelect(currentMonthIdx, currentYear - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-bold font-mono tracking-wider text-amber-400">
                    {currentYear}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zinc-400"
                    onClick={() => handleQuickSelect(currentMonthIdx, currentYear + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Grid com os 12 meses */}
                <div className="grid grid-cols-4 gap-2">
                  {MESES.map((mes, idx) => {
                    const isSelected = idx === currentMonthIdx;
                    return (
                      <Button
                        key={mes}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "h-10 text-xs font-medium transition-all p-0",
                          isSelected 
                            ? "bg-gradient-gold text-black font-bold shadow-md" 
                            : "bg-white/5 border-white/5 text-zinc-300"
                        )}
                        onClick={() => handleQuickSelect(idx, currentYear)}
                      >
                        {mes}
                      </Button>
                    );
                  })}
                </div>

                {/* Botão para Ativar Período Customizado */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-dashed border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 text-xs gap-2 font-medium text-amber-400"
                  onClick={() => setShowMobileCustom(true)}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Selecionar Vários Meses / Outra Data
                </Button>
              </>
            ) : (
              /* Formulário de Data Customizada dentro do Mobile */
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-bold">Início</label>
                    <Input
                      type="date"
                      className="h-10 text-xs bg-white/5 border-white/10"
                      value={localRange.from}
                      onChange={(e) => setLocalRange({ ...localRange, from: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-bold">Fim</label>
                    <Input
                      type="date"
                      className="h-10 text-xs bg-white/5 border-white/10"
                      value={localRange.to}
                      onChange={(e) => setLocalRange({ ...localRange, to: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-xs text-zinc-400"
                    onClick={() => setShowMobileCustom(false)}
                  >
                    Voltar aos Meses
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-gold text-black font-bold text-xs h-10"
                    onClick={() => {
                      onApply(localRange);
                      // Fecha o popover simulando um comportamento nativo após aplicar
                      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                    }}
                  >
                    Confirmar Período
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* =======================================================
              INTERFACE DESKTOP: MANTÉM INFRAESTRUTURA COMPLETA
             ======================================================= */}
          <div className="hidden md:block space-y-4">
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

            <div className="flex items-center justify-between gap-1.5">
              <Button
                variant="link"
                className="h-8 flex-1 border-white/10 hover:bg-white/5 text-[11px] font-bold gap-1 transition-all group"
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
                className="h-8 flex-1 border-white/10 hover:bg-white/5 text-[11px] font-bold gap-1 transition-all group"
                onClick={() => navigateMonth("next")}
              >
                Próximo
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            <Button
              className="w-full bg-gradient-gold text-white font-bold h-9 shadow-md"
              onClick={() => onApply(localRange)}
            >
              Confirmar Período
            </Button>
          </div>

        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;