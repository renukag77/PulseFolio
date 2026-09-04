import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as apiErrorMessage, d as getToken, l as clearToken, s as api, t as Button, u as cn } from "./card-TTZZ9CQl.mjs";
import { g as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as LogOut, p as Activity, s as Inbox } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/format-DsCgJCtg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Client-side auth state backed by the JWT in localStorage. */
function useAuth() {
	const navigate = useNavigate();
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [token, setTokenState] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setTokenState(getToken());
		setHydrated(true);
	}, []);
	const logout = (0, import_react.useCallback)(() => {
		clearToken();
		setTokenState(null);
		navigate({ to: "/auth" });
	}, [navigate]);
	return {
		token,
		isAuthenticated: Boolean(token),
		hydrated,
		logout
	};
}
/** Redirects to /auth once hydration proves there is no token. */
function useRequireAuth() {
	const { hydrated, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (hydrated && !isAuthenticated) navigate({ to: "/auth" });
	}, [
		hydrated,
		isAuthenticated,
		navigate
	]);
	return { ready: hydrated && isAuthenticated };
}
var NAV = [
	{
		to: "/",
		label: "Dashboard"
	},
	{
		to: "/holdings",
		label: "Holdings"
	},
	{
		to: "/alerts",
		label: "Alerts"
	}
];
function AppShell({ children }) {
	const { logout } = useAuth();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-2 font-semibold tracking-tight",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-8 place-items-center rounded-lg text-primary-foreground",
							style: { background: "var(--gradient-brand)" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4" })
						}), "PulseFolio"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "order-3 flex w-full items-center gap-1 sm:order-none sm:w-auto",
						children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: item.to,
							activeOptions: { exact: item.to === "/" },
							className: "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
							activeProps: { className: "bg-secondary text-secondary-foreground font-medium" },
							children: item.label
						}, item.to))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						size: "sm",
						className: "ml-auto gap-2",
						onClick: logout,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), "Logout"]
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8",
			children
		})]
	});
}
function EmptyState({ title, description, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-11 place-items-center rounded-full bg-secondary text-secondary-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium text-foreground",
				children: title
			}), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: description
			}) : null] }),
			action
		]
	});
}
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-md bg-primary/10", className),
		...props
	});
}
async function listHoldings() {
	const { data } = await api.get("/holdings");
	return data;
}
async function createHolding(payload) {
	const { data } = await api.post("/holdings", payload);
	return data;
}
async function deleteHolding(id) {
	await api.delete(`/holdings/${id}`);
}
async function importHoldingsCsv(file) {
	const form = new FormData();
	form.append("file", file);
	const { data } = await api.post("/holdings/import-csv", form, { headers: { "Content-Type": "multipart/form-data" } });
	return data;
}
async function getSummary() {
	const { data } = await api.get("/portfolio/summary");
	return data;
}
async function getHealthScore() {
	const { data } = await api.get("/portfolio/health-score");
	return data;
}
var portfolioKeys = {
	summary: ["portfolio", "summary"],
	health: ["portfolio", "health-score"]
};
function usePortfolioSummary(enabled = true) {
	return useQuery({
		queryKey: portfolioKeys.summary,
		queryFn: getSummary,
		enabled,
		refetchInterval: 6e4
	});
}
function useHealthScore(enabled = true) {
	return useQuery({
		queryKey: portfolioKeys.health,
		queryFn: getHealthScore,
		enabled,
		refetchInterval: 6e4
	});
}
var holdingsKey = ["holdings"];
function useHoldings(enabled = true) {
	return useQuery({
		queryKey: holdingsKey,
		queryFn: listHoldings,
		enabled
	});
}
function useInvalidatePortfolio() {
	const qc = useQueryClient();
	return () => {
		qc.invalidateQueries({ queryKey: holdingsKey });
		qc.invalidateQueries({ queryKey: portfolioKeys.summary });
		qc.invalidateQueries({ queryKey: portfolioKeys.health });
	};
}
function useCreateHolding() {
	const invalidate = useInvalidatePortfolio();
	return useMutation({
		mutationFn: (payload) => createHolding(payload),
		onSuccess: (h) => {
			invalidate();
			toast.success(`Added ${h.ticker ?? "holding"}`);
		},
		onError: (e) => toast.error(apiErrorMessage(e, "Could not add holding"))
	});
}
function useDeleteHolding() {
	const invalidate = useInvalidatePortfolio();
	return useMutation({
		mutationFn: (id) => deleteHolding(id),
		onSuccess: () => {
			invalidate();
			toast.success("Holding removed");
		},
		onError: (e) => toast.error(apiErrorMessage(e, "Could not delete holding"))
	});
}
function useImportCsv() {
	const invalidate = useInvalidatePortfolio();
	return useMutation({
		mutationFn: (file) => importHoldingsCsv(file),
		onSuccess: (rows) => {
			invalidate();
			toast.success(`Imported ${rows?.length ?? 0} holdings`);
		},
		onError: (e) => toast.error(apiErrorMessage(e, "CSV import failed"))
	});
}
var inr = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 0
});
var inrPrecise = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2
});
function formatCurrency(value, precise = false) {
	if (value === null || value === void 0 || Number.isNaN(value)) return "—";
	return precise ? inrPrecise.format(value) : inr.format(value);
}
function formatPct(value, digits = 2) {
	if (value === null || value === void 0 || Number.isNaN(value)) return "—";
	return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}
function formatNumber(value) {
	if (value === null || value === void 0 || Number.isNaN(value)) return "—";
	return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 4 }).format(value);
}
var ASSET_TYPE_LABELS = {
	stock: "Stocks",
	mf: "Mutual funds",
	gold: "Gold",
	debt: "Debt"
};
/** Accepts either a {label: value} map or an array of slices from the API. */
function toSlices(input) {
	if (!input) return [];
	if (Array.isArray(input)) return input.filter((s) => Number(s.value) > 0);
	return Object.entries(input).map(([label, value]) => ({
		label,
		value: Number(value)
	})).filter((s) => s.value > 0);
}
//#endregion
export { formatCurrency as a, holdingsKey as c, useDeleteHolding as d, useHealthScore as f, useRequireAuth as g, usePortfolioSummary as h, Skeleton as i, toSlices as l, useImportCsv as m, AppShell as n, formatNumber as o, useHoldings as p, EmptyState as r, formatPct as s, ASSET_TYPE_LABELS as t, useCreateHolding as u };
