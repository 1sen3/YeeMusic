import { Loading } from "@/components/loading";
import { getArtistSimilar } from "@/lib/services/artist";
import { Artist } from "@/lib/types";
import { useEffect, useState } from "react";
import { ArtistList } from "../artist-list";

export function ArtistSimilar({ artistId }: { artistId: string | number }) {
  const [loading, setLoading] = useState(false);
  const [similar, setSimilar] = useState<Artist[]>([]);

  useEffect(() => {
    async function fetchSimilar() {
      setLoading(true);
      try {
        const res = await getArtistSimilar(artistId.toString());
        setSimilar(res.artists);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSimilar();
  }, [artistId]);

  return (
    <div className="w-full h-full">
      {loading ? <Loading /> : <ArtistList artistList={similar} />}
    </div>
  );
}
