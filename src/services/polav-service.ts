import axios from 'axios';
import * as cheerio from 'cheerio';
import { ConfigService } from '../config/config.service';
import { Scenes, Telegraf } from 'telegraf';
import {
  getDataFromArticle as getAutoCardFromArticle,
  getDateNow,
} from '../utils';
import trackingService from './tracking-service';
import { exampleHhtml } from '../example';
import userService from './user-service';

export interface AutoCard {
  id: string;
  titles: string;
  img: string;
  link: string;
  date: number;
  tags: string[];
}

const ARTICLE_CLASS = '<article class="classified';
const ARTICLE_WITH_ADD =
  'article.usedCarFeatured, article[class~="usedCarFeatured"]';
const ARTICLE_ORDINARY = 'article.classified:not(.usedCarFeatured)';
const NEXT_PAGE = '<a title="Sledeća stranica" class="js-pagination-next"';

function getDatesFromPage(rawHtml: string) {
  const res = {
    add: '',
    ord: '',
  };
  const html = cheerio.load(rawHtml);
  const firstArticleAdd = html(ARTICLE_WITH_ADD).first();

  const firstArticleOrdinary = html(ARTICLE_ORDINARY).first();

  if (firstArticleAdd.length > 0) {
    res.add = firstArticleAdd.attr('data-renewdate') || '';
    console.log(
      'first finded add',
      firstArticleAdd.attr('data-renewdate') || ''
    );
  }
  if (firstArticleOrdinary.length > 0) {
    res.ord = firstArticleOrdinary.attr('data-renewdate') || '';
    console.log(
      'first finded ord',
      firstArticleOrdinary.attr('data-renewdate') || ''
    );
  }
  return res;
}

function getNewFromPage(
  rawHtml: string,
  last_date_with_add: number,
  last_date: number
) {
  const res: {
    add: AutoCard[];
    ord: AutoCard[];
    findedOrd: boolean;
  } = {
    add: [],
    ord: [],
    findedOrd: false,
  };
  const html = cheerio.load(rawHtml);
  html(ARTICLE_WITH_ADD)
    .filter(function () {
      const renewDateStr = html(this).attr('data-renewdate');
      const renewDate = renewDateStr ? Date.parse(renewDateStr) : 0;
      return renewDate > last_date_with_add;
    })
    .each(function (i) {
      const renewDateStr = html(this).attr('data-renewdate');
      console.log(
        i,
        'find with ad',
        renewDateStr,
        Date.parse(renewDateStr || '0'),
        last_date_with_add
      );
      const article = html(this);
      res.add.push(getAutoCardFromArticle(html, article));
    });

  const ordinary = html(ARTICLE_ORDINARY);
  const ArticlesOrdinary = ordinary.filter(function () {
    const renewDateStr = html(this).attr('data-renewdate');
    const renewDate = renewDateStr ? Date.parse(renewDateStr) : 0;
    return renewDate > last_date;
  });
  ArticlesOrdinary.each(function () {
    const article = html(this);
    res.ord.push(getAutoCardFromArticle(html, article));
  });
  res.findedOrd = ordinary.length > 0;
  return res;
}

