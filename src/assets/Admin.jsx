import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8790";
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || "";

// ====================== Sidebar ======================
function Sidebar({ active, setActive }) {
    const menu = [
        { id: "history", label: "Chat History" },
        { id: "models", label: "Model Settings" },
    ];

    return (
        <div style={{
            width: 220,
            background: "#f8f9fb",
            padding: "20px 10px",
            borderRight: "1px solid #e0e4ea",
            height: "100vh",
            position: "fixed",
            top: 0,
            left: 0,
            overflowY: "auto"
        }}>
            <h3 style={{ marginLeft: 10 }}>Admin Menu</h3>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
                {menu.map(m => (
                    <li key={m.id} style={{ marginBottom: 10 }}>
                        <button
                            onClick={() => setActive(m.id)}
                            style={{
                                width: "100%",
                                textAlign: "left",
                                background: active === m.id ? "#dde6f7" : "transparent",
                                border: "none",
                                padding: "10px 14px",
                                cursor: "pointer",
                                borderRadius: 6
                            }}
                        >
                            {m.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ====================== Chat History Section ======================
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

    useEffect(() => { fetchList(0); /* eslint-disable-next-line */ }, []);

    const open = async (sid) => {
        const r = await fetch(`${API_BASE}/admin/session/${encodeURIComponent(sid)}`, {
            headers: { "x-admin-token": ADMIN_TOKEN }
        });
        setDetail(await r.json());
    };

    const del = async (sid) => {
        if (!window.confirm(`Delete session ${sid}?`)) return;
        await fetch(`${API_BASE}/admin/session/${encodeURIComponent(sid)}`, {
            method: "DELETE",
            headers: { "x-admin-token": ADMIN_TOKEN }
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
        <div style={{ padding: 20, fontFamily: "system-ui,Arial" }}>
            <h2>Admin — Chat Sessions</h2>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <input placeholder="Search text…" value={q} onChange={e => setQ(e.target.value)} />
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
                <input type="date" value={to} onChange={e => setTo(e.target.value)} />
                <button onClick={() => fetchList(0)}>Search</button>
                <button onClick={exportNdjson}>Export NDJSON</button>
            </div>

            <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "#f4f6fa" }}>
                        <th align="left">SID</th>
                        <th align="left">Messages</th>
                        <th align="left">Created</th>
                        <th align="left">Updated</th>
                        <th align="left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.sid}>
                            <td><code>{r.sid}</code></td>
                            <td>{r.count ?? "–"}</td>
                            <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "–"}</td>
                            <td>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "–"}</td>
                            <td>
                                <button onClick={() => open(r.sid)}>Open</button>{" "}
                                <button onClick={() => del(r.sid)} style={{ color: "#a00" }}>Delete</button>
                            </td>
                        </tr>
                    ))}
                    {!rows.length && <tr><td colSpan="5">No results.</td></tr>}
                </tbody>
            </table>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button disabled={skip === 0} onClick={() => fetchList(Math.max(skip - limit, 0))}>Prev</button>
                <div style={{ alignSelf: "center" }}>
                    {skip + 1}–{Math.min(skip + limit, total)} of {total}
                </div>
                <button disabled={skip + limit >= total} onClick={() => fetchList(skip + limit)}>Next</button>
            </div>

            {detail && (
                <div style={{ marginTop: 20, padding: 12, border: "1px solid #e2e6ee", borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ margin: 0 }}>Session: {detail.sid}</h3>
                        <button onClick={() => setDetail(null)}>Close</button>
                    </div>
                    <div style={{ maxHeight: 400, overflow: "auto", marginTop: 10 }}>
                        {(detail.history || []).map((m, i) => (
                            <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #f2f2f2" }}>
                                <b style={{ textTransform: "capitalize" }}>{m.role}</b> ·{" "}
                                <small>{m.ts ? new Date(m.ts).toLocaleString() : ""}</small>
                                <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{m.content}</div>
                            </div>
                        ))}
                        {!detail.history?.length && <div>Empty.</div>}
                    </div>
                </div>
            )}
        </div>
    );
}

// ====================== Model Settings Section ======================
function ModelSettings() {
    const [model, setModel] = useState(localStorage.getItem("openai_model") || "gpt-4o-mini");
    const models = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];

    const saveModel = () => {
        localStorage.setItem("openai_model", model);
        alert(`Model saved: ${model}`);
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Model Settings</h2>
            <p>Select which OpenAI model to use for responses:</p>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={saveModel} style={{ marginLeft: 10 }}>Save</button>
        </div>
    );
}

// ====================== Main Component ======================
export default function Admin() {
    const [active, setActive] = useState("history");

    return (
        <div style={{ display: "flex" }}>
            <Sidebar active={active} setActive={setActive} />
            <div style={{ marginLeft: 240, width: "100%" }}>
                {active === "history" && <ChatHistory />}
                {active === "models" && <ModelSettings />}
            </div>
        </div>
    );
}


