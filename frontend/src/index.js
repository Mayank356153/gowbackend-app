import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // ✅ Add this

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <App />
);

// ✅ Register service worker to enable PWA
serviceWorkerRegistration.register();
