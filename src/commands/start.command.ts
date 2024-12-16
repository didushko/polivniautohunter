import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { clearSession } from "../utils";
import { deleteTrackingById } from "../services/database";

export class StartCommand extends Command {
  constructor(bot: Telegraf) {
    super(bot);
  }
  handle(): void {
    this.bot.help((ctx) => {
      ctx.reply(
        "I can help you with your car hunt! Just add new hunt, send me link to your polovniautomobili search, and i will send you message if something new appears. \nJust type /start"
      );
    });

    this.bot.start((ctx) =>
      ctx.reply(
        "Hi! There what i can do:  \n\
        \n \t/list - Show hunt list\
        \n \t/add - Add new hunt\
        \n \t/delete - Delete hunt\
        \n \t/delete_all - Delete all hunts\
        \n \t/help - Help"
      )
    );

    this.bot.command("cancel", (ctx) => {
      clearSession(ctx);
      ctx.reply("Operation cancelled");
    });

    this.bot.on("my_chat_member", (ctx) => {
      const status = ctx.update.my_chat_member.new_chat_member.status;

      if (status === "kicked" || status === "left") {
        console.log(
          `Bot was removed by user: ${ctx.update.my_chat_member.chat.id}`
        );
        deleteTrackingById(ctx.from.id);
      }

    });
  }
}
