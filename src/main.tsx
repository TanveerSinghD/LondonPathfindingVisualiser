import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

if (import.meta.env.PROD && typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error("Unhandled error:", event.error || event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
  });
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root container missing");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
