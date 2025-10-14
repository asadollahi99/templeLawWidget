import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Gear, ClockHistory } from "react-bootstrap-icons";
import templeLogo from "./temple-logo.png"; // your Temple logo

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8790";
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || "";

// Theme
const THEME_GRADIENT = "linear-gradient(90deg, #7b1e1e 0%, #34495e 100%)";
const THEME_ACCENT = "#7b1e1e";

// ---------------- Sidebar ----------------
function Sidebar({ active, setActive }) {
    const menu = [
        { id: "history", label: "Chat History", icon: <ClockHistory size={18} /> },
        { id: "models", label: "Model Settings", icon: <Gear size={18} /> },
    ];

    return (
        <div
            className="d-flex flex-column p-3 shadow-sm position-fixed top-0 start-0 bg-white"
            style={{
                width: 250,
                height: "100vh",
                borderRight: "1px solid #dee2e6",
            }}
        >
            <div className="text-center mb-4">
                <img
                    src={templeLogo}
                    alt="Temple"
                    width="80"
                    height="80"
                    className="rounded-circle shadow-sm mb-2"
                />
                <h5 className="fw-bold mb-0 text-dark">Temple Law</h5>
                <small className="text-muted">Admin Panel</small>
            </div>

            <ul className="nav nav-pills flex-column mb-auto">
                {menu.map((m) => (
                    <li className="nav-item mb-2" key={m.id}>
                        <button
                            className={`btn w-100 text-start d-flex align-items-center gap-2 py-2 ${active === m.id ? "text-white" : "text-dark"
                                }`}
                            style={{
                                background: active === m.id ? THEME_GRADIENT : "#f8f9fa",
                                borderRadius: 8,
                                border: "1px solid #dee2e6",
                                transition: "0.3s",
                            }}
                            onClick={() => setActive(m.id)}
                        >
                            {m.icon}
                            {m.label}
                        </button>
                    </li>
                ))}
            </ul>

            <div className="text-center text-muted mt-auto small">
                © Temple Law Chat
            </div>
        </div>
    );
}

