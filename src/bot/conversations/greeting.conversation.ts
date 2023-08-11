import { Conversation, createConversation } from "@grammyjs/conversations";
import { Context } from "#root/bot/context.js";
import { i18n } from "#root/bot/i18n.js";

export const GREETING_CONVERSATION = "greeting";

export function greetingConversation() {
  return createConversation(
    async (conversation: Conversation<Context>, ctx: Context) => {
      await conversation.run(i18n);

      await ctx.reply("Please send me your name");

      while (true) {
        ctx = await conversation.wait();

        if (ctx.has("message:text")) {
          ctx.chatAction = "typing";
          await conversation.sleep(1000);

          await ctx.reply(`Hello, ${ctx.message.text}!`);
        } else {
          await ctx.reply("Please send me your name");
        }
      }
    },
    GREETING_CONVERSATION,
  );
}
