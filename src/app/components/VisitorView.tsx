const ROOM_URL = import.meta.env.VITE_DAILY_ROOM_URL as string;

export function VisitorView() {
  if (!ROOM_URL) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07111f" }}>
        <p style={{ color: "#6b90a8" }}>Sala não configurada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#07111f" }}>
      <iframe
        src={ROOM_URL}
        allow="camera; microphone; fullscreen; display-capture"
        className="flex-1 w-full border-0"
        style={{ height: "100dvh" }}
      />
    </div>
  );
}
