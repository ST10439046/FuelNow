import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userRepository } from "../repositories/UserRepository";
import Button from "../components/Button";

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("safwaan@fuelnow.co.za");
  const [password, setPassword] = useState("admin1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await userRepository.adminLogin(email, password);
      localStorage.setItem("admin_token", token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #111827 0%, #1F2937 50%, #111827 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background accent */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(249,115,22,0.07)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(37,99,235,0.05)",
          }}
        />
        {/* Grid lines */}
        <svg width="100%" height="100%" style={{ opacity: 0.04 }}>
          {Array.from({ length: 20 }, (_, i) => (
            <React.Fragment key={i}>
              <line
                x1={i * 80}
                y1={0}
                x2={i * 80}
                y2="100%"
                stroke="#fff"
                strokeWidth={1}
              />
              <line
                x1={0}
                y1={i * 80}
                x2="100%"
                y2={i * 80}
                stroke="#fff"
                strokeWidth={1}
              />
            </React.Fragment>
          ))}
        </svg>
      </div>

      <div style={{ width: 440, animation: "fadeIn 0.4s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "var(--petrol-deep)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              margin: "0 auto 16px",
              boxShadow: "0 0 0 8px rgba(249,115,22,0.15)",
            }}
          >
            ⛽
          </div>
          <h1
            style={{
              color: "#fff",
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            FuelNow Admin
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
            Staff access only — South Africa operations
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "var(--radius-xl)",
            padding: "36px 40px",
          }}
        >
          <h2
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Sign in to continue
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              marginBottom: 28,
            }}
          >
            Enter your admin credentials below
          </p>

          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.65)",
                  marginBottom: 6,
                }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@fuelnow.co.za"
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--petrol-deep)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.65)",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--petrol-deep)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")
                }
              />
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  color: "#FCA5A5",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            >
              Sign in to Admin Console
            </Button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.25)",
            fontSize: 12,
            marginTop: 24,
          }}
        >
          FuelNow © 2025 · Authorised personnel only
        </p>
      </div>
    </div>
  );
}
