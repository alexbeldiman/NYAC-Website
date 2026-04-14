"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.session) {
      setError(authError?.message ?? "Sign in failed. Please try again.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .single();

    const role = profile?.role;

    if (role === "director" || role === "creator") {
      router.push("/staff/director");
    } else if (role === "coach") {
      router.push("/staff/coach");
    } else if (role === "tennis_house") {
      router.push("/staff/tennis-house");
    } else {
      setError("Your account does not have staff access.");
      await supabase.auth.signOut();
      setLoading(false);
    }
  }

  return (
    <>
      <style suppressHydrationWarning>{`
        .login-shell {
          min-height: 100vh;
          background: var(--staff-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
        }

        .login-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(200,16,46,0.08) 0%, transparent 65%);
          pointer-events: none;
        }

        .login-card {
          width: 100%;
          max-width: 380px;
          background: var(--staff-surface);
          border: 1px solid var(--staff-border);
          padding: 48px 40px 40px;
          position: relative;
          z-index: 1;
        }

        .login-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--crimson);
        }

        .login-logo {
          display: block;
          height: 28px;
          width: auto;
          filter: brightness(0) invert(1);
          opacity: 0.85;
          margin-bottom: 28px;
        }

        .login-heading {
          font-family: var(--font-label);
          font-size: 22px;
          font-weight: 400;
          color: var(--staff-text);
          margin-bottom: 4px;
          line-height: 1.2;
        }

        .login-subheading {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--staff-dim);
          margin-bottom: 32px;
          display: block;
        }

        .login-divider {
          border: none;
          border-top: 1px solid var(--staff-border);
          margin-bottom: 28px;
        }

        .login-field { margin-bottom: 20px; }

        .login-label {
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--staff-dim);
          display: block;
          margin-bottom: 8px;
        }

        .login-input {
          width: 100%;
          background: var(--staff-card);
          border: 1px solid var(--staff-border);
          color: var(--staff-text);
          font-family: var(--font-ui);
          font-size: 13px;
          padding: 11px 14px;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .login-input:focus { border-color: var(--crimson); }
        .login-input::placeholder { color: var(--staff-dim); }

        .login-error {
          background: rgba(200,16,46,0.1);
          border: 1px solid rgba(200,16,46,0.3);
          color: #f87171;
          font-family: var(--font-ui);
          font-size: 12px;
          padding: 10px 14px;
          margin-bottom: 20px;
          letter-spacing: 0.02em;
        }

        .login-btn {
          width: 100%;
          background: var(--crimson);
          color: white;
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 14px;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-btn:hover { background: var(--crimson-dk); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .login-footer {
          margin-top: 24px;
          text-align: center;
          font-family: var(--font-ui);
          font-size: 11px;
          color: var(--staff-dim);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .login-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-shell">
        <div className="login-card">
          <Image
            src="/NYAC.Website.Photos/NYAC.logo.png"
            alt="NYAC"
            width={100}
            height={28}
            className="login-logo"
            style={{ objectFit: 'contain', objectPosition: 'left' }}
          />
          <h1 className="login-heading">Staff Portal</h1>
          <span className="login-subheading">NYAC Travers Island Tennis</span>
          <hr className="login-divider" />

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email" className="login-label">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                placeholder="you@nyac.org"
              />
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                placeholder="••••••••"
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing In
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="login-footer">Staff access only</p>
        </div>
      </div>
    </>
  );
}
