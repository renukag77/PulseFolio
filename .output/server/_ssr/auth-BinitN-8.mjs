import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as CardHeader, c as apiErrorMessage, d as getToken, f as setToken, i as CardDescription, n as Card, o as CardTitle, r as CardContent, s as api, t as Button } from "./card-TTZZ9CQl.mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as LoaderCircle, p as Activity } from "../_libs/lucide-react.mjs";
import { n as Label, t as Input } from "./label-MckuJOPR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-BinitN-8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function signup(email, password) {
	const { data } = await api.post("/auth/signup", {
		email,
		password
	});
	return data;
}
async function login(email, password) {
	const { data } = await api.post("/auth/login", {
		email,
		password
	});
	return data;
}
function AuthPage() {
	const navigate = useNavigate();
	const [mode, setMode] = (0, import_react.useState)("login");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (getToken()) navigate({ to: "/" });
	}, [navigate]);
	const onSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		try {
			const res = mode === "login" ? await login(email, password) : await signup(email, password);
			if (!res?.token) throw new Error("No token returned by the API");
			setToken(res.token);
			toast.success(mode === "login" ? "Welcome back" : "Account created");
			navigate({ to: "/" });
		} catch (err) {
			toast.error(apiErrorMessage(err, "Authentication failed"));
		} finally {
			setSubmitting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid min-h-screen lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "hidden flex-col justify-between p-10 text-primary-foreground lg:flex",
			style: { background: "var(--gradient-brand)" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-lg font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-5" }), "PulseFolio"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-md space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-3xl font-semibold leading-tight",
						children: "Know how diversified your portfolio really is."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm opacity-85",
						children: "PulseFolio scores your holdings on concentration, sector exposure and asset-class balance — then tells you exactly what to rebalance."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs opacity-70",
					children: "health = 0.4·diversification + 0.3·sector + 0.3·balance"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-center px-4 py-12",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "w-full max-w-md shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-2xl",
					children: mode === "login" ? "Sign in" : "Create your account"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: mode === "login" ? "Use your email and password to access your dashboard." : "Start tracking your portfolio health in under a minute." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "space-y-4",
					onSubmit,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "email",
								children: "Email"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "email",
								type: "email",
								autoComplete: "email",
								required: true,
								value: email,
								onChange: (e) => setEmail(e.target.value),
								placeholder: "you@example.com"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "password",
								children: "Password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "password",
								type: "password",
								autoComplete: mode === "login" ? "current-password" : "new-password",
								required: true,
								minLength: 6,
								value: password,
								onChange: (e) => setPassword(e.target.value),
								placeholder: "••••••••"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "submit",
							className: "w-full",
							disabled: submitting,
							children: [submitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, mode === "login" ? "Sign in" : "Sign up"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 text-center text-sm text-muted-foreground",
					children: [
						mode === "login" ? "New to PulseFolio?" : "Already have an account?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "font-medium text-primary underline-offset-4 hover:underline",
							onClick: () => setMode(mode === "login" ? "signup" : "login"),
							children: mode === "login" ? "Create an account" : "Sign in"
						})
					]
				})] })]
			})
		})]
	});
}
//#endregion
export { AuthPage as component };
