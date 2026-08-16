import { DownloadQueue } from "./queue";
import { unloads } from "./tracer";

const asMB = (bytes: number) => (bytes / 1048576).toFixed(0);

/**
 * A floating progress indicator for the active download.
 *
 * The context menu button is a poor place for this: it is shared between every
 * media item and gets overwritten whenever any context menu is opened.
 */
export const initStatusPill = () => {
	const pill = document.createElement("div");
	pill.className = "song-downloader-pill";

	const text = document.createElement("div");
	text.className = "song-downloader-pill-text";

	const title = document.createElement("span");
	title.className = "song-downloader-pill-title";
	const detail = document.createElement("span");
	detail.className = "song-downloader-pill-detail";
	text.append(title, detail);

	const cancel = document.createElement("button");
	cancel.className = "song-downloader-pill-cancel";
	cancel.title = "Stop after this track";
	cancel.innerText = "✕";
	cancel.onclick = () => DownloadQueue.cancelAll();

	pill.append(text, cancel);
	document.body.appendChild(pill);
	unloads.add(() => pill.remove());

	const render = () => {
		const job = DownloadQueue.activeJob;
		if (job === undefined) {
			pill.classList.remove("visible");
			return;
		}
		pill.classList.add("visible");

		const queued = DownloadQueue.pendingCount - 1;
		const done = Math.min(job.completed + job.failed + 1, job.trackCount);
		title.innerText = `${job.label} — ${done}/${job.trackCount}`;

		const parts: string[] = [];
		if (job.current !== undefined) {
			parts.push(job.current.title);
			if (job.current.total > 0) {
				parts.push(`${asMB(job.current.downloaded)}/${asMB(job.current.total)}MB`);
				parts.push(`${job.current.percent.toFixed(0)}%`);
			}
		}
		if (queued > 0) parts.push(`${queued} queued`);
		detail.innerText = parts.join(" · ");

		pill.style.setProperty("--progress", `${job.current?.percent ?? 0}%`);
	};

	unloads.add(DownloadQueue.subscribe(render));
	render();
};
