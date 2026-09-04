import { api } from "./client";
import type { Holding, NewHolding } from "@/types";

export async function listHoldings(): Promise<Holding[]> {
  const { data } = await api.get<Holding[]>("/holdings");
  return data;
}

export async function createHolding(payload: NewHolding): Promise<Holding> {
  const { data } = await api.post<Holding>("/holdings", payload);
  return data;
}

export async function deleteHolding(id: Holding["id"]): Promise<void> {
  await api.delete(`/holdings/${id}`);
}

export async function importHoldingsCsv(file: File): Promise<Holding[]> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<Holding[]>("/holdings/import-csv", form);
  return data;
}
