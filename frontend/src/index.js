import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AppProviders } from "./context/AppProviders.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AppProviders>
    <App />
  </AppProviders>
);

