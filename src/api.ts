const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/api";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "API error");
  return json.data as T;
}

// Endpoints
export const getScreenplay = (id: string) => api(`/screenplays/${id}`);

// Content
export const getScreenplayContent = (sid: string) =>
  api<{ html: string; updatedAt: string | null }>(`/screenplays/${sid}/content`);

export const putScreenplayContent = (sid: string, html: string) =>
  api<{ updatedAt: string }>(`/screenplays/${sid}/content`, {
    method: "PUT",
    body: JSON.stringify({ html })
  });

export const getCharacters = (sid: string) => api(`/screenplays/${sid}/characters`);
export const addCharacter = (sid: string, body: { name: string; role?: string }) =>
  api(`/screenplays/${sid}/characters`, { method: "POST", body: JSON.stringify(body) });

export const getDialogues = (cid: string) => api(`/characters/${cid}/dialogues`);
export const updateDialogue = (id: string, text: string) =>
  api(`/dialogues/${id}`, { method: "PUT", body: JSON.stringify({ text }) });

export const getActiveSprint = (uid: string) => api(`/users/${uid}/sprints/active`);
export const startSprint = (uid: string) => api(`/users/${uid}/sprints`, { method: "POST" });
export const updateSprint = (uid: string, sid: string, payload: any) =>
  api(`/users/${uid}/sprints/${sid}`, { method: "PUT", body: JSON.stringify(payload) });

export const getStash = (uid: string) => api(`/users/${uid}/stash`);
export const addStash = (uid: string, text: string, type = "snippet") =>
  api(`/users/${uid}/stash`, { method: "POST", body: JSON.stringify({ text, type }) });
export const deleteStash = (uid: string, id: string) =>
  api(`/users/${uid}/stash/${id}`, { method: "DELETE" });

// Export PDF (raw fetch)
export async function exportPdf(html: string, title = "screenplay") {
  const res = await fetch(`${BASE}/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, title })
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${title}.pdf`; a.click();
  URL.revokeObjectURL(url);
}