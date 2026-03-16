"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Home() {
  const canvasRef = useRef(null);

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

    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.4,
      c: Math.random() > 0.5 ? "99,102,241" : "168,85,247",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},0.35)`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - d / 90)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      animId = requestAnimationFrame(draw);
    };
    draw();

    // Count up animation
    const countUp = (id, target) => {
      const el = document.getElementById(id);
      if (!el) return;
      let v = 0; const step = Math.ceil(target / 40);
      const t = setInterval(() => {
        v = Math.min(v + step, target);
        el.textContent = v.toLocaleString();
        if (v >= target) clearInterval(t);
      }, 35);
    };
    setTimeout(() => { countUp("s1", 1240); countUp("s2", 3870); countUp("s3", 12); }, 600);

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#08050f", fontFamily: "'DM Sans', sans-serif", padding: "3rem 2rem" }}>

      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* Canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Center glow */}
      <div className="absolute rounded-full pointer-events-none" style={{
        width: 500, height: 500,
        background: "radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 65%)",
        top: "50%", left: "50%", transform: "translate(-50%,-50%)"
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full mb-7 px-4 py-1.5 text-xs tracking-widest uppercase"
          style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)", color: "#a5b4fc" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Binary Network MLM System
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, lineHeight: 1.05, color: "#fff", fontSize: "clamp(2.4rem,6vw,3.8rem)", marginBottom: "0.5rem" }}>
          Build Your<br />
          <span style={{ background: "linear-gradient(90deg,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Binary Empire
          </span>
        </h1>
        <p className="mb-12" style={{ color: "rgba(255,255,255,0.38)", fontSize: 15, fontWeight: 300, letterSpacing: "0.04em" }}>
          Grow your network. Track earnings. Dominate the tree.
        </p>

        {/* Buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/login">
            <button className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-medium text-white transition-all"
              style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", cursor: "pointer", boxShadow: "0 4px 24px rgba(99,102,241,0.38)", fontFamily: "inherit" }}
              onMouseOver={e => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.55)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(99,102,241,0.38)"; }}>
              Login <span>→</span>
            </button>
          </Link>
          <Link href="/signup">
            <button className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.75)", cursor: "pointer", fontFamily: "inherit" }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; e.currentTarget.style.transform = ""; }}>
              Sign Up <span>→</span>
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-10 mt-14">
          {[["s1","Members"],["s2","Nodes"],["s3","Levels"]].map(([id,label],i) => (
            <div key={id} className="flex items-center gap-10">
              {i > 0 && <div style={{ width:1, height:32, background:"rgba(255,255,255,0.08)" }} />}
              <div className="text-center">
                <div id={id} style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, background:"linear-gradient(90deg,#818cf8,#c084fc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>0</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Binary Tree SVG */}
        <div className="mt-10">
          <svg width="320" height="130" viewBox="0 0 320 130">
            <defs>
              <radialGradient id="ng" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.7"/>
              </radialGradient>
            </defs>
            {[["160","24","90","74"],["160","24","230","74"],["90","74","55","114"],["90","74","125","114"],["230","74","195","114"],["230","74","265","114"]].map(([x1,y1,x2,y2],i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i<2?"rgba(99,102,241,0.25)":"rgba(99,102,241,0.18)"} strokeWidth={i<2?1.5:1}/>
            ))}
            <circle cx="160" cy="22" r="16" fill="url(#ng)"/>
            <text x="160" y="26" textAnchor="middle" fill="white" fontSize="9" fontFamily="DM Sans,sans-serif">YOU</text>
            <circle cx="90" cy="72" r="13" fill="rgba(99,102,241,0.5)"/>
            <text x="90" y="76" textAnchor="middle" fill="white" fontSize="8" fontFamily="DM Sans,sans-serif">L1</text>
            <circle cx="230" cy="72" r="13" fill="rgba(168,85,247,0.5)"/>
            <text x="230" y="76" textAnchor="middle" fill="white" fontSize="8" fontFamily="DM Sans,sans-serif">R1</text>
            {[[55,112],[125,112],[195,112],[265,112]].map(([cx,cy],i) => (
              <circle key={i} cx={cx} cy={cy} r="10" fill={i<2?"rgba(99,102,241,0.3)":"rgba(168,85,247,0.3)"}/>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}