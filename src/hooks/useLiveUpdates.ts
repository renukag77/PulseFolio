import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getToken, wsUrl } from "@/api/client";
import { holdingsKey } from "./useHoldings";
import type { Holding, LiveMessage } from "@/types";

type Status = "connecting" | "live" | "offline";

/**
 * Connects to the FastAPI WebSocket hub and patches holdings prices in the
 * React Query cache in place (no refetch), plus toasts triggered alerts.
 */
export function useLiveUpdates(enabled = true) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("offline");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let closed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (closed) return;
      setStatus("connecting");
      const token = getToken();
      const url = token ? `${wsUrl()}?token=${encodeURIComponent(token)}` : wsUrl();
      let socket: WebSocket;
      try {
        socket = new WebSocket(url);
      } catch {
        setStatus("offline");
        return;
      }
      socketRef.current = socket;

      socket.onopen = () => setStatus("live");

      socket.onmessage = (event) => {
        let msg: LiveMessage;
        try {
          msg = JSON.parse(event.data as string) as LiveMessage;
        } catch {
          return;
        }
        if (msg.type === "price_update") {
          const { ticker, last_price } = msg.payload;
          qc.setQueryData<Holding[]>(holdingsKey, (prev) =>
            prev?.map((h) =>
              h.ticker === ticker
                ? {
                    ...h,
                    last_price,
                    current_value: last_price * h.quantity,
                    gain_pct: h.buy_price ? ((last_price - h.buy_price) / h.buy_price) * 100 : (h.gain_pct ?? null),
                  }
                : h,
            ),
          );
        } else if (msg.type === "alert_triggered") {
          const p = msg.payload ?? {};
          toast.warning("Price alert triggered", {
            description:
              p.message ??
              `${p.ticker ?? "Holding"} moved ${p.direction ?? ""} ₹${p.threshold_price ?? ""}`.trim(),
          });
        }
      };

      socket.onclose = () => {
        setStatus("offline");
        if (!closed) retry = setTimeout(connect, 5000);
      };
      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled, qc]);

  return { status };
}
