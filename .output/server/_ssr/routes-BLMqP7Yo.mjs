import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as CardHeader, d as getToken, n as Card, o as CardTitle, p as wsUrl, r as CardContent, t as Button } from "./card-TTZZ9CQl.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { f as ArrowUpRight, o as Lightbulb, r as Radio } from "../_libs/lucide-react.mjs";
import { a as formatCurrency, c as holdingsKey, f as useHealthScore, g as useRequireAuth, h as usePortfolioSummary, i as Skeleton, l as toSlices, n as AppShell, p as useHoldings, r as EmptyState, s as formatPct, t as ASSET_TYPE_LABELS } from "./format-DsCgJCtg.mjs";
import { a as Tooltip, i as ResponsiveContainer, n as Pie, o as Legend, r as Cell, t as PieChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BLMqP7Yo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--accent)"
];
function AllocationDonut({ data, emptyLabel = "No allocation data yet" }) {
	if (!data.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-64 place-items-center text-sm text-muted-foreground",
		children: emptyLabel
	});
	const total = data.reduce((sum, d) => sum + d.value, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-64 w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
					data,
					dataKey: "value",
					nameKey: "label",
					innerRadius: "58%",
					outerRadius: "82%",
					paddingAngle: 2,
					stroke: "var(--card)",
					children: data.map((entry, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: COLORS[i % COLORS.length] }, entry.label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
					formatter: (value, name) => [`${formatCurrency(value)} (${total ? (value / total * 100).toFixed(1) : "0"}%)`, name],
					contentStyle: {
						background: "var(--card)",
						border: "1px solid var(--border)",
						borderRadius: "0.5rem",
						fontSize: "0.8rem"
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
					verticalAlign: "bottom",
					height: 36,
					formatter: (value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted-foreground",
						children: value
					})
				})
			] })
		})
	});
}
function bandColor(score) {
	if (score >= 70) return "var(--positive)";
	if (score >= 40) return "var(--warning)";
	return "var(--negative)";
}
function bandLabel(score) {
	if (score >= 70) return "Healthy";
	if (score >= 40) return "Needs attention";
	return "At risk";
}
function HealthGauge({ score, size = 208 }) {
	const clamped = Math.max(0, Math.min(100, score));
	const stroke = 16;
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const dash = clamped / 100 * circumference;
	const color = bandColor(clamped);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			style: {
				width: size,
				height: size
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				className: "-rotate-90",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: size / 2,
					cy: size / 2,
					r: radius,
					fill: "none",
					stroke: "var(--muted)",
					strokeWidth: stroke
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: size / 2,
					cy: size / 2,
					r: radius,
					fill: "none",
					stroke: color,
					strokeWidth: stroke,
					strokeLinecap: "round",
					strokeDasharray: `${dash} ${circumference - dash}`,
					className: "transition-all duration-700"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 flex flex-col items-center justify-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-5xl font-semibold tabular-nums",
					style: { color },
					children: Math.round(clamped)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs uppercase tracking-widest text-muted-foreground",
					children: "/ 100"
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "rounded-full px-3 py-1 text-xs font-medium",
			style: {
				backgroundColor: "var(--surface)",
				color
			},
			children: bandLabel(clamped)
		})]
	});
}
function StatCard({ label, value, hint, tone = "default" }) {
	const color = tone === "positive" ? "var(--positive)" : tone === "negative" ? "var(--negative)" : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		className: "shadow-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-wider text-muted-foreground",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-mono text-2xl font-semibold tabular-nums",
					style: color ? { color } : void 0,
					children: value
				}),
				hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: hint
				}) : null
			]
		})
	});
}
/**
* Connects to the FastAPI WebSocket hub and patches holdings prices in the
* React Query cache in place (no refetch), plus toasts triggered alerts.
*/
function useLiveUpdates(enabled = true) {
	const qc = useQueryClient();
	const [status, setStatus] = (0, import_react.useState)("offline");
	const socketRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!enabled || typeof window === "undefined") return;
		let closed = false;
		let retry;
		const connect = () => {
			if (closed) return;
			setStatus("connecting");
			const token = getToken();
			const url = token ? `${wsUrl()}?token=${encodeURIComponent(token)}` : wsUrl();
			let socket;
			try {
				socket = new WebSocket(url);
			} catch {
				setStatus("offline");
				return;
			}
			socketRef.current = socket;
			socket.onopen = () => setStatus("live");
			socket.onmessage = (event) => {
				let msg;
				try {
					msg = JSON.parse(event.data);
				} catch {
					return;
				}
				if (msg.type === "price_update") {
					const { ticker, last_price } = msg.payload;
					qc.setQueryData(holdingsKey, (prev) => prev?.map((h) => h.ticker === ticker ? {
						...h,
						last_price,
						current_value: last_price * h.quantity,
						gain_pct: h.buy_price ? (last_price - h.buy_price) / h.buy_price * 100 : h.gain_pct ?? null
					} : h));
				} else if (msg.type === "alert_triggered") {
					const p = msg.payload ?? {};
					toast.warning("Price alert triggered", { description: p.message ?? `${p.ticker ?? "Holding"} moved ${p.direction ?? ""} ₹${p.threshold_price ?? ""}`.trim() });
				}
			};
			socket.onclose = () => {
				setStatus("offline");
				if (!closed) retry = setTimeout(connect, 5e3);
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
function Dashboard() {
	const { ready } = useRequireAuth();
	const { status } = useLiveUpdates(ready);
	const summary = usePortfolioSummary(ready);
	const health = useHealthScore(ready);
	const holdings = useHoldings(ready);
	const sectorSlices = toSlices(summary.data?.allocation_by_sector);
	const assetSlices = toSlices(summary.data?.allocation_by_asset_type).map((s) => ({
		...s,
		label: ASSET_TYPE_LABELS[s.label] ?? s.label
	}));
	const topHoldings = summary.data?.top_holdings ?? (holdings.data ?? []).map((h) => ({
		ticker: h.ticker,
		name: h.name,
		current_value: h.current_value ?? (h.last_price ?? h.buy_price) * h.quantity,
		gain_pct: h.gain_pct ?? (h.last_price ? (h.last_price - h.buy_price) / h.buy_price * 100 : 0)
	})).sort((a, b) => b.current_value - a.current_value).slice(0, 8);
	const isEmpty = ready && !holdings.isLoading && (holdings.data?.length ?? 0) === 0;
	const totalGain = summary.data?.total_gain ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-end justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Portfolio value"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-4xl font-semibold tabular-nums",
					children: summary.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-52" }) : formatCurrency(summary.data?.total_value)
				}),
				!summary.isLoading && summary.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 font-mono text-sm",
					style: { color: totalGain >= 0 ? "var(--positive)" : "var(--negative)" },
					children: [
						totalGain >= 0 ? "+" : "",
						formatCurrency(totalGain),
						" overall",
						" ",
						summary.data.total_gain_pct !== void 0 ? `(${formatPct(summary.data.total_gain_pct)})` : ""
					]
				}) : null
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, {
					className: "size-3.5",
					style: { color: status === "live" ? "var(--positive)" : "var(--muted-foreground)" }
				}), status === "live" ? "Live prices" : status === "connecting" ? "Connecting…" : "Live feed offline"]
			})]
		}),
		isEmpty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "No holdings yet",
				description: "Add your first stock or mutual fund to compute your health score.",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/holdings",
						children: "Add a holding"
					})
				})
			})
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-5 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "shadow-card lg:col-span-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Portfolio health score" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "flex flex-col items-center gap-6",
					children: [health.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "size-52 rounded-full" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HealthGauge, { score: health.data?.health_score ?? 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-xs text-muted-foreground",
						children: "0.4 × diversification + 0.3 × sector balance + 0.3 × asset balance"
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-5 lg:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							label: "Diversification",
							value: health.data ? `${Math.round(health.data.diversification_score)}` : "—",
							hint: "100 × (1 − HHI)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							label: "Sector balance",
							value: health.data ? `${Math.round(health.data.sector_score)}` : "—",
							hint: "Penalty above 30% per sector"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							label: "Asset balance",
							value: health.data ? `${Math.round(health.data.balance_score)}` : "—",
							hint: "Deviation from target mix"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "shadow-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { className: "size-4 text-primary" }), "Rebalancing actions"]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "space-y-3",
						children: health.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full" })] }) : (health.data?.recommendations?.length ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No action needed — your allocation is within target bands."
						}) : health.data?.recommendations.map((rec, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "mt-0.5 size-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm",
								children: rec
							})]
						}, i))
					})]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 grid gap-5 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Allocation by sector" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: summary.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64 w-full" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AllocationDonut, { data: sectorSlices }) })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Allocation by asset type" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: summary.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64 w-full" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AllocationDonut, { data: assetSlices }) })]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "mt-5 shadow-card",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Top holdings" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: summary.isLoading || holdings.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full" }) : topHoldings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "No holdings to show yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-4 font-medium",
								children: "Ticker"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-4 font-medium",
								children: "Name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-4 text-right font-medium",
								children: "Current value"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 text-right font-medium",
								children: "Gain / loss"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: topHoldings.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/60 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 pr-4 font-medium",
								children: h.ticker
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 pr-4 text-muted-foreground",
								children: h.name ?? "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 pr-4 text-right font-mono tabular-nums",
								children: formatCurrency(h.current_value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 text-right font-mono tabular-nums",
								style: { color: h.gain_pct >= 0 ? "var(--positive)" : "var(--negative)" },
								children: formatPct(h.gain_pct)
							})
						]
					}, h.ticker)) })]
				})
			}) })]
		})
	] });
}
//#endregion
export { Dashboard as component };
