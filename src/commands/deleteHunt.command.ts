import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import trackingService from "../services/tracking-service";
// import { deleteTrackingByName, getListOfTracking } from "../services/database";

export class DeleteHuntCommand extends Command {
  constructor(bot: Telegraf) {
    super(bot);
  }

  handle(): void {
    this.bot.command("delete", async (ctx) => {
      const list = await trackingService.getListOfTracking(ctx.from.id);

      if (list.length === 0) {
        return ctx.reply("You have no tracking data to delete.");
      }

      ctx.reply(
        "Choose what you want to delete:\n",
        Markup.inlineKeyboard(
          list.map((v) => Markup.button.callback(v, `delete_hunt_${v}`))
        )
      );
    });

    this.bot.action(/^delete_hunt_(.+)$/, async (ctx) => {
      const nameToDelete = ctx.match[1];

      const result = await trackingService.deleteTrackingByName(ctx.from.id, nameToDelete);

      if (result) {
        ctx.reply(`Successfully deleted the tracking for: ${nameToDelete}`);
      } else {
        ctx.reply(`Failed to delete the tracking for: ${nameToDelete}`);
      }
    });
  }
}