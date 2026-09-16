import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const miniTool = mode === "minitool";
  return {
  base: miniTool ? "./" : "/",
  publicDir: miniTool ? false : "public",
  define: {
    __MINITOOL_BUILD__: JSON.stringify(miniTool),
  },
  build: {
    outDir: miniTool ? "dist/minitool" : "dist/client",
    target: ["es2017", "chrome61"],
    cssTarget: "chrome61",
    modulePreload: miniTool ? { polyfill: false } : undefined,
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
  };
});
