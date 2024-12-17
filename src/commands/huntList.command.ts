import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import trackingService from "../services/tracking-service";
import { clearSession } from "../utils";
import { inlineKeyboard } from "telegraf/typings/markup";
// import { getListOfTracking } from "../services/database";

export class HuntListCommand extends Command {
  constructor(bot: Telegraf) {
    super(bot);
  }
  handle(): void {
    this.bot.command("list", async (ctx) => {
      clearSession(ctx);
      const list = await trackingService.getListOfTracking(ctx.from.id);
      console.log(list[0]);
      if (list && list.length > 0)
        ctx.reply(`Here’s what we’re hunting now:`, {
          reply_markup: {
            inline_keyboard: [
              list.map((i) => ({
                text: i.name,
                url: i.url,
              })),
            ],
          },
        });
      else {
        ctx.reply("You’re not hunting anything.");
      }
    });
  }
}
