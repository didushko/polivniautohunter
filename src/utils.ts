import axios from "axios";
import { Context, Scenes } from "telegraf";
import * as cheerio from "cheerio";
import { IUser } from "./database/User.model";
import { Message } from "telegraf/typings/core/types/typegram";

export function clearSession(ctx: Context) {
  // if (ctx.session.add.currentStep || ctx.session.delete.currentStep) {
  //   ctx.session.add.currentStep = undefined;
  //   ctx.session.delete.currentStep = undefined;
  //   ctx.session.support = false;
  // }
}

export const isTextMessageNotEmpty = (
  message: unknown
): message is Message.TextMessage =>
  !!message &&
  typeof (message as Message.TextMessage).text === "string" &&
  (message as Message.TextMessage).text !== "";

export async function handleCancel(
  ctx: Scenes.WizardContext
): Promise<false | string> {
  if (!isTextMessageNotEmpty(ctx.message)) {
    await ctx.reply("Please provide a valid field");
    return false;
  } else if (ctx.message?.text === "/cancel") {
    await ctx.reply("Scene canceled.");
    await ctx.scene.leave();
    return false;
  }
  return ctx.message.text;
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
    axios.get(url + `/send/`).catch((error) => {
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
  const titles = [`🏷️ <b>${title}</b>\n`, " 💰 — " + price];

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
  const city = article.find(".city").first().text();
  const cityLink = city
    ? `<a href="https://www.google.com/maps/place/${encodeURIComponent(
        city
      )}" name="${city}">${city}</a>`
    : "Unknown lication";
  titles.push(cityLink);

  if (titles.length === 9) {
    titles[2] = "🗓️ — " + replaceAutoType(titles[2]);
    titles[3] = "⛽ — " + titles[3].replace(" | ", "\n⚙️ — ");
    titles[4] = "🎰 — " + titles[4] + "🛞";
    titles[5] = "⚡ — " + titles[5];
    titles[6] = "🕹️ — " + titles[6];
    titles[7] = "🚪 — " + titles[7].replace(",", ", 💺 — ");
    titles[8] = "📍 — " + titles[8];
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
  const typeRegex = new RegExp(
    Object.keys(emojiMap)
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|"),
    "g"
  );

  // Заміна типів на емодзі з відповідними назвами
  return `${text.replace(typeRegex, (match) => emojiMap[match] || match)}`;
}

export function formatUserTable(users: IUser[], sort?: () => number): string {
  const data = [
    ["ID", "NAME", "First request", "First hunt", "Last hunt", "Total_hunting"],
  ];
  if (sort) {
    users.sort(sort);
  }
  users.forEach((user) => {
    for (let i = 0; i < 25; i++) {
      data.push([
        user.user_id.toString(),
        user.user_name || "",
        user.first_request?.toString() || "",
        user.first_hunt?.toString() || "",
        user.last_hunt?.toString() || "",
        user.total_hunting?.toString(),
      ]);
    }
  });

  const columnWidths = data[0].map((_, i) =>
    Math.max(...data.map((row) => row[i].length))
  );

  return data
    .map((row) =>
      row.map((cell, i) => cell.padEnd(columnWidths[i])).join(" | ")
    )
    .join("\n");
}
