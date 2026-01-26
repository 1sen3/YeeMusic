"use client";

import { useEffect, useState } from "react";
import { SongListCard } from "./components/songlistcard";
import { getAlbum } from "@/lib/services/album";
import { AlbumDetails } from "@/lib/types";
import { Section } from "./components/section";
import { useUserStore } from "@/lib/store/userStore";
import { SongPreview } from "./components/songpreview";

export default function Page() {
  const ids = [259068379, 286650744];
  const [album, setAlbum] = useState<AlbumDetails[] | null>(null);

  const user = useUserStore((state) => state.user);

  useEffect(() => {
    async function getAlbumInfo() {
      try {
        // const albumInfo = await getAlbum(id);
        const validAlbums = (
          await Promise.all(ids.map((id) => getAlbum(id)))
        ).filter((item): item is AlbumDetails => item !== null);
        setAlbum(validAlbums);
      } catch (err) {
        console.error(err);
      }
    }

    getAlbumInfo();
  }, [setAlbum]);

  return (
    <div className="w-full h-full px-8 py-8 flex flex-col gap-6">
      <h1 className="text-2xl">主页</h1>

      <Section title="推荐歌单" seeMore={true} refresh={true}>
        <SongListCard album={null} />
        <SongListCard album={null} />
        <SongListCard album={null} />
        <SongListCard album={null} />
        <SongListCard album={null} />
      </Section>

      <Section title="最近常听">
        <SongListCard album={null} />
        <SongListCard album={null} />
        <SongListCard album={null} />
        <SongListCard album={null} />
        <SongListCard album={null} />
      </Section>

      <Section
        title={`${user ? user.nickname + "的" : ""}雷达歌单`}
        seeMore={true}
        refresh={true}
      >
        <SongListCard album={null} />
        <SongListCard album={null} />
        <SongListCard album={null} />
        <SongListCard album={null} />
        <SongListCard album={null} />
      </Section>

      <Section title="猜你喜欢" seeMore={true} refresh={true}>
        <SongPreview />
        <SongPreview />
      </Section>
    </div>
  );
}
