function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  telegramToken: requireEnv("TELEGRAM_BOT_TOKEN"),
  notionToken: requireEnv("NOTION_TOKEN"),
  zynLogDbId: requireEnv("NOTION_ZYN_LOG_DB_ID"),
  configDbId: requireEnv("NOTION_CONFIG_DB_ID"),
  anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
};
