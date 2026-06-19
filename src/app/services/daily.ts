export async function getOrCreateRoom(): Promise<string> {
  const url = import.meta.env.VITE_DAILY_ROOM_URL as string;
  if (!url) throw new Error("VITE_DAILY_ROOM_URL não configurada");
  return url;
}
