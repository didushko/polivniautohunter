import { config, DotenvParseOutput } from "dotenv";
import { IConfigService } from "./config.interface";

export class ConfigService implements IConfigService {
  private config: DotenvParseOutput;
  constructor() {
    const { error, parsed } = config();
    if (error) {
      throw new Error("No .env file found");
    }
    if (!parsed) {
      throw new Error("Empty .env");
    }
    this.config = parsed;
  }
  get(key: string): string {
    const res = this.config[key];
    if (!res) {
      throw new Error(`Config key ${key} not found`);
    }
    return res;
  }
}
