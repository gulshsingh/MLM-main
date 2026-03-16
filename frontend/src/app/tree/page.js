"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const NODE_R = 28;
const V_X = 200;
const V_Y = 130;
const H_X = 220;
const H_Y = 120;

// BUG FIX 2: guard against null/undefined name
function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function countDown(n) {
  if (!n) return 0;
  return 1 + countDown(n.left) + countDown(n.right);
}

function buildNodes(node, x, y, level, side, parentX, parentY, vertical, arr = []) {
  if (!node) return arr;
  arr.push({ ...node, x, y, level, side, parentX, parentY, downline: countDown(node) - 1 });
  if (vertical) {
    const dx = (V_X / (level + 1)) * 2;
    buildNodes(node.left,  x - dx, y + V_Y, level + 1, "left",  x, y, vertical, arr);
    buildNodes(node.right, x + dx, y + V_Y, level + 1, "right", x, y, vertical, arr);
  } else {
    const dy = H_Y / (level + 1) * 1.2;
    buildNodes(node.left,  x + H_X, y - dy, level + 1, "left",  x, y, vertical, arr);
    buildNodes(node.right, x + H_X, y + dy, level + 1, "right", x, y, vertical, arr);
  }
  return arr;
}

function drawArrow(ctx, x1, y1, x2, y2, col) {
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  if (len === 0) return;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const sx = x1 + (x2 - x1) * (NODE_R / len);
  const sy = y1 + (y2 - y1) * (NODE_R / len);
  const ex = x2 - (x2 - x1) * (NODE_R / len);
  const ey = y2 - (y2 - y1) * (NODE_R / len);
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash([]); ctx.stroke();
  const ah = 8;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - ah * Math.cos(angle - Math.PI / 7), ey - ah * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(ex - ah * Math.cos(angle + Math.PI / 7), ey - ah * Math.sin(angle + Math.PI / 7));
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}