export async function getDatesByUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set('sort', 'renewDate_desc');
    parsedUrl.searchParams.set('page', '1');
    const dates = {
      add: '',
      ord: '',
    };
    let page = 1;
    let finish = false;
    do {
      parsedUrl.searchParams.set('page', page.toString());
      const res = await axios.get(parsedUrl.toString());
      if (res.status === 200 && res.data.toString().includes(ARTICLE_CLASS)) {
        const finedDates = getDatesFromPage(res.data);
        if (!dates.add) {
          dates.add = finedDates.add;
        }
        if (!dates.ord && finedDates.ord) {
          dates.ord = finedDates.ord;
          finish = true;
        }
        if (res.data.toString().includes(NEXT_PAGE)) {
          page++;
        } else {
          finish = true;
        }
      } else {
        break;
      }
    } while (!finish);
    return dates;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function getNewCard(
  url: string,
  last_date_with_add: number,
  last_date: number
) {
  const newWithAdd = [];
  const newOrdinary = [];
  let finish = false;
  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set('sort', 'renewDate_desc');
    parsedUrl.searchParams.set('page', '1');
    let page = 1;
    do {
      parsedUrl.searchParams.set('page', page.toString());
      const res = await axios.get(parsedUrl.toString());
      if (res.status === 200 && res.data.toString().includes(ARTICLE_CLASS)) {
        const newData = getNewFromPage(res.data, last_date_with_add, last_date);
        newWithAdd.push(...newData.add);
        newOrdinary.push(...newData.ord);
        finish = newData.ord.length > 0;
        if (res.data.toString().includes('NEXT_PAGE')) {
          page++;
        } else {
          finish = true;
        }
      } else {
        break;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    } while (!finish);
    return { newWithAdd, newOrdinary };
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function sendUpdates(
  configService: ConfigService,
  bot: Telegraf<Scenes.WizardContext>
) {
  setInterval(
    () => processAllTrackings(bot),
    Number.parseInt(configService.get('INTERVAL')) * 60 * 1000
  );
}

export const processAllTrackings = async (
  bot: Telegraf<Scenes.WizardContext>
) => {
  const limit = 100;
  let offset = 0;
  const processTracking = async (tracking: {
    user_id: string;
    url: string;
    name: string;
    last_date_with_add: number;
    last_date: number;
  }): Promise<void> => {
    try {
      const newItems = await getNewCard(
        tracking.url,
        tracking.last_date_with_add,
        tracking.last_date
      );
      if (!newItems) {
        return;
      }

      await trackingService.updateTrackingDates(
        tracking.user_id,
        tracking.name,
        Math.max(
          ...newItems.newWithAdd.map((item) => item.date),
          tracking.last_date_with_add
        ),
        Math.max(
          ...newItems.newOrdinary.map((item) => item.date),
          tracking.last_date
        )
      );
      newItems?.newOrdinary
        .sort((a, b) => a.date - b.date)
        .forEach(async (item) =>
          sendMessageWithNewItem(
            bot,
            tracking.user_id,
            tracking.name,
            tracking.url,
            item.tags,
            item.titles,
            item.img,
            item.link,
            '🌟 Regular'
          )
        );
      newItems?.newWithAdd
        .sort((a, b) => a.date - b.date)
        .forEach(async (item) => {
          sendMessageWithNewItem(
            bot,
            tracking.user_id,
            tracking.name,
            tracking.url,
            item.tags,
            item.titles,
            item.img,
            item.link,
            '📢 Sponsored'
          );
        });

      console.log(
        `${getDateNow()}---send ${
          newItems.newWithAdd.length + newItems.newOrdinary.length
        } to user ${tracking.user_id} with hunting name ${tracking.name}`
      );
    } catch (e) {
      console.log(e);
    }
  };

  while (true) {
    const rows = await trackingService.getTrackingListBatch(offset, limit);
    if (rows.length === 0) {
      break;
    }

    for (const tracking of rows) {
      await processTracking({
        user_id: tracking.user_id.toString(),
        url: tracking.url,
        name: tracking.name,
        last_date_with_add: tracking.last_date_with_add,
        last_date: tracking.last_date,
      });
    }
    offset += limit;
  }
};

async function sendMessageWithNewItem(
  bot: Telegraf<Scenes.WizardContext>,
  user_id: string,
  huntName: string,
  huntUrl: string,
  tags: string[],
  titles: string,
  img: string,
  link: string,
  type: string
) {
  try {
    const messageText = `Here’s a new car in your 🎯<a href='${huntUrl}'><b>${huntName}</b></a> hunt\nType: ${type}\n\n${titles}\n\n${tags
      .map((el) => '#' + el.replace(/\s+/g, '_'))
      .join(' ')}`;

    const buttonText = 'View on the website';
    const buttonUrl = 'https://www.polovniautomobili.com' + link;

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Belgrade',
      hour: 'numeric',
      hour12: false,
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const currentHour = parseInt(formatter.format(new Date()), 10);
    const disableNotification = currentHour <= 10 || currentHour >= 22;
    await bot.telegram.sendPhoto(user_id, img, {
      caption: messageText + (disableNotification ? '\n 🔕 10pm — 10am' : ''),
      parse_mode: 'HTML',
      disable_notification: disableNotification,
      reply_markup: {
        inline_keyboard: [[{ text: buttonText, url: buttonUrl }]],
      },
    });
  } catch (e: any) {
    if (e?.description?.includes('bot was blocked by the user')) {
      console.log(`🚫 User ${user_id} заблокував бота, видаляємо`);
      trackingService.deleteTrackingById(Number.parseInt(user_id));
      userService.deleteUser(Number.parseInt(user_id));
    } else {
      console.error('Send error:', e);
    }
  }
}

export async function sendTestMessage(bot: Telegraf<Scenes.WizardContext>) {
  const newItem = getNewFromPage(exampleHhtml, 0, 0);
  const { titles, img, link, tags } = newItem.ord[0]!;
  const type = '🌟 Regular';
  const name = 'TEST';
  const user_id = process.env.ADMIN_ID;
  const url = 'https://www.polovniautomobili.com/auto-oglasi/';
  if (user_id) {
    sendMessageWithNewItem(
      bot,
      user_id,
      name,
      url,
      tags,
      titles,
      img,
      link,
      type
    );
  }
}
