export async function getOrCreateRoom(): Promise<string> {
  const res = await fetch("/api/room");
  if (!res.ok) throw new Error("Falha ao obter sala");
  const data = await res.json();
  return data.url as string;
}
