export interface ZynLogEntry {
  id: string;
  timestamp: string;
  mentalHealth: number | null;
  comments: string;
  emergency: boolean;
}

export interface WeeklySummaryEntry {
  id: string;
  weekStart: string;
  weekEnd: string;
  totalZyns: number;
  emergencyCount: number;
  avgMentalHealth: number;
  summary: string;
}

export interface BotConfig {
  intervalHours: number;
  chatId: number | null;
  lastZynTime: string | null;
  botActive: boolean;
}
