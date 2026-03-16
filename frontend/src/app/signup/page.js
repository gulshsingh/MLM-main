"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Signup() {
  const router = useRouter();
  const canvasRef = useRef(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", parentId: "", position: "left" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(0);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", ok: true });

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.4, c: Math.random() > 0.5 ? "124,58,237" : "168,85,247",
    }));
    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},0.3)`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 85) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(124,58,237,${0.08 * (1 - d / 85)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      animId = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  const calcStrength = (v) => {
    let s = 0;
    if (v.length > 5) s += 33;
    if (/[A-Z]/.test(v)) s += 33;
    if (/[0-9!@#$%^&*]/.test(v)) s += 34;
    return s;
  };

  const strengthColor = strength < 34 ? "#dc2626" : strength < 67 ? "#d97706" : "#7c3aed";

  const showToast = (msg, ok = true) => {
    setToast({ show: true, msg, ok });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2600);
  };

 const submit = async () => {
  if (!form.name || !form.email || !form.password) {
    setShake(true);
    setTimeout(() => setShake(false), 400);
    showToast("Saare fields bharo!", false);
    return;
  }

  setLoading(true);

  const payload = {
    name: form.name,
    email: form.email,
    password: form.password,
    position: form.position,
  };

  // parentId tabhi bhejo jab value ho
  if (form.parentId && form.parentId.trim() !== "") {
    payload.parentId = form.parentId;
  }

  try {
    const res = await fetch("https://mlm-main-1.onrender.com/api/users/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
      const data = await res.json();
      if (res.ok) {
        showToast("Account created successfully!", true);
        setTimeout(() => router.push("/login"), 1200);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        showToast(data.message || "Kuch galat ho gaya", false);
      }
    } catch {
      showToast("Server se connect nahi ho paya", false);
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay },
  });

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.09)",
    border: "1.5px solid rgba(255,255,255,0.14)",
    borderRadius: 11,
    padding: "11px 12px 11px 38px",
    color: "#fff",
    fontSize: 13.5,
    fontFamily: "inherit",
    outline: "none",
    WebkitTextFillColor: "#fff",
    caretColor: "#a78bfa",
    transition: "border-color .25s, background .25s, box-shadow .25s",
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#07040f", fontFamily: "'DM Sans', sans-serif", padding: "2rem" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes orbpulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        .mlm-input::placeholder { color: rgba(255,255,255,0.32); -webkit-text-fill-color: rgba(255,255,255,0.32) !important; }
        .mlm-input:focus { border-color: #8b5cf6 !important; background: rgba(255,255,255,0.13) !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.2); }
        .mlm-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #1a0a2e inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(139,92,246,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.05) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 350, height: 350, background: "radial-gradient(circle,rgba(168,85,247,.14) 0%,transparent 68%)", top: -70, left: -80, animation: "orbpulse 6s ease-in-out infinite" }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, background: "radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 68%)", bottom: -60, right: -50, animation: "orbpulse 6s ease-in-out infinite 3s" }} />

      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -20, x: "-50%" }}
            style={{ position: "fixed", top: 20, left: "50%", zIndex: 50, background: toast.ok ? "#059669" : "#dc2626", color: "#fff", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", pointerEvents: "none" }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.84, y: 28 }} animate={{ opacity: shake ? undefined : 1, scale: 1, y: 0 }}
        animate={shake ? { x: [-8, 8, -5, 5, 0] } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, type: "spring", stiffness: 120 }}
        style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 22, padding: "2.2rem 1.8rem" }}>

        {/* Logo */}
        <motion.div initial={{ rotate: -180, scale: 0, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.9rem" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </motion.div>

        <motion.h2 {...fadeUp(0.3)} style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.55rem", color: "#fff", textAlign: "center", marginBottom: 3 }}>Create Account</motion.h2>
        <motion.p {...fadeUp(0.38)} style={{ color: "rgba(255,255,255,.35)", fontSize: 12.5, textAlign: "center", marginBottom: "1.5rem" }}>Join the Binary MLM network today</motion.p>

        {/* Name + Email row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { id: "name", placeholder: "Full name", key: "name", icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, delay: 0.42 },
            { id: "email", placeholder: "Email", key: "email", type: "email", icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>, delay: 0.48 },
          ].map(({ id, placeholder, key, type = "text", icon, delay }) => (
            <motion.div key={id} {...fadeUp(delay)} style={{ position: "relative", marginBottom: 11 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              </div>
              <input className="mlm-input" style={inputStyle} type={type} placeholder={placeholder} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </motion.div>
          ))}
        </div>

        {/* Password */}
        <motion.div {...fadeUp(0.54)} style={{ position: "relative", marginBottom: 4 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
          <input className="mlm-input" style={{ ...inputStyle, paddingRight: 38 }} type={showPass ? "text" : "password"} placeholder="Password"
            onChange={(e) => { setForm({ ...form, password: e.target.value }); setStrength(calcStrength(e.target.value)); }} />
          <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke={showPass ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)"}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </motion.div>

        {/* Strength bar */}
        {form.password && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: 2.5, background: "rgba(255,255,255,0.08)", borderRadius: 3, marginBottom: 12, overflow: "hidden" }}>
            <motion.div animate={{ width: `${strength}%` }} transition={{ duration: 0.3 }} style={{ height: "100%", background: strengthColor, borderRadius: 3 }} />
          </motion.div>
        )}

        {/* Sponsor ID */}
        <motion.div {...fadeUp(0.6)} style={{ position: "relative", marginBottom: 11 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
          </div>
          <input className="mlm-input" style={inputStyle} placeholder="Sponsor ID (optional)" onChange={(e) => setForm({ ...form, parentId: e.target.value })} />
        </motion.div>

        {/* Divider */}
        <motion.div {...fadeUp(0.66)} style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>Join position</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </motion.div>

        {/* Position toggle */}
        <motion.div {...fadeUp(0.72)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {["left", "right"].map((p) => (
            <motion.button key={p} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setForm({ ...form, position: p })}
              style={{
                padding: "10px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .2s",
                background: form.position === p ? "rgba(139,92,246,0.22)" : "rgba(255,255,255,0.06)",
                border: `1.5px solid ${form.position === p ? "rgba(139,92,246,0.55)" : "rgba(255,255,255,0.12)"}`,
                color: form.position === p ? "#c4b5fd" : "rgba(255,255,255,0.55)",
              }}>
              {p === "left" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>}
              {p.charAt(0).toUpperCase() + p.slice(1)} Node
              {p === "right" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>}
            </motion.button>
          ))}
        </motion.div>

        {/* Submit button */}
        <motion.button
          {...fadeUp(0.78)}
          whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
          onClick={submit} disabled={loading}
          style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", borderRadius: 12, padding: "12.5px", color: "#fff", fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 4px 22px rgba(124,58,237,.42),inset 0 1px 0 rgba(255,255,255,.14)", opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(255,255,255,0.28)", borderTop: "2px solid #fff", borderRadius: "50%" }} />
              Creating...
            </span>
          ) : "Create Account"}
        </motion.button>

        <motion.p {...fadeUp(0.84)} style={{ color: "rgba(255,255,255,.3)", fontSize: 12.5, textAlign: "center", marginTop: "1rem" }}>
          Already have an account?{" "}
          <span onClick={() => router.push("/login")} style={{ color: "#a78bfa", cursor: "pointer" }}>Login</span>
        </motion.p>
      </motion.div>
    </div>
  );
}