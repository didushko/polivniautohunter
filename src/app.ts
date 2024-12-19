import { Scenes, session, Telegraf } from "telegraf";
import { IConfigService } from "./config/config.interface";
import { ConfigService } from "./config/config.service";
import { Command } from "./commands/command.class";
import { CommonCommand } from "./commands/common.command";
import {
  processAllTrackings,
  sendTestMessage,
  sendUpdates,
} from "./services/polav-service";
import * as http from "http";
import { selfReq } from "./utils";
import { AdminCommand } from "./commands/admin.command";
import { ServiceMiddleware } from "./commands/service.middlware";
import { addHuntingScene } from "./scenes/addHunting.scene";
import { HuntCommand } from "./commands/hunt.command";

class Bot {
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
    this.scenes = [addHuntingScene];
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

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/send/all") {
      console.log("Receive send all comand");
      await processAllTrackings(bot.bot);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("All messages sended");
    } else if (req.method === "GET" && req.url === "/send/test") {
      await sendTestMessage(bot.bot);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(JSON.stringify({ message: "Test sended" }));
    } else if (req.method === "GET" && req.url?.startsWith("/date")) {
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      const date = parsedUrl.searchParams.get("q");
      if (date) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ message: `Date: ${Date.parse(date)}}` }));
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ error: "Missing 'q' parameter" }));
      }
    } else {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  } catch (e) {
    console.log(e);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Error");
  }
});

const port = process.env.PORT || 3333;
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

if (process.env.CHEAP) selfReq();
