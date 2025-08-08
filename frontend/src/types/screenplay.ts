export type ScreenplayFormatId =
  | 'scene-header-1'
  | 'scene-header-2'
  | 'scene-header-location'
  | 'action'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition'
  | 'basmala'
  | 'unknown';

export interface IClassifier {
  classifyLine(line: string, previousFormat: ScreenplayFormatId | null): ScreenplayFormatId;
  parseSceneHeaderLine(line: string): { sceneNumber: string; sceneInfo: string } | null;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  dialogueCount: number;
  wordCount: number;
  sceneCount: number;
  dialogueShare: number;
}

export interface DialogueLine {
  id: string;
  characterId: string;
  text: string;
  sceneNumber: number;
  pageNumber: number;
  isEdited: boolean;
}

export interface Sprint {
  id: string;
  userId: string;
  duration: number; // in minutes
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  pausedAt?: Date;
  wordsWritten: number;
}

export interface StashItem {
  id: string;
  userId: string;
  text: string;
  type: ScreenplayFormatId;
  wordCount: number;
  createdAt: Date;
}

export interface ErrorCheck {
  id: string;
  type: 'Format' | 'Consistency';
  severity: 'Error' | 'Warning';
  description: string;
  location: {
    line: number;
    column: number;
  };
  suggestion?: string;
}

export interface ScriptStructure {
  acts: Act[];
  scenes: Scene[];
  bookmarks: Bookmark[];
}

export interface Act {
  id: string;
  title: string;
  scenes: Scene[];
  startLine: number;
  endLine: number;
}

export interface Scene {
  id: string;
  number: number;
  title: string;
  location: string;
  setting: string;
  startLine: number;
  endLine: number;
  characters: string[];
}

export interface Bookmark {
  id: string;
  title: string;
  line: number;
  createdAt: Date;
}

export interface ClassifiedLine {
  line: string;
  format: ScreenplayFormatId;
  sceneData?: {
    sceneNumber: string;
    sceneInfo: string;
  };
}