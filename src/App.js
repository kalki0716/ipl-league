import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, onSnapshot,
  addDoc, deleteDoc, doc, query, orderBy
} from "firebase/firestore";

// ─── 🔥 YOUR FIREBASE CONFIG ──────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDnqYQjMNMI2UCEDi0FHPv9UTzrm_zju_8",
  authDomain: "ipl-friends-league.firebaseapp.com",
  projectId: "ipl-friends-league",
  storageBucket: "ipl-friends-league.firebasestorage.app",
  messagingSenderId: "1074393387493",
  appId: "1:1074393387493:web:e75bf9888e9310d3af9f0c"
};
// ─────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAYERS = ["Chandan Bhai", "Kalki", "Aswani Bhai", "Sagar Bhai", "Silu Bhai", "Sai Bhai"];
const RANK_POINTS = { 1: 100, 2: 75, 3: 50, 4: -50, 5: -75, 6: -100, NA: 0 };
const RANK_LABELS = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th" };
const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ec4899", "#8b5cf6", "#f97316"];
const EMOJIS = ["🦁", "🐯", "🦊", "🐺", "🦅", "🐉"];

// ─── Utilities ────────────────────────────────────────────────────────────────
const getPts = (rank) => (rank === "NA" ? 0 : (RANK_POINTS[rank] ?? 0));

const getBoard = (matches) => {
  const t = {};
  PLAYERS.forEach((p) => (t[p] = 0));
  matches.forEach((m) => PLAYERS.forEach((p) => (t[p] += getPts(m.ranks[p]))));
  return PLAYERS.map((name, i) => ({ name, total: t[name], color: COLORS[i], emoji: EMOJIS[i] }))
    .sort((a, b) => b.total - a.total)
    .map((p, i) => ({ ...p, rank: i + 1 }));
};

const getLineData = (matches) => {
  const run = {};
  PLAYERS.forEach((p) => (run[p] = 0));
  return matches.map((m, i) => {
    const pt = { label: `M${i + 1}` };
    PLAYERS.forEach((p) => { run[p] += getPts(m.ranks[p]); pt[p] = run[p]; });
    return pt;
  });
};

