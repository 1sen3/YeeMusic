import { Playlist } from "@/lib/types";
import {
	Dialog,
	DialogAction,
	DialogBody,
	DialogCancel,
	DialogContent,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { YeeButton } from "../yee-button";
import { Edit24Filled } from "@fluentui/react-icons";
import { Input } from "../ui/input";
import { useState } from "react";
import { Textarea } from "../ui/textarea";
import { YeeImageUploader } from "../yee-image-uploader";
import { toast } from "sonner";
import { updatePlaylist, updatePlaylistCover } from "@/lib/services/playlist";
import { Spinner } from "../ui/spinner";
import { getUserPlaylists } from "@/lib/services/user";
import { useUserStore } from "@/lib/store/userStore/userStore";

export function PlaylistEditButton({
	playlist,
	onSuccess,
}: {
	playlist: Playlist;
	onSuccess?: () => void;
}) {
	const [title, setTitle] = useState(playlist.name);
	const [intro, setIntro] = useState<string>(playlist.description || "");
	const [open, setOpen] = useState(false);
	const [uploading, setUploading] = useState(false);

	const [coverFile, setCoverFile] = useState<File | null>(null);

	const { setPlaylistList, user } = useUserStore();

	const titleLength = title.length;
	const maxTitleLength = 40;
	const introLength = intro.length;
	const leftIntroLength = 1000 - introLength;

	const canSubmit =
		title &&
		(title !== playlist.name || intro !== playlist.description || coverFile);

	async function handleEditPlaylist() {
		if (!canSubmit) return;

		try {
			setUploading(true);
			const res = await updatePlaylist(playlist.id, title, intro);

			if (coverFile) {
				const coverRes = await updatePlaylistCover(playlist.id, coverFile);
				if (!coverRes) {
					toast.error("歌单封面更新失败", { position: "top-center" });
					return;
				}
			}

			if (res) {
				toast.success("歌单编辑成功", { position: "top-center" });
				setOpen(false);
				onSuccess?.();
			}

			if (user) {
				const getUserPlaylistRes = await getUserPlaylists(user.userId);
				setPlaylistList(getUserPlaylistRes.playlist);
			}
		} catch (err) {
			console.error("编辑歌单失败： ", err);
			toast.error("编辑歌单失败", { position: "top-center" });
		} finally {
			setUploading(false);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				setOpen(val);
				if (val) setTitle(playlist.name);
			}}
		>
			<DialogTrigger asChild>
				<YeeButton
					variant="glass"
					size="lg"
					icon={<Edit24Filled className="size-4" />}
				/>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogTitle className="sr-only">编辑歌单</DialogTitle>
				<DialogBody>
					<div className="flex gap-8 p-4 pt-6">
						<YeeImageUploader
							src={playlist.coverImgUrl}
							alt={`${playlist.name}-歌单封面`}
							onChange={(file) => setCoverFile(file)}
						/>
						<div className="w-full flex flex-col gap-6">
							<div className="relative">
								<Input
									className="rounded-md bg-card text-foreground/80 pr-16"
									containerClassName="rounded-md"
									value={title}
									onChange={(e) => {
										if (e.target.value.length > maxTitleLength) return;
										setTitle(e.target.value);
									}}
								/>
								<span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-foreground/40">
									{titleLength}/{maxTitleLength}
								</span>
							</div>

							<div className="h-full relative">
								<Textarea
									className="h-34 resize-none rounded-md bg-card text-foreground/80 p-4"
									placeholder="在此填写简介..."
									value={intro}
									onChange={(e) => {
										if (leftIntroLength === 0) return;
										setIntro(e.target.value);
									}}
								/>
								<span className="absolute right-4 bottom-4 text-sm text-black/40">
									{leftIntroLength}
								</span>
							</div>
						</div>
					</div>
				</DialogBody>
				<DialogFooter>
					<DialogCancel>取消</DialogCancel>
					<DialogAction
						disabled={!canSubmit || uploading}
						onClick={handleEditPlaylist}
					>
						<span className="flex items-center gap-2">
							{uploading && <Spinner />}保存
						</span>
					</DialogAction>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
