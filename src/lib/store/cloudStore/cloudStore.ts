import { toast } from "sonner";
import { create } from "zustand";
import { uploadCloudSong } from "../../services/cloud";
import type { CloudUploadTask } from "../../types";

// File 对象与 abort 函数不放进 store state，避免不可序列化数据参与渲染
const pendingFiles = new Map<string, File>();
const abortFns = new Map<string, () => void>();
let taskSeq = 0;
let processing = false;

type CloudStore = {
	uploadTasks: Map<string, CloudUploadTask>;

	uploadFiles: (files: File[]) => void;
	cancelUpload: (id: string) => void;
	clearFinishedTasks: () => void;
};

function updateTask(
	set: (fn: (s: CloudStore) => Partial<CloudStore>) => void,
	id: string,
	patch: Partial<CloudUploadTask>,
) {
	set((s) => {
		const task = s.uploadTasks.get(id);
		if (!task) return {};
		const next = new Map(s.uploadTasks);
		next.set(id, { ...task, ...patch });
		return { uploadTasks: next };
	});
}

function removeTask(
	set: (fn: (s: CloudStore) => Partial<CloudStore>) => void,
	id: string,
) {
	set((s) => {
		const next = new Map(s.uploadTasks);
		next.delete(id);
		return { uploadTasks: next };
	});
}

// 串行处理上传队列，避免多文件并发上传占满带宽
async function processQueue(
	set: (fn: (s: CloudStore) => Partial<CloudStore>) => void,
	get: () => CloudStore,
) {
	if (processing) return;
	processing = true;

	try {
		while (true) {
			const task = Array.from(get().uploadTasks.values()).find(
				(t) => t.status === "pending" && pendingFiles.has(t.id),
			);
			if (!task) break;

			const file = pendingFiles.get(task.id)!;
			pendingFiles.delete(task.id);
			updateTask(set, task.id, { status: "uploading" });

			// 进度回调节流计算速度
			let lastLoaded = 0;
			let lastTime = Date.now();
			const { promise, abort } = uploadCloudSong(file, (loaded, total) => {
				const now = Date.now();
				const elapsed = now - lastTime;
				if (elapsed >= 300) {
					const speed = ((loaded - lastLoaded) / elapsed) * 1000;
					lastLoaded = loaded;
					lastTime = now;
					updateTask(set, task.id, { uploaded: loaded, total, speed });
				} else {
					updateTask(set, task.id, { uploaded: loaded, total });
				}
			});
			abortFns.set(task.id, abort);

			try {
				await promise;
				const total = get().uploadTasks.get(task.id)?.total ?? task.total;
				updateTask(set, task.id, {
					status: "done",
					uploaded: total,
					speed: 0,
				});
				toast.success(`《${task.fileName}》已上传到云盘`);
				window.dispatchEvent(
					new CustomEvent("cloud-song-uploaded", {
						detail: { fileName: task.fileName },
					}),
				);
			} catch (err) {
				if (err instanceof DOMException && err.name === "AbortError") {
					removeTask(set, task.id);
				} else {
					const msg = err instanceof Error ? err.message : "上传失败";
					updateTask(set, task.id, {
						status: "error",
						speed: 0,
						errorMsg: msg,
					});
					toast.error(`《${task.fileName}》${msg}`);
				}
			} finally {
				abortFns.delete(task.id);
			}
		}
	} finally {
		processing = false;
	}
}

export const useCloudStore = create<CloudStore>((set, get) => ({
	uploadTasks: new Map(),

	uploadFiles: (files) => {
		if (!files.length) return;

		set((s) => {
			const next = new Map(s.uploadTasks);
			for (const file of files) {
				const id = `${Date.now()}-${taskSeq++}`;
				pendingFiles.set(id, file);
				next.set(id, {
					id,
					fileName: file.name,
					status: "pending",
					uploaded: 0,
					total: file.size,
					speed: 0,
					addedAt: Date.now(),
				});
			}
			return { uploadTasks: next };
		});

		void processQueue(set, get);
	},

	cancelUpload: (id) => {
		const task = get().uploadTasks.get(id);
		if (!task) return;

		if (task.status === "uploading") {
			// abort 后上传 promise 以 AbortError 拒绝，由队列统一移除任务
			abortFns.get(id)?.();
		} else {
			pendingFiles.delete(id);
			removeTask(set, id);
		}
	},

	clearFinishedTasks: () => {
		set((s) => {
			const next = new Map(s.uploadTasks);
			for (const [id, t] of next) {
				if (t.status === "done" || t.status === "error") next.delete(id);
			}
			return { uploadTasks: next };
		});
	},
}));
