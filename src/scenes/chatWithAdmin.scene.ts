import { Scenes } from "telegraf";

interface AddHuntingWizardState {
  chat_id?: string;
  message_id?: string;
}

type AddHuntingWizardContext = Scenes.WizardContext & {
  wizard: Scenes.WizardContext["wizard"] & {
    state: AddHuntingWizardState;
  };
};

export const chatWithAdminScene =
  new Scenes.WizardScene<AddHuntingWizardContext>(
    "chatWithAdmin",
    async (ctx) => {
      await ctx.reply("Please, send your message:", {
        reply_markup: {
          inline_keyboard: [[{ text: "Cancel", callback_data: "cancel" }]],
        },
      });
      return ctx.wizard.next();
    },
    async (ctx) => {
      if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
        if (ctx.callbackQuery?.data === "cancel") {
          await ctx.answerCbQuery();
          await ctx.reply("Support message canceled.");
          return ctx.scene.leave();
        }
      }
      const m = await sendSupportMessage(ctx);
      await ctx.reply(
        m
          ? "Your message sended, please wait answer."
          : "Oops, something went wrong. Please try again later."
      );
      return ctx.scene.leave();
    }
  );

async function sendSupportMessage(ctx: AddHuntingWizardContext) {
  try {
    const isAdmin = ctx.from?.id.toString() === process.env.ADMIN_ID;
    if (ctx.chat?.id && ctx.message?.message_id) {
      if ("text" in ctx.message) {
        const text = isAdmin
          ? ctx.message?.text
          : `id: ${ctx.message.from.id}, @${ctx.message.from.username}\n\n ${ctx.message.text}`;
        return await ctx.telegram.sendMessage(
          ctx.wizard.state.chat_id || process.env.ADMIN_ID!,
          text,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Answer",
                    callback_data: `helpdesk_answer_${ctx.message.from.id}_${ctx.message.message_id}`,
                  },
                ],
              ],
            },
            reply_parameters: ctx.wizard.state.message_id
              ? {
                  message_id: Number(ctx.wizard.state.message_id),
                }
              : undefined,
          }
        );
      }
    }
  } catch (e) {
    console.log(e);
    return;
  }
}
