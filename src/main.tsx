import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPushService } from "./services/pushService"; // ✅ Correct path — adjust if needed

// Initialize push notifications once
initPushService();

// Render your app
createRoot(document.getElementById("root")!).render(<App />);
