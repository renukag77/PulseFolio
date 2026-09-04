import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addWatchlistItem, deleteWatchlistItem, getWatchlistDigest, listWatchlist } from "@/api/watchlist";
import { apiErrorMessage, getToken, wsUrl } from "@/api/client";
import type { WatchlistDigest, WatchlistItem, WatchlistLiveMessage } from "@/types";

export const watchlistKey = ["watchlist"] as const;
export const watchlistDigestKey = ["watchlist", "digest"] as const;

export function useWatchlist(enabled = true) {
  return useQuery({ queryKey: watchlistKey, queryFn: listWatchlist, enabled });
}

export function useWatchlistDigest(enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: watchlistDigestKey,
    queryFn: getWatchlistDigest,
    enabled,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const token = getToken();
    if (!token) return;
    let socket: WebSocket;
    try {
      socket = new WebSocket(`${wsUrl("/ws/watchlist")}?token=${encodeURIComponent(token)}`);
    } catch {
      return;
    }
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as WatchlistLiveMessage;
        if (message.type !== "ticker_update") return;
        queryClient.setQueryData<WatchlistDigest>(watchlistDigestKey, (current) => {
          if (!current) return current;
          return {
            ...current,
            items: current.items.map((item) =>
              item.ticker === message.payload.ticker
                ? { ...item, ...message.payload, freshness_seconds: 0, is_stale: false }
                : item,
            ),
          };
        });
        queryClient.setQueryData<WatchlistItem[]>(watchlistKey, (current) =>
          current?.map((item) =>
            item.ticker === message.payload.ticker
              ? { ...item, state: { ...item.state, ...message.payload } }
              : item,
          ),
        );
      } catch {
        // Ignore malformed messages from a disconnected or outdated server.
      }
    };
    return () => socket.close();
  }, [enabled, queryClient]);

  return query;
}

export function useAddWatchlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticker: string) => addWatchlistItem(ticker),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: watchlistKey });
      void queryClient.invalidateQueries({ queryKey: watchlistDigestKey });
      toast.success("Ticker added to your watchlist");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not add ticker")),
  });
}

export function useDeleteWatchlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: WatchlistItem["id"]) => deleteWatchlistItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: watchlistKey });
      void queryClient.invalidateQueries({ queryKey: watchlistDigestKey });
      toast.success("Ticker removed");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not remove ticker")),
  });
}
