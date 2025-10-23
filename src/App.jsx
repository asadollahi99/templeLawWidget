import { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./chat.css";
import templeLogo from "./assets/temple-logo.png"; // your Temple logo file

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8790";
const TITLE = import.meta.env.VITE_CHAT_TITLE || "Temple Law Chat";

// Theme colors
const THEME_ACCENT = "#7b1e1e"; // deep maroon
const THEME_GRADIENT = "linear-gradient(90deg, #7b1e1e 0%, #34495e 100%)";

function SourceChips({ sources = [] }) {
  if (!sources.length) return null;
  return (
    <div className="src mt-2">
      <b>Sources:</b>{" "}
      {sources.slice(0, 4).map((s, i) => {
        let label = s;
        try {
          label = new URL(s).pathname;
        } catch { }
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
  const [showHist, setShowHist] = useState(false);
  const [histItems, setHistItems] = useState([]);
  const logRef = useRef(null);

  const add = (role, content, sources = [], mid = null) =>
    setMsgs((m) => [...m, { mid, role, content, sources, ts: new Date() }]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const openHistory = async () => {
    if (!sid) return alert("No conversation yet.");
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
    const blob = new Blob([JSON.stringify({ sid, history: histItems }, null, 2)], {
      type: "application/json",
    });
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
      add("assistant", j.answer || (j.error ? `Error: ${j.error}` : "No answer"), j.sources || [], j.mid);
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

    const notice = document.createElement("div");
    notice.textContent = "Conversation reset.";
    notice.style.cssText = `
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      background: #212529; color: #fff; padding: 8px 14px; border-radius: 6px;
      font-size: 14px; opacity: 0.9; z-index: 9999;
    `;
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 2000);
  };

  return (
    <div className="page bg-light">
      <div className="wrap card shadow-lg border-0 rounded-4 overflow-hidden">
        {/* Header */}
        <header
          className="hdr d-flex align-items-center justify-content-between p-3 text-white"
          style={{
            background: THEME_GRADIENT,
            borderBottom: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <img src={templeLogo} alt="Temple Logo" width="36" height="36" />
            <h5 className="m-0 fw-semibold">{TITLE}</h5>
          </div>
          <div className="hdr-actions d-flex gap-2">
            <button
              className="btn btn-light btn-sm"
              onClick={openHistory}
              disabled={!sid}
            >
              History
            </button>
            <button
              className="btn btn-light btn-sm"
              onClick={reset}
            >
              New Chat
            </button>
          </div>
        </header>

        {/* Chat log */}
        <main ref={logRef} className="log card-body bg-white">
          {msgs.length === 0 && (
            <div className="empty text-center text-muted mt-5">
              Ask anything about <b>law.temple.edu</b>. I’ll cite sources under each answer.
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.role === "user" ? "me" : "bot"}`}>
              <div className="content">{m.content}</div>
              <div className="meta text-muted small">
                {m.ts?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>

              {m.role === "assistant" && (
                <div style={{ marginTop: 8 }}>
                  <SourceChips sources={m.sources} />
                  <div
                    style={{
                      marginTop: 10,
                      background: "#f8f9fb",
                      border: "1px solid #e2e6ee",
                      borderRadius: 8,
                      padding: 10,
                    }}
                  >
                    <div style={{ marginBottom: 6, fontWeight: 500 }}>Feedback</div>
                    <label style={{ marginRight: 10 }}>
                      <input
                        type="radio"
                        name={`fb-${i}`}
                        checked={m.feedback?.correct === true}
                        onChange={() => {
                          const newMsgs = [...msgs];
                          newMsgs[i].feedback = { ...(newMsgs[i].feedback || {}), correct: true };
                          setMsgs(newMsgs);
                        }}
                      />{" "}
                      Correct
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`fb-${i}`}
                        checked={m.feedback?.correct === false}
                        onChange={() => {
                          const newMsgs = [...msgs];
                          newMsgs[i].feedback = { ...(newMsgs[i].feedback || {}), correct: false };
                          setMsgs(newMsgs);
                        }}
                      />{" "}
                      Incorrect
                    </label>

                    <textarea
                      placeholder="Write comment..."
                      rows={2}
                      className="form-control mt-2"
                      value={m.feedback?.comment || ""}
                      onChange={(e) => {
                        const newMsgs = [...msgs];
                        newMsgs[i].feedback = { ...(newMsgs[i].feedback || {}), comment: e.target.value };
                        setMsgs(newMsgs);
                      }}
                    />

                    <button
                      className="btn btn-sm text-white mt-2"
                      style={{
                        backgroundColor: THEME_ACCENT,
                        borderRadius: 6,
                        opacity: m.feedback?.submitted ? 0.6 : 1,
                      }}
                      disabled={m.feedback?.submitted}
                      onClick={async () => {
                        const fb = msgs[i].feedback || {};
                        if (fb.correct === undefined && !fb.comment) return;
                        try {
                          await fetch(`${API_BASE}/feedback`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              sid,
                              mid: m.mid,
                              correct: fb.correct,
                              comment: fb.comment,
                            }),
                          });
                          const newMsgs = [...msgs];
                          newMsgs[i].feedback = { ...fb, submitted: true };
                          setMsgs(newMsgs);
                        } catch (err) {
                          console.error("Feedback error:", err);
                        }
                      }}
                    >
                      {m.feedback?.submitted ? "✓ Feedback Saved" : "Send Feedback"}
                    </button>
                  </div>
                </div>
              )}
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

        {/* Input */}
        <footer className="inp card-footer bg-light d-flex gap-2">
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about law.temple.edu…"
            rows={1}
            className="form-control border"
          />
          <button
            className="btn text-white px-4"
            style={{ backgroundColor: THEME_ACCENT }}
            onClick={send}
            disabled={busy || !q.trim()}
          >
            Send
          </button>
        </footer>

        {/* History modal */}
        {showHist && (
          <div className="modal-backdrop-custom" onClick={() => setShowHist(false)}>
            <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
              <div className="modal-hdr d-flex justify-content-between align-items-center border-bottom pb-2">
                <h5 className="m-0 fw-semibold">Chat History</h5>
                <div className="d-flex gap-2">
                  <button className="btn btn-light btn-sm" onClick={downloadHistory}>
                    Download JSON
                  </button>
                  <button className="btn btn-light btn-sm" onClick={() => setShowHist(false)}>
                    Close
                  </button>
                </div>
              </div>
              <div className="modal-body mt-2">
                {!histItems.length && <div className="text-muted text-center py-4">No messages yet.</div>}
                {histItems.map((m, i) => (
                  <div key={i} className={`hist-row ${m.role}`}>
                    <span className="role fw-bold text-capitalize">{m.role}</span>
                    <span className="text">{m.content}</span>
                    {m.ts && <span className="time text-muted small">{new Date(m.ts).toLocaleString()}</span>}
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
