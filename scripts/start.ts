#!/usr/bin/env tsx

import { onShutdown } from "node-graceful-shutdown";
import { Bot, createBot } from "#root/bot/index.js";
import { config } from "#root/config.js";
import { logger } from "#root/logger.js";
import { createServer } from "#root/server/index.js";

try {
  const bots = new Map<string, Bot>();
  const server = await createServer({
    getBot: async (token) => {
      if (bots.has(token)) {
        return bots.get(token) as Bot;
      }

      const bot = createBot(token);
      await bot.init();

      bots.set(token, bot);

      return bot;
    },
  });

  // Graceful shutdown
  onShutdown(async () => {
    logger.info("shutdown");

    await server.close();
    await Promise.all(Object.values(bots).map((bot: Bot) => bot.stop()));
  });

  await server.listen({
    host: config.BOT_SERVER_HOST,
    port: config.BOT_SERVER_PORT,
  });
} catch (error) {
  logger.error(error);
  process.exit(1);
}
