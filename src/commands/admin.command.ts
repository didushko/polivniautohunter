import { Scenes, Telegraf } from "telegraf";
import { Command } from "./command.class";
import trackingService from "../services/tracking-service";
import {
  processAllTrackings,
  sendTestMessage,
} from "../services/polav-service";

export class AdminCommand extends Command {
  constructor(bot: Telegraf<Scenes.WizardContext>) {
    super(bot);
  }
  handle(): void {
    this.bot.command("admin", async (ctx, next) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        return ctx.reply(`Що будем робити?:`, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Активні охоти",
                  callback_data: "admin_show_active",
                },
                {
                  text: "Список користувачів",
                  callback_data: "admin_show_users",
                },
              ],
              [
                {
                  text: "Оновити для всіх",
                  callback_data: "admin_send_all",
                },
                {
                  text: "Тестове повідомлення",
                  callback_data: "admin_send_test",
                },
              ],
              [
                {
                  text: "Повідомлення для всіх",
                  callback_data: "admin_send_to_all",
                },
              ],
            ],
          },
        });
      } else {
        return next();
      }
    });

    this.bot.action("admin_show_active", async (ctx, next) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        const list = await trackingService.getListOfActive();
        await ctx.answerCbQuery();
        return ctx.reply(
          `Ось список активних, всього - ${list.length}:\n\n${list
            .map((u) => `${u.user_id} \t @${u.user_name} \t ${u.name}\n`)
            .join("\n")}`,
          {
            parse_mode: "HTML",
          }
        );
      }
      return next();
    });

    this.bot.action("admin_show_users", async (ctx) => {
      await ctx.answerCbQuery();
      ctx.scene.enter("admin_show_users");
    });

    this.bot.action("admin_send_test", async (ctx, next) => {
      await ctx.answerCbQuery();
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        await sendTestMessage(this.bot);
        return next();
      }
    });
    this.bot.action("admin_send_all", async (ctx) => {
      await ctx.answerCbQuery();
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        return processAllTrackings(this.bot);
      }
    });
    this.bot.action("admin_send_to_all", async (ctx) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        ctx.scene.enter("admin_send_message_to_all");
        await ctx.answerCbQuery();
      }
    });
  }
}
