import { Scenes } from "telegraf";
import { IUser } from "../../database/User.model";
import userService from "../../services/user-service";
import { formatUserTable } from "../../utils";
import { WizardContext, WizardSessionData } from "telegraf/typings/scenes";
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";

const modeMap: Record<
  string,
  { name: string; sortFn: (a: IUser, b: IUser) => number }
> = {
  users_sort_oldest: {
    name: "Oldest",
    sortFn: (a, b) =>
      (b.first_request || 0) > (a.first_request || 0) ? -1 : 1,
  },
  users_sort_fresh: {
    name: "Fresh",
    sortFn: (a, b) =>
      (b.first_request || 0) > (a.first_request || 0) ? 1 : -1,
  },
  users_sort_max_hunts: {
    name: "Max hunts",
    sortFn: (a, b) => b.total_hunting - a.total_hunting,
  },
};

export const adminShowUsersScene = new Scenes.WizardScene<WizardContext>(
  "admin_show_users",
  async (ctx) => {
    if (ctx.from?.id.toString() === process.env.ADMIN_ID) {
      await renderUserList(ctx);
      return ctx.wizard.next();
    }
    await ctx.reply("You are not authorized to use this command.");
    return ctx.scene.leave();
  },
  async (ctx) => {
    if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
      if (Object.keys(modeMap).includes(ctx.callbackQuery?.data)) {
        await renderUserList(ctx, ctx.callbackQuery.data);
        await ctx.answerCbQuery();
      }
      if (ctx.callbackQuery?.data === "exit") {
        await ctx.reply("Exit");
        await ctx.answerCbQuery();
        return ctx.scene.leave();
      }
      return;
    }
    await ctx.reply("Unknown command, back to main menu");
    return ctx.scene.leave();
  }
);

const renderUserList = async (
  ctx: WizardContext<WizardSessionData>,
  sortMode?: string
) => {
  const users: IUser[] = await userService.getUsers();
  if (!sortMode) {
    sortMode = "users_sort_max_hunts";
  }
  users.sort(modeMap[sortMode].sortFn);
  const text =
    `Ось список користувачівd, всього \\- ${users.length}:${
      sortMode ? "\nВідсортовано: " + modeMap[sortMode].name : ""
    }` +
    "```\n" +
    formatUserTable(users) +
    "```";
  await ctx.editMessageText(text, generateSortButtons(sortMode));
};

const generateSortButtons = (sortMode?: string): ExtraEditMessageText => {
  const sortButton = Object.entries(modeMap)
    .filter((el) => el[0] !== sortMode)
    .map((el) => ({ text: el[1].name, callback_data: el[0] }));

  return {
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        sortButton,
        [
          {
            text: "Exit",
            callback_data: "exit",
          },
        ],
      ],
    },
  };
};
