import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createHolding, deleteHolding, importHoldingsCsv, listHoldings } from "@/api/holdings";
import { apiErrorMessage } from "@/api/client";
import { portfolioKeys } from "./usePortfolio";
import type { Holding, NewHolding } from "@/types";

export const holdingsKey = ["holdings"] as const;

export function useHoldings(enabled = true) {
  return useQuery({ queryKey: holdingsKey, queryFn: listHoldings, enabled });
}

function useInvalidatePortfolio() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: holdingsKey });
    void qc.invalidateQueries({ queryKey: portfolioKeys.summary });
    void qc.invalidateQueries({ queryKey: portfolioKeys.health });
  };
}

export function useCreateHolding() {
  const invalidate = useInvalidatePortfolio();
  return useMutation({
    mutationFn: (payload: NewHolding) => createHolding(payload),
    onSuccess: (h) => {
      invalidate();
      toast.success(`Added ${h.ticker ?? "holding"}`);
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not add holding")),
  });
}

export function useDeleteHolding() {
  const invalidate = useInvalidatePortfolio();
  return useMutation({
    mutationFn: (id: Holding["id"]) => deleteHolding(id),
    onSuccess: () => {
      invalidate();
      toast.success("Holding removed");
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not delete holding")),
  });
}

export function useImportCsv() {
  const invalidate = useInvalidatePortfolio();
  return useMutation({
    mutationFn: (file: File) => importHoldingsCsv(file),
    onSuccess: (rows) => {
      invalidate();
      toast.success(`Imported ${rows?.length ?? 0} holdings`);
    },
    onError: (e) => toast.error(apiErrorMessage(e, "CSV import failed")),
  });
}
