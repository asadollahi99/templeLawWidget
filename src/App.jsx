import { useEffect, useMemo, useRef, useState } from "react";
import "./chat.css";
import React from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8790";
const TITLE = import.meta.env.VITE_CHAT_TITLE || "Temple Law Chat";

function SourceChips({ sources = [] }) {
  if (!sources.length) return null;
  return (
    <div className="src">
      Sources:
      {sources.map((s, i) => {
        let label = s;
        try { label = new URL(s).pathname; } catch { }
        return (
          <a key={i} href={s} target="_blank" rel="noreferrer">
            {label}
          </a>
        );
      })}
    </div>
  );
}

export default function App() {
  document.title = TITLE;
  const [sid, setSid] = useState(localStorage.getItem("tlc_sid") || "");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const logRef = useRef(null);

  const [showHist, setShowHist] = useState(false);
  const [histItems, setHistItems] = useState([]);

  const add = (role, content, sources = []) => {
    setMsgs(m => [...m, { role, content, sources, ts: new Date() }]);
  };

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const openHistory = async () => {
    if (!sid) { alert("No conversation yet."); return; }
    try {
      const r = await fetch(`${API_BASE}/history?sid=${encodeURIComponent(sid)}`);
      const j = await r.json();
      setHistItems(j.history || []);
      setShowHist(true);
    } catch (e) {
      alert("Could not load history: " + e.message);
    }
  };

  const downloadHistory = () => {
    const blob = new Blob([JSON.stringify({ sid, history: histItems }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${sid}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const send = async () => {
    const query = q.trim();
    if (!query || busy) return;
    add("user", query);
    setQ("");
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, sid }),
      });
      const j = await r.json();
      if (j.sid && !sid) {
        setSid(j.sid);
        localStorage.setItem("tlc_sid", j.sid);
      }
      add("assistant", j.answer || (j.error ? `Error: ${j.error}` : "No answer"), j.sources || []);
    } catch (e) {
      add("assistant", `Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const reset = async () => {
    if (sid) {
      try {
        await fetch(`${API_BASE}/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sid }),
        });
      } catch { }
    }
    localStorage.removeItem("tlc_sid");
    setSid("");
    setMsgs([]);
    add("assistant", "Conversation reset.");
  };

  return (
    <div className="page">
      <div className="wrap">
        <header className="hdr">
          <div className="brand">{TITLE}</div>
          <div className="hdr-actions">
            <button className="btn" onClick={openHistory} title="View chat history" disabled={!sid}>History</button>
            <button className="btn" onClick={reset} title="Reset conversation">Reset</button>
          </div>
        </header>

        <main ref={logRef} className="log">
          {msgs.length === 0 && (
            <div className="empty">
              Ask anything about <b>law.temple.edu</b>. I’ll cite sources under each answer.
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.role === "user" ? "me" : "bot"}`}>
              <div className="content">{m.content}</div>
              <div className="meta">
                {m.ts?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              {m.role === "assistant" && <SourceChips sources={m.sources} />}
            </div>
          ))}
          {busy && (
            <div className="bubble bot typing">
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}


        </main>

        <footer className="inp">
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about law.temple.edu…"
            rows={1}
          />
          <button className="btn primary" onClick={send} disabled={busy || !q.trim()}>
            Send
          </button>
        </footer>
        {/* History Modal */}
        {showHist && (
          <div className="modal-backdrop" onClick={() => setShowHist(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-hdr">
                <b>Chat History</b>
                <div className="gap"></div>
                <button className="btn" onClick={downloadHistory}>Download JSON</button>
                <button className="btn" onClick={() => setShowHist(false)}>Close</button>
              </div>
              <div className="modal-body">
                {!histItems.length && <div className="muted">No messages yet.</div>}
                {histItems.map((m, i) => (
                  <div key={i} className={`hist-row ${m.role}`}>
                    <span className="role">{m.role}</span>
                    <span className="text">{m.content}</span>
                    {m.ts && <span className="time">{new Date(m.ts).toLocaleString()}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// import React from "react";

// export default function App() {
//   return (
//     <div style={{ padding: 24 }}>
//       <h1>Temple Law Chat — Local Dev</h1>
//       <p>If you can see this, React rendered successfully.</p>
//     </div>
//   );
// }
