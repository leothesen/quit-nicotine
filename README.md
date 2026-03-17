# Quit Nicotine Bot

A personal Telegram bot that acts as a gatekeeper for nicotine pouch (Zyn) usage. You must ask permission before having one, and the bot enforces a configurable cooldown that you can ramp up over time as you quit.

It tracks every use in Notion, logs your mental health, and generates weekly AI-powered summaries. The bot has a sassy, guilt-tripping personality — it will shame you, reference your hair loss, and remind you about depression. Tough love.

## How It Works

1. You send `/zyn` when you want a nicotine pouch
2. If your cooldown hasn't passed — denied with sass
3. If it has — reluctantly approved, then you log your mental health (1-10) and a comment
4. Everything gets stored in Notion
5. The bot sends milestone messages as you go longer without one (2h, 4h, 8h, 12h, 24h, 48h, 72h)
6. Every Sunday at 9 AM, Claude generates a weekly summary roasting your usage

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Register your chat and get the welcome message |
| `/zyn` | Ask permission for a nicotine pouch |
| `/emergency` | Override the cooldown (logged with maximum shame) |
| `/stats` | View today's count, weekly totals, streak, and avg mental health |
| `/interval [hours]` | View or set the cooldown (e.g., `/interval 2` for 2 hours) |
| `/help` | List all commands |

## Tech Stack

- **Runtime:** TypeScript / Node.js
- **Bot Framework:** [grammY](https://grammy.dev) with conversations plugin
- **Database:** [Notion API](https://developers.notion.com)
- **AI Summaries:** [Claude API](https://docs.anthropic.com/en/docs/intro-to-claude)
- **Scheduling:** node-cron (in-process)
- **Deployment:** Railway (or any Node.js host)

## Setup

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io)
- A Telegram account
- A Notion account
- An Anthropic API key

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the bot token

### 2. Create a Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the integration token
4. Give it read + write access to content

### 3. Create the Notion Databases

You need three databases in Notion. The easiest way is to use **Claude with the Notion MCP** — paste the schemas below and ask it to create them for you.

Alternatively, create them manually in Notion.

#### Zyn Log
- Name (Title)
- Timestamp (Date)
- Mental Health (Number)
- Comments (Rich Text)
- Emergency (Checkbox)

#### Config
- Name (Title)
- Interval Hours (Number)
- Chat ID (Number)
- Last Zyn Time (Date)
- Bot Active (Checkbox)

#### Weekly Summaries
- Name (Title)
- Week Start (Date)
- Week End (Date)
- Total Zyns (Number)
- Emergency Count (Number)
- Avg Mental Health (Number)
- Summary (Rich Text)

After creating the databases:

1. **Share each database** with your Notion integration (click "..." > "Connections" > select your integration)
2. **Add one row to Config**: Name = `Bot Config`, Interval Hours = `1`, Bot Active = checked
3. **Copy each database ID** from the URL — it's the 32-character hex string after the workspace name and before the `?v=` parameter

### 4. Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key

### 5. Configure Environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
NOTION_TOKEN=your-notion-integration-token
NOTION_ZYN_LOG_DB_ID=your-zyn-log-database-id
NOTION_CONFIG_DB_ID=your-config-database-id
NOTION_WEEKLY_SUMMARIES_DB_ID=your-weekly-summaries-database-id
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 6. Install and Run

```bash
pnpm install
pnpm dev
```

Send `/start` to your bot in Telegram. You're live.

### 7. Deploy to Railway

```bash
# Push to GitHub, then:
# 1. Connect your repo on railway.com
# 2. Add all env vars from .env to the Railway service
# 3. Deploy — railway.json handles the rest
```

The bot uses long polling (not webhooks), so it works on any host without a public URL.

## Project Structure

```
src/
├── index.ts                  # Entry point: boots bot + scheduler
├── bot.ts                    # grammY setup, middleware, command registration
├── config.ts                 # Env var loading + validation
├── types.ts                  # Shared interfaces
├── handlers/
│   ├── zyn.ts                # /zyn command (cooldown check + approval)
│   ├── emergency.ts          # /emergency override
│   ├── stats.ts              # /stats command
│   └── settings.ts           # /interval command
├── conversations/
│   └── log-zyn.ts            # Multi-step: mental health score + comments
├── services/
│   ├── notion.ts             # All Notion CRUD
│   ├── claude.ts             # Claude API weekly summary
│   └── personality.ts        # Sassy message templates
└── scheduler/
    ├── index.ts              # Cron job setup
    ├── milestones.ts         # Proactive milestone messages
    └── weekly-summary.ts     # Weekly AI summary job
```

## Customization

**Cooldown:** Change the default by updating the `Interval Hours` value in your Config database, or use `/interval <hours>` in Telegram.

**Personality:** Edit `src/services/personality.ts` to change the denial messages, approval messages, emergency shame, and milestone celebrations. The current personality references hair loss and depression — swap these for whatever motivates you.

**AI Summary:** Edit the system prompt in `src/services/claude.ts` to change the tone and focus of weekly summaries.

**Milestones:** The bot celebrates at 2h, 4h, 8h, 12h, 24h, 48h, and 72h. Edit the `MILESTONE_HOURS` array and `milestoneMessages` in `src/services/personality.ts` to change these.

**Kill switch:** Uncheck `Bot Active` in the Config database to pause the bot without stopping the process.

## License

MIT
