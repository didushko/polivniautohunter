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
      const deleted = await trackingService.deleteTrackingById(ctx.from.id);
      if (deleted) {
        userService.endHunting(ctx.from.id);
        return ctx.reply(
          `Deleted ${deleted}.\nYour hunt list is currently empty. You can /add new one`
        );
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
              ...list
                .map((i) => [
                  {
                    text: "🎯" + i.name,
                    url: i.url,
                  },
                  {
                    text: "🗑 delete",
                    callback_data: `delete_hunt_${i.name}`,
                  },
                ])
                .filter((_, i) => i < 48),
              [{ text: "❌ delete all", callback_data: "delete_all_hunt" }],
              [{ text: "➕ add new hunt", callback_data: "add_new_hunt" }],
            ],
          },
        });
      else {
        return ctx.reply(
          "You’re not hunting anything. But you can /add new hunting.",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "➕ add new hunt", callback_data: "add_new_hunt" }],
              ],
            },
          }
        );
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
            Markup.button.callback("🗑 " + v.name, `delete_hunt_${v.name}`)
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
        await ctx.answerCbQuery("Hunt " + nameToDelete + " deleted!");
        return ctx.reply(`Successfully deleted the hunt named ${nameToDelete}`);
      } else {
        return ctx.reply(`Failed to delete the hunt named ${nameToDelete}`);
      }
    });
    this.bot.action("delete_all_hunt", async (ctx) => {
      const deleted = await trackingService.deleteTrackingById(ctx.from.id);
      await ctx.answerCbQuery();
      if (deleted) {
        userService.endHunting(ctx.from.id);
        return ctx.reply(
          `Deleted ${deleted}.\nYour hunt list is currently empty. You can /add new one`
        );
      } else {
        return ctx.reply("Oops, something went wrong. Please try again later.");
      }
    });
    this.bot.action("add_new_hunt", async (ctx) => {
      await ctx.answerCbQuery();
      return ctx.scene.enter("addHuntingScene");
    });
  }
}
