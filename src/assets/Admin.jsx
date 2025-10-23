import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Gear, ClockHistory, ClipboardCheck, QuestionSquare, PencilSquare, Trash, ToggleOn, ToggleOff, PlusSquare } from "react-bootstrap-icons";
import templeLogo from "./temple-logo.png"; // your Temple logo

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8790";
//const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || "";
const ADMIN_TOKEN = localStorage.getItem("admin_token") || "";

// Theme
const THEME_GRADIENT = "linear-gradient(90deg, #7b1e1e 0%, #34495e 100%)";
const THEME_ACCENT = "#7b1e1e";
const TOKEN = localStorage.getItem("jwt_token");
const ROLE = localStorage.getItem("role");


// ---------------- Sidebar ----------------
function Sidebar({ active, setActive }) {
    const role = localStorage.getItem("role");

    const menu = [
        { id: "history", label: "Chat History", icon: <ClockHistory size={18} /> },
        { id: "review", label: "Review Chat", icon: <ClipboardCheck size={18} /> },
        { id: "overrides", label: "FAQ Overrides", icon: <QuestionSquare size={18} /> },
        { id: "models", label: "Model Settings", icon: <Gear size={18} /> },
    ];

    if (role === "superadmin") {
        menu.push({
            id: "users",
            label: "User Management",
            icon: <PencilSquare size={18} />,
        });
    }

    return (
        <div
            className="sidebar-fixed d-flex flex-column p-3 shadow-sm position-fixed top-0 start-0 bg-white"
            style={{ width: 250, height: "100vh", borderRight: "1px solid #dee2e6" }}
        >
            <div className="text-center mb-4">
                <img src={templeLogo} alt="Temple Law" width={80} />
                <h5 className="mt-2 mb-0">Temple Law</h5>
                <small className="text-muted">Admin Panel</small>
            </div>

            {menu.map((item) => (
                <button
                    key={item.id}
                    className={`btn w-100 text-start mb-2 ${active === item.id
                        ? "text-white"
                        : "text-dark"
                        }`}
                    style={{
                        background:
                            active === item.id
                                ? "linear-gradient(90deg, #7b1e1e 0%, #34495e 100%)"
                                : "#f8f9fa",
                        border: "none",
                        fontWeight: active === item.id ? "600" : "normal",
                    }}
                    onClick={() => setActive(item.id)}
                >
                    <span className="me-2">{item.icon}</span>
                    {item.label}
                </button>
            ))}

            <button
                className="btn btn-danger mt-auto w-100"
                onClick={() => {
                    localStorage.clear();
                    window.location.href = "/login";
                }}
            >
                Logout
            </button>

            <div className="text-center mt-3 text-muted small">© Temple Law Chat</div>
        </div>
    );
}



// ---------------- Helpers ----------------
function idToString(doc) {
    // handles different _id shapes: { $oid } or plain string or ObjectId-like
    if (!doc) return null;
    const _id = doc._id ?? doc.id ?? doc;
    if (!_id) return null;
    if (typeof _id === "string") return _id;
    if (_id.$oid) return _id.$oid;
    if (typeof _id.toString === "function") return _id.toString();
    return JSON.stringify(_id);
}



