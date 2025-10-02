import * as http from 'http';
import { processAllTrackings, sendTestMessage } from './services/polav-service';
import { Bot } from './app';

export function startServer(bot: Bot) {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/send/all') {
        console.log('Receive send all comand');
        await processAllTrackings(bot.bot);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('All messages sended');
      } else if (req.method === 'GET' && req.url === '/send/test') {
        await sendTestMessage(bot.bot);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify({ message: 'Test sended' }));
      } else if (req.method === 'GET' && req.url?.startsWith('/date')) {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const date = parsedUrl.searchParams.get('q');
        if (date) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(
            JSON.stringify({ message: `Date: ${date} ${Date.parse(date)}}` })
          );
        } else {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end(JSON.stringify({ error: "Missing 'q' parameter" }));
        }
      } else if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('PolovniAutoHunter_bot work now!');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    } catch (e) {
      console.log(e);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Error');
    }
  });

  const port = process.env.PORT || 3333;
  server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}
