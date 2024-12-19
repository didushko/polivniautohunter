import { Scenes, Telegraf } from "telegraf";
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
  constructor(bot: Telegraf<Scenes.WizardContext>) {
    super(bot);
  }
  handle(): void {
    this.bot.command("admin", async (ctx, next) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        clearSession(ctx);
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

    this.bot.action("admin_show_users", async (ctx) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        await renderUserList(ctx, () => 0);
      }
    });

    this.bot.action("users_sort_oldest", async (ctx) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        await renderUserList(
          ctx,
          (a, b) => ((b.first_request || 0) > (a.first_request || 0) ? -1 : 1),
          "users_sort_oldest"
        );
      }
    });

    this.bot.action("users_sort_max_hunts", async (ctx) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        await renderUserList(
          ctx,
          (a, b) => b.total_hunting - a.total_hunting,
          "users_sort_max_hunts"
        );
      }
    });

    this.bot.action("admin_send_test", async (ctx, next) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        await sendTestMessage(this.bot);
        return next();
      }
    });
    this.bot.action("admin_send_all", async (ctx) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        return processAllTrackings(this.bot);
      }
    });
    this.bot.action("admin_send_to_all", async (ctx) => {
      if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        const users: IUser[] = await userService.getUsers();
        users.forEach((u) => {
          try {
            this.bot.telegram.sendMessage(
              u.user_id,
              "Привет, Теодор! Тестовое сообщение =)"
            );
          } catch (e) {
            console.log(e);
          }
        });
      }
    });

    // Function to handle user list rendering
    const renderUserList = async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctx: any,
      sortFn: (a: IUser, b: IUser) => number,
      sortMode?: string
    ) => {
      if (ctx.session.add.currentStep === sortMode) {
        return;
      }
      ctx.session.add.currentStep = sortMode;
      const users: IUser[] = await userService.getUsers();
      let mode = "reply";
      if (sortMode) {
        mode = "editMessageText";
        users.sort(sortFn);
      }
      const text =
        `Ось список користувачівd, всього \\- ${users.length}:${
          sortMode ? "\nВідсортовано: " + sortMode.replace(/_/g, " ") : ""
        }` +
        "```\n" +
        formatUserTable(users) +
        "```";

      await ctx[mode](text, {
        parse_mode: "MarkdownV2",
        reply_markup: generateSortButtons(),
      });
    };
    const generateSortButtons = () => ({
      inline_keyboard: [
        [
          { text: "Oldest", callback_data: "users_sort_oldest" },
          { text: "Max hunts", callback_data: "users_sort_max_hunts" },
        ],
      ],
    });
  }
}
