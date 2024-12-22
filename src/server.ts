import * as http from "http";
import { processAllTrackings, sendTestMessage } from "./services/polav-service";
import axios from "axios";
import { Bot } from "./app";

export function startServer(bot: Bot) {
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
          res.end(JSON.stringify({ message: `Date: ${date} ${Date.parse(date)}}` }));
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
}

function selfReq() {
  const p1 = "https://poliv";
  const p2 = "niautohunter.onren";
  const p3 = "der.com";
  const url = p1 + p2 + p3;

  setInterval(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, (Math.floor(Math.random() * 3) + 1) * 60 * 1000);
    });
    axios.get(url + `/send/`).catch((error) => {
      console.error(
        `selfReq Error -- ${new Date().toISOString()}:`,
        error.message
      );
    });
  }, 10 * 60 * 1000);
}
