import { api } from "../api";
import { Playlist, Privilege, Song } from "../types";

interface PlaylistDetailResponse {
	code: number;
	playlist: Playlist;
	privileges: Privilege[];
}

interface PlaylistAllTrackResponse {
	code: number;
	songs: Song[];
	privileges: Privilege[];
}

export async function getPlaylistDetail(id: string | number) {
	const res = await api.get<PlaylistDetailResponse>("/playlist/detail", {
		id: id.toString(),
	});

	return { playlist: res.playlist, privilege: res.privileges };
}

export async function getPlaylistAllTrack(
	id: string | number,
	limit?: string | number,
	offset?: string | number,
) {
	const res = await api.get<PlaylistAllTrackResponse>("/playlist/track/all", {
		id: id.toString(),
		...(limit !== undefined && { limit: limit.toString() }),
		...(offset !== undefined && { offset: offset.toString() }),
	});

	const songs = res.songs.map((song, idx) => ({
		...song,
		privilege: res.privileges[idx],
	}));

	return songs;
}

export async function subscribePlaylist(t: 1 | 2, id: string | number) {
	const res = await api.get<{ code: number }>("/playlist/subscribe", {
		t: t.toString(),
		id: id.toString(),
		timestamp: Date.now().toString(),
	});

	return res.code === 200;
}

export async function updatePlaylist(
	id: string | number,
	name?: string,
	desc?: string,
) {
	const res = await api.get<{ code: number }>("/playlist/update", {
		id: id.toString(),
		...(name && { name: name.toString() }),
		...(desc && { desc: desc.toString() }),
	});

	return res.code === 200;
}

export async function updatePlaylistCover(
	id: string | number,
	file: File,
	imgSize: number = 300,
) {
	const formData = new FormData();
	formData.append("imgFile", file);

	const params = {
		id: id.toString(),
		imgSize: imgSize.toString(),
		imgX: "0",
		imgY: "0",
	};

	const res = await api.post<{ code: number }>(
		"/playlist/cover/update",
		formData,
		{
			params,
		},
	);

	return res.code === 200;
}

export async function deletePlaylist(id: string[] | number[]) {
	const idStr = id.map((i) => i.toString()).join(",");
	const res = await api.get<{ code: number }>("/playlist/delete", {
		id: idStr,
	});

	return res.code === 200;
}

export async function createPlaylist(name: string, isPrivate: boolean) {
	const res = await api.get<{ code: number }>("/playlist/create", {
		name: name.toString(),
		...(isPrivate && { privacy: "10" }),
	});

	return res.code === 200;
}

export async function addSongToPlaylist(
	pid: string | number,
	tracks: string[],
) {
	const ids = tracks.join(",");
	const res = await api.get<{ code: number }>("/playlist/tracks", {
		op: "add",
		pid: pid.toString(),
		tracks: ids,
		timestamp: Date.now().toString(),
	});

	return res.code === 200;
}

export async function removeSongFromPlaylist(
	pid: string | number,
	tracks: string[],
) {
	const ids = tracks.join(",");
	const res = await api.get<{ code: number }>("/playlist/tracks", {
		op: "del",
		pid: pid.toString(),
		tracks: ids,
		timestamp: Date.now().toString(),
	});

	return res.code === 200;
}
