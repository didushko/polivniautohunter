import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import trackingService from "../services/tracking-service";
// import { getListOfTracking } from "../services/database";

export class HuntListCommand extends Command {
  constructor(bot: Telegraf) {
    super(bot);
  }
  handle(): void {
    this.bot.command("list", async (ctx) => {
      const list = await trackingService.getListOfTracking(ctx.from.id);
      if (list && list.length > 0)
        ctx.reply(`There what we tracking now:  \n${list.join("\n")}`);
      else {
        ctx.reply("You are not tracking anything");
      }
    });
  }
}
