import axios from "axios";
import { Context } from "telegraf";

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
