import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createAlert, deleteAlert, listAlerts } from "@/api/alerts";
import { apiErrorMessage } from "@/api/client";
import type { Alert, NewAlert } from "@/types";

export const alertsKey = ["alerts"] as const;

export function useAlerts(enabled = true) {
  return useQuery({ queryKey: alertsKey, queryFn: listAlerts, enabled });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: NewAlert) => createAlert(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: alertsKey });
      toast.success("Alert created");
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not create alert")),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Alert["id"]) => deleteAlert(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: alertsKey });
      toast.success("Alert deleted");
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not delete alert")),
  });
}
