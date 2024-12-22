import { Scenes, session, Telegraf } from "telegraf";
import { IConfigService } from "./config/config.interface";
import { ConfigService } from "./config/config.service";
import { Command } from "./commands/command.class";
import { CommonCommand } from "./commands/common.command";
import { sendUpdates } from "./services/polav-service";

import { AdminCommand } from "./commands/admin.command";
import { ServiceMiddleware } from "./commands/service.middlware";
import { addHuntingScene } from "./scenes/addHunting.scene";
import { HuntCommand } from "./commands/hunt.command";
import { adminShowUsersScene } from "./scenes/admin/showUsers.scene";
import { chatWithAdminScene } from "./scenes/chatWithAdmin.scene";
import { startServer } from "./server";
import { adminSendMessageToAllScene } from "./scenes/admin/sendMessageToAll.scene";

export class Bot {
  bot: Telegraf<Scenes.WizardContext>;
  commands: Command[] = [];
  scenes: Scenes.WizardScene<Scenes.WizardContext<Scenes.WizardSessionData>>[] =
    [];
  constructor(private readonly configService: IConfigService) {
    this.bot = new Telegraf<Scenes.WizardContext>(
      this.configService.get("TOKEN")
    );
  }
  init() {
    this.scenes = [
      addHuntingScene,
      adminShowUsersScene,
      chatWithAdminScene,
      adminSendMessageToAllScene,
    ];
    const stage = new Scenes.Stage<Scenes.WizardContext>(this.scenes);
    this.bot.use(session());
    this.bot.use(stage.middleware());
    this.commands = [
      new ServiceMiddleware(this.bot),
      new CommonCommand(this.bot),
      new HuntCommand(this.bot),
      new AdminCommand(this.bot),
    ];
    for (const command of this.commands) {
      command.handle();
    }

    this.bot.launch();
  }
}
const configService = new ConfigService();

const bot = new Bot(configService);

bot.init();

if (!process.env.TEST) sendUpdates(configService, bot.bot);
startServer(bot);
