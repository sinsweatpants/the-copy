export type ID = string;

export interface Screenplay {
  id: ID;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: ID;
  screenplayId: ID;
  name: string;
  role: string;
}

export interface Dialogue {
  id: ID;
  characterId: ID;
  screenplayId: ID;
  text: string;
  sceneNumber?: string | null;
  page?: number | null;
}

export interface Sprint {
  id: ID;
  userId: ID;
  isActive: number; // 0/1
  startedAt: string;
  endedAt?: string | null;
  durationSec?: number | null;
}

export interface StashItem {
  id: ID;
  userId: ID;
  text: string;
  type: string;
  wordCount: number;
  createdAt: string;
}