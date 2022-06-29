import { Composer } from "grammy";
import { isUserId } from "grammy-guard";

import { Context } from "@bot/types";
import { usersService } from "@bot/services";
import { config } from "@bot/config";
import {
  DEFAULT_LANGUAGE_CODE,
  getGroupChatCommands,
  getPrivateChatCommands,
} from "@bot/helpers/bot-commands";
import { isMultipleLocales, locales } from "@bot/helpers/i18n";
import { logHandle } from "@bot/helpers/logging";

export const composer = new Composer<Context>();

const feature = composer
  .chatType("private")
  .filter(isUserId(config.BOT_ADMIN_USER_ID));

feature.command("stats", logHandle("handle /stats"), async (ctx) => {
  await ctx.replyWithChatAction("typing");

  const usersCount = await usersService.count();

  const stats = `Users count: ${usersCount}`;

  return ctx.reply(stats);
});

feature.command(
  "setcommands",
  logHandle("handle /setcommands"),
  async (ctx) => {
    await ctx.replyWithChatAction("typing");

    // set private chat commands
    await ctx.api.setMyCommands(
      getPrivateChatCommands({
        localeCode: DEFAULT_LANGUAGE_CODE,
        includeLanguageCommand: isMultipleLocales,
      }),
      {
        scope: {
          type: "all_private_chats",
        },
      }
    );

    if (isMultipleLocales) {
      const requests = locales.map((code) =>
        ctx.api.setMyCommands(
          getPrivateChatCommands({
            localeCode: code,
            includeLanguageCommand: isMultipleLocales,
          }),
          {
            language_code: code,
            scope: {
              type: "all_private_chats",
            },
          }
        )
      );

      await Promise.all(requests);
    }

    // set private chat admin commands
    await ctx.api.setMyCommands(
      [
        ...getPrivateChatCommands({
          localeCode: DEFAULT_LANGUAGE_CODE,
          includeLanguageCommand: isMultipleLocales,
        }),
        {
          command: "stats",
          description: "Stats",
        },
        {
          command: "setcommands",
          description: "Set bot commands",
        },
      ],
      {
        scope: {
          type: "chat",
          chat_id: config.BOT_ADMIN_USER_ID,
        },
      }
    );

    // set group chat commands
    await ctx.api.setMyCommands(
      getGroupChatCommands({
        localeCode: DEFAULT_LANGUAGE_CODE,
      }),
      {
        scope: {
          type: "all_group_chats",
        },
      }
    );

    return ctx.reply("Commands updated");
  }
);
