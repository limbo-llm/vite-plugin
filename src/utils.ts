export interface ReloadPluginOptions {
	pluginId: string;
	serverPort: number;
}

export function reloadPlugin(opts: ReloadPluginOptions) {
	return fetch(`http://localhost:${opts.serverPort}/plugins/${opts.pluginId}/reload`, {
		method: "POST",
	});
}
