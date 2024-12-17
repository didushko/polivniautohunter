import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import trackingService from "../services/tracking-service";
import { clearSession } from "../utils";
// import { deleteTrackingById } from "../services/database";

export class DeleteAllCommand extends Command {
  constructor(bot: Telegraf) {
    super(bot);
  }
  handle(): void {
    this.bot.command("delete_all", async (ctx) => {
      clearSession(ctx);
      const res = await trackingService.deleteTrackingById(ctx.from.id);
      if (res) {
        ctx.reply("Your hunt list is currently empty.");
      } else {
        ctx.reply("Oops, something went wrong. Please try again later.");
      }
    });
  }
}
