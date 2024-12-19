import { Scenes, Telegraf } from "telegraf";
import { Command } from "./command.class";
import userService from "../services/user-service";

export class ServiceMiddleware extends Command {
  constructor(bot: Telegraf<Scenes.WizardContext>) {
    super(bot);
  }
  handle(): void {
    this.bot.use((ctx, next) => {
      if (ctx.from?.id) {
        userService.addUserIfNotExists(ctx.from.id, ctx.from?.username);
      }
      return next();
    });
    if (process.env.TEST) {
      this.bot.use((ctx, next) =>
        ctx.from?.id == process.env.ADMIN_ID
          ? next()
          : ctx.reply("Not allowed, you are not admin")
      );
    }
  }
}
