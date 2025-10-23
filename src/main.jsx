import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App.jsx";
import Admin from "./assets/Admin.jsx";
import Login from "./assets/Login.jsx";

function PrivateRoute({ children }) {
    const token = localStorage.getItem("jwt_token");
    return token ? children : <Navigate to="/login" replace />;
}

createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/login" element={<Login />} />
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute>
                            <Admin />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
