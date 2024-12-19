import { Markup, Scenes, Telegraf } from "telegraf";
import { Command } from "./command.class";
import trackingService from "../services/tracking-service";
import userService from "../services/user-service";

export class HuntCommand extends Command {
  constructor(bot: Telegraf<Scenes.WizardContext>) {
    super(bot);
  }
  handle(): void {
    this.bot.command("add", async (ctx) => {
      ctx.scene.enter("addHuntingScene");
    });

    this.bot.command("delete_all", async (ctx) => {
      const res = await trackingService.deleteTrackingById(ctx.from.id);
      if (res) {
        userService.endHunting(ctx.from.id);
        return ctx.reply("Your hunt list is currently empty.");
      } else {
        return ctx.reply("Oops, something went wrong. Please try again later.");
      }
    });

    this.bot.command("list", async (ctx) => {
      const list = await trackingService.getListOfTracking(ctx.from.id);
      if (list && list.length > 0)
        return ctx.reply(`Here’s what we’re hunting now:`, {
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
        return ctx.reply("You’re not hunting anything.");
      }
    });

    this.bot.command("delete", async (ctx) => {
      const list = await trackingService.getListOfTracking(ctx.from.id);

      if (list.length === 0) {
        return ctx.reply("You have no hunts to delete.");
      }

      return ctx.reply(
        "Choose what you want to delete:\n",
        Markup.inlineKeyboard(
          list.map((v) =>
            Markup.button.callback(v.name, `delete_hunt_${v.name}`)
          )
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
