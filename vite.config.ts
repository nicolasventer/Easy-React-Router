import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { watch } from "vite-plugin-watch";

const routerGenWatcher = watch({
	pattern: "src/routes/**",
	command: "bun _genRoute.ts", // add --json or -j to also generate json file
});

const lazyComponentWatcher = watch({
	pattern: "src/**/*.{tsx,ts}",
	command: (filePath) => `bun _lazyComponent.ts ${filePath}`,
});

// https://vite.dev/config/
export default defineConfig({
	base: "./",
	plugins: [react(), routerGenWatcher, lazyComponentWatcher],
	build: {
		sourcemap: true,
		rollupOptions: {
			output: {
				// eslint-disable-next-line no-undef
				dir: path.resolve(__dirname, "dist"),
				entryFileNames: "[name].js",
				assetFileNames: "asset/[name].[ext]",
				chunkFileNames: "[name].chunk.js",
				manualChunks: undefined,
			},
			onLog(level, log, handler) {
				if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
				handler(level, log);
			},
		},
	},
});