// ---------------- Chat History ----------------
function ChatHistory() {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const [limit, setLimit] = useState(25);
    const [q, setQ] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [detail, setDetail] = useState(null);

    const fetchList = async (sk = skip) => {
        const u = new URL(`${API_BASE}/admin/sessions`);
        u.searchParams.set("limit", String(limit));
        u.searchParams.set("skip", String(sk));
        if (q) u.searchParams.set("q", q);
        if (from) u.searchParams.set("from", from);
        if (to) u.searchParams.set("to", to);
        const r = await fetch(u, { headers: { "x-admin-token": ADMIN_TOKEN } });
        const j = await r.json();
        setRows(j.rows || []);
        setTotal(j.total || 0);
        setSkip(sk);
    };

    useEffect(() => {
        fetchList(0);
    }, []);

    const open = async (sid) => {
        const r = await fetch(`${API_BASE}/admin/session/${encodeURIComponent(sid)}`, {
            headers: { "x-admin-token": ADMIN_TOKEN },
        });
        setDetail(await r.json());
    };

    const del = async (sid) => {
        if (!window.confirm(`Delete session ${sid}?`)) return;
        await fetch(`${API_BASE}/admin/session/${encodeURIComponent(sid)}`, {
            method: "DELETE",
            headers: { "x-admin-token": ADMIN_TOKEN },
        });
        if (detail?.sid === sid) setDetail(null);
        fetchList(skip);
    };

    const exportNdjson = () => {
        const a = document.createElement("a");
        a.href = `${API_BASE}/admin/export.ndjson?token=${encodeURIComponent(ADMIN_TOKEN)}`;
        a.download = "sessions.ndjson";
        a.click();
    };

    return (
        <div className="main-content" style={{ marginLeft: 260 }}>
            <header
                className="d-flex align-items-center justify-content-between p-3 text-white shadow-sm"
                style={{ background: THEME_GRADIENT }}
            >
                <h5 className="m-0 fw-semibold">Chat Sessions</h5>
                <button className="btn btn-light btn-sm" onClick={exportNdjson}>
                    Export Sessions
                </button>
            </header>

            <div className="container-fluid p-4">
                <div className="d-flex flex-wrap gap-2 mb-3">
                    <input
                        className="form-control w-auto"
                        placeholder="Search text…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <input
                        type="date"
                        className="form-control w-auto"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    />
                    <input
                        type="date"
                        className="form-control w-auto"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                    <button
                        className="btn text-white"
                        style={{ backgroundColor: THEME_ACCENT }}
                        onClick={() => fetchList(0)}
                    >
                        Search
                    </button>
                </div>

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: "#f1f3f5" }}>
                                <tr>
                                    <th>SID</th>
                                    <th>Messages (✓ / ✗)</th>
                                    <th>Created</th>
                                    <th>Updated</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.sid}>
                                        <td>
                                            <code>{r.sid}</code>
                                        </td>
                                        <td>
                                            <span>{r.count ?? "–"}</span>{" "}
                                            {typeof r.correctCount === "number" && (
                                                <>
                                                    <span className="text-success fw-bold ms-1">
                                                        +{r.correctCount}
                                                    </span>
                                                    <span className="text-danger fw-bold ms-1">
                                                        -{r.incorrectCount}
                                                    </span>
                                                </>
                                            )}
                                        </td>
                                        <td>
                                            {r.createdAt
                                                ? new Date(r.createdAt).toLocaleString()
                                                : "–"}
                                        </td>
                                        <td>
                                            {r.updatedAt
                                                ? new Date(r.updatedAt).toLocaleString()
                                                : "–"}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => open(r.sid)}
                                            >
                                                View
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => del(r.sid)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!rows.length && (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted">
                                            No results found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="d-flex align-items-center gap-2 mt-3">
                    <button
                        className="btn btn-outline-secondary"
                        disabled={skip === 0}
                        onClick={() => fetchList(Math.max(skip - limit, 0))}
                    >
                        Prev
                    </button>
                    <div className="text-muted small">
                        {skip + 1}–{Math.min(skip + limit, total)} of {total}
                    </div>
                    <button
                        className="btn btn-outline-secondary"
                        disabled={skip + limit >= total}
                        onClick={() => fetchList(skip + limit)}
                    >
                        Next
                    </button>
                </div>

                {/* Session Detail */}
                {detail && (
                    <div className="card mt-4 shadow-sm border-0 rounded-4">
                        <div
                            className="card-header d-flex justify-content-between align-items-center text-white"
                            style={{ background: THEME_GRADIENT }}
                        >
                            <strong>Session: {detail.sid}</strong>
                            <button
                                className="btn btn-sm btn-light"
                                onClick={() => setDetail(null)}
                            >
                                Close
                            </button>
                        </div>
                        <div
                            className="card-body overflow-auto"
                            style={{ maxHeight: 420, backgroundColor: "#fafafa" }}
                        >
                            {(detail.history || []).map((m, i) => (
                                <div key={i} className="mb-3 pb-2 border-bottom">
                                    <b className="text-capitalize">{m.role}</b> ·{" "}
                                    <small className="text-muted">
                                        {m.ts ? new Date(m.ts).toLocaleString() : ""}
                                    </small>
                                    <div className="mt-1" style={{ whiteSpace: "pre-wrap" }}>
                                        {m.content}
                                    </div>

                                    {m.role === "assistant" && m.feedback && (
                                        <div className="bg-white border rounded p-2 mt-2 small shadow-sm">
                                            <b>Feedback:</b>{" "}
                                            {m.feedback.correct === true ? (
                                                <span className="text-success">✔ Correct</span>
                                            ) : m.feedback.correct === false ? (
                                                <span className="text-danger">✖ Incorrect</span>
                                            ) : (
                                                <span className="text-muted">– No label</span>
                                            )}
                                            {m.feedback.comment && (
                                                <div>
                                                    <b>Comment:</b> {m.feedback.comment}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {!detail.history?.length && <div>Empty.</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------------- Model Settings ----------------
function ModelSettings() {
    const [model, setModel] = useState(
        localStorage.getItem("openai_model") || "gpt-4o-mini"
    );
    const models = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];

    const saveModel = () => {
        localStorage.setItem("openai_model", model);
        alert(`Model saved: ${model}`);
    };

    return (
        <div className="main-content" style={{ marginLeft: 260 }}>
            <header
                className="d-flex align-items-center justify-content-between p-3 text-white shadow-sm"
                style={{ background: THEME_GRADIENT }}
            >
                <h5 className="m-0 fw-semibold">Model Settings</h5>
            </header>

            <div className="container p-4">
                <div
                    className="card p-4 shadow-sm border-0 rounded-4"
                    style={{ maxWidth: 480 }}
                >
                    <p className="text-muted mb-2">
                        Select which OpenAI model to use for responses:
                    </p>
                    <select
                        className="form-select mb-3"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    >
                        {models.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                    <button
                        className="btn text-white w-100"
                        style={{ backgroundColor: THEME_ACCENT }}
                        onClick={saveModel}
                    >
                        Save Model
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------- Main Admin ----------------
export default function Admin() {
    const [active, setActive] = useState("history");
    return (
        <div className="d-flex bg-light">
            <Sidebar active={active} setActive={setActive} />
            {active === "history" && <ChatHistory />}
            {active === "models" && <ModelSettings />}
        </div>
    );
}
