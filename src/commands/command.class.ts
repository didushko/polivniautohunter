import { Telegraf } from "telegraf";

export abstract class Command {
  constructor(public bot: Telegraf) {}
  abstract handle(): void;
}
