import fs from "node:fs";
import type { Plugin } from "vite";
import { reloadPlugin } from "./utils";

export declare namespace plugin {
	interface Options {
		/**
		 * The path of the main plugin file
		 *
		 * @default "./src/plugin.ts"
		 */
		entry?: string;

		/**
		 * The ouytput directory for the built plugin files.
		 *
		 * @default "dist"
		 */
		outDir?: string; // The output directory for the build

		/**
		 * The port of the limbo server to use for hot reloading the plugin.
		 *
		 * @default 5151
		 */
		serverPort?: number;
	}
}

export function plugin(opts?: plugin.Options): Plugin {
	let pluginManifestRaw;

	try {
		pluginManifestRaw = fs.readFileSync("plugin.json", "utf8");
	} catch (error) {
		throw new Error(
			`Failed to find a "plugin.json" file in the current directory. Make sure it exists.`
		);
	}

	const pluginManifest = JSON.parse(pluginManifestRaw);

	let isWatchMode = false;

	return {
		name: "limbo",
		apply: "build",
		config(config) {
			return {
				...config,
				build: {
					...config.build,
					outDir: opts?.outDir ?? "dist",
					lib: {
						...config.build?.lib,
						entry: opts?.entry ?? "./src/plugin.ts",
						formats: ["cjs"],
						fileName: () => "plugin.js",
						cssFileName: "plugin",
					},
					rollupOptions: {
						...config.build?.rollupOptions,
						external: ["limbo", "react"],
					},
				},
			};
		},
		configResolved(config) {
			isWatchMode = !!config.build.watch;
		},
		async closeBundle() {
			if (!isWatchMode) {
				return;
			}

			try {
				await reloadPlugin({
					pluginId: pluginManifest.id,
					serverPort: opts?.serverPort ?? (Number(process.env.LIMBO_SERVER_PORT) || 5151),
				});
			} catch {
				this.warn(
					`Failed to hot reload "${pluginManifest.id}" in the limbo desktop. Make sure the desktop app is running, development mode is enabled, and the correct server port is configured.`
				);

				return;
			}

			this.info(`Successfully hot reloaded "${pluginManifest.id}" in limbo desktop`);
		},
	};
}
