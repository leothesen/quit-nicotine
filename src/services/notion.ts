import { Client } from "@notionhq/client";
import { config } from "../config";
import { BotConfig, ZynLogEntry, WeeklySummaryEntry } from "../types";

const notion = new Client({ auth: config.notionToken });

// --- Config ---

export async function getConfig(): Promise<BotConfig> {
  const { results } = await notion.databases.query({
    database_id: config.configDbId,
    page_size: 1,
  });

  if (results.length === 0) throw new Error("No config row found in Notion");

  const page = results[0] as any;
  const props = page.properties;

  return {
    intervalHours: props["Interval Hours"]?.number ?? 1,
    chatId: props["Chat ID"]?.number ?? null,
    lastZynTime: props["Last Zyn Time"]?.date?.start ?? null,
    botActive: props["Bot Active"]?.checkbox ?? true,
  };
}

async function getConfigPageId(): Promise<string> {
  const { results } = await notion.databases.query({
    database_id: config.configDbId,
    page_size: 1,
  });
  if (results.length === 0) throw new Error("No config row found in Notion");
  return results[0].id;
}

export async function updateConfig(
  updates: Partial<Pick<BotConfig, "intervalHours" | "chatId" | "lastZynTime" | "botActive">>
): Promise<void> {
  const pageId = await getConfigPageId();
  const properties: Record<string, any> = {};

  if (updates.intervalHours !== undefined) {
    properties["Interval Hours"] = { number: updates.intervalHours };
  }
  if (updates.chatId !== undefined) {
    properties["Chat ID"] = { number: updates.chatId };
  }
  if (updates.lastZynTime !== undefined) {
    properties["Last Zyn Time"] = {
      date: updates.lastZynTime ? { start: updates.lastZynTime } : null,
    };
  }
  if (updates.botActive !== undefined) {
    properties["Bot Active"] = { checkbox: updates.botActive };
  }

  await notion.pages.update({ page_id: pageId, properties });
}

// --- Zyn Log ---

export async function createZynLog(entry: {
  timestamp: string;
  emergency: boolean;
}): Promise<string> {
  const page = await notion.pages.create({
    parent: { database_id: config.zynLogDbId },
    properties: {
      Name: {
        title: [{ text: { content: `Zyn - ${entry.timestamp}` } }],
      },
      Timestamp: { date: { start: entry.timestamp } },
      Emergency: { checkbox: entry.emergency },
    },
  });

  await updateConfig({ lastZynTime: entry.timestamp });

  return page.id;
}

export async function updateZynLog(
  pageId: string,
  updates: { mentalHealth?: number; comments?: string }
): Promise<void> {
  const properties: Record<string, any> = {};

  if (updates.mentalHealth !== undefined) {
    properties["Mental Health"] = { number: updates.mentalHealth };
  }
  if (updates.comments !== undefined) {
    properties["Comments"] = {
      rich_text: [{ text: { content: updates.comments } }],
    };
  }
  await notion.pages.update({ page_id: pageId, properties });
}

export async function getRecentLogs(days: number): Promise<ZynLogEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { results } = await notion.databases.query({
    database_id: config.zynLogDbId,
    filter: {
      property: "Timestamp",
      date: { on_or_after: since.toISOString() },
    },
    sorts: [{ property: "Timestamp", direction: "descending" }],
  });

  return results.map((page: any) => {
    const props = page.properties;
    return {
      id: page.id,
      timestamp: props.Timestamp?.date?.start ?? "",
      mentalHealth: props["Mental Health"]?.number ?? null,
      comments:
        props.Comments?.rich_text?.map((t: any) => t.plain_text).join("") ?? "",
      emergency: props.Emergency?.checkbox ?? false,
    };
  });
}

export async function getTodayCount(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { results } = await notion.databases.query({
    database_id: config.zynLogDbId,
    filter: {
      property: "Timestamp",
      date: { on_or_after: today.toISOString() },
    },
  });

  return results.length;
}

// --- Weekly Summaries ---

export async function createWeeklySummaryEntry(entry: {
  weekStart: string;
  weekEnd: string;
  totalZyns: number;
  emergencyCount: number;
  avgMentalHealth: number;
  summary: string;
}): Promise<string> {
  const page = await notion.pages.create({
    parent: { database_id: config.weeklySummariesDbId },
    properties: {
      Name: {
        title: [{ text: { content: `Week of ${entry.weekStart.slice(0, 10)}` } }],
      },
      "Week Start": { date: { start: entry.weekStart } },
      "Week End": { date: { start: entry.weekEnd } },
      "Total Zyns": { number: entry.totalZyns },
      "Emergency Count": { number: entry.emergencyCount },
      "Avg Mental Health": { number: parseFloat(entry.avgMentalHealth.toFixed(1)) },
      Summary: {
        rich_text: [{ text: { content: entry.summary.slice(0, 2000) } }],
      },
    },
  });

  return page.id;
}