// ---------------- Overrides Panel ----------------
function OverridesPanel() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState(null); // doc being edited
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        question: "",
        answer: "",
        assistantContent: "",
        force: false,
        reviewer: ""
    });

    async function fetchList(search = "") {
        setLoading(true);
        try {
            const url = new URL(`${API_BASE}/admin/overrides`);
            if (search) url.searchParams.set("q", search);
            const r = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${TOKEN}` }
            });
            const j = await r.json();
            setRows(j.rows || []);
        } catch (err) {
            alert("Error fetching overrides: " + (err.message || err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchList();
    }, []);

    const clearForm = () => setForm({ question: "", answer: "", assistantContent: "", force: false, reviewer: "" });

    async function startEdit(doc) {
        setEditing(doc);
        setCreating(false);
        setForm({
            question: doc.question || "",
            answer: doc.answer || "",
            assistantContent: doc.assistantContent || "",
            force: !!doc.force,
            reviewer: doc.reviewer || ""
        });
    }

    async function saveCreate() {
        if (!form.question.trim() || !form.answer.trim()) return alert("Question and answer are required.");
        try {
            const r = await fetch(`${API_BASE}/admin/override`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKEN}` },
                body: JSON.stringify({ question: form.question.trim(), answer: form.answer, assistantContent: form.assistantContent || null, force: !!form.force, reviewer: form.reviewer || null })
            });
            const j = await r.json();
            if (j.ok) {
                alert("Override saved.");
                clearForm();
                setCreating(false);
                fetchList();
            } else {
                alert("Error: " + (j.error || JSON.stringify(j)));
            }
        } catch (err) {
            alert("Network error: " + (err.message || err));
        }
    }

    async function saveEdit() {
        const id = idToString(editing);
        if (!id) return alert("Missing id");
        try {
            const r = await fetch(`${API_BASE}/admin/override/${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKEN}` },
                body: JSON.stringify({
                    question: form.question.trim(),
                    answer: form.answer,
                    assistantContent: form.assistantContent || null,
                    force: !!form.force,
                    reviewer: form.reviewer || null
                })
            });
            const j = await r.json();
            if (j.ok) {
                alert("Override updated.");
                setEditing(null);
                clearForm();
                fetchList();
            } else {
                alert("Error updating: " + (j.error || JSON.stringify(j)));
            }
        } catch (err) {
            alert("Network error: " + (err.message || err));
        }
    }

    async function toggleForce(doc) {
        const id = idToString(doc);
        if (!id) return;
        try {
            const r = await fetch(`${API_BASE}/admin/override/${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKEN}` },
                body: JSON.stringify({ force: !doc.force })
            });
            const j = await r.json();
            if (j.ok) fetchList();
            else alert("Error toggling force: " + (j.error || JSON.stringify(j)));
        } catch (err) {
            alert("Network error: " + (err.message || err));
        }
    }

    async function del(doc) {
        const id = idToString(doc);
        if (!id) return;
        if (!window.confirm("Delete override?")) return;
        try {
            const r = await fetch(`${API_BASE}/admin/override/${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${TOKEN}` }

            });
            const j = await r.json();
            if (j.ok) fetchList();
            else alert("Error deleting: " + (j.error || JSON.stringify(j)));
        } catch (err) {
            alert("Network error: " + (err.message || err));
        }
    }

    return (
        <div className="main-content">
            <header
                className="d-flex align-items-center justify-content-between p-3 text-white shadow-sm"
                style={{ background: THEME_GRADIENT }}
            >
                <h5 className="m-0 fw-semibold">FAQ Overrides</h5>
                <div>
                    <button className="btn btn-light btn-sm me-2" onClick={() => fetchList(q)}>
                        Refresh
                    </button>
                    <button className="btn btn-light btn-sm" onClick={() => { setCreating(true); setEditing(null); clearForm(); }}>
                        <PlusSquare /> New
                    </button>
                </div>
            </header>

            <div className="container-fluid p-4">
                <div className="d-flex gap-2 mb-3 align-items-center">
                    <input className="form-control w-auto" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
                    <button className="btn text-white" style={{ backgroundColor: THEME_ACCENT }} onClick={() => fetchList(q)}>Search</button>
                </div>

                {/* Create / Edit form */}
                {(creating || editing) && (
                    <div className="card p-3 mb-4 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>{creating ? "Create new override" : "Edit override"}</strong>
                            <div>
                                <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => { setCreating(false); setEditing(null); clearForm(); }}>Close</button>
                            </div>
                        </div>

                        <div className="mb-2">
                            <label className="form-label small">Question (normalized will be computed)</label>
                            <input className="form-control" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
                        </div>
                        <div className="mb-2">
                            <label className="form-label small">Answer (canonical)</label>
                            <textarea className="form-control" rows={3} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
                        </div>
                        <div className="mb-2">
                            <label className="form-label small">assistantContent (optional)</label>
                            <textarea className="form-control" rows={2} value={form.assistantContent} onChange={(e) => setForm({ ...form, assistantContent: e.target.value })} />
                        </div>
                        <div className="mb-2 form-check">
                            <input className="form-check-input" type="checkbox" checked={!!form.force} onChange={(e) => setForm({ ...form, force: e.target.checked })} id="force-create" />
                            <label className="form-check-label small" htmlFor="force-create">Force (override returned immediately)</label>
                        </div>
                        <div className="mb-2">
                            <label className="form-label small">Reviewer</label>
                            <input className="form-control" value={form.reviewer} onChange={(e) => setForm({ ...form, reviewer: e.target.value })} />
                        </div>

                        <div className="d-flex gap-2">
                            {creating ? (
                                <button className="btn btn-success" onClick={saveCreate}>Create</button>
                            ) : (
                                <button className="btn btn-primary" onClick={saveEdit}>Save changes</button>
                            )}
                            <button className="btn btn-outline-secondary" onClick={() => { setCreating(false); setEditing(null); clearForm(); }}>Cancel</button>
                        </div>
                    </div>
                )}

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: "#f1f3f5" }}>
                                <tr>
                                    <th>Question</th>
                                    <th>Answer (preview)</th>
                                    <th>Force</th>
                                    <th>Reviewer</th>
                                    <th>Updated</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr><td colSpan="6" className="text-center">Loading…</td></tr>
                                )}
                                {!loading && rows.length === 0 && (
                                    <tr><td colSpan="6" className="text-center text-muted">No overrides found.</td></tr>
                                )}
                                {!loading && rows.map((r) => {
                                    const id = idToString(r);
                                    return (
                                        <tr key={id || Math.random()}>
                                            <td style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {r.question}
                                            </td>
                                            <td style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {r.answer ?? r.assistantContent ?? "—"}
                                            </td>
                                            <td>
                                                {r.force ? <span className="text-success">Yes</span> : <span className="text-muted">No</span>}
                                            </td>
                                            <td>{r.reviewer ?? "—"}</td>
                                            <td>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : (r.createdAt ? new Date(r.createdAt).toLocaleString() : "—")}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(r)}><PencilSquare /> Edit</button>
                                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleForce(r)}>{r.force ? <><ToggleOff /> Unforce</> : <><ToggleOn /> Force</>}</button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => del(r)}><Trash /> Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------- Chat History ----------------
