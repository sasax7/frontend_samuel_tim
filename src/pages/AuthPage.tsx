import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiLogin, apiRegister, type ApiError } from "@/features/finance/api";
import { setAccessToken } from "@/features/auth/session";

type Mode = "login" | "register";

function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "status" in e && "message" in e;
}

export default function AuthPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const initialMode = useMemo<Mode>(() => {
    const m = search.get("mode");
    return m === "register" ? "register" : "login";
  }, [search]);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = mode === "register" ? await apiRegister(email, password) : await apiLogin(email, password);
      setAccessToken(res.access_token);
      navigate("/finance/log", { replace: true });
    } catch (err: unknown) {
      if (isApiError(err)) {
        setError(`${err.status}: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">{mode === "register" ? "Account erstellen" : "Login"}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {mode === "register" ? "Erstelle einen neuen Account." : "Melde dich an, um deine Finanzdaten zu laden."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Passwort</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            required
          />
          <p className="text-xs text-slate-500">Mindestens 8 Zeichen.</p>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Bitte warten…" : mode === "register" ? "Registrieren" : "Login"}
        </button>
      </form>

      <div className="mt-6 text-sm">
        {mode === "register" ? (
          <button className="text-slate-900 underline" onClick={() => setMode("login")}>
            Schon einen Account? Zum Login
          </button>
        ) : (
          <button className="text-slate-900 underline" onClick={() => setMode("register")}>
            Noch keinen Account? Registrieren
          </button>
        )}
      </div>
    </div>
  );
}
