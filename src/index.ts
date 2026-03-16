import "dotenv/config";
import { createBot } from "./bot";
import { startScheduler } from "./scheduler";

async function main() {
  const bot = createBot();

  startScheduler(bot);

  console.log("Starting bot...");
  await bot.start({
    onStart: () => console.log("Bot is running!"),
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
