import { Message } from "discord.js";

export interface PhraseMatcher {
  [key: string]: boolean;
}

export interface FeatureHandler {
  checkPhrases(messageContent: string): PhraseMatcher;
  handle(message: Message, ...args: any[]): Promise<void>;
}

export interface GameState {
  playerId: string;
  channelId: string;
  gameData: any;
  timestamp: number;
}

export interface PingTracker {
  userId: string;
  count: number;
  timestamp: number;
}
