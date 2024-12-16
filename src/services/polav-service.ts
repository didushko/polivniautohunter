import axios from "axios";
import * as cheerio from "cheerio";
import { getTrackingListBatch, updateTrackingDates } from "./database";
import { ConfigService } from "../config/config.service";
import { Telegraf } from "telegraf";

function getDatesFromPage(rawHtml: string) {
  const res = {
    add: "",
    ord: "",
  };
  const html = cheerio.load(rawHtml);
  const firstArticleAdd = html(
    'article.classified, article[class~="classified"]'
  ).first();

  const firstArticleOrdinary = html(
    "article.classified:not(.usedCarFeatured)"
  ).first();

  if (firstArticleAdd.length > 0) {
    res.add = firstArticleAdd.attr("data-renewdate") || "";
  }
  if (firstArticleOrdinary.length > 0) {
    res.ord = firstArticleOrdinary.attr("data-renewdate") || "";
  }
  return res;
}

function getNewFromPage(
  rawHtml: string,
  last_date_with_add: number,
  last_date: number
) {
  const res: {
    add: {
      id: string;
      price: string;
      title: string;
      img: string;
      link: string;
      date: number;
    }[];
    ord: {
      id: string;
      price: string;
      title: string;
      img: string;
      link: string;
      date: number;
    }[];
    findedOrd: boolean;
  } = {
    add: [],
    ord: [],
    findedOrd: false,
  };
  const html = cheerio.load(rawHtml);
  html('article.usedCarFeatured, article[class~="usedCarFeatured"]')
    .filter(function () {
      const renewDateStr = html(this).attr("data-renewdate");
      const renewDate = renewDateStr ? Date.parse(renewDateStr) : 0;
      return renewDate > last_date_with_add;
    })
    .each(function () {
      const article = html(this);
      const id = article.attr("data-classifiedid");
      const price = article.attr("data-price") || "";
      const title = article.find("img").attr("title") || "";
      const img = article.find("img").attr("data-src") || "";
      const link = article.find("a").attr("href") || "";
      const renewDateStr = html(this).attr("data-renewdate");
      const date = renewDateStr ? Date.parse(renewDateStr) : 0;
      if (id) res.add.push({ id: id, price, title, img, link, date });
    });

  const ArticlesOrdinary = html(
    "article.classified:not(.usedCarFeatured)"
  ).filter(function () {
    const renewDateStr = html(this).attr("data-renewdate");
    const renewDate = renewDateStr ? Date.parse(renewDateStr) : 0;
    return renewDate > last_date;
  });
  ArticlesOrdinary.each(function () {
    const article = html(this);
    const id = article.attr("data-classifiedid");
    const price = article.attr("data-price") || "";
    const title = article.find("img").attr("title") || "";
    const img = article.find("img").attr("data-src") || "";
    const link = article.find("a").attr("href") || "";
    const renewDateStr = html(this).attr("data-renewdate");
    const date = renewDateStr ? Date.parse(renewDateStr) : 0;
    if (id) res.ord.push({ id: id, price, title, img, link, date });
  });
  res.findedOrd = ArticlesOrdinary.length > 0;
  return res;
}

export async function getDatesByUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set("sort", "renewDate_desc");
    parsedUrl.searchParams.set("page", "1");
    const dates = {
      add: "",
      ord: "",
    };
    let page = 1;
    do {
      parsedUrl.searchParams.set("page", page.toString());
      const res = await axios.get(parsedUrl.toString());
      if (
        res.status === 200 &&
        res.data.toString().includes('<article class="classified')
      ) {
        const finedDates = getDatesFromPage(res.data);
        if (!dates.add) {
          dates.add = finedDates.add;
        }
        if (!dates.ord && finedDates.ord) {
          dates.ord = finedDates.ord;
          break;
        }
        page++;
      } else {
        break;
      }
    } while (!dates.ord);
    return dates;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function getNew(
  url: string,
  last_date_with_add: number,
  last_date: number
) {
  const newWithAdd = [];
  const newOrdinary = [];
  let findedOrdinary = false;
  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set("sort", "renewDate_desc");
    parsedUrl.searchParams.set("page", "1");
    let page = 1;
    do {
      parsedUrl.searchParams.set("page", page.toString());
      const res = await axios.get(parsedUrl.toString());
      if (
        res.status === 200 &&
        res.data.toString().includes('<article class="classified')
      ) {
        const newData = getNewFromPage(res.data, last_date_with_add, last_date);
        newWithAdd.push(...newData.add);
        newOrdinary.push(...newData.ord);
        page++;
        findedOrdinary = newData.findedOrd && newData.ord.length === 0;
      } else {
        break;
      }
    } while (!findedOrdinary);
    return { newWithAdd, newOrdinary };
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function sendUpdates(configService: ConfigService, bot: Telegraf) {
  const processTracking = async (tracking: {
    user_id: string;
    url: string;
    name: string;
    last_date_with_add: number;
    last_date: number;
  }): Promise<void> => {
    const newItems = await getNew(
      tracking.url,
      tracking.last_date_with_add,
      tracking.last_date
    );
    if (!newItems) {
      return;
    }

    await updateTrackingDates(
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
    newItems?.newOrdinary.forEach(async (item) =>
      sendMessageWithNewItem(
        bot,
        tracking.user_id,
        tracking.name,
        item.id,
        item.price,
        item.title,
        item.img,
        item.link,
        "Ordinary"
      )
    );
    newItems?.newWithAdd.forEach(async (item) => {
      sendMessageWithNewItem(
        bot,
        tracking.user_id,
        tracking.name,
        item.id,
        item.price,
        item.title,
        item.img,
        item.link,
        "Add"
      );
    });
    await new Promise((resolve) => {
      setTimeout(resolve, Number.parseInt(configService.get("SLEEP")) * 1000);
    });
  };

  const processAllTrackings = async () => {
    const limit = 100;
    let offset = 0;

    while (true) {
      const rows = await new Promise<
        {
          user_id: string;
          url: string;
          name: string;
          last_date_with_add: number;
          last_date: number;
        }[]
      >((resolve, reject) => {
        getTrackingListBatch(offset, limit, (error, rows) => {
          if (error) {
            reject("Error fetching tracking list: " + error);
          } else {
            resolve(rows);
          }
        });
      });

      if (rows.length === 0) {
        break;
      }
      for (const tracking of rows) {
        await processTracking(tracking);
      }
      offset += limit;
    }
  };
  setInterval(
    processAllTrackings,
    Number.parseInt(configService.get("INTERVAL")) * 60 * 1000
  );
}

async function sendMessageWithNewItem(
  bot: Telegraf,
  user_id: string,
  name: string,
  id: string,
  price: string,
  title: string,
  img: string,
  link: string,
  type: string
) {
  const messageText = `Here new car in your ${name} search.\n ${title} \n Id: ${id}\n Type: ${type}\n Price: ${price}`;

  const buttonText = "Go to website";
  const buttonUrl = "https://www.polovniautomobili.com" + link;

  await bot.telegram.sendPhoto(user_id, img, {
    caption: messageText,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: buttonText, url: buttonUrl }]],
    },
  });
}
