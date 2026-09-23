export interface TwinePassage {
  pid: string;
  name: string;
  tags: string[];
  pos: { x: number; y: number };
  size: { width: number; height: number };
  content: string;
  links: string[];
  isStart: boolean;
  isEnding: boolean;
}

export interface TwineStoryData {
  id: string;
  title: string;
  format: string;
  formatVersion: string;
  creator: string;
  creatorVersion: string;
  startNodePid: string;
  passages: TwinePassage[];
  rawHtml: string;
  sizeBytes: number;
  uploadedAt: number;
  lastPlayedAt?: number;
  playCount: number;
  description?: string;
  tags: string[];
  isSample?: boolean;
}

export interface TwineAnalysis {
  totalPassages: number;
  totalWords: number;
  totalLinks: number;
  endingPassagesCount: number;
  orphanPassagesCount: number;
  averageBranchingFactor: number;
  detectedEngine: string;
  startPassageName: string;
}

export type PlayerViewMode = 'fullscreen' | 'contained' | 'graph';
