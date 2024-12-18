import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import trackingService from "../services/tracking-service";
import { clearSession } from "../utils";
import userService from "../services/user-service";
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
        userService.endHunting(ctx.from.id);
        return ctx.reply("Your hunt list is currently empty.");
      } else {
        return ctx.reply("Oops, something went wrong. Please try again later.");
      }
    });
  }
}
