import { Client, ConfBot } from "oicq";
import { Logger } from 'log4js';

export declare global {
  var yumemi: {
    bots: Map<string, Client>;
    api: IApi;
    cmd: ICmd;
    info: IInfo;
    logger: Logger;
  };
}

// Client 实例上增加 masters groups plugins 属性
declare module 'oicq' {
  interface Client {
    masters: number[];
  }
}

interface IBot {
  readonly qq: { masters: number[], uin: number };
  readonly plugins: string[];
  readonly config: ConfBot;
}

interface IApi {
  readonly acgmx: { url: string, key: string };
  readonly hitokoto: { url: string, params: string };
  readonly lolicon: { url: string, key: string };
  readonly pcrdfans: { url: string, key: string };
  readonly saucenao: { url: string, key: string };
  readonly webhook: { path: string, secret: string };
}

interface IBot {
  readonly qq: { master: number[], uin: number, password: string };
  readonly plugins: string[];
  readonly config: ConfBot;
}

interface ICmd {
  readonly [plugin: string]: {
    [string: string]: string
  }
}

interface IInfo {
  readonly admin: number[];
  readonly released: string;
  readonly version: string;
  readonly docs: string;
  readonly changelogs: string;
}