import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { getDatesByUrl } from "../services/polav-service";
import { clearSession } from "../utils";
import trackingService from "../services/tracking-service";
// import { addTracking } from "../services/database";

export class AddHuntCommand extends Command {
  constructor(bot: Telegraf) {
    super(bot);
  }
  handle(): void {
    this.bot.command("add", async (ctx) => {
      clearSession(ctx);
      ctx.session.add.currentStep = "name";
      ctx.reply(
        "Let's add a new hunt! Send me the name of the hunt, or type /cancel to stop."
      );
    });

    this.bot.on("text", async (ctx, next) => {
      if (ctx.session.add.currentStep === "name") {
        const name = ctx.message.text;
        ctx.session.add.name = name;

        ctx.session.add.currentStep = "url";

        ctx.reply(
          "Got it! Now, please provide the search URL, or type /cancel to stop."
        );
      } else if (ctx.session.add.currentStep === "url") {
        if (!ctx.session.add.name) {
          clearSession(ctx);
          ctx.reply("Oops, something went wrong. Please try again later.");
          return;
        }
        const url = ctx.message.text;
        const dates = await getDatesByUrl(url);
        if (!dates) {
          clearSession(ctx);
          ctx.reply("The URL is not valid. Please try again.");
          return;
        }

        const saved = await trackingService.addTracking(
          ctx.from.id,
          ctx.from.username || "",
          url,
          ctx.session.add.name,
          Date.parse(dates.add) || 0,
          Date.parse(dates.ord) || 0
        );
        if (!saved) {
          ctx.reply("Oops, something went wrong. Please try again later.");
          return;
        }
        ctx.reply(
          `The new hunt "${ctx.session.add.name}" has been added successfully.`
        );
        clearSession(ctx);
      } else {
        next();
      }
    });
  }
}
