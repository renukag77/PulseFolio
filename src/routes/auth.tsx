import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { login, signup } from "@/api/auth";
import { apiErrorMessage, getToken, setToken } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PulseFolio Portfolio Health" },
      {
        name: "description",
        content:
          "Log in or create a PulseFolio account to track your portfolio health score, diversification and rebalancing actions.",
      },
      { property: "og:title", content: "Sign in — PulseFolio" },
      {
        property: "og:description",
        content: "Access your portfolio health score, allocation charts and price alerts.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getToken()) void navigate({ to: "/" });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = mode === "login" ? await login(email, password) : await signup(email, password);
      if (!res?.token) throw new Error("No token returned by the API");
      setToken(res.token);
      toast.success(mode === "login" ? "Welcome back" : "Account created");
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Authentication failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div
        className="hidden flex-col justify-between p-10 text-primary-foreground lg:flex"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Activity className="size-5" />
          PulseFolio
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            Know how diversified your portfolio really is.
          </h2>
          <p className="text-sm opacity-85">
            PulseFolio scores your holdings on concentration, sector exposure and asset-class balance —
            then tells you exactly what to rebalance.
          </p>
        </div>
        <p className="font-mono text-xs opacity-70">
          health = 0.4·diversification + 0.3·sector + 0.3·balance
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl">
              {mode === "login" ? "Sign in" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Use your email and password to access your dashboard."
                : "Start tracking your portfolio health in under a minute."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {mode === "login" ? "Sign in" : "Sign up"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? "New to PulseFolio?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
