import { Scenes } from "telegraf";
import { IUser } from "../../database/User.model";
import userService from "../../services/user-service";
import { formatUserTable } from "../../utils";
import { WizardContext } from "telegraf/typings/scenes";

export const adminShowUsersScene = new Scenes.WizardScene<WizardContext>(
  "admin_show_users",
  async (ctx) => {
    if (ctx.from?.id.toString() === process.env.ADMIN_ID) {
      await renderUserList(ctx, () => 0);
      return ctx.wizard.next();
    }
    await ctx.reply("You are not authorized to use this command.");
    return ctx.scene.leave();
  },
  async (ctx) => {
    if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
      if (ctx.callbackQuery?.data === "users_sort_oldest") {
        await renderUserList(
          ctx,
          (a, b) => ((b.first_request || 0) > (a.first_request || 0) ? -1 : 1),
          "users_sort_oldest"
        );
      }
      if (ctx.callbackQuery?.data === "users_sort_max_hunts") {
        await renderUserList(
          ctx,
          (a, b) => b.total_hunting - a.total_hunting,
          "users_sort_max_hunts"
        );
      }
      if (ctx.callbackQuery?.data === "exit") {
        await ctx.reply("Back to main menu.");
        await ctx.answerCbQuery();
        return ctx.scene.leave();
      }
      return;
    }
    await ctx.reply("Back to main menu.");
    return ctx.scene.leave();
  }
);

const renderUserList = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  sortFn: (a: IUser, b: IUser) => number,
  sortMode?: string
) => {
  const users: IUser[] = await userService.getUsers();
  let mode = "reply";
  if (sortMode) {
    mode = "editMessageText";
    users.sort(sortFn);
  }
  const text =
    `Ось список користувачівd, всього \\- ${users.length}:${
      sortMode
        ? "\nВідсортовано: " +
          sortMode.replace(/_/g, " ").replace("users sort ", "")
        : ""
    }` +
    "```\n" +
    formatUserTable(users) +
    "```";

  await ctx[mode](text, {
    parse_mode: "MarkdownV2",
    reply_markup: generateSortButtons(sortMode),
  });
};

const generateSortButtons = (sortMode?: string) => ({
  inline_keyboard: [
    [
      { text: "Oldest", callback_data: "users_sort_oldest" },
      { text: "Max hunts", callback_data: "users_sort_max_hunts" },
    ].filter((el) => el.callback_data !== sortMode),
    [
      {
        text: "Exit",
        callback_data: "exit",
      },
    ],
  ],
});
