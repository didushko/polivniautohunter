import { Context } from "telegraf";

export function clearSession(ctx: Context) {
  if (ctx.session.add.currentStep || ctx.session.delete.currentStep) {
    ctx.session.add.currentStep = undefined;
    ctx.session.delete.currentStep = undefined;
  }
}

export function getDateNow(){
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Місяць з 0-індексацією
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}