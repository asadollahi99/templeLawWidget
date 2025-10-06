// import React from "react";
// import { createRoot } from "react-dom/client";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import App from "./App.jsx";
// import Admin from "./Admin.jsx";

// createRoot(document.getElementById("root")).render(
//     <BrowserRouter>
//         <Routes>
//             <Route path="/" element={<App />} />
//             <Route path="/admin" element={<Admin />} />
//         </Routes>
//     </BrowserRouter>
// );
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Admin from "./assets/Admin.jsx"; // or "./Admin.jsx" if you moved it

//const basename = import.meta.env.MODE === "production" ? "/ctlaw" : "/";
const basename = "/";
createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter basename={basename}>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
