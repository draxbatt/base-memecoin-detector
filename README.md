# Base Chain Memecoin Detector 🚀

Automated detection and alert system for interesting memecoin opportunities on Base chain. Monitors Clanker and Bankr launches with intelligent scoring to identify tokens with promising fundamentals and manageable risk.

## Features

- **Real-time Memecoin Monitoring:** Fetches latest launches from Clanker & Bankr APIs
- **Multi-Factor Scoring:** Evaluates holder distribution, creator history, liquidity, and pump speed
- **Telegram Alerts:** Instant notifications with detailed risk breakdown
- **Database Tracking:** SQLite persistence to avoid duplicate alerts and track metrics
- **Error Recovery:** Graceful handling of API failures with exponential backoff
- **24/7 Operation:** Runs continuously with configurable scan intervals

## Quick Start

### Prerequisites

- Node.js 18+ (with npm)
- Base RPC endpoint (Alchemy, Infura, or public node)
- Telegram bot token (from @BotFather)
- Clanker & Bankr API access (if available; fallback to on-chain events)

### Installation

```bash
git clone git@github.com:draxbatt/base-memecoin-detector.git
cd base-memecoin-detector
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables:
   ```env
   # Base RPC
   BASE_RPC_URL=https://base.infura.io/v3/YOUR_KEY

   # Telegram
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   TELEGRAM_CHAT_ID=987654321

   # APIs (optional)
   CLANKER_API_KEY=your_api_key
   BANKR_API_KEY=your_api_key

   # Scanner Config
   SCAN_INTERVAL_MS=300000  # 5 minutes
   MIN_SCORE_THRESHOLD=60
   DATABASE_PATH=./data/tokens.db
   ```

3. Run the bot:
   ```bash
   npm run dev       # Development (watch mode)
   npm run build     # Build TypeScript
   npm start         # Production
   ```

## Environment Variables

See `.env.example` for the full template. Key variables:

| Variable | Required | Example |
|----------|----------|---------|
| `BASE_RPC_URL` | Yes | `https://base.infura.io/v3/...` |
| `TELEGRAM_BOT_TOKEN` | Yes | `123456:ABC-DEF1234...` |
| `TELEGRAM_CHAT_ID` | Yes | `987654321` |
| `CLANKER_API_KEY` | No | Your Clanker API key |
| `SCAN_INTERVAL_MS` | No | `300000` (5 min default) |
| `MIN_SCORE_THRESHOLD` | No | `60` (default) |
| `DATABASE_PATH` | No | `./data/tokens.db` |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, `error` |

## Scoring Algorithm

Each token is scored 0-100 based on:

- **Holder Distribution (30%):** Lower concentration = higher score
- **Creator History (40%):** Successful creators score higher
- **Liquidity Analysis (20%):** Locked/sustainable liquidity scores higher
- **Pump Speed (10%):** Explosive growth can indicate p&d scheme

Tokens scoring ≥60 trigger Telegram alerts.

## Project Structure

```
/src
  /scrapers          # Data fetching (Clanker, Bankr, RPC)
  /analyzers         # Token analysis modules
  /scoring           # Scoring engine & rules
  /alerts            # Telegram notification system
  /database          # SQLite schema & ORM
  /utils             # Logging, errors, helpers
  index.ts           # Main entry point

/tests              # Jest unit & integration tests
/config             # Environment & constants
/data               # SQLite database (git-ignored)
```

## Development

### Testing

```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Linting & Formatting

```bash
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier format
```

### Building

```bash
npm run build        # TypeScript → JavaScript
npm run build:watch  # Watch mode
```

## Deployment

### Local Testing

```bash
npm run dev
```

Monitor the console for log output. Test alerts by creating a fake high-scoring token.

### Production (Replit/Railway)

1. Push to `main` branch
2. Platform automatically deploys (see `DEPLOYMENT.md`)
3. Set environment variables in platform dashboard
4. Verify bot is running: `npm start`

## Troubleshooting

### Bot not sending alerts
- Check Telegram token: `curl -s https://api.telegram.org/botTOKEN/getMe`
- Verify chat ID: bot should be in the chat
- Check logs for errors: `LOG_LEVEL=debug npm start`

### RPC connection failing
- Test RPC endpoint: `curl -X POST $BASE_RPC_URL -d '{"jsonrpc":"2.0","method":"eth_blockNumber"}'`
- Ensure endpoint is Base mainnet (not Ethereum)

### High API rate limiting
- Reduce `SCAN_INTERVAL_MS` if safe
- Add exponential backoff (auto-implemented)
- Consider paid RPC tier

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes, commit: `git commit -am 'Add feature'`
3. Push: `git push origin feature/my-feature`
4. Open PR on GitHub

## Security

- **Never commit `.env` with real secrets** — use `.env.local` (git-ignored)
- Rotate Telegram bot token if exposed
- Use read-only RPC keys where possible
- Monitor transaction logs for anomalies

## Monitoring & Maintenance

- View database stats: `npm run stats`
- Export alert history: `npm run export:alerts`
- Clear old data: `npm run cleanup -- --days 30`

## FAQ

**Q: Can I use this on other chains?**  
A: Yes! Modify `BASE_RPC_URL` and contract addresses, but testing on Base first is recommended.

**Q: What's the latency from launch to alert?**  
A: Target <5 seconds; actual depends on RPC node responsiveness.

**Q: Does this track Telegram reactions on alerts?**  
A: Not yet; see `FUTURE_WORK.md` for planned features.

## License

MIT — See `LICENSE` file.

## Contact

Questions? Issues? Open a GitHub issue or reach out to [@draxbatt](https://github.com/draxbatt).

---

**Status:** Development phase. Join the project and help build the best memecoin early-warning system on Base! 🚀
