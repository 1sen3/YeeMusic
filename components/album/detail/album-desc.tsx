export function AlbumDesc({ desc }: { desc: string }) {
  return (
    <div className="w-full h-full py-4">
      <h1 className="text-xl font-semibold mb-4">简介</h1>

      <div className="flex flex-col gap-2">
        {desc.split("\n").map((d, idx) => (
          <p key={idx} className="text-black/80 leading-relaxed">
            {d}
          </p>
        ))}
      </div>
    </div>
  );
}
