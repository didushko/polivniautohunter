import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { deleteTrackingById } from "../services/database";

export class DeleteAllCommand extends Command {
  constructor(bot: Telegraf) {
    super(bot);
  }
  handle(): void {
    this.bot.command("delete_all", async (ctx) => {
      const res = await deleteTrackingById(ctx.from.id);
      if (res) {
        ctx.reply("Your tracking list is empty");
      } else {
        ctx.reply("Uups, we have some trable, please try again");
      }
    });
  }
}
