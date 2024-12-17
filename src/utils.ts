import axios from "axios";
import { Context } from "telegraf";
import * as cheerio from "cheerio";

export function clearSession(ctx: Context) {
  if (ctx.session.add.currentStep || ctx.session.delete.currentStep) {
    ctx.session.add.currentStep = undefined;
    ctx.session.delete.currentStep = undefined;
  }
}

export function getDateNow() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Місяць з 0-індексацією
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function selfReq() {
  const p1 = "https://poliv";
  const p2 = "niautohunter.onren";
  const p3 = "der.com";
  const url = p1 + p2 + p3;

  setInterval(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, (Math.floor(Math.random() * 3) + 1) * 60 * 1000);
    });
    axios
      .get(url + `/send/`)
      .then((response) => {
        console.log(
          `Reloaded at ${new Date().toISOString()}: Status Code ${
            response.status
          }`
        );
      })
      .catch((error) => {
        console.error(
          `selfReq Error -- ${new Date().toISOString()}:`,
          error.message
        );
      });
  }, 10 * 60 * 1000);
}

export function getTitlles(
  html: ReturnType<typeof cheerio.load>,
  article: ReturnType<ReturnType<typeof cheerio.load>>
) {
  const price = article.attr("data-price") || "";
  const title = article.find("img").attr("title") || "";
  const titles = [`<b>${title}</b>`, " 💰 - " + price];

  article.find(".setInfo").each((index, setInfo) => {
    html(setInfo)
      .find("div[title]")
      .each((index, div) => {
        const titleFromDiv = html(div).attr("title");
        if (titleFromDiv) {
          titles.push(titleFromDiv);
        }
      });
  });
  titles.push(
    article.find(".uk-icon-map-marker").first().html() || "No lication"
  );
  if (titles.length === 9) {
    titles[2] = "🗓️ - " + replaceAutoType(titles[2]);
    titles[3] = "⛽ - " + titles[3].replace(" | ", "\n⚙️ - ");
    titles[4] = "🎰 - " + titles[4] + "🛞";
    titles[5] = "⚡ - " + titles[5];
    titles[6] = "🕹️ - " + titles[6];
    titles[7] = "🚪 - " + titles[7].replace(",", ", 💺 - ");
    titles[8] = "📍 - " + titles[8];
  }
  return titles;
}

function replaceAutoType(text: string) {
  const emojiMap: { [key: string]: string } = {
    ". Limuzina": "\n🚗 — Limuzina",
    ". Hečbek": "\n🚗 — Hečbek",
    ". Karavan": "\n🚙 — Karavan",
    ". Kupe": "\n🚗 — Kupe",
    ". Kabriolet/Roadster": "\n🚙 — Kabriolet/Roadster",
    ". Monovolumen (MiniVan)": "\n🚐 — Monovolumen (MiniVan)",
    ". Džip/SUV": "\n🚙 — Džip/SUV",
    ". Pickup": "\n🛻 — Pickup",
  };

  // Регулярний вираз для знаходження типів
  const typeRegex = new RegExp(Object.keys(emojiMap).join("|"), "g");

  // Заміна типів на емодзі з відповідними назвами
  return `\n${text.replace(typeRegex, (match) => emojiMap[match] || match)}`;
}
