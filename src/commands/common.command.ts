import { Scenes, Telegraf } from 'telegraf';
import { Command } from './command.class';
import trackingService from '../services/tracking-service';
import userService from '../services/user-service';

export class CommonCommand extends Command {
  constructor(bot: Telegraf<Scenes.WizardContext>) {
    super(bot);
  }
  handle(): void {
    this.bot.help((ctx) => {
      return ctx.reply(
        'I can help you with your car hunt! Just a add new hunt, send me the link to your <a href="https://www.polovniautomobili.com/auto-oglasi/pretraga" >PolovniAutomobili</a> search, and i will notify if something new appears. \nJust type /start',
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Polovniautomobili',
                  url: 'https://www.polovniautomobili.com/auto-oglasi/pretraga',
                },
              ],
            ],
          },
        }
      );
    });

    this.bot.start((ctx) => {
      return ctx.reply(
        `Hi there! Here’s what I can do:

  • /list – Show the hunt list
  • /add – Add a new hunt
  • /delete – Delete a hunt
  • /delete_all – Delete all hunts
  • /support – Suppot & feedback
  • /help – Show help${
    ctx.from.id.toString() === process.env.ADMIN_ID
      ? '\n\t• /admin – Admin commands'
      : ''
  }`
      );
    });

    this.bot.on('my_chat_member', (ctx) => {
      const status = ctx.update.my_chat_member.new_chat_member.status;

      if (status === 'kicked' || status === 'left') {
        console.log(
          `Bot was removed by user: ${ctx.update.my_chat_member.chat.id}`
        );
        trackingService.deleteTrackingById(ctx.from.id);
        userService.deleteUser(ctx.from.id);
      }
    });

    this.bot.command('support', async (ctx) => {
      ctx.scene.enter('chatWithAdmin');
      // return ctx.reply("Support menu", {
      //   reply_markup: {
      //     inline_keyboard: [
      //       [{ text: "Send message to admin", callback_data: "chatWithAdmin" }],
      //     ],
      //   },
      // });
    });
    this.bot.action('chatWithAdmin', async (ctx) => {
      ctx.scene.enter('chatWithAdmin');
    });

    this.bot.action(/^helpdesk_answer_(\d+)_(\d+)$/, async (ctx) => {
      const matches = ctx.match;
      const userId = matches[1];
      const messageId = matches[2];
      ctx.scene.enter('chatWithAdmin', {
        chat_id: userId,
        message_id: messageId,
      });
    });
  }
}