export default function TreePage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef({
    scale: 1, offX: 0, offY: 0, vertical: true,
    dragging: false, lastMx: 0, lastMy: 0,
    nodes: [], searchTerm: "", highlight: null,
  });

  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoomPct, setZoomPct] = useState(100);
  const [vertical, setVertical] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, node: null });

  // BUG FIX 1: send Authorization header so backend doesn't return 401
  // BUG FIX 2: fallback name to "Unknown" if node.name is missing
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token  = localStorage.getItem("token");

    if (!userId || !token) {
      router.push("/login");
      return;
    }

    fetch(`https://mlm-main-1.onrender.com/api/users/tree/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((r) => {
        // 401 = token invalid/expired => redirect to login
        if (r.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const convert = (node) => {
          if (!node) return null;
          return {
            name:  node.name || "Unknown",  // guard: never pass undefined to getInitials
            left:  convert(node.left),
            right: convert(node.right),
          };
        };
        setTreeData(convert(data));
      })
      .catch(() => {
        // offline / CORS fallback — demo tree for development
        setTreeData({
          name: "You",
          left: {
            name: "Left User",
            left:  { name: "LL User", left: null, right: null },
            right: { name: "LR User", left: null, right: null },
          },
          right: {
            name: "Right User",
            left:  { name: "RL User", left: null, right: null },
            right: { name: "RR User", left: null, right: null },
          },
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const render = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const s = stateRef.current;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save();
    ctx.translate(s.offX, s.offY);
    ctx.scale(s.scale, s.scale);

    // connector lines
    s.nodes.forEach((n) => {
      if (n.parentX === null) return;
      const faded = s.searchTerm && !n.name.toLowerCase().includes(s.searchTerm.toLowerCase());
      const lineCol = faded
        ? "rgba(255,255,255,0.05)"
        : n.side === "left" ? "rgba(99,102,241,0.35)" : "rgba(168,85,247,0.35)";
      drawArrow(ctx, n.parentX, n.parentY, n.x, n.y, lineCol);
    });

    // node circles
    s.nodes.forEach((n) => {
      const isHL  = s.highlight && s.highlight.name === n.name;
      const faded = s.searchTerm && !n.name.toLowerCase().includes(s.searchTerm.toLowerCase());
      const alpha = faded ? 0.2 : 1;

      if (isHL) {
        ctx.beginPath(); ctx.arc(n.x, n.y, NODE_R + 7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99,102,241,0.25)"; ctx.fill();
        ctx.strokeStyle = "rgba(99,102,241,0.6)"; ctx.lineWidth = 1.5; ctx.stroke();
      }

      const g = ctx.createRadialGradient(n.x - 4, n.y - 4, 2, n.x, n.y, NODE_R);
      if (n.level === 0) {
        g.addColorStop(0, `rgba(129,140,248,${alpha})`);
        g.addColorStop(1, `rgba(99,102,241,${alpha})`);
      } else if (n.side === "left") {
        g.addColorStop(0, `rgba(99,102,241,${alpha})`);
        g.addColorStop(1, `rgba(79,70,229,${alpha})`);
      } else {
        g.addColorStop(0, `rgba(168,85,247,${alpha})`);
        g.addColorStop(1, `rgba(124,58,237,${alpha})`);
      }

      ctx.beginPath(); ctx.arc(n.x, n.y, NODE_R, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${0.2 * alpha})`; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.font = `500 12px 'DM Sans',sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(getInitials(n.name), n.x, n.y);

      ctx.fillStyle = `rgba(255,255,255,${0.7 * alpha})`;
      ctx.font = `400 10px 'DM Sans',sans-serif`;
      ctx.fillText(n.name.split(" ")[0], n.x, n.y + NODE_R + 11);

      if (n.level === 0) {
        ctx.fillStyle = "rgba(129,140,248,0.9)";
        ctx.font = `500 9px 'DM Sans',sans-serif`;
        ctx.fillText("ROOT", n.x, n.y + NODE_R + 22);
      }
    });

    // empty slot placeholders
    s.nodes.forEach((n) => {
      const sa = s.searchTerm ? 0.07 : 0.16;
      [["left", !!n.left], ["right", !!n.right]].forEach(([side, has]) => {
        if (has) return;
        let sx, sy;
        if (s.vertical) {
          sx = n.x + (side === "left" ? -1 : 1) * ((V_X / (n.level + 1)) * 2);
          sy = n.y + V_Y;
        } else {
          sx = n.x + H_X;
          sy = n.y + (side === "left" ? -1 : 1) * (H_Y / (n.level + 1) * 1.2);
        }
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(255,255,255,${sa * 0.4})`;
        ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(sx, sy, NODE_R * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${sa * 0.07})`; ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${sa})`; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${sa * 0.85})`;
        ctx.font = `400 14px 'DM Sans',sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("+", sx, sy);
      });
    });

    ctx.restore();
  }, []);

  const layoutNodes = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || !treeData) return;
    const s = stateRef.current;
    const cx = s.vertical ? cv.width / 2 : 80;
    const cy = s.vertical ? 100 : cv.height / 2;
    s.nodes = buildNodes(treeData, cx, cy, 0, "root", null, null, s.vertical);
  }, [treeData]);

  useEffect(() => {
    if (!treeData) return;
    const cv = canvasRef.current;
    const wr = wrapRef.current;
    if (!cv || !wr) return;
    const resize = () => {
      cv.width  = wr.offsetWidth;
      cv.height = wr.offsetHeight;
      layoutNodes(); render();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [treeData, layoutNodes, render]);

  useEffect(() => {
    const cv = canvasRef.current;
    const wr = wrapRef.current;
    if (!cv || !wr) return;
    const s = stateRef.current;

    const onDown = (e) => { s.dragging = true; s.lastMx = e.clientX; s.lastMy = e.clientY; };
    const onUp   = () => { s.dragging = false; };
    const onMove = (e) => {
      if (s.dragging) {
        s.offX += e.clientX - s.lastMx;
        s.offY += e.clientY - s.lastMy;
        s.lastMx = e.clientX; s.lastMy = e.clientY;
        render();
      }
      const rect = cv.getBoundingClientRect();
      const mx = (e.clientX - rect.left  - s.offX) / s.scale;
      const my = (e.clientY - rect.top - s.offY) / s.scale;
      const hit = s.nodes.find((n) => Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2) < NODE_R + 4);
      if (hit) setTooltip({ show: true, x: e.clientX - rect.left + 14, y: e.clientY - rect.top - 20, node: hit });
      else      setTooltip((t) => ({ ...t, show: false }));
    };
    const onWheel = (e) => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.1 : 0.9;
      s.scale = Math.min(Math.max(s.scale * f, 0.3), 3);
      setZoomPct(Math.round(s.scale * 100));
      render();
    };

    wr.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",    onUp);
    window.addEventListener("mousemove",  onMove);
    wr.addEventListener("wheel", onWheel, { passive: false });

    // touch support
    const onTouchStart = (e) => { if (e.touches.length === 1) { s.dragging = true; s.lastMx = e.touches[0].clientX; s.lastMy = e.touches[0].clientY; } };
    const onTouchMove  = (e) => { if (s.dragging && e.touches.length === 1) { s.offX += e.touches[0].clientX - s.lastMx; s.offY += e.touches[0].clientY - s.lastMy; s.lastMx = e.touches[0].clientX; s.lastMy = e.touches[0].clientY; render(); } };
    const onTouchEnd   = () => { s.dragging = false; };
    wr.addEventListener("touchstart", onTouchStart, { passive: true });
    wr.addEventListener("touchmove",  onTouchMove,  { passive: true });
    wr.addEventListener("touchend",   onTouchEnd);

    return () => {
      wr.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onMove);
      wr.removeEventListener("wheel", onWheel);
      wr.removeEventListener("touchstart", onTouchStart);
      wr.removeEventListener("touchmove",  onTouchMove);
      wr.removeEventListener("touchend",   onTouchEnd);
    };
  }, [render]);

  const zoomBy = (f) => {
    const s = stateRef.current;
    s.scale = Math.min(Math.max(s.scale * f, 0.3), 3);
    setZoomPct(Math.round(s.scale * 100));
    render();
  };

  const resetView = () => {
    const s = stateRef.current;
    s.scale = 1; s.offX = 0; s.offY = 0;
    setZoomPct(100);
    layoutNodes(); render();
  };

  const handleToggleLayout = () => {
    const s = stateRef.current;
    s.vertical = !s.vertical;
    setVertical(s.vertical);
    resetView();
  };

  const handleSearch = (v) => {
    const s = stateRef.current;
    setSearchVal(v);
    s.searchTerm = v.trim();
    s.highlight  = v.trim()
      ? s.nodes.find((n) => n.name.toLowerCase().includes(v.toLowerCase())) || null
      : null;
    render();
  };

  const totalMembers = treeData ? countDown(treeData) : 0;
  const maxLevel     = stateRef.current.nodes.reduce((m, n) => Math.max(m, n.level), 0);

  return (
    <div className="flex flex-col w-full min-h-screen" style={{ background: "#07040f", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes orbpulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        .tree-srch::placeholder { color: rgba(255,255,255,.3); }
        .tree-srch:focus { border-color: rgba(99,102,241,.5) !important; outline: none; }
        .ctrl:hover { background: rgba(255,255,255,.11) !important; color: #fff !important; }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="fixed rounded-full pointer-events-none" style={{ width: 400, height: 400, background: "radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 68%)", top: -100, right: -100, animation: "orbpulse 5s ease-in-out infinite" }} />
      <div className="fixed rounded-full pointer-events-none" style={{ width: 300, height: 300, background: "radial-gradient(circle,rgba(168,85,247,.08) 0%,transparent 68%)", bottom: -80, left: -80, animation: "orbpulse 5s ease-in-out infinite 2.5s" }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff" }}>Binary MLM Tree</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: ".04em" }}>Network visualization</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            ["Members", totalMembers],
            ["Levels",  maxLevel + 1],
            ["Left",    stateRef.current.nodes.filter((n) => n.side === "left").length],
            ["Right",   stateRef.current.nodes.filter((n) => n.side === "right").length],
          ].map(([label, val]) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 12px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, background: "linear-gradient(90deg,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{val}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center gap-2 px-6 py-2 flex-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
       

        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, minWidth: 40, textAlign: "center" }}>{zoomPct}%</span>

        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={handleToggleLayout}
          style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.38)", borderRadius: 8, padding: "6px 14px", color: "#a5b4fc", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
          {vertical ? "↕ Vertical" : "↔ Horizontal"}
        </motion.button>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input className="tree-srch" value={searchVal} onChange={(e) => handleSearch(e.target.value)} placeholder="Search member..."
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px 6px 30px", color: "#fff", fontSize: 12, fontFamily: "inherit", width: 180, WebkitTextFillColor: "#fff" }} />
        </div>
      </div>

      {/* Canvas */}
      <div ref={wrapRef} className="relative flex-1 z-10" style={{ cursor: "grab", minHeight: 500 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ width: 32, height: 32, border: "2px solid rgba(99,102,241,0.2)", borderTop: "2px solid #6366f1", borderRadius: "50%" }} />
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

        {/* Hover tooltip */}
        {tooltip.show && tooltip.node && (
          <div style={{ position: "absolute", top: tooltip.y, left: tooltip.x, background: "rgba(15,10,30,0.95)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, padding: "10px 14px", pointerEvents: "none", zIndex: 10, minWidth: 150 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginBottom: 5 }}>{tooltip.node.name}</div>
            {[
              ["Level",    `Level ${tooltip.node.level}`],
              ["Position", tooltip.node.level === 0 ? "Root" : tooltip.node.side.charAt(0).toUpperCase() + tooltip.node.side.slice(1)],
              ["Downline", `${tooltip.node.downline} members`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                <span>{k}</span><span style={{ color: "rgba(255,255,255,0.75)" }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex gap-3 flex-wrap">
          {[
            { color: "linear-gradient(135deg,#6366f1,#a855f7)", label: "Root" },
            { color: "#4f46e5",                                  label: "Left branch" },
            { color: "#7c3aed",                                  label: "Right branch" },
            { color: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", label: "Empty slot" },
          ].map(({ color, label, border }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, border }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}