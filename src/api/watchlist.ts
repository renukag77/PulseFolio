import { api } from "./client";
import type { WatchlistDigest, WatchlistItem } from "@/types";

export async function listWatchlist(): Promise<WatchlistItem[]> {
  const { data } = await api.get<WatchlistItem[]>("/watchlist");
  return data;
}

export async function addWatchlistItem(ticker: string): Promise<WatchlistItem> {
  const { data } = await api.post<WatchlistItem>("/watchlist", { ticker });
  return data;
}

export async function deleteWatchlistItem(id: WatchlistItem["id"]): Promise<void> {
  await api.delete(`/watchlist/${id}`);
}

export async function getWatchlistDigest(): Promise<WatchlistDigest> {
  const { data } = await api.get<WatchlistDigest>("/watchlist/digest");
  return data;
}