// ─── PlayerCard ───────────────────────────────────────────────────────────────
function PlayerCard({ player, rank }) {
  const [hov, setHov] = useState(false);
  const isFirst = rank === 1;
  const isLast = rank === 6;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: isFirst
          ? "linear-gradient(135deg,#1a1200,#2a1f00)"
          : isLast
          ? "linear-gradient(135deg,#1a0000,#2a0808)"
          : "linear-gradient(135deg,#111827,#1f2937)",
        border: `1px solid ${isFirst ? "#f59e0b55" : isLast ? "#ef444455" : "#ffffff11"}`,
        borderRadius: 16, padding: "18px 12px", textAlign: "center", position: "relative",
        transition: "transform .2s,box-shadow .2s", cursor: "default",
        transform: hov ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hov
          ? (isFirst ? "0 12px 36px #f59e0b55" : isLast ? "0 12px 36px #ef444455" : "0 12px 28px #00000099")
          : (isFirst ? "0 4px 20px #f59e0b33" : isLast ? "0 4px 20px #ef444433" : "0 2px 12px #00000066"),
      }}
    >
      {isFirst && <div style={{ position: "absolute", top: 7, right: 9, fontSize: 16 }}>👑</div>}
      {isLast && <div style={{ position: "absolute", top: 7, right: 9, fontSize: 16 }}>🔻</div>}
      <div style={{ fontSize: 30, marginBottom: 4 }}>{player.emoji}</div>
      <div style={{ color: player.color, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
        <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: player.color, boxShadow: `0 0 5px ${player.color}`, marginRight: 5 }} />
        {player.name}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: isFirst ? "#f59e0b" : isLast ? "#ef4444" : "#f1f5f9", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>
        {player.total > 0 ? "+" : ""}{player.total}
      </div>
      <div style={{ color: "#64748b", fontSize: 11, marginTop: 2, letterSpacing: 2 }}>{RANK_LABELS[rank]}</div>
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function Leaderboard({ board }) {
  return (
    <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid #ffffff11", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px #00000066" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #ffffff11", color: "#94a3b8", fontWeight: 700, letterSpacing: 2, fontSize: 11 }}>🏆 LEADERBOARD</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#ffffff08" }}>
            {["#", "Player", "Points", ""].map((h) => (
              <th key={h} style={{ padding: "9px 14px", textAlign: h === "Points" ? "right" : "left", color: "#64748b", fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {board.map((p, i) => (
            <tr key={p.name} style={{ background: p.rank === 1 ? "#f59e0b08" : p.rank === 6 ? "#ef44440a" : i % 2 === 0 ? "#ffffff03" : "transparent", borderBottom: "1px solid #ffffff06" }}>
              <td style={{ padding: "11px 14px", color: "#64748b", fontWeight: 700 }}>{p.rank}</td>
              <td style={{ padding: "11px 14px" }}>
                <span style={{ fontSize: 18, marginRight: 7 }}>{p.emoji}</span>
                <span style={{ color: p.color, fontWeight: 600, fontSize: 13 }}>{p.name}</span>
              </td>
              <td style={{ padding: "11px 14px", textAlign: "right" }}>
                <span style={{ color: p.total >= 0 ? "#10b981" : "#ef4444", fontWeight: 800, fontSize: 15, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>
                  {p.total > 0 ? "+" : ""}{p.total}
                </span>
              </td>
              <td style={{ padding: "11px 14px" }}>{p.rank === 1 ? "👑" : p.rank === 6 ? "🔻" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MatchForm ────────────────────────────────────────────────────────────────
function MatchForm({ onAdd }) {
  const init = () => { const r = {}; PLAYERS.forEach((p) => (r[p] = "")); return r; };
  const [form, setForm] = useState({
    matchNumber: "",
    date: new Date().toISOString().slice(0, 10),
    match: "",
    ranks: init()
  });
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!form.matchNumber || !form.date || !form.match) return "Fill all match details.";
    const numbers = PLAYERS
      .filter((p) => form.ranks[p] !== "NA")
      .map((p) => parseInt(form.ranks[p]));
    if (numbers.some((x) => isNaN(x) || x < 1 || x > 6)) return "Ranks must be between 1–6 or N/A.";
    if (new Set(numbers).size !== numbers.length) return "Duplicate ranks not allowed.";
    return "";
  };

  const submit = async () => {
    const e = validate();
    if (e) { setErr(e); return; }
    setErr("");
    setSubmitting(true);
    const ranks = {};
    PLAYERS.forEach((p) => {
      ranks[p] = form.ranks[p] === "NA" ? "NA" : parseInt(form.ranks[p]);
    });
    await onAdd({ ...form, matchNumber: parseInt(form.matchNumber), ranks });
    setForm({ matchNumber: "", date: new Date().toISOString().slice(0, 10), match: "", ranks: init() });
    setSubmitting(false);
  };

  const inp = { background: "#0a0f1a", border: "1px solid #ffffff22", borderRadius: 8, padding: "8px 11px", color: "#f1f5f9", fontSize: 13, width: "100%" };

  return (
    <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid #ffffff11", borderRadius: 16, padding: 22, boxShadow: "0 4px 24px #00000066" }}>
      <div style={{ color: "#94a3b8", fontWeight: 700, letterSpacing: 2, fontSize: 11, marginBottom: 18 }}>⚡ ADD MATCH RESULT</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
        {[["Match #", "matchNumber", "number", "12"], ["Date", "date", "date", ""], ["Teams", "match", "text", "MI vs CSK"]].map(([label, key, type, ph]) => (
          <div key={key}>
            <label style={{ color: "#64748b", fontSize: 10, letterSpacing: 1, display: "block", marginBottom: 3 }}>{label}</label>
            <input type={type} placeholder={ph} value={form[key]} onChange={(ev) => setForm((f) => ({ ...f, [key]: ev.target.value }))} style={inp} />
          </div>
        ))}
      </div>
      <div style={{ color: "#64748b", fontSize: 10, letterSpacing: 1, marginBottom: 9 }}>ASSIGN RANKS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginBottom: 18 }}>
        {PLAYERS.map((p, i) => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 7, background: "#ffffff05", borderRadius: 8, padding: "7px 10px" }}>
            <span style={{ fontSize: 16 }}>{EMOJIS[i]}</span>
            <span style={{ color: COLORS[i], fontSize: 11, fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p}</span>
            <select
              value={form.ranks[p]}
              onChange={(ev) => setForm((f) => ({ ...f, ranks: { ...f.ranks, [p]: ev.target.value } }))}
              style={{ background: "#0a0f1a", border: "1px solid #ffffff22", borderRadius: 6, padding: "5px 7px", color: "#f1f5f9", fontSize: 12 }}
            >
              <option value="">–</option>
              <option value="NA">N/A</option>
              {[1, 2, 3, 4, 5, 6].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        ))}
      </div>
      {err && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 11, padding: "7px 11px", background: "#ef444411", borderRadius: 8 }}>⚠ {err}</div>}
      <button
        onClick={submit}
        disabled={submitting}
        style={{ background: submitting ? "#334155" : "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 10, padding: "11px 24px", color: submitting ? "#94a3b8" : "#000", fontWeight: 800, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer", letterSpacing: 1, boxShadow: "0 4px 14px #f59e0b55" }}
      >
        {submitting ? "Saving to Firebase..." : "+ SUBMIT RESULT"}
      </button>
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────
function Charts({ matches, board }) {
  const barData = board.map((p) => ({ name: p.name.split(" ")[0], Points: p.total, color: p.color }));
  const lineData = getLineData(matches);

  // ✅ Fixed: no payload?.length (causes no-self-compare ESLint error)
  function CBar({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;
    const val = payload[0].value;
    return (
      <div style={{ background: "#1e293b", border: "1px solid #ffffff22", borderRadius: 8, padding: "9px 13px" }}>
        <div style={{ color: "#94a3b8", fontSize: 11 }}>{label}</div>
        <div style={{ color: val >= 0 ? "#10b981" : "#ef4444", fontWeight: 800, fontSize: 17, fontFamily: "'Bebas Neue',sans-serif" }}>
          {val > 0 ? "+" : ""}{val}
        </div>
      </div>
    );
  }

  function CLine({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div style={{ background: "#1e293b", border: "1px solid #ffffff22", borderRadius: 8, padding: "9px 13px" }}>
        <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 5 }}>{label}</div>
        {payload.map((e) => (
          <div key={e.name} style={{ color: e.color, fontSize: 12, fontWeight: 600 }}>
            {e.name.split(" ")[0]}: {e.value > 0 ? "+" : ""}{e.value}
          </div>
        ))}
      </div>
    );
  }

  const wrap = (title, child) => (
    <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid #ffffff11", borderRadius: 16, padding: 22, boxShadow: "0 4px 24px #00000066" }}>
      <div style={{ color: "#94a3b8", fontWeight: 700, letterSpacing: 2, fontSize: 11, marginBottom: 18 }}>{title}</div>
      {child}
    </div>
  );

  if (!matches.length) {
    return wrap("📊 CHARTS", <div style={{ textAlign: "center", color: "#334155", padding: "40px 0" }}>Add matches to see charts 📊</div>);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      {wrap("📊 TOTAL POINTS",
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -14 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
            <Tooltip content={<CBar />} cursor={{ fill: "#ffffff08" }} />
            <Bar dataKey="Points" radius={[6, 6, 0, 0]}>
              {barData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      {wrap("📈 PERFORMANCE OVER TIME",
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData} margin={{ top: 0, right: 0, bottom: 0, left: -14 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
            <Tooltip content={<CLine />} />
            <Legend wrapperStyle={{ color: "#64748b", fontSize: 10 }} formatter={(v) => v.split(" ")[0]} />
            {PLAYERS.map((p, i) => (
              <Line key={p} type="monotone" dataKey={p} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Match History ────────────────────────────────────────────────────────────
function History({ matches, onDelete }) {
  if (!matches.length) {
    return (
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid #ffffff11", borderRadius: 16, padding: 36, textAlign: "center", color: "#334155", boxShadow: "0 4px 24px #00000066" }}>
        No matches yet — add your first! 🏏
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[...matches].reverse().map((m) => (
        <div key={m.id} style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid #ffffff11", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px #00000066" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #ffffff11", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 13, marginRight: 10 }}>M{m.matchNumber}</span>
              <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>{m.match}</span>
              <span style={{ color: "#475569", fontSize: 11, marginLeft: 10 }}>{m.date}</span>
            </div>
            <button onClick={() => onDelete(m.id)} style={{ background: "#ef444411", border: "1px solid #ef444433", borderRadius: 7, padding: "4px 10px", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>🗑 Delete</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
            {PLAYERS.map((p, i) => {
              // ✅ Fixed: calculate pts separately to avoid ?? precedence bug
              const pts = getPts(m.ranks[p]);
              const isNA = m.ranks[p] === "NA";
              return (
                <div key={p} style={{ padding: "10px 14px", borderRight: i % 3 !== 2 ? "1px solid #ffffff06" : "none", borderBottom: "1px solid #ffffff06" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 14 }}>{EMOJIS[i]}</span>
                    <span style={{ color: COLORS[i], fontSize: 11, fontWeight: 700 }}>{p.split(" ")[0]}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b", fontSize: 11 }}>
                      {isNA ? "N/A" : RANK_LABELS[m.ranks[p]]}
                    </span>
                    <span style={{ color: isNA ? "#64748b" : pts > 0 ? "#10b981" : "#ef4444", fontWeight: 800, fontSize: 14, fontFamily: "'Bebas Neue',sans-serif" }}>
                      {isNA ? "–" : (pts > 0 ? "+" : "") + pts}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Top Performer Banner ─────────────────────────────────────────────────────
function Banner({ matches }) {
  if (!matches.length) return null;
  const last = matches[matches.length - 1];

  // ✅ Fixed: skip NA ranks when finding winner
  const activePlayers = PLAYERS.filter((p) => last.ranks[p] !== "NA" && last.ranks[p] !== "");
  if (activePlayers.length === 0) return null;

  const winner = activePlayers.reduce((b, p) => {
    const rankP = Number(last.ranks[p]);
    const rankB = Number(last.ranks[b]);
    return rankP < rankB ? p : b;
  }, activePlayers[0]);

  const idx = PLAYERS.indexOf(winner);
  return (
    <div style={{ background: "linear-gradient(135deg,#1a1200,#2a1f00)", border: "1px solid #f59e0b44", borderRadius: 16, padding: "14px 22px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 22px #f59e0b22" }}>
      <div style={{ fontSize: 30 }}>🏆</div>
      <div>
        <div style={{ color: "#f59e0b", fontWeight: 700, letterSpacing: 2, fontSize: 10 }}>TOP PERFORMER — MATCH {last.matchNumber}</div>
        <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 17, marginTop: 2 }}>
          {EMOJIS[idx]} {winner}
          <span style={{ color: "#64748b", fontWeight: 400, fontSize: 12, marginLeft: 8 }}>{last.match}</span>
        </div>
      </div>
      <div style={{ marginLeft: "auto", textAlign: "right" }}>
        <div style={{ color: "#10b981", fontSize: 11, fontWeight: 700 }}>🔴 LIVE — Synced across all devices</div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    const q = query(collection(db, "matches"), orderBy("matchNumber", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd = useCallback(async (match) => {
    await addDoc(collection(db, "matches"), match);
  }, []);

  const handleDelete = useCallback(async (id) => {
    await deleteDoc(doc(db, "matches", id));
  }, []);

  const board = getBoard(matches);
  const tabs = [
    ["dashboard", "🏏 Dashboard"],
    ["add", "⚡ Add Match"],
    ["charts", "📊 Charts"],
    ["history", "📋 History"]
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#060b14;font-family:'DM Sans',sans-serif;color:#f1f5f9;min-height:100vh}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1)}
        select option{background:#1e293b}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0f172a}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 20% 10%,#f59e0b08 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,#3b82f608 0%,transparent 50%)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1050, margin: "0 auto", padding: "0 14px 50px" }}>

        {/* Header */}
        <div style={{ paddingTop: 28, paddingBottom: 20, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>🏏</span>
            <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(28px,5vw,46px)", letterSpacing: 4, background: "linear-gradient(135deg,#f59e0b,#fbbf24,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              IPL FRIENDS LEAGUE
            </h1>
          </div>
          <div style={{ color: "#475569", fontSize: 11, letterSpacing: 3 }}>
            PRIVATE FANTASY TRACKER • {loading ? "Connecting..." : `${matches.length} MATCHES PLAYED`}
            {!loading && <span style={{ marginLeft: 10, color: "#10b981" }}>🔴 LIVE</span>}
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: "flex", gap: 7, marginBottom: 22, flexWrap: "wrap" }}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ background: tab === id ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#ffffff08", border: tab === id ? "none" : "1px solid #ffffff11", borderRadius: 9, padding: "8px 16px", color: tab === id ? "#000" : "#94a3b8", fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 0.5, transition: "all .15s", boxShadow: tab === id ? "0 4px 14px #f59e0b44" : "none" }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #ffffff11", borderTop: "3px solid #f59e0b", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
            <div style={{ color: "#475569", fontSize: 13 }}>Connecting to Firebase...</div>
          </div>
        ) : (
          <>
            {tab === "dashboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <Banner matches={matches} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
                  {board.map((p) => <PlayerCard key={p.name} player={p} rank={p.rank} />)}
                </div>
                <Leaderboard board={board} />
              </div>
            )}
            {tab === "add" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <MatchForm onAdd={handleAdd} />
                <div style={{ color: "#475569", fontSize: 11, letterSpacing: 1, padding: "10px 14px", background: "#ffffff05", borderRadius: 10, border: "1px solid #ffffff08" }}>
                  POINTS GUIDE: 1st = +100 · 2nd = +75 · 3rd = +50 · 4th = −50 · 5th = −75 · 6th = −100 · N/A = 0
                </div>
              </div>
            )}
            {tab === "charts" && <Charts matches={matches} board={board} />}
            {tab === "history" && <History matches={matches} onDelete={handleDelete} />}
          </>
        )}
      </div>
    </>
  );
}
