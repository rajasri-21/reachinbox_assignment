import * as React from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

type Props = {
  onGoogleLogin: () => void;
};

function GoogleG(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="#4285F4" d="M15.3 8.1c0-.6-.1-1.1-.2-1.6H8v3h4.1c-.2.9-.8 1.7-1.7 2.2v1.8h2.7c1.6-1.5 2.5-3.6 2.5-6.1z" />
      <path fill="#34A853" d="M8 15c2 0 3.7-.7 4.9-1.8l-2.7-1.8c-.7.5-1.7.8-2.2.8-1.7 0-3.1-1.1-3.6-2.7H1.6v1.9C2.8 13.7 5.2 15 8 15z" />
      <path fill="#FBBC05" d="M4.4 9.5c-.2-.5-.3-1-.3-1.5s.1-1 .3-1.5V4.6H1.6C1 5.8.7 6.9.7 8s.4 2.2 1 3.4l2.7-1.9z" />
      <path fill="#EA4335" d="M8 3.4c1.1 0 2 .4 2.8 1l2.1-2.1C11.7.7 10 0 8 0 5.2 0 2.8 1.3 1.6 3.6l2.8 1.9C5 4 6.3 3.4 8 3.4z" />
    </svg>
  );
}

export function LoginPage({ onGoogleLogin }: Props): React.JSX.Element {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] border border-[#e5e7eb] rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-[26px] font-bold text-[#0f172a] tracking-tight mb-6">Login</h1>

        <Button
          type="button"
          variant="secondary"
          onClick={onGoogleLogin}
          className="w-full bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#0f172a] border border-transparent h-10 rounded-lg text-sm font-medium"
          aria-label="Login with Google"
        >
          <span className="inline-flex items-center gap-2">
            <GoogleG />
            Login with Google
          </span>
        </Button>

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
