import { Client, ConfBot } from "oicq";
import { Logger } from 'log4js';

interface IBoss {
  bl: number[][],
  tw: number[][],
  jp: number[][],
}

interface IDate {
  time: string,
  today: string,
  tomorrow: string,
  the_month: string,
  next_month: string
}

interface IBattle {
  id: number,
  title: string,
  syuume: number,
  one: number,
  two: number,
  three: number,
  four: number,
  five: number,
  crusade: string,
  length: number,
  update_time: string
}

interface ISetu {
  readonly url: string;
  readonly key: string;
  readonly lsp: Map<number, number>;
  readonly max_lsp: number;
}

interface IGroups {
  [group_id: number]: {
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

interface IPlugin {
  readonly bot: Client;
  readonly cmd?: any;
  readonly activate: (bot: Client) => void;
  readonly deactivate: (bot: Client) => void;
}

// Client 实例上增加 master groups plugins 属性
declare module 'oicq' {
  interface Client {
    master: number[];
    groups: IGroups;
    plugins: Map<string, any>;
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

type IProfile = IApi | ICmd | IInfo | IBot | IGroups | any;

export declare global {
  var yumemi: {
    bots: Map<string, Client>;
    api: IApi;
    cmd: ICmd;
    info: IInfo;
    logger: Logger;
  };

  var __yumeminame: string;
  var __configname: string;
  var __groupsname: string;
  var __imagesname: string;
  var __setuname: string;
  var __rankname: string;
  var __emojiname: string;
  var __pluginsname: string;
  var __servicesname: string;
  var __dynamicname: string;
  var __dbname: string;
}