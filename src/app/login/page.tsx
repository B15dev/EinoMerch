"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="card" style={{ padding: 40, width: "100%", maxWidth: 400 }}>
        <div
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: 32,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          MerchStore
        </div>
        <p style={{ textAlign: "center", color: "var(--text-light)", marginBottom: 28 }}>
          Sign in to your account
        </p>
        <form
          action={(fd) => {
            setError("");
            start(async () => {
              const res = await loginAction(fd);
              if (res?.error) setError(res.error);
            });
          }}
        >
          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" type="email" required className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" required className="form-input" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} disabled={pending}>
            {pending ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-faint)" }}>
          <Link href="/">← Back to store</Link>
        </p>
      </div>
    </div>
  );
}
