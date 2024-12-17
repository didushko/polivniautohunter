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
      ctx.session.add.currentStep = "name";
      ctx.reply(
        "Ok, let's add new hunt! Send me name of this hunt, or /cancel"
      );
    });

    this.bot.on("text", async (ctx, next) => {
      if (ctx.session.add.currentStep === "name") {
        const name = ctx.message.text;
        ctx.session.add.name = name;

        ctx.session.add.currentStep = "url";

        ctx.reply("Got it! Now, please provide your search url, or /cancel");
      } else if (ctx.session.add.currentStep === "url") {
        if (!ctx.session.add.name) {
          clearSession(ctx);
          ctx.reply("Uups, catch some error, please try later");
          return;
        }
        const url = ctx.message.text;
        const dates = await getDatesByUrl(url);
        if (!dates) {
          clearSession(ctx);
          ctx.reply("Url is not valid, please try again");
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
          ctx.reply("Uups, catch some error, please try later");
          return;
        }
        ctx.reply(`New hunt "${ctx.session.add.name}" was added successfully.`);
        clearSession(ctx);
      } else {
        next();
      }
    });
  }
}
