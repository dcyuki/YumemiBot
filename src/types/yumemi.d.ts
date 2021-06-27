import { Client, ConfBot } from "oicq";
import { Logger } from 'log4js';

interface IGroups {
  [group_id: string]: {
    name: string;
    plugins: string[];
    settings: {
      [plugin: string]: {
        lock: boolean;
        [param: string]: any;
      }
    }
  }
}

// oicq Client 实例上增加 master groups plugins 属性
declare module 'oicq' {
  interface Client {
    master: number[];
    groups: IGroups;
    plugins: Map<string, IPlugins>;
  }
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
  readonly [plugin: string]: any
}

interface IInfo {
  readonly admin: number[];
  readonly released: string;
  readonly version: string;
  readonly docs: string;
  readonly changelogs: string;
}

type IProfile = IApi | ICmd | IInfo | IGroups;

export declare global {
  var yumemi: {
    bots: Map<string, Client>;
    api: IApi;
    cmd: ICmd;
    info: IInfo;
    logger: Logger;
  };

  var __yumeminame: string;
}
