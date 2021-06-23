import { Client, GroupMessageEventData } from "oicq";

import { Battle, checkCommand } from "../../utils/yumemi";

const all_battle: Map<number, Battle> = new Map();
const chess: Set<string> = new Set(['●', '○']);
const reg: { x: RegExp, y: RegExp } = { x: /[a-zA-Z]/g, y: /[0-9]/g };
const delta: number[][][] = [[[0, 1], [0, -1]], [[-1, 0], [1, 0]], [[-1, -1], [1, 1]], [[1, -1], [-1, 1]],];
const alphabet: string = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ';
const numbers: string[] = ['　', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];

// 创建对局
function start(data: GroupMessageEventData) {
  const { group_id, user_id, raw_message, reply } = data;

  if (all_battle.has(group_id)) return reply('当前群聊对局尚未结束，请勿重复开启');

  // 获取棋盘大小，默认 10 * 10
  const board: string[][] = [];
  const board_size: number = Number(raw_message.replace(/[^\d]/g, '')) || 9;

  // if (board_size < 5 || board_size > 20) return bot.sendGroupMsg(group_id, '创建对局失败，棋盘超出大小限制');

  // 绘制棋盘
  for (let i = 0, j = 0; i <= board_size; j++) {
    j === 0 && (board[i] = []);

    switch (i) {
      case 0:
        board[i].push(j === 0 ? '┌' : (j === board_size ? '┐' : '┬'));
        break;
      case board_size:
        board[i].push(j === 0 ? '└' : (j === board_size ? '┘' : '┴'));
        break;

      default:
        board[i].push(j === 0 ? '├' : (j === board_size ? '┤' : '┼'));
        break;
    }

    j === board_size && (board[i].unshift(alphabet[i]), i++, j = -1);
  }

  numbers.length = board_size + 2;
  board.unshift(numbers);
  const timeout: NodeJS.Timeout = setTimeout(() => {
    surrender(data, '因长时间未分出胜负');
  }, 1800000);

  const battle: Battle = new Battle(user_id, board, timeout);

  all_battle.set(group_id, battle);
  reply(battle.board.join('\n'));
}

function move(data: GroupMessageEventData) {
  const { group_id, user_id, raw_message, reply, sender: { card, nickname } } = data;

  if (!all_battle.has(group_id)) return reply('当前群聊未开启对局');

  const battle: Battle = <Battle>all_battle.get(group_id);
  const { board, offensive } = battle;

  // 白棋未录入棋手则判断记录
  if (!battle.white && battle.black !== user_id) {
    battle.white = user_id;
    reply(`${card ? card : nickname} 加入当前对局`);
  }

  let msg: string | null = null;
  const { black, white } = battle;

  switch (true) {
    case user_id !== white && user_id !== black:
      msg = `[CQ:at,qq=${user_id}] 你以后下象棋必被人指指点点！<( ￣^￣)(θ(θ☆( >_<)`;
      break;
    case user_id === black && !offensive || user_id === white && offensive:
      msg = `[CQ:at,qq=${user_id}] 还没到你的回合呢，你急啥 (lll￢ω￢)`;
      break;
  }

  if (msg) return reply(msg);

  // 落子坐标
  const x: number = <number>raw_message.match(reg.x)?.join().toUpperCase().charCodeAt(0) - 64;
  const y: number = Number(raw_message.match(reg.y)?.join(''));

  // 已有棋子
  if (chess.has(board[x][y])) {
    reply(`[CQ:at,qq=${user_id}] 当前位置已经有棋子啦，换个位置下吧`);
    return;
  }

  // 坐标越界
  if (!board[x][y]) return reply(`[CQ:at,qq=${user_id}] 越界了，亲 (╯▔皿▔)╯`);

  board[x][y] = offensive ? '●' : '○';
  battle.board = board;

  // 记录落子
  battle.history.push([x, y]);

  // 落子后发送新的棋盘数据
  reply(board.join('\n'));

  // 循环遍历五子棋数组规则
  for (const [last, next] of delta) {
    let new_x = null;
    let new_y = null;

    for (let i = 1, j = true; i < 5; i++) {
      // 初次循环 j = true 即落子后，则返回棋子左侧坐标
      new_x = x + (j ? last[0] : next[0]) * i;
      new_y = y + (j ? last[1] : next[1]) * i;

      // 邻处有相同棋子则继续遍历
      if (board[new_x][new_y] === board[x][y]) {
        if (i < 4) continue;

        // 移除当前群聊棋盘信息
        clearTimeout(battle.timeout);
        all_battle.delete(group_id);
        reply(`check mate！恭喜 [CQ:at,qq=${user_id}] 获得本轮胜利~ ヾ(≧▽≦*)o`);
        return;
      } else {
        // 左侧没相同棋子则返回右侧坐标 j = false
        if (j) {
          j = !j, i = 0
        } else {
          j = !j;
          break;
        }
      }
    }
  }
}

function rollback(data: GroupMessageEventData) {
  const { group_id, user_id, reply } = data;

  if (!all_battle.has(group_id)) return reply(`当前群聊未开启对局`);

  const battle: Battle = <Battle>all_battle.get(group_id);
  const { black, white, board, history } = battle;

  // 既不是黑棋手也不是白棋手则指指点点
  if (user_id !== white && user_id !== black) {
    reply(`[CQ:at,qq=${user_id}] 你以后下象棋必被人指指点点！<( ￣^￣)(θ(θ☆( >_<)`);
    return;
  }

  if (battle.history.length < 1) {
    return reply(`[CQ:at,qq=${user_id}] 当前对局没有历史记录`);
  }

  const [x, y] = history[history.length - 1];

  board[x][y] = '┼';
  battle.board = board;
  battle.history.length = battle.history.length - 1;
  reply(board.join('\n'));
}

function surrender(data: GroupMessageEventData, msg: string = `${data.sender.card ? data.sender.card : data.sender.nickname} 认输`) {
  const { group_id, reply } = data;

  if (!all_battle.has(group_id)) return;
  const { timeout } = <Battle>all_battle.get(group_id);
  clearTimeout(timeout);
  all_battle.delete(group_id);
  reply(`${msg}，游戏结束`);
}

function over(data: GroupMessageEventData) {
  const { sender: { nickname, card } } = data;

  surrender(data, `${card ? card : nickname} 中止了对局`);
}

function gobang(bot: Client, data: GroupMessageEventData) {
  const { gobang } = yumemi.cmd;
  const { groups } = bot;
  const { group_id, raw_message } = data;

  if (!groups[group_id].plugins.includes('gobang')) {
    return
  }
  checkCommand(raw_message, gobang.start) && start(data);
  checkCommand(raw_message, gobang.move) && move(data);
  checkCommand(raw_message, gobang.rollback) && rollback(data);
  checkCommand(raw_message, gobang.surrender) && surrender(data);
  checkCommand(raw_message, gobang.over) && over(data);
}

function activate(bot: Client): void {
  bot.on("message.group", (data: GroupMessageEventData) => gobang(bot, data));
}

function deactivate(bot: Client): void {
  bot.off("message.group", gobang)
}

export {
  activate, deactivate
}