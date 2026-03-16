export interface ZynLogEntry {
  id: string;
  timestamp: string;
  mentalHealth: number | null;
  comments: string;
  emergency: boolean;
  weeklyInsight: string;
}

export interface BotConfig {
  intervalHours: number;
  chatId: number | null;
  lastZynTime: string | null;
  botActive: boolean;
}
