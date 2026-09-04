import { api } from "./client";
import type { Alert, NewAlert } from "@/types";

export async function listAlerts(): Promise<Alert[]> {
  const { data } = await api.get<Alert[]>("/alerts");
  return data;
}

export async function createAlert(payload: NewAlert): Promise<Alert> {
  const { data } = await api.post<Alert>("/alerts", payload);
  return data;
}

export async function deleteAlert(id: Alert["id"]): Promise<void> {
  await api.delete(`/alerts/${id}`);
}
