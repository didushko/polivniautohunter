import { Scenes } from "telegraf";
import userService from "../../services/user-service";

interface AddHuntingWizardState {
  message_id?: number;
}

type AddHuntingWizardContext = Scenes.WizardContext & {
  wizard: Scenes.WizardContext["wizard"] & {
    state: AddHuntingWizardState;
  };
};

export const adminSendMessageToAllScene =
  new Scenes.WizardScene<AddHuntingWizardContext>(
    "admin_send_message_to_all",
    async (ctx) => {
      if (ctx.from?.id.toString() === process.env.ADMIN_ID) {
        await ctx.reply("Що хочемо відправити користувачам?", {
          reply_markup: {
            inline_keyboard: [[{ text: "Cancel", callback_data: "cancel" }]],
          },
        });
        return ctx.wizard.next();
      }
      await ctx.reply("You are not authorized to use this command.");
      return ctx.scene.leave();
    },
    async (ctx) => {
      if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
        if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
          if (ctx.callbackQuery?.data === "cancel") {
            await ctx.answerCbQuery();
            await ctx.reply(
              "Повертайся, якщо все таки захочеш щось відправити"
            );
            return ctx.scene.leave();
          }
        }
      }
      if (ctx.message?.message_id) {
        ctx.wizard.state.message_id = ctx.message.message_id;
        await ctx.telegram.copyMessage(
          ctx.message.chat.id,
          ctx.message.chat.id,
          ctx.message.message_id,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Cancel", callback_data: "cancel" }],
                [{ text: "Send", callback_data: "send" }],
              ],
            },
          }
        );
        return ctx.wizard.next();
      }
      await ctx.reply("Back to main menu.");
      return ctx.scene.leave();
    },
    async (ctx) => {
      if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
        if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
          if (ctx.callbackQuery?.data === "cancel") {
            await ctx.answerCbQuery();
            await ctx.reply(
              "Повертайся, якщо все таки захочеш щось відправити"
            );
            return ctx.scene.leave();
          } else if (
            ctx.callbackQuery?.data === "send" &&
            ctx.callbackQuery.message?.chat &&
            ctx.wizard.state.message_id
          ) {
            const chatIdFrom = ctx.callbackQuery.message.chat.id;
            const users = await userService.getUsers();
            const messageId = ctx.wizard.state.message_id;
            users.forEach(async (u) => {
              try {
                await ctx.telegram.copyMessage(
                  u.user_id,
                  chatIdFrom,
                  messageId
                );
              } catch (e) {
                console.log(e);
              }
            });
            await ctx.answerCbQuery();
            await ctx.reply(
              `Повідомлення відправлено ${users.length} користувачам`
            );
            return ctx.scene.leave();
          }
        }
      }
      await ctx.reply("Якась незрозуміла команда, йди правити код =)");
      return ctx.scene.leave();
    }
  );
