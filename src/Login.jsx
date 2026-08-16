import React, { useState } from "react";
import { supabase } from "./supabaseClient.js";

export default function Login({ settings }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F6F3EA", fontFamily: "Inter,system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');
        .login-input{width:100%;padding:11px 13px;border-radius:8px;border:1px solid #D8CDAF;font:14px Inter;background:#FCFAF3;margin-top:5px}
        .login-btn{width:100%;padding:12px;border-radius:8px;border:0;background:#0F2544;color:#fff;font-weight:700;font-size:14px;cursor:pointer;margin-top:18px}
        .login-btn:disabled{opacity:.6;cursor:default}
        .login-btn:hover:not(:disabled){filter:brightness(1.1)}
      `}</style>
      <div style={{ background: "#fff", border: "1px solid #E4DCC8", borderRadius: 14, padding: "36px 34px", width: 360, boxShadow: "0 20px 50px -20px rgba(15,37,68,.25)" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontFamily: "Playfair Display", fontWeight: 800, fontSize: 21, color: "#0F2544" }}>
            {settings?.name || "SANTOSH EDUCATION & LEARNING CENTRE"}
          </div>
          <div style={{ fontSize: 11.5, color: "#B5924A", marginTop: 4, letterSpacing: ".08em", textTransform: "uppercase" }}>
            Sign in to continue
          </div>
        </div>
        <form onSubmit={submit}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#544A38" }}>
            Email
            <input className="login-input" type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#544A38", display: "block", marginTop: 14 }}>
            Password
            <input className="login-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          {error && <div style={{ color: "#A8433A", fontSize: 12.5, marginTop: 12 }}>{error}</div>}
          <button className="login-btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <div style={{ textAlign: "center", fontSize: 11.5, color: "#9A8F78", marginTop: 18 }}>
          Don't have an account? Ask your administrator to create one for you.
        </div>
      </div>
    </div>
  );
}
