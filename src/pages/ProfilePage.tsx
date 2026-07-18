import { motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { Entrance, entranceEase } from "@/components/entrance";
import { ProfileEditButton } from "@/components/profile/profile-edit-button";
import { ProfilePlaylistSection } from "@/components/profile/profile-playlist-section";
import { Skeleton } from "@/components/ui/skeleton";
import { YeeImageUploader } from "@/components/yee-image-uploader";
import {
	getUserDetails,
	getUserPlaylists,
	updateUserAvatar,
} from "@/lib/services/user";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { formateDate } from "@/lib/utils";

const GENDER_LABELS: Record<number, string> = {
	1: "男",
	2: "女",
};

function PlaylistSectionSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			<h2 className="font-medium text-foreground/88 text-sm">歌单</h2>
			<div className="grid grid-cols-7 gap-8">
				{["a", "b", "c", "d", "e", "f", "g"].map((key) => (
					<div key={key} className="flex w-full flex-col gap-3">
						<Skeleton className="aspect-square w-full rounded-lg" />
						<Skeleton className="h-4 w-3/4" />
					</div>
				))}
			</div>
		</div>
	);
}

export default function ProfilePage() {
	const [searchParams] = useSearchParams();
	const reduceMotion = useReducedMotion();
	const user = useUserStore((s) => s.user);
	const setUser = useUserStore((s) => s.setUser);

	const uidParam = searchParams.get("uid");
	const uid = uidParam ? Number(uidParam) : user?.userId;
	const isMe = !!user && uid === user.userId;

	const { data, isLoading, mutate } = useSWR(
		uid ? `user-detail-${uid}` : null,
		uid ? () => getUserDetails(uid) : null,
		{ revalidateOnFocus: false },
	);

	const { data: playlistData, isLoading: isPlaylistsLoading } = useSWR(
		uid ? `user-playlists-${uid}` : null,
		uid ? () => getUserPlaylists(uid, 1000) : null,
		{ revalidateOnFocus: false },
	);

	if (!uid) {
		return (
			<div className="flex h-full w-full flex-col gap-8 px-8 py-8">
				<div className="flex h-full w-full items-center justify-center text-foreground/60">
					登录后即可查看个人信息
				</div>
			</div>
		);
	}

	const profile = data?.profile;
	const nickname = profile?.nickname ?? (isMe ? user?.nickname : "");
	const avatarUrl = profile?.avatarUrl ?? (isMe ? user?.avatarUrl : "");
	const signature = profile?.signature ?? (isMe ? user?.signature : "");
	const genderLabel = profile ? (GENDER_LABELS[profile.gender] ?? "") : "";
	const birthday =
		profile?.birthday && profile.birthday > 0
			? formateDate(profile.birthday)
			: "";

	const playlists = playlistData?.playlist ?? [];
	const createdPlaylists = playlists.filter((pl) => pl.creator.userId === uid);
	const subscribedPlaylists = playlists.filter(
		(pl) => pl.creator.userId !== uid,
	);

	const handleAvatarChange = async (file: File) => {
		try {
			const res = await updateUserAvatar(file);
			if (!res) {
				toast.error("头像更新失败", { position: "top-center" });
				return;
			}

			toast.success("头像更新成功", { position: "top-center" });

			const detail = await mutate();
			const newAvatarUrl = detail?.profile?.avatarUrl;
			if (user && newAvatarUrl) {
				const updated = { ...user, avatarUrl: newAvatarUrl };
				setUser(updated);
				localStorage.setItem("userInfo", JSON.stringify(updated));
			}
		} catch (err) {
			console.error("更新头像失败：", err);
			toast.error("头像更新失败", { position: "top-center" });
		}
	};

	const stats = data
		? [
				{ label: "关注", value: profile?.follows ?? 0 },
				{ label: "粉丝", value: profile?.followeds ?? 0 },
				{ label: "动态", value: profile?.eventCount ?? 0 },
				{ label: "累计听歌", value: `${data.listenSongs.toLocaleString()} 首` },
				{ label: "村龄", value: `${data.createDays.toLocaleString()} 天` },
			]
		: [];

	return (
		<div className="flex h-full w-full flex-col gap-8 px-8 py-8">
			<div className="flex items-center gap-8">
				<Entrance className="shrink-0">
					{user && isMe ? (
						<YeeImageUploader
							className="size-40 rounded-full"
							cropShape="round"
							src={user.avatarUrl}
							alt={`${user.nickname} 的头像`}
							onChange={handleAvatarChange}
						/>
					) : avatarUrl ? (
						<img
							className="size-40 shrink-0 rounded-full object-cover drop-shadow-xl"
							src={avatarUrl}
							alt={`${nickname} 的头像`}
						/>
					) : (
						<Skeleton className="size-40 shrink-0 rounded-full" />
					)}
				</Entrance>

				<Entrance delay={0.06} className="flex min-w-0 flex-col gap-4">
					<div className="flex items-center gap-3">
						<span className="select-text font-bold text-2xl tracking-tight">
							{nickname}
						</span>
						{data && (
							<span className="rounded-full border border-foreground/[0.12] px-2 py-0.5 text-foreground/60 text-xs">
								Lv.{data.level}
							</span>
						)}
					</div>

					<div className="flex flex-col gap-1.5">
						<span className="select-text text-foreground/60 text-sm">
							{signature || "这个人很懒，什么都没有留下"}
						</span>
						{(genderLabel || birthday) && (
							<div className="flex items-center gap-2 text-foreground/60 text-sm">
								{genderLabel && <span>{genderLabel}</span>}
								{genderLabel && birthday && (
									<span className="h-4 w-0.5 rounded-full bg-foreground/15" />
								)}
								{birthday && <span>{birthday}</span>}
							</div>
						)}
					</div>

					{isMe && (
						<div>
							{profile && (
								<ProfileEditButton
									profile={profile}
									onSuccess={() => mutate()}
								/>
							)}
						</div>
					)}
				</Entrance>
			</div>

			<Entrance delay={0.12} className="flex flex-col gap-3">
				<h2 className="font-medium text-foreground/88 text-sm">
					{isMe ? "我的数据" : "TA 的数据"}
				</h2>
				{isLoading ? (
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
						{["关注", "粉丝", "动态", "累计听歌", "村龄"].map((label) => (
							<Skeleton key={label} className="h-20 rounded-md" />
						))}
					</div>
				) : (
					<div
						className="group grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
						onPointerMove={(event) => {
							for (const card of event.currentTarget.querySelectorAll<HTMLElement>(
								"[data-reveal-card]",
							)) {
								const rect = card.getBoundingClientRect();
								card.style.setProperty(
									"--mouse-x",
									`${event.clientX - rect.left}px`,
								);
								card.style.setProperty(
									"--mouse-y",
									`${event.clientY - rect.top}px`,
								);
							}
						}}
					>
						{stats.map((stat, index) => (
							<motion.div
								key={stat.label}
								data-reveal-card
								className="relative flex flex-col gap-1 rounded-md border border-foreground/[0.08] bg-card/55 px-5 py-4"
								initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
								animate={
									reduceMotion
										? { opacity: 1, transition: { duration: 0.25 } }
										: {
												opacity: 1,
												y: 0,
												transition: {
													duration: 0.5,
													ease: entranceEase,
													delay: index * 0.045,
												},
											}
								}
								style={
									{
										"--mouse-x": "-999px",
										"--mouse-y": "-999px",
									} as React.CSSProperties
								}
							>
								<div
									aria-hidden="true"
									className="pointer-events-none absolute inset-0 rounded-md p-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
									style={{
										background:
											"radial-gradient(90px circle at var(--mouse-x) var(--mouse-y), color-mix(in srgb, var(--foreground) 22%, transparent), transparent 70%)",
										WebkitMask:
											"linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
										WebkitMaskComposite: "xor",
										mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
										maskComposite: "exclude",
									}}
								/>
								<span className="text-foreground/52 text-sm">{stat.label}</span>
								<span className="font-bold text-xl tabular-nums tracking-tight">
									{stat.value}
								</span>
							</motion.div>
						))}
					</div>
				)}
			</Entrance>

			{isPlaylistsLoading ? (
				<PlaylistSectionSkeleton />
			) : (
				<>
					{createdPlaylists.length > 0 && (
						<Entrance>
							<ProfilePlaylistSection
								title="创建的歌单"
								playlists={createdPlaylists}
							/>
						</Entrance>
					)}
					{subscribedPlaylists.length > 0 && (
						<Entrance delay={0.06}>
							<ProfilePlaylistSection
								title="收藏的歌单"
								playlists={subscribedPlaylists}
							/>
						</Entrance>
					)}
				</>
			)}
		</div>
	);
}
