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
import { Delete24Filled } from "@fluentui/react-icons";
import { useState } from "react";
import { deletePlaylist } from "@/lib/services/playlist";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { getUserPlaylists } from "@/lib/services/user";
import { Spinner } from "../ui/spinner";

export function PlaylistDeleteButton({ playlist }: { playlist: Playlist }) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { user, setPlaylistList } = useUserStore();

	async function handleDelete() {
		try {
			setLoading(true);
			const res = await deletePlaylist([playlist.id]);
			if (!res) {
				toast.error("删除歌单失败", { position: "top-center" });
				return;
			}

			toast.success("歌单已删除", { position: "top-center" });
			setOpen(false);

			if (user) {
				const getUserPlaylistRes = await getUserPlaylists(user.userId);
				setPlaylistList(getUserPlaylistRes.playlist);
			}

			navigate("/");
		} catch (error) {
			console.log("删除歌单失败", error);
			toast.error("删除歌单失败", { position: "top-center" });
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<YeeButton
					variant="glass"
					size="lg"
					icon={<Delete24Filled className="size-4" />}
				/>
			</DialogTrigger>
			<DialogContent>
				<DialogTitle>删除歌单</DialogTitle>
				<DialogBody>确定删除该歌单？</DialogBody>
				<DialogFooter>
					<DialogCancel onClick={() => setOpen(false)}>取消</DialogCancel>
					<DialogAction
						onClick={handleDelete}
						disabled={loading}
						className="bg-destructive hover:bg-destructive/80"
					>
						<span className="flex items-center gap-2">
							{loading && <Spinner />}确定
						</span>
					</DialogAction>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
