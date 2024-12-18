import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import trackingService from "../services/tracking-service";
import { clearSession } from "../utils";
import userService from "../services/user-service";
// import { deleteTrackingByName, getListOfTracking } from "../services/database";

export class DeleteHuntCommand extends Command {
  constructor(bot: Telegraf) {
    super(bot);
  }

  handle(): void {
    this.bot.command("delete", async (ctx) => {
      clearSession(ctx);
      const list = await trackingService.getListOfTracking(ctx.from.id);

      if (list.length === 0) {
        return ctx.reply("You have no hunts to delete.");
      }

      return ctx.reply(
        "Choose what you want to delete:\n",
        Markup.inlineKeyboard(
          list.map((v) => Markup.button.callback(v.name, `delete_hunt_${v.name}`))
        )
      );
    });

    this.bot.action(/^delete_hunt_(.+)$/, async (ctx) => {
      const nameToDelete = ctx.match[1];

      const result = await trackingService.deleteTrackingByName(
        ctx.from.id,
        nameToDelete
      );

      if (result) {
        userService.endHunting(ctx.from.id);
        return ctx.reply(`Successfully deleted the hunt named ${nameToDelete}`);
      } else {
        return ctx.reply(`Failed to delete the hunt named ${nameToDelete}`);
      }
    });
  }
}
