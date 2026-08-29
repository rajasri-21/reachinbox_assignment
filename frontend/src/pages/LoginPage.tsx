import * as React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";

type Props = {
  onGoogleLogin?: () => void;
};

export function LoginPage(_props: Props): React.JSX.Element {
  const { login, error: authError, loading } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
  const isGoogleConfigured = Boolean(googleClientId && googleClientId.length > 0);

  const handleGoogleSuccess = React.useCallback(
    async (credentialResponse: { credential?: string }) => {
      const credential = credentialResponse.credential;
      if (!credential) {
        setLocalError("Google login failed: missing credential. Please try again.");
        return;
      }
      setLocalError(null);
      setGoogleLoading(true);
      try {
        await login(credential);
        // App will switch to dashboard via auth state
      } catch (e) {
        const message = e instanceof Error ? e.message : "Google login failed. Please try again.";
        setLocalError(message);
      } finally {
        setGoogleLoading(false);
      }
    },
    [login],
  );

  const handleGoogleError = React.useCallback(() => {
    setLocalError("Google login was cancelled or failed. Please try again.");
  }, []);

  const displayError = localError ?? authError;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] border border-[#e5e7eb] rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-[26px] font-bold text-[#0f172a] tracking-tight mb-6">Login</h1>

        <div className="w-full" aria-label="Login with Google">
          {!isGoogleConfigured ? (
            <div
              role="alert"
              className="w-full rounded-lg bg-[#fef2f2] border border-[#fecaca] px-3 py-2.5 text-sm text-[#dc2626] text-center"
            >
              Google login is not configured. Set <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> to enable login.
            </div>
          ) : (
            <div className="flex flex-col items-stretch">
              <div className="flex justify-center" aria-live="polite" aria-busy={googleLoading || loading}>
                {googleLoading || loading ? (
                  <div className="w-full h-10 rounded-lg bg-[#ecfdf5] border border-[#bbf7d0] flex items-center justify-center gap-2 text-sm text-[#0f172a]">
                    <span className="w-4 h-4 rounded-full border-2 border-[#0f172a]/20 border-t-[#0f172a] animate-spin" aria-hidden="true" />
                    Signing in...
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    width="318"
                    text="signin_with"
                    shape="rectangular"
                  />
                )}
              </div>
              <p className="sr-only">Login with Google — real Google Identity Services</p>
            </div>
          )}
        </div>

        {displayError ? (
          <div role="alert" className="mt-3 rounded-lg bg-[#fef2f2] border border-[#fecaca] px-3.5 py-2.5 text-sm text-[#dc2626]">
            {displayError}
          </div>
        ) : null}

        <div className="flex items-center gap-3 my-5">
          <span className="h-px flex-1 bg-[#e5e7eb]" aria-hidden="true" />
          <span className="text-xs text-[#94a3b8] whitespace-nowrap">or sign up through email</span>
          <span className="h-px flex-1 bg-[#e5e7eb]" aria-hidden="true" />
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-3"
          aria-label="Login form"
        >
          <label className="block">
            <span className="sr-only">Email ID</span>
            <Input
              type="email"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              aria-label="Email ID"
            />
          </label>
          <label className="block">
            <span className="sr-only">Password</span>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-label="Password"
            />
          </label>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 h-11 rounded-lg bg-[#0fb95d] hover:bg-[#0ca750] border-[#0fb95d] text-white font-medium"
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