/* the ChatHistory component is identical to your original; paste it here unchanged */
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
        const r = await fetch(u, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
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
            headers: { Authorization: `Bearer ${TOKEN}` }
            ,
        });
        setDetail(await r.json());
    };

    const del = async (sid) => {
        if (!window.confirm(`Delete session ${sid}?`)) return;
        await fetch(`${API_BASE}/admin/session/${encodeURIComponent(sid)}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${TOKEN}` }
            ,
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
        <div className="main-content">
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
                    <button className="btn text-white" style={{ backgroundColor: THEME_ACCENT }} onClick={() => fetchList(0)}>
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
                                                    <span className="text-success fw-bold ms-1">+{r.correctCount}</span>
                                                    <span className="text-danger fw-bold ms-1">-{r.incorrectCount}</span>
                                                </>
                                            )}
                                        </td>
                                        <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "–"}</td>
                                        <td>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "–"}</td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => open(r.sid)}>
                                                View
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => del(r.sid)}>
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
                    <button className="btn btn-outline-secondary" disabled={skip === 0} onClick={() => fetchList(Math.max(skip - limit, 0))}>
                        Prev
                    </button>
                    <div className="text-muted small">
                        {skip + 1}–{Math.min(skip + limit, total)} of {total}
                    </div>
                    <button className="btn btn-outline-secondary" disabled={skip + limit >= total} onClick={() => fetchList(skip + limit)}>
                        Next
                    </button>
                </div>

                {/* Session Detail */}
                {detail && (
                    <div className="card mt-4 shadow-sm border-0 rounded-4">
                        <div className="card-header d-flex justify-content-between align-items-center text-white" style={{ background: THEME_GRADIENT }}>
                            <strong>Session: {detail.sid}</strong>
                            <button className="btn btn-sm btn-light" onClick={() => setDetail(null)}>
                                Close
                            </button>
                        </div>
                        <div className="card-body overflow-auto" style={{ maxHeight: 420, backgroundColor: "#fafafa" }}>
                            {(detail.history || []).map((m, i) => (
                                <div key={i} className="mb-3 pb-2 border-bottom">
                                    <b className="text-capitalize">{m.role}</b> ·{" "}
                                    <small className="text-muted">{m.ts ? new Date(m.ts).toLocaleString() : ""}</small>
                                    <div className="mt-1" style={{ whiteSpace: "pre-wrap" }}>
                                        {m.content}
                                    </div>

                                    {/* Show feedback (read-only) if present on assistant messages */}
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

// ---------------- Review Panel ----------------
/* ReviewPanel left unchanged except minor formatting — copy as you have it in your code */

function ReviewPanel() {
    const [sessions, setSessions] = useState([]);
    const [skip, setSkip] = useState(0);
    const [limit] = useState(25);
    const [total, setTotal] = useState(0);
    const [selectedSid, setSelectedSid] = useState(null);
    const [sessionDetail, setSessionDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSessions(0);
    }, []);

    async function fetchSessions(sk = 0) {
        setLoading(true);
        const u = new URL(`${API_BASE}/admin/sessions`);
        u.searchParams.set("limit", String(limit));
        u.searchParams.set("skip", String(sk));
        const r = await fetch(u, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
        const j = await r.json();
        setSessions(j.rows || []);
        setTotal(j.total || 0);
        setSkip(sk);
        setLoading(false);
    }

    async function openSession(sid) {
        setSelectedSid(sid);
        const r = await fetch(`${API_BASE}/admin/session/${encodeURIComponent(sid)}`, {
            headers: { Authorization: `Bearer ${TOKEN}` }
            ,
        });
        const j = await r.json();
        setSessionDetail(j);
    }

    async function saveCorrectedAnswer(question, corrected, extra = {}) {
        if (!question || !corrected) return alert("Question and corrected answer required.");
        try {
            const r = await fetch(`${API_BASE}/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${TOKEN}`,
                },
                body: JSON.stringify({ question, correctedAnswer: corrected, ...extra }),
            });
            const j = await r.json();
            if (j?.ok) {
                alert("Corrected answer saved.");
                fetchSessions(skip);
                if (selectedSid) openSession(selectedSid);
            } else {
                alert("Error saving corrected answer: " + (j.error || "unknown"));
            }
        } catch (e) {
            alert("Network error: " + e.message);
        }
    }

    // ✅ Helper component for resources with show more/less
    function ResourceList({ sources }) {
        const [expanded, setExpanded] = useState(false);
        if (!Array.isArray(sources) || sources.length === 0)
            return <div className="text-muted small">No resources recorded.</div>;

        const visible = expanded ? sources : sources.slice(0, 2);
        return (
            <div className="d-flex flex-wrap gap-2 align-items-center">
                {visible.map((s, i) => {
                    let href = String(s || "").trim();
                    if (href && !/^https?:\/\//i.test(href)) {
                        if (href.startsWith("/")) href = `https://law.temple.edu${href}`;
                    }
                    return (
                        <a
                            key={i}
                            href={href || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="badge bg-light border text-truncate"
                            style={{
                                maxWidth: 340,
                                textDecoration: "none",
                                padding: "0.45rem 0.6rem",
                                color: "#333",
                            }}
                        >
                            {String(s).slice(0, 80)}
                        </a>
                    );
                })}
                {sources.length > 2 && (
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        style={{
                            padding: "0.15rem 0.5rem",
                            fontSize: "0.75rem",
                            borderRadius: "999px",
                        }}
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? "Show less" : `+${sources.length - 2} more`}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="main-content">
            <header
                className="d-flex align-items-center justify-content-between p-3 text-white shadow-sm"
                style={{ background: THEME_GRADIENT }}
            >
                <h5 className="m-0 fw-semibold">Review Chat</h5>
            </header>

            <div className="container p-4">
                <div className="row">
                    <div className="col-4">
                        <div className="card p-2 shadow-sm">
                            <div className="list-group">
                                {sessions.map((s) => (
                                    <button
                                        key={s.sid}
                                        className={`list-group-item list-group-item-action ${selectedSid === s.sid ? "active" : ""
                                            }`}
                                        onClick={() => openSession(s.sid)}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <div style={{ fontSize: 12 }}>
                                                <code>{s.sid}</code>
                                            </div>
                                            <div style={{ fontSize: 12 }} className="text-muted">
                                                {s.count ?? 0} msgs
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 11 }} className="text-muted">
                                            {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ""}
                                        </div>
                                    </button>
                                ))}
                                {!sessions.length && <div className="text-muted p-3">No sessions.</div>}
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-2">
                            <button
                                className="btn btn-outline-secondary"
                                disabled={skip === 0}
                                onClick={() => fetchSessions(Math.max(skip - limit, 0))}
                            >
                                Prev
                            </button>
                            <div className="small text-muted">
                                {skip + 1}–{Math.min(skip + limit, total)} of {total}
                            </div>
                            <button
                                className="btn btn-outline-secondary"
                                disabled={skip + limit >= total}
                                onClick={() => fetchSessions(skip + limit)}
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    <div className="col-8">
                        {!sessionDetail && (
                            <div className="card p-4 shadow-sm">
                                <div className="text-muted">
                                    Select a session to review assistant messages.
                                </div>
                            </div>
                        )}

                        {sessionDetail && (
                            <div className="card p-3 shadow-sm">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <strong>Session: {sessionDetail.sid}</strong>
                                    <button
                                        className="btn btn-sm btn-light"
                                        onClick={() => {
                                            setSessionDetail(null);
                                            setSelectedSid(null);
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>

                                <div style={{ maxHeight: 520, overflow: "auto" }}>
                                    {(sessionDetail.history || [])
                                        .filter((h) => h.role === "assistant")
                                        .map((m, idx) => {
                                            const idKey = m.mid ?? idx;

                                            let questionToShow = m.content || "";
                                            if (sessionDetail?.history?.length) {
                                                const all = sessionDetail.history;
                                                const pos = all.findIndex(
                                                    (x) =>
                                                        (x.mid ?? String(x.ts)) ===
                                                        (m.mid ?? String(m.ts))
                                                );
                                                if (pos !== -1) {
                                                    for (let j = pos - 1; j >= 0; j--) {
                                                        const cand = all[j];
                                                        if (
                                                            cand.role === "user" &&
                                                            cand.content &&
                                                            cand.content.trim()
                                                        ) {
                                                            questionToShow = cand.content;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }

                                            const corrId = `corr-${idKey}`;
                                            const forceId = `force-${idKey}`;

                                            let sources = [];
                                            if (Array.isArray(m.sources)) sources = m.sources;
                                            else if (typeof m.sources === "string" && m.sources.trim()) {
                                                if (m.sources.includes(","))
                                                    sources = m.sources
                                                        .split(",")
                                                        .map((s) => s.trim())
                                                        .filter(Boolean);
                                                else sources = [m.sources];
                                            } else if (m.sources && typeof m.sources === "object") {
                                                try {
                                                    sources = JSON.parse(JSON.stringify(m.sources));
                                                } catch {
                                                    sources = [];
                                                }
                                                if (!Array.isArray(sources))
                                                    sources = [String(m.sources)];
                                            }

                                            return (
                                                <div key={idKey} className="mb-3 border-bottom pb-2">
                                                    <div className="text-muted small mb-1">
                                                        {m.ts
                                                            ? new Date(m.ts).toLocaleString()
                                                            : ""}
                                                    </div>

                                                    <div
                                                        style={{ whiteSpace: "pre-wrap" }}
                                                        className="mb-2 mt-2"
                                                    >
                                                        <b>Question:</b>
                                                        <br />
                                                        {questionToShow}
                                                    </div>

                                                    <div
                                                        style={{ whiteSpace: "pre-wrap" }}
                                                        className="mb-2 mt-2"
                                                    >
                                                        <b>Assistant answer:</b>
                                                        <br />
                                                        {m.content}
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="form-label small">
                                                            Resources:
                                                        </label>
                                                        <ResourceList sources={sources} />
                                                    </div>

                                                    <label className="form-label small">
                                                        Corrected answer (admin-only):
                                                    </label>
                                                    <textarea
                                                        id={corrId}
                                                        className="form-control mb-2"
                                                        rows={4}
                                                        placeholder="Enter corrected canonical answer here..."
                                                    />

                                                    <div className="form-check mb-2">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={forceId}
                                                        />
                                                        <label
                                                            className="form-check-label small"
                                                            htmlFor={forceId}
                                                        >
                                                            Force override (use this answer even if
                                                            website has an entry)
                                                        </label>
                                                    </div>

                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-outline-success"
                                                            onClick={async () => {
                                                                const questionValue =
                                                                    questionToShow?.trim() || "";
                                                                const corrected =
                                                                    document
                                                                        .getElementById(corrId)
                                                                        ?.value?.trim() || "";
                                                                const force = !!(
                                                                    document.getElementById(
                                                                        forceId
                                                                    ) &&
                                                                    document.getElementById(forceId)
                                                                        .checked
                                                                );
                                                                if (!questionValue || !corrected)
                                                                    return alert(
                                                                        "Please provide both question and corrected answer before saving."
                                                                    );

                                                                try {
                                                                    await saveCorrectedAnswer(
                                                                        questionValue,
                                                                        corrected,
                                                                        {
                                                                            force,
                                                                            sid: sessionDetail?.sid,
                                                                            assistantMid: m.mid,
                                                                            assistantContent: m.content,
                                                                        }
                                                                    );
                                                                    const t =
                                                                        document.getElementById(
                                                                            corrId
                                                                        );
                                                                    if (t) t.value = "";
                                                                    const f =
                                                                        document.getElementById(
                                                                            forceId
                                                                        );
                                                                    if (f) f.checked = false;
                                                                } catch (err) {
                                                                    alert(
                                                                        "Save failed: " +
                                                                        (err?.message || err)
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            Save Corrected Answer
                                                        </button>

                                                        <button
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => {
                                                                const t =
                                                                    document.getElementById(corrId);
                                                                const f =
                                                                    document.getElementById(forceId);
                                                                if (t) t.value = "";
                                                                if (f) f.checked = false;
                                                            }}
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {!(
                                        sessionDetail.history || []
                                    ).some((h) => h.role === "assistant") && (
                                            <div className="text-muted">
                                                No assistant messages in this session.
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}





// ---------------- Model Settings ----------------
// ModelSettings (replace the existing function)

function ModelSettings() {
    // three model slots for comparison
    const [modelA, setModelA] = useState(localStorage.getItem("openai_model_a") || "gpt-4o-mini");
    const [modelB, setModelB] = useState(localStorage.getItem("openai_model_b") || "gpt-4o-mini");
    const [modelC, setModelC] = useState(localStorage.getItem("openai_model_c") || "gpt-3.5-turbo");
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const models = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];

    const saveModels = () => {
        localStorage.setItem("openai_model_a", modelA);
        localStorage.setItem("openai_model_b", modelB);
        localStorage.setItem("openai_model_c", modelC);
        alert("Saved model selection.");
    };

    async function compareNow() {
        if (!question.trim()) return alert("Please type a test question to compare.");
        // send to server: /admin/compare-models (requires admin token)
        setLoading(true);
        setResults(null);
        try {
            const r = await fetch(`${API_BASE}/admin/compare-models`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${TOKEN}`
                },
                body: JSON.stringify({ q: question.trim(), models: [modelA, modelB, modelC] })
            });
            const j = await r.json();
            if (!r.ok) {
                alert("Compare call failed: " + (j.error || r.statusText));
            } else {
                setResults(j.results || []);
            }
        } catch (err) {
            alert("Network error: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="main-content" >
            <header className="d-flex align-items-center justify-content-between p-3 text-white shadow-sm" style={{ background: THEME_GRADIENT }}>
                <h5 className="m-0 fw-semibold">Model Settings & Comparison</h5>
            </header>

            <div className="container p-4">
                <div className="card p-4 shadow-sm border-0 rounded-4" style={{ maxWidth: 920 }}>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label small">Model A</label>
                            <select className="form-select" value={modelA} onChange={(e) => setModelA(e.target.value)}>
                                {models.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small">Model B</label>
                            <select className="form-select" value={modelB} onChange={(e) => setModelB(e.target.value)}>
                                {models.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small">Model C</label>
                            <select className="form-select" value={modelC} onChange={(e) => setModelC(e.target.value)}>
                                {models.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div className="col-12 mt-2 d-flex gap-2">
                            <button className="btn text-white" style={{ background: THEME_ACCENT }} onClick={saveModels}>Save Models</button>
                            <button className="btn btn-outline-secondary" onClick={() => {
                                setModelA(localStorage.getItem("openai_model_a") || "gpt-4o-mini");
                                setModelB(localStorage.getItem("openai_model_b") || "gpt-4o-mini");
                                setModelC(localStorage.getItem("openai_model_c") || "gpt-3.5-turbo");
                            }}>Reset to saved</button>
                        </div>

                        <hr className="my-3" />

                        <div className="col-12">
                            <label className="form-label small">Test question for comparison</label>
                            <textarea className="form-control mb-2" value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder="Type a question to compare the selected models..." />
                            <div className="d-flex gap-2">
                                <button className="btn btn-outline-primary" disabled={loading} onClick={compareNow}>
                                    {loading ? "Comparing…" : "Compare models"}
                                </button>
                                <button className="btn btn-outline-secondary" onClick={() => { setQuestion(""); setResults(null); }}>
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="col-12">
                            {results && (
                                <div className="mt-3">
                                    <h6>Comparison results</h6>
                                    <div className="row">
                                        {results.map((r, i) => (
                                            <div key={i} className="col-md-4 mb-3">
                                                <div className="card h-100 shadow-sm">
                                                    <div className="card-header bg-light">
                                                        <strong>{r.model}</strong>
                                                        <div className="text-muted small">{r.ts ? new Date(r.ts).toLocaleString() : ""}</div>
                                                    </div>
                                                    <div className="card-body" style={{ maxHeight: 260, overflow: "auto" }}>
                                                        <p style={{ whiteSpace: "pre-wrap" }}>{r.answer}</p>

                                                        <div className="mt-2">
                                                            <div className="text-muted small mb-1">Sources</div>
                                                            {(!r.sources || !r.sources.length) && <div className="small text-muted">none</div>}
                                                            {Array.isArray(r.sources) && r.sources.map((s, j) => (
                                                                <div key={j}><a href={s.startsWith("http") ? s : s} target="_blank" rel="noreferrer" className="small">{String(s).slice(0, 120)}</a></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="card-footer text-end">
                                                        <button className="btn btn-sm btn-outline-primary" onClick={() => navigator.clipboard.writeText(r.answer || "")}>Copy</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}


function SuperAdminPanel() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ username: "", password: "", role: "admin" });
    const [editing, setEditing] = useState(null);
    const TOKEN = localStorage.getItem("jwt_token");
    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8790";

    // Fetch users
    async function loadUsers() {
        const r = await fetch(`${API_BASE}/admin/users`, {
            headers: { Authorization: `Bearer ${TOKEN}` },
        });
        const data = await r.json();
        setUsers(data || []);
    }

    useEffect(() => {
        loadUsers();
    }, []);

    // Create or update user
    async function saveUser() {
        if (!form.username || (!form.password && !editing)) {
            alert("Username and password are required for new users.");
            return;
        }

        const method = editing ? "PATCH" : "POST";
        const url = editing
            ? `${API_BASE}/admin/users/${encodeURIComponent(editing.username)}`
            : `${API_BASE}/admin/users`;

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify(form),
        });

        const j = await res.json();
        if (res.ok && j.ok) {
            alert(editing ? "User updated successfully." : "User created successfully.");
            setForm({ username: "", password: "", role: "admin" });
            setEditing(null);
            loadUsers();
        } else {
            alert("Error: " + (j.error || res.statusText));
        }
    }

    // Delete user
    async function deleteUser(username) {
        if (!window.confirm(`Delete user "${username}"?`)) return;
        const res = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(username)}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${TOKEN}` },
        });
        const j = await res.json();
        if (j.ok) {
            alert("User deleted.");
            loadUsers();
        } else {
            alert("Error deleting user: " + (j.error || res.statusText));
        }
    }

    return (
        <div className="main-content" >
            <header
                className="d-flex align-items-center justify-content-between p-3 text-white shadow-sm"
                style={{ background: "linear-gradient(90deg, #7b1e1e 0%, #34495e 100%)" }}
            >
                <h5 className="m-0 fw-semibold">User Management</h5>
            </header>

            <div className="container-fluid p-4">
                <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
                    <h6>{editing ? "Edit User" : "Add New User"}</h6>
                    <div className="row g-3 mt-1">
                        <div className="col-md-3">
                            <input
                                className="form-control"
                                placeholder="Username"
                                value={form.username}
                                disabled={!!editing}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3">
                            <input
                                type="password"
                                className="form-control"
                                placeholder={editing ? "New Password (optional)" : "Password"}
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-select"
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                            >
                                <option value="admin">admin</option>
                                <option value="reviewer">reviewer</option>
                                <option value="superadmin">superadmin</option>
                            </select>
                        </div>
                        <div className="col-md-3 d-flex gap-2">
                            <button className="btn btn-success w-50" onClick={saveUser}>
                                {editing ? "Update" : "Add"}
                            </button>
                            {editing && (
                                <button
                                    className="btn btn-secondary w-50"
                                    onClick={() => {
                                        setEditing(null);
                                        setForm({ username: "", password: "", role: "admin" });
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4">
                    <div className="table-responsive p-3">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: "#f1f3f5" }}>
                                <tr>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th style={{ width: 200 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.username}>
                                        <td>{u.username}</td>
                                        <td>{u.role}</td>
                                        <td>{new Date(u.createdAt).toLocaleString()}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => {
                                                        setEditing(u);
                                                        setForm({ username: u.username, password: "", role: u.role });
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => deleteUser(u.username)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!users.length && (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}




// ---------------- Main Admin ----------------
export default function Admin() {
    const [active, setActive] = useState("history");
    const ROLE = localStorage.getItem("role");

    return (
        <div className="d-flex bg-light" style={{ minHeight: "100vh" }}>
            <Sidebar active={active} setActive={setActive} />

            <div className="flex-fill bg-light">
                {/* right content area */}
                <div
                    className="shadow-sm"
                    style={{
                        minHeight: "100vh",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "0px",
                    }}
                >
                    {active === "history" && <ChatHistory />}
                    {active === "review" && <ReviewPanel />}
                    {active === "overrides" && <OverridesPanel />}
                    {active === "models" && <ModelSettings />}
                    {active === "users" && ROLE === "superadmin" && <SuperAdminPanel />}
                </div>
            </div>
        </div>
    );
}