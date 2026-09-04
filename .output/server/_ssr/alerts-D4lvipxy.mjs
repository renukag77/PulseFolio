import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { a as CardHeader, c as apiErrorMessage, i as CardDescription, n as Card, o as CardTitle, r as CardContent, s as api, t as Button, u as cn } from "./card-TTZZ9CQl.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as LoaderCircle, d as BellRing, n as Trash2 } from "../_libs/lucide-react.mjs";
import { a as formatCurrency, g as useRequireAuth, i as Skeleton, n as AppShell, p as useHoldings, r as EmptyState } from "./format-DsCgJCtg.mjs";
import { n as Label, t as Input } from "./label-MckuJOPR.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-haybfQB9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/alerts-D4lvipxy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
		secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
		outline: "text-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
async function listAlerts() {
	const { data } = await api.get("/alerts");
	return data;
}
async function createAlert(payload) {
	const { data } = await api.post("/alerts", payload);
	return data;
}
async function deleteAlert(id) {
	await api.delete(`/alerts/${id}`);
}
var alertsKey = ["alerts"];
function useAlerts(enabled = true) {
	return useQuery({
		queryKey: alertsKey,
		queryFn: listAlerts,
		enabled
	});
}
function useCreateAlert() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload) => createAlert(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: alertsKey });
			toast.success("Alert created");
		},
		onError: (e) => toast.error(apiErrorMessage(e, "Could not create alert"))
	});
}
function useDeleteAlert() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id) => deleteAlert(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: alertsKey });
			toast.success("Alert deleted");
		},
		onError: (e) => toast.error(apiErrorMessage(e, "Could not delete alert"))
	});
}
function AlertsPage() {
	const { ready } = useRequireAuth();
	const alerts = useAlerts(ready);
	const holdings = useHoldings(ready);
	const createAlert = useCreateAlert();
	const deleteAlert = useDeleteAlert();
	const [holdingId, setHoldingId] = (0, import_react.useState)("");
	const [threshold, setThreshold] = (0, import_react.useState)("");
	const [direction, setDirection] = (0, import_react.useState)("above");
	const tickerFor = (id) => holdings.data?.find((h) => String(h.id) === String(id))?.ticker ?? `#${id}`;
	const submit = (e) => {
		e.preventDefault();
		if (!holdingId) return;
		createAlert.mutate({
			holding_id: holdingId,
			threshold_price: Number(threshold),
			direction
		}, { onSuccess: () => setThreshold("") });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold tracking-tight",
			children: "Price alerts"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "Alerts are evaluated on the backend against live prices and pushed to your dashboard instantly."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-5 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "New alert" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Pick a holding and a threshold price." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "space-y-4",
					onSubmit: submit,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Holding" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: holdingId,
								onValueChange: setHoldingId,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a holding" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: (holdings.data ?? []).map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: String(h.id),
									children: h.ticker
								}, h.id)) })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Direction" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: direction,
								onValueChange: (v) => setDirection(v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "above",
									children: "Goes above"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "below",
									children: "Falls below"
								})] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "threshold",
								children: "Threshold price (₹)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "threshold",
								type: "number",
								step: "any",
								min: "0",
								required: true,
								value: threshold,
								onChange: (e) => setThreshold(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "submit",
							className: "w-full",
							disabled: createAlert.isPending || !holdingId || (holdings.data?.length ?? 0) === 0,
							children: [createAlert.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, "Create alert"]
						}),
						(holdings.data?.length ?? 0) === 0 && !holdings.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Add a holding first to create alerts."
						}) : null
					]
				}) })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "shadow-card lg:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Active alerts" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: alerts.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full" })]
				}) : (alerts.data?.length ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					title: "No alerts yet",
					description: "Create one on the left to be notified when a price crosses your threshold."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3",
					children: alerts.data?.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellRing, { className: "size-4 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: tickerFor(a.holding_id)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-muted-foreground",
								children: a.direction === "above" ? "goes above" : "falls below"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono tabular-nums",
								children: formatCurrency(a.threshold_price, true)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: a.is_triggered ? "default" : "secondary",
								className: "ml-auto",
								children: a.is_triggered ? "Triggered" : "Watching"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								"aria-label": "Delete alert",
								onClick: () => deleteAlert.mutate(a.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4 text-destructive" })
							})
						]
					}, a.id))
				}) })]
			})]
		})
	] });
}
//#endregion
export { AlertsPage as component };