// import { useEffect, useState } from "react";
// const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8790";
// const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || ""; // set in .env.local

// function Row({ s, onOpen, onDelete }) {
//     return (
//         <tr>
//             <td><code>{s.sid}</code></td>
//             <td>{s.count ?? "–"}</td>
//             <td>{s.createdAt ? new Date(s.createdAt).toLocaleString() : "–"}</td>
//             <td>{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "–"}</td>
//             <td>
//                 <button onClick={() => onOpen(s.sid)}>Open</button>{" "}
//                 <button onClick={() => onDelete(s.sid)} style={{ color: "#a00" }}>Delete</button>
//             </td>
//         </tr>
//     );
// }

// export default function Admin() {
//     const [rows, setRows] = useState([]);
//     const [total, setTotal] = useState(0);
//     const [skip, setSkip] = useState(0);
//     const [limit, setLimit] = useState(25);
//     const [q, setQ] = useState("");
//     const [from, setFrom] = useState("");
//     const [to, setTo] = useState("");
//     const [detail, setDetail] = useState(null);

//     const fetchList = async (sk = skip) => {
//         const u = new URL(`${API_BASE}/admin/sessions`);
//         u.searchParams.set("limit", String(limit));
//         u.searchParams.set("skip", String(sk));
//         if (q) u.searchParams.set("q", q);
//         if (from) u.searchParams.set("from", from);
//         if (to) u.searchParams.set("to", to);
//         const r = await fetch(u, { headers: { "x-admin-token": ADMIN_TOKEN } });
//         const j = await r.json();
//         setRows(j.rows || []);
//         setTotal(j.total || 0);
//         setSkip(sk);
//     };

//     useEffect(() => { fetchList(0); /* eslint-disable-next-line */ }, []);

//     const open = async (sid) => {
//         const r = await fetch(`${API_BASE}/admin/session/${encodeURIComponent(sid)}`, {
//             headers: { "x-admin-token": ADMIN_TOKEN }
//         });
//         setDetail(await r.json());
//     };

//     const del = async (sid) => {
//         if (!window.confirm(`Delete session ${sid}?`)) return;
//         await fetch(`${API_BASE}/admin/session/${encodeURIComponent(sid)}`, {
//             method: "DELETE",
//             headers: { "x-admin-token": ADMIN_TOKEN }
//         });
//         if (detail?.sid === sid) setDetail(null);
//         fetchList(skip);
//     };

//     const exportNdjson = () => {
//         const a = document.createElement("a");
//         a.href = `${API_BASE}/admin/export.ndjson?token=${encodeURIComponent(ADMIN_TOKEN)}`;
//         a.download = "sessions.ndjson";
//         a.click();
//     };

//     return (
//         <div style={{ padding: 20, fontFamily: "system-ui,Arial" }}>
//             <h2>Admin — Chat Sessions</h2>

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
//                 <input placeholder="Search text…" value={q} onChange={e => setQ(e.target.value)} />
//                 <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
//                 <input type="date" value={to} onChange={e => setTo(e.target.value)} />
//                 <button onClick={() => fetchList(0)}>Search</button>
//                 <button onClick={exportNdjson}>Export NDJSON</button>
//             </div>

//             <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse" }}>
//                 <thead>
//                     <tr style={{ background: "#f4f6fa" }}>
//                         <th align="left">SID</th>
//                         <th align="left">Messages</th>
//                         <th align="left">Created</th>
//                         <th align="left">Updated</th>
//                         <th align="left">Actions</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {rows.map(r => <Row key={r.sid} s={r} onOpen={open} onDelete={del} />)}
//                     {!rows.length && <tr><td colSpan="5">No results.</td></tr>}
//                 </tbody>
//             </table>

//             <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
//                 <button disabled={skip === 0} onClick={() => fetchList(Math.max(skip - limit, 0))}>Prev</button>
//                 <div style={{ alignSelf: "center" }}>{skip + 1}–{Math.min(skip + limit, total)} of {total}</div>
//                 <button disabled={skip + limit >= total} onClick={() => fetchList(skip + limit)}>Next</button>
//             </div>

//             {detail && (
//                 <div style={{ marginTop: 20, padding: 12, border: "1px solid #e2e6ee", borderRadius: 10 }}>
//                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                         <h3 style={{ margin: 0 }}>Session: {detail.sid}</h3>
//                         <button onClick={() => setDetail(null)}>Close</button>
//                     </div>
//                     <div style={{ maxHeight: 400, overflow: "auto", marginTop: 10 }}>
//                         {(detail.history || []).map((m, i) => (
//                             <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #f2f2f2" }}>
//                                 <b style={{ textTransform: "capitalize" }}>{m.role}</b> · <small>{m.ts ? new Date(m.ts).toLocaleString() : ""}</small>
//                                 <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{m.content}</div>
//                             </div>
//                         ))}
//                         {!detail.history?.length && <div>Empty.</div>}
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }
