import React, { useState } from "react";
import { supabase } from "./supabaseClient.js";

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="#7A6F5C" strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="#7A6F5C" strokeWidth="1.6"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
      <path d="M3 3l18 18M9.9 5.2C10.6 5.07 11.3 5 12 5c6.5 0 10 7 10 7-.6 1.1-1.7 2.7-3.3 4.1M6.3 6.3C4.1 7.8 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.8-.9M9.9 14.1a3 3 0 0 0 4.2-4.2" stroke="#7A6F5C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Login({ settings }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message || "Could not sign in. Check your email and password.");
  }

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#F6F3EA", fontFamily: "Inter,system-ui,sans-serif", padding: "24px 16px", boxSizing: "border-box" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');
        *{box-sizing:border-box}
        .login-wrap{width:100%;max-width:380px}
        .login-card{background:#fff;border:1px solid #E4DCC8;border-radius:14px;padding:32px 26px;box-shadow:0 20px 50px -20px rgba(15,37,68,.25)}
        .login-input{width:100%;padding:13px 14px;border-radius:8px;border:1px solid #D8CDAF;font-size:16px;font-family:Inter;background:#FCFAF3;margin-top:6px;-webkit-appearance:none;appearance:none}
        .login-input:focus{outline:2px solid #DDA13A;outline-offset:1px}
        .pw-wrap{position:relative;margin-top:6px}
        .pw-wrap .login-input{margin-top:0;padding-right:44px}
        .pw-toggle{position:absolute;right:0;top:0;bottom:0;width:44px;display:flex;align-items:center;justify-content:center;background:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
        .login-btn{width:100%;padding:14px;border-radius:8px;border:0;background:#0F2544;color:#fff;font-weight:700;font-size:15px;cursor:pointer;margin-top:20px;-webkit-tap-highlight-color:transparent}
        .login-btn:disabled{opacity:.6;cursor:default}
        .login-btn:hover:not(:disabled){filter:brightness(1.1)}
        .login-btn:active:not(:disabled){transform:scale(.98)}
        @media (max-width:400px){
          .login-card{padding:26px 20px;border-radius:12px}
        }
      `}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "Playfair Display", fontWeight: 800, fontSize: "clamp(17px, 5vw, 21px)", color: "#0F2544", lineHeight: 1.3 }}>
              {settings?.name || "SANTOSH EDUCATION & LEARNING CENTRE"}
            </div>
            <div style={{ fontSize: 11.5, color: "#B5924A", marginTop: 6, letterSpacing: ".08em", textTransform: "uppercase" }}>
              Sign in to continue
            </div>
          </div>
          <form onSubmit={submit}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#544A38", display: "block" }}>
              Email
              <input className="login-input" type="email" inputMode="email" autoComplete="username" required autoFocus value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#544A38", display: "block", marginTop: 16 }}>
              Password
              <div className="pw-wrap">
                <input className="login-input" type={showPw ? "text" : "password"} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)} aria-label={showPw ? "Hide password" : "Show password"}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </label>
            {error && <div style={{ color: "#A8433A", fontSize: 13, marginTop: 14, lineHeight: 1.4 }}>{error}</div>}
            <button className="login-btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          <div style={{ textAlign: "center", fontSize: 11.5, color: "#9A8F78", marginTop: 20, lineHeight: 1.5 }}>
            Don't have an account? Ask your administrator to create one for you.
          </div>
        </div>
      </div>
    </div>
  );
}
