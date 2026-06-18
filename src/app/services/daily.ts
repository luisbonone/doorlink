const API_KEY = import.meta.env.VITE_DAILY_API_KEY as string;
const ROOM_NAME = "doorlink-entrada";

export async function getOrCreateRoom(): Promise<string> {
  const getRes = await fetch(`https://api.daily.co/v1/rooms/${ROOM_NAME}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (getRes.ok) {
    const room = await getRes.json();
    return room.url as string;
  }
  const createRes = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: ROOM_NAME, privacy: "public" }),
  });
  const room = await createRes.json();
  return room.url as string;
}
