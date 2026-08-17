import { ContextMenu, StyleTag } from "@luna/lib";

import { getDownloadFolder } from "./helpers";
import { DownloadQueue } from "./queue";
import { settings } from "./settingsStore";
import { initStatusPill } from "./statusPill";
import { errSignal, trace, unloads } from "./tracer";

import styles from "file://downloadButton.css?minify";

export { errSignal, trace, unloads };
export { Settings } from "./Settings";

new StyleTag("SongDownloader", unloads, styles);
initStatusPill();

const downloadButton = ContextMenu.addButton(unloads);
const cancelButton = ContextMenu.addButton(unloads);

ContextMenu.onMediaItem(unloads, async ({ mediaCollection, contextMenu }) => {
	const trackCount = await mediaCollection.count();
	if (trackCount === 0) return;

	const pending = DownloadQueue.pendingCount;
	// "downloading" overstates it, only one of the pending jobs is ever actually transferring
	downloadButton.text = pending === 0 ? `Download ${trackCount} tracks` : `Queue ${trackCount} tracks (${pending} in queue)`;
	downloadButton.onClick(async () => {
		// The folder has to be picked while the click is still in hand, prompting once the
		// job reaches the front of the queue would ambush the user minutes later
		const downloadFolder = settings.defaultPath ?? (trackCount > 1 ? await getDownloadFolder() : undefined);
		// Dismissing the folder picker means don't download, not download somewhere else
		if (trackCount > 1 && downloadFolder === undefined) return;
		await DownloadQueue.enqueue(mediaCollection, downloadFolder).catch(trace.msg.err.withContext("Failed to queue download"));
	});
	await downloadButton.show(contextMenu);

	// Only offered while there is something to cancel
	if (pending > 0) {
		cancelButton.text = `Cancel downloads (${pending})`;
		cancelButton.onClick(() => DownloadQueue.cancelAll());
		await cancelButton.show(contextMenu);
	}
});
