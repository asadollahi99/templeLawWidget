import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8790";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const r = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const j = await r.json();
            if (j.error) return setError(j.error);
            localStorage.setItem("jwt_token", j.token);
            localStorage.setItem("role", j.role);
            window.location.href = "/admin";
        } catch {
            setError("Server error, please try again.");
        }
    };

    return (
        <div
            className="d-flex align-items-center justify-content-center vh-100 bg-light"
            style={{
                background:
                    "linear-gradient(90deg, rgba(123,30,30,0.9) 0%, rgba(52,73,94,0.9) 100%)",
            }}
        >
            <div className="card p-4 shadow-lg border-0 rounded-4" style={{ width: 340 }}>
                <h4 className="text-center mb-3 text-dark">Admin Login</h4>
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className="text-danger small mb-2">{error}</div>}
                    <button
                        type="submit"
                        className="btn w-100 text-white"
                        style={{ backgroundColor: "#7b1e1e" }}
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
