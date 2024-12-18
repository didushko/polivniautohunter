import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { clearSession, formatUserTable } from "../utils";
import trackingService from "../services/tracking-service";
import {
  processAllTrackings,
  sendTestMessage,
} from "../services/polav-service";
import { IUser } from "../database/User.model";
import userService from "../services/user-service";

export class AdminCommand extends Command {
  constructor(bot: Telegraf) {
    super(bot);
  }
  handle(): void {
    this.bot.command("admin", async (ctx, next) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        clearSession(ctx);
        ctx.session.add.currentStep = "name";
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

    this.bot.action("admin_show_users", async (ctx, next) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        const users: IUser[] = await userService.getUsers();
        return ctx.reply(
          `Ось список користувачів, всього - ${
            users.length
          }:\n\n${formatUserTable(users)}`,
          {
            parse_mode: "HTML",
          }
        );
      }
      return next();
    });

    this.bot.action("admin_send_test", async (ctx, next) => {
      await sendTestMessage(this.bot);
      return next();
    });
    this.bot.action("admin_send_all", async () => {
      return processAllTrackings(this.bot);
    });
    this.bot.action("admin_send_to_all", async () => {
      const users: IUser[] = await userService.getUsers();
      users.forEach((u) =>
        this.bot.telegram.sendMessage(
          u.user_id,
          "Привет, Теодор! Тестовое сообщение =)"
        )
      );
    });
  }
}
