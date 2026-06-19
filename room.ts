const API_KEY = process.env.VITE_DAILY_API_KEY;
const ROOM_NAME = "doorlink-entrada";

export default async function handler(req: Request): Promise<Response> {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const getRes = await fetch(`https://api.daily.co/v1/rooms/${ROOM_NAME}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (getRes.ok) {
      const room = await getRes.json();
      return new Response(JSON.stringify({ url: room.url }), { headers });
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
    return new Response(JSON.stringify({ url: room.url }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: "Falha ao criar sala" }), { status: 500, headers });
  }
}

export const config = { runtime: "edge" };
