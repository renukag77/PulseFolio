import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as CardHeader, i as CardDescription, n as Card, o as CardTitle, r as CardContent, t as Button } from "./card-TTZZ9CQl.mjs";
import { a as LoaderCircle, n as Trash2, t as Upload } from "../_libs/lucide-react.mjs";
import { a as formatCurrency, d as useDeleteHolding, g as useRequireAuth, i as Skeleton, m as useImportCsv, n as AppShell, o as formatNumber, p as useHoldings, r as EmptyState, s as formatPct, t as ASSET_TYPE_LABELS, u as useCreateHolding } from "./format-DsCgJCtg.mjs";
import { n as Label, t as Input } from "./label-MckuJOPR.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-haybfQB9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/holdings-C8eJKEGG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HoldingsPage() {
	const { ready } = useRequireAuth();
	const { data, isLoading } = useHoldings(ready);
	const createHolding = useCreateHolding();
	const deleteHolding = useDeleteHolding();
	const importCsv = useImportCsv();
	const fileInput = (0, import_react.useRef)(null);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [ticker, setTicker] = (0, import_react.useState)("");
	const [assetType, setAssetType] = (0, import_react.useState)("stock");
	const [quantity, setQuantity] = (0, import_react.useState)("");
	const [buyPrice, setBuyPrice] = (0, import_react.useState)("");
	const submit = (e) => {
		e.preventDefault();
		createHolding.mutate({
			ticker: ticker.trim().toUpperCase(),
			asset_type: assetType,
			quantity: Number(quantity),
			buy_price: Number(buyPrice)
		}, { onSuccess: () => {
			setTicker("");
			setQuantity("");
			setBuyPrice("");
		} });
	};
	const handleFiles = (files) => {
		const file = files?.[0];
		if (file) importCsv.mutate(file);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold tracking-tight",
			children: "Holdings"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "Add positions one by one, or import a CSV with ticker, asset_type, quantity, buy_price."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-5 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Add a holding" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Ticker as your market data provider expects it." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "space-y-4",
					onSubmit: submit,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "ticker",
								children: "Ticker"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "ticker",
								required: true,
								value: ticker,
								onChange: (e) => setTicker(e.target.value),
								placeholder: "INFY.NS"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Asset type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: assetType,
								onValueChange: (v) => setAssetType(v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "stock",
										children: "Stock"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "mf",
										children: "Mutual fund"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "gold",
										children: "Gold"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "debt",
										children: "Debt"
									})
								] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "qty",
									children: "Quantity"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "qty",
									type: "number",
									step: "any",
									min: "0",
									required: true,
									value: quantity,
									onChange: (e) => setQuantity(e.target.value)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "buy",
									children: "Buy price (₹)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "buy",
									type: "number",
									step: "any",
									min: "0",
									required: true,
									value: buyPrice,
									onChange: (e) => setBuyPrice(e.target.value)
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "submit",
							className: "w-full",
							disabled: createHolding.isPending,
							children: [createHolding.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, "Add holding"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					onDragOver: (e) => {
						e.preventDefault();
						setDragging(true);
					},
					onDragLeave: () => setDragging(false),
					onDrop: (e) => {
						e.preventDefault();
						setDragging(false);
						handleFiles(e.dataTransfer.files);
					},
					className: `mt-6 cursor-pointer rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${dragging ? "border-primary bg-secondary" : "border-border"}`,
					onClick: () => fileInput.current?.click(),
					children: [
						importCsv.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mx-auto size-5 animate-spin text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "mx-auto size-5 text-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm font-medium",
							children: "Import CSV"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Drag & drop a file, or click to browse"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileInput,
							type: "file",
							accept: ".csv,text/csv",
							className: "hidden",
							onChange: (e) => handleFiles(e.target.files)
						})
					]
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "shadow-card lg:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Your positions" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-full" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-full" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-full" })
					]
				}) : (data?.length ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					title: "No holdings yet",
					description: "Add your first one using the form on the left, or import a CSV."
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
									children: "Type"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 pr-4 font-medium",
									children: "Sector"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 pr-4 text-right font-medium",
									children: "Qty"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 pr-4 text-right font-medium",
									children: "Buy"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 pr-4 text-right font-medium",
									children: "LTP"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 pr-4 text-right font-medium",
									children: "Value"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 pr-4 text-right font-medium",
									children: "P&L"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "py-2" })
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data?.map((h) => {
							const ltp = h.last_price ?? null;
							const value = h.current_value ?? (ltp ?? h.buy_price) * h.quantity;
							const gain = h.gain_pct ?? (ltp ? (ltp - h.buy_price) / h.buy_price * 100 : null);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border/60 last:border-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 pr-4 font-medium",
										children: h.ticker
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 pr-4 text-muted-foreground",
										children: ASSET_TYPE_LABELS[h.asset_type] ?? h.asset_type
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 pr-4 text-muted-foreground",
										children: h.sector ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 pr-4 text-right font-mono tabular-nums",
										children: formatNumber(h.quantity)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 pr-4 text-right font-mono tabular-nums",
										children: formatCurrency(h.buy_price, true)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 pr-4 text-right font-mono tabular-nums",
										children: formatCurrency(ltp, true)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 pr-4 text-right font-mono tabular-nums",
										children: formatCurrency(value)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 pr-4 text-right font-mono tabular-nums",
										style: { color: gain === null ? void 0 : gain >= 0 ? "var(--positive)" : "var(--negative)" },
										children: formatPct(gain)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "icon",
											"aria-label": `Delete ${h.ticker}`,
											onClick: () => deleteHolding.mutate(h.id),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4 text-destructive" })
										})
									})
								]
							}, h.id);
						}) })]
					})
				}) })]
			})]
		})
	] });
}
//#endregion
export { HoldingsPage as component };
