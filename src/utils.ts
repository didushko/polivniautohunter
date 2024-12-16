import { Context } from "telegraf";

export function clearSession(ctx: Context) {
  if (ctx.session.add.currentStep || ctx.session.delete.currentStep) {
    ctx.session.add.currentStep = undefined;
    ctx.session.delete.currentStep = undefined;
  }
}
