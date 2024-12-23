import { Scenes } from "telegraf";
import { handleCancel } from "../utils";
import { getDatesByUrl } from "../services/polav-service";
import trackingService from "../services/tracking-service";

interface AddHuntingWizardState {
  name?: string;
}

type AddHuntingWizardContext = Scenes.WizardContext & {
  wizard: Scenes.WizardContext["wizard"] & {
    state: AddHuntingWizardState;
  };
};

export const addHuntingScene = new Scenes.WizardScene<AddHuntingWizardContext>(
  "addHuntingScene",
  async (ctx) => {
    await ctx.reply(
      "Let's add a new hunt! Send me the <b>NAME</b> of the hunt, or type /cancel to stop.",
      { parse_mode: "HTML" }
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    const text = await handleCancel(ctx);
    if (!text) {
      return;
    }
    ctx.wizard.state.name = text;
    await ctx.reply(
      "Got it! Now, please provide the search <b>URL</b>, or type /cancel to stop.",
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Go to Polovniautomobili",
                url: "https://www.polovniautomobili.com/auto-oglasi/pretraga",
              },
            ],
          ],
        },
      }
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    const url = await handleCancel(ctx);
    if (!url) {
      return;
    }
    const dates = await getDatesByUrl(url);
    if (!dates) {
      await ctx.reply("The URL is not valid. Please try again, or /cancel");
      return;
    }
    if (ctx.wizard.state.name && url && dates && ctx.from?.id) {
      const saved = await trackingService.addTracking(
        ctx.from.id,
        ctx.from.username || "",
        url,
        ctx.wizard.state.name,
        Date.parse(dates.add),
        Date.parse(dates.ord)
      );

      if (saved) {
        await ctx.reply(
          `The new hunt "${ctx.wizard.state.name}" has been added successfully.`
        );
        return await ctx.scene.leave();
      }
    }
    await ctx.reply(`Oops, something went wrong. Please try again later.`);
    return await ctx.scene.leave();
  }
);
