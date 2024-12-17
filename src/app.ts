import { session, Telegraf } from "telegraf";
import { IConfigService } from "./config/config.interface";
import { ConfigService } from "./config/config.service";
import { Command } from "./commands/command.class";
import { StartCommand } from "./commands/start.command";
import { HuntListCommand } from "./commands/huntList.command";
import { AddHuntCommand } from "./commands/addHunt.command";
import { DeleteHuntCommand } from "./commands/deleteHunt.command";
import { DeleteAllCommand } from "./commands/deleteAll.command";
import {
  processAllTrackings,
  sendTestMessage,
  sendUpdates,
} from "./services/polav-service";
import * as http from "http";

declare module "telegraf" {
  interface Context {
    session: {
      add: {
        name?: string | undefined;
        currentStep?: "name" | "url" | undefined;
      };
      delete: {
        currentStep?: "name" | undefined;
      };
    };
  }
}

class Bot {
  bot: Telegraf;
  commands: Command[] = [];
  constructor(private readonly configService: IConfigService) {
    this.bot = new Telegraf(this.configService.get("TOKEN"));
  }
  init() {
    this.bot.use(session({ defaultSession: () => ({ add: {}, delete: {} }) }));
    this.commands = [
      new StartCommand(this.bot),
      new HuntListCommand(this.bot),
      new AddHuntCommand(this.bot),
      new DeleteHuntCommand(this.bot),
      new DeleteAllCommand(this.bot),
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
sendUpdates(configService, bot.bot);

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/send/all") {
    console.log("Receive send all comand");
    await processAllTrackings(configService, bot.bot);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("All messages sended");
  } else if (req.method === "GET" && req.url === "/send/test") {
    await sendTestMessage(bot.bot);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(JSON.stringify({ message: "Test sended" }));
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

const port = process.env.PORT || 3333;
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
