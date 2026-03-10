import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// App build info
if (typeof window !== 'undefined') {
  (window as any).__APP_BUILD__ = '20260309v2';
}

createRoot(document.getElementById("root")!).render(<App />);
