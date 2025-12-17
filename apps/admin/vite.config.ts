import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
    plugins: [
        react(),
        // Only enable TypeScript checker in dev mode
        command === "serve" && checker({
            typescript: true,
        }),
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        __APP_NAME__: JSON.stringify(process.env.npm_package_name),
    },
    server: {
        port: 3001,
        strictPort: true,
        host: true,
    },
});

