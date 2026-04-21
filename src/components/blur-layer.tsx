export function BlurLayer() {
  return (
    <div className="absolute top-0 w-full h-40 pointer-events-none z-0 transition-opacity duration-300">
      <div
        className="absolute inset-0 bg-main-background/20"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(1px)",
          WebkitBackdropFilter: "blur(1px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, transparent 80%)",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, transparent 60%)",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 60%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, transparent 40%)",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 40%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, transparent 20%)",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 20%)",
        }}
      />
    </div>
  );
}
