import { config, DotenvParseOutput } from "dotenv";
import { IConfigService } from "./config.interface";

export class ConfigService implements IConfigService {
  private config: DotenvParseOutput | NodeJS.ProcessEnv;
  constructor() {
    const { error, parsed } = config();
    if (error) {
      this.config = process.env;
      console.log("No .env file found");
    }
    if (!parsed) {
      this.config = process.env;
      console.log("Empty .env");
    }
    this.config = process.env;
  }
  get(key: string): string {
    const res = this.config[key];
    if (!res) {
      throw new Error(`Config key ${key} not found`);
    }
    return res;
  }
}
