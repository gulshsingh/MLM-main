"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const router = useRouter();
  const canvasRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [strength, setStrength] = useState(0);
  const [toast, setToast] = useState({ show: false, msg: "" });

  // ─── Particle canvas ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const N = window.innerWidth < 600 ? 25 : 55;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.38,
      vy: (Math.random() - 0.5) * 0.38,
      r: Math.random() * 1.8 + 0.4,
      c: Math.random() > 0.5 ? "99,102,241" : "168,85,247",
      o: Math.random() * 0.45 + 0.1,
    }));

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.o})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 82) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.1 * (1 - d / 82)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      animId = requestAnimationFrame(frame);
    };
    frame();

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────
  const calcStrength = (v) => {
    let s = 0;
    if (v.length > 5) s += 33;
    if (/[A-Z]/.test(v)) s += 33;
    if (/[0-9!@#$%]/.test(v)) s += 34;
    return s;
  };
  const strengthColor = strength < 34 ? "#dc2626" : strength < 67 ? "#d97706" : "#6366f1";

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2500);
  };

  // ─── Login handler ────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) {
      setShake(true); setTimeout(() => setShake(false), 400);
      showToast("Email aur password dono bharo!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user._id);
        setSuccess(true);
        setTimeout(() => router.push("/tree"), 1200);
      } else {
        setShake(true); setTimeout(() => setShake(false), 400);
        showToast(data.message || "Login failed");
      }
    } catch {
      showToast("Server se connect nahi ho paya");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  // ─── Shared styles ────────────────────────────────────────────
  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.09)",
    border: "1.5px solid rgba(255,255,255,0.14)",
    borderRadius: 12,
    padding: "12px 13px 12px 40px",
    color: "#fff",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    WebkitTextFillColor: "#fff",
    caretColor: "#a5b4fc",
    transition: "border-color .25s, background .25s, box-shadow .25s",
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay },
  });

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#07040f", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes orbpulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        .mlm-inp::placeholder { color:rgba(255,255,255,0.32);-webkit-text-fill-color:rgba(255,255,255,0.32)!important; }
        .mlm-inp:focus { border-color:#818cf8!important;background:rgba(255,255,255,0.13)!important;box-shadow:0 0 0 3px rgba(99,102,241,0.2); }
        .mlm-inp:-webkit-autofill { -webkit-box-shadow:0 0 0 1000px #1a1035 inset!important;-webkit-text-fill-color:#fff!important; }
      `}</style>

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      {/* Glow orbs */}
      <div className="absolute rounded-full pointer-events-none" style={{ width: 320, height: 320, background: "radial-gradient(circle,rgba(99,102,241,.16) 0%,transparent 68%)", top: -70, right: -60, animation: "orbpulse 5s ease-in-out infinite" }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 260, height: 260, background: "radial-gradient(circle,rgba(168,85,247,.12) 0%,transparent 68%)", bottom: -50, left: -50, animation: "orbpulse 5s ease-in-out infinite 2.5s" }} />

      {/* Toast notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -16, x: "-50%" }}
            style={{ position: "fixed", top: 20, left: "50%", zIndex: 50, background: "#dc2626", color: "#fff", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", pointerEvents: "none" }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.84, y: 26 }}
        animate={shake ? { x: [-8, 8, -6, 6, 0], opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, type: "spring", stiffness: 120 }}
        className="relative z-10 w-full mx-4"
        style={{ maxWidth: 390, background: "rgba(255,255,255,0.065)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 22, padding: "2.3rem 2rem" }}
      >
        {/* Success overlay */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-20"
              style={{ background: "rgba(7,4,15,0.92)", borderRadius: 22 }}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 180, delay: 0.15 }}
                style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 0 36px rgba(16,185,129,0.45)" }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>Login Successful!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logo */}
        <motion.div
          initial={{ rotate: -180, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", boxShadow: "0 0 28px rgba(99,102,241,0.45)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
        </motion.div>

        <motion.h2 {...fadeUp(0.3)} style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#fff", textAlign: "center", marginBottom: 3 }}>
          Binary MLM
        </motion.h2>
        <motion.p {...fadeUp(0.38)} style={{ color: "rgba(255,255,255,0.35)", fontSize: 12.5, textAlign: "center", marginBottom: "1.6rem", letterSpacing: ".02em" }}>
          Welcome back — sign in to continue
        </motion.p>

        {/* Email */}
        <motion.div {...fadeUp(0.44)} style={{ position: "relative", marginBottom: 12 }}>
          <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <input className="mlm-inp" style={inputStyle} type="email" placeholder="Email address" value={email}
            onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKey} autoComplete="email" />
        </motion.div>

        {/* Password */}
        <motion.div {...fadeUp(0.52)} style={{ position: "relative", marginBottom: 4 }}>
          <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <input className="mlm-inp" style={{ ...inputStyle, paddingRight: 40 }}
            type={showPass ? "text" : "password"} placeholder="Password" value={password}
            onChange={(e) => { setPassword(e.target.value); setStrength(calcStrength(e.target.value)); }}
            onKeyDown={handleKey} autoComplete="current-password" />
          <button onClick={() => setShowPass(!showPass)} type="button"
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              stroke={showPass ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.35)"}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </motion.div>

        {/* Strength bar */}
        {password && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ height: 2.5, background: "rgba(255,255,255,0.08)", borderRadius: 3, marginBottom: 14, overflow: "hidden" }}>
            <motion.div animate={{ width: `${strength}%` }} transition={{ duration: 0.3 }}
              style={{ height: "100%", background: strengthColor, borderRadius: 3 }} />
          </motion.div>
        )}

        {/* Remember me + Forgot */}
        <motion.div {...fadeUp(0.6)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 12px", display: "flex", alignItems: "center", gap: 7 }}>
            <input type="checkbox" id="rem" style={{ accentColor: "#6366f1", cursor: "pointer", width: 14, height: 14 }} />
            <label htmlFor="rem" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12.5, cursor: "pointer" }}>Remember me</label>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 12, color: "#818cf8", cursor: "pointer" }}>Forgot password?</span>
          </div>
        </motion.div>

        {/* Submit button */}
        <motion.button
          {...fadeUp(0.66)}
          whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
          onClick={handleLogin} disabled={loading}
          style={{ width: "100%", background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", borderRadius: 12, padding: "13px", color: "#fff", fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 4px 22px rgba(99,102,241,0.42),inset 0 1px 0 rgba(255,255,255,0.15)", opacity: loading ? 0.7 : 1, transition: "box-shadow .22s" }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(255,255,255,0.28)", borderTop: "2px solid #fff", borderRadius: "50%" }} />
              Logging in...
            </span>
          ) : "Login"}
        </motion.button>

       
       

        <motion.p {...fadeUp(0.84)} style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", marginTop: "1.1rem" }}>
          Don't have an account?{" "}
          <span onClick={() => router.push("/signup")} style={{ color: "#818cf8", cursor: "pointer" }}>Sign up</span>
        </motion.p>
      </motion.div>
    </div>
  );
}