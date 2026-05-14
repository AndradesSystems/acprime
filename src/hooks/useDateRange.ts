import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";

export type DateRange = {
  from: string;
  to: string;
};

const toYMD = (d: Date) => format(d, "yyyy-MM-dd");

export function useDateRange() {
  const [searchParams, setSearchParams] = useSearchParams();

  const range = useMemo<DateRange>(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (from && to) {
      return { from, to };
    }

    return {
      from: toYMD(startOfMonth(new Date())),
      to: toYMD(endOfMonth(new Date())),
    };
  }, [searchParams]);

  const setRange = (newRange: DateRange) => {
    const params = new URLSearchParams(searchParams);

    params.set("from", newRange.from);
    params.set("to", newRange.to);

    setSearchParams(params, { replace: true });
  };

  return { range, setRange };
}
