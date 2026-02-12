import { Loading } from "@/components/loading";
import { getArtistDesc } from "@/lib/services/artist";
import { ArtistIntroduction } from "@/lib/types";
import { useEffect, useState } from "react";

export function ArtistDesc({ artistId }: { artistId: number }) {
  const [intros, setIntros] = useState<ArtistIntroduction[]>([]);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchArtistDesc() {
      setLoading(true);
      try {
        const res = await getArtistDesc(artistId.toString());
        setIntros(res.introduction);
        setBrief(res.briefDesc);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchArtistDesc();
  }, [artistId]);

  return (
    <div className="w-full h-full flex flex-col gap-8 py-6">
      {loading ? (
        <Loading />
      ) : (
        <>
          <div>
            <h1 className="text-xl font-semibold mb-4">简介</h1>
            <p className="text-black/80 leading-relaxed">{brief}</p>
          </div>

          {intros.map((intro, idx) => (
            <div key={idx} className="flex flex-col gap-4">
              <h1 className="text-xl font-semibold mb-4">{intro.ti}</h1>
              {intro.txt.split("\n").map((line, i) => (
                <p key={i} className="text-black/80 leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
