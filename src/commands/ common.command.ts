import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { clearSession } from "../utils";
import trackingService from "../services/tracking-service";
// import { deleteTrackingById } from "../services/database";

export class CommonCommand extends Command {
  constructor(bot: Telegraf) {
    super(bot);
  }
  handle(): void {
    this.bot.help((ctx) => {
      clearSession(ctx);
      return ctx.reply(
        "I can help you with your car hunt! Just a add new hunt, send me the link to your PolovniAutomobili search, and i will notify if something new appears. \nJust type /start"
      );
    });

    this.bot.start((ctx) => {
      clearSession(ctx);
      return ctx.reply(
        `Hi there! Here’s what I can do:

  • /list – Show the hunt list
  • /add – Add a new hunt
  • /delete – Delete a hunt
  • /delete_all – Delete all hunts
  • /help – Show help`
      );
    });

    this.bot.command("cancel", (ctx) => {
      clearSession(ctx);
      return ctx.reply("Operation cancelled");
    });

    this.bot.on("my_chat_member", (ctx) => {
      const status = ctx.update.my_chat_member.new_chat_member.status;

      if (status === "kicked" || status === "left") {
        console.log(
          `Bot was removed by user: ${ctx.update.my_chat_member.chat.id}`
        );
        trackingService.deleteTrackingById(ctx.from.id);
      }
    });

    this.bot.command("support", async (ctx) => {
      ctx.session.support = true;
      return ctx.reply("type me message, or type /cancel");
    });
  }
}
