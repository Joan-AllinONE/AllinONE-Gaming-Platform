import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import "./index.css";
import { initCloudBase } from "./services/cloudbase.ts";

const basename = '/AllinONE-Gaming-Platform';

// 初始化 CloudBase（不阻塞应用启动）
initCloudBase().catch((err) => {
  console.warn('CloudBase 初始化失败:', err.message);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
      <Toaster />
    </BrowserRouter>
  </StrictMode>
);
