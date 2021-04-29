class Battle {
  constructor(user_id, board) {
    this.black = user_id;
    this.white = null;
    this.board = board;
    this.offensive = true;
    this.history = [];
  }

  get board(){

  }
}

class Gobang {
  static all_battle = new Map();
  static chess = new Set(['●', '○']);
  static reg = { x: /[a-zA-Z]/g, y: /[0-9]/g };
  static delta = [[[0, 1], [0, -1]], [[-1, 0], [1, 0]], [[-1, -1], [1, 1]], [[1, -1], [-1, 1]],];
  static alphabet = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ';
  static numbers = ['　', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];

  constructor(ctx) {
    const { group_id, user_id, raw_message, nickname, card } = ctx;

    this.group_id = group_id;
    this.user_id = user_id;
    this.raw_message = raw_message;
    this.nickname = nickname;
    this.card = card;
  }

  get all_battle(){

  }
  
  // 创建对局
  start() {
    if (Gobang.all_battle.has(this.group_id)) return bot.sendGroupMsg(this.group_id, '当前群聊对局尚未结束，请勿重复开启');

    // 获取棋盘大小，默认 10 * 10
    const board = [];
    const board_size = Number(this.raw_message.replace(/[^\d]/g, '')) || 9;

    // if (board_size < 5 || board_size > 20) return bot.sendGroupMsg(this.group_id, '创建对局失败，棋盘超出大小限制');

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

      j === board_size && (board[i].unshift(Gobang.alphabet[i]), i++, j = -1);
    }

    Gobang.numbers.length = board_size + 2;
    board.unshift(Gobang.numbers);
    const battle = new Battle(this.user_id, board);
    Gobang.all_battle.set(this.group_id, battle);

    bot.sendGroupMsg(this.group_id, battle.board.join('\n'))
  }

  // 落子
  move() {
    if (!Gobang.all_battle.has(this.group_id)) return bot.sendGroupMsg(this.group_id, `当前群聊未开启对局`);

    const battle = Gobang.all_battle.get(this.group_id);
    const { black, white, board, offensive } = battle;

    // 白棋未录入棋手则判断记录
    if (!white && black !== this.user_id) {
      battle.white = this.user_id;
      bot.sendGroupMsg(this.group_id, `${this.card ? this.card : this.nickname} 加入当前对局`);
    }

    // 既不是黑棋手也不是白棋手则指指点点
    if (this.user_id !== white && this.user_id !== black) {
      bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 你以后下象棋必被人指指点点！<( ￣^￣)(θ(θ☆( >_<`);
      return;
    }

    // 落子坐标
    const reg = Gobang.reg;
    const x = this.raw_message.match(reg.x).join().toUpperCase().charCodeAt() - 64;
    const y = parseInt(this.raw_message.match(reg.y).join());

    // 坐标越界
    if (!board[x][y]) return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 越界了，亲 (╯▔皿▔)╯`);

    // 已有棋子
    if (Gobang.chess.has(board[x][y])) {
      bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 当前位置已经有棋子啦，换个位置下吧`);
      return;
    }

    if (this.user_id === black && !offensive) {
      return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 还没到你的回合呢，你急啥 (lll￢ω￢)`);
    }

    battle.board[x][y] = offensive ? '●' : '○';
    // 换手
    battle.offensive = !offensive;

    // 记录落子
    battle.history.push([x, y]);

    // 落子后发送新的棋盘数据
    bot.sendGroupMsg(this.group_id, battle.board.join('\n'));
  }

  // 悔棋
  rollback() {
    if (!Gobang.all_battle.has(this.group_id)) return bot.sendGroupMsg(this.group_id, `当前群聊未开启对局`);

    const battle = Gobang.all_battle.get(this.group_id);
    const { black, white, board, history, offensive } = battle;

    // 既不是黑棋手也不是白棋手则指指点点
    if (this.user_id !== white && this.user_id !== black) {
      bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 你以后下象棋必被人指指点点！<( ￣^￣)(θ(θ☆( >_<`);
      return;
    }

    battle.history.
    // 换手
    battle.offensive = !offensive;

    const [x, y] = this.history[this.history.length - 1];

    this.board[x][y] = '┼';
    bot.sendGroupMsg(this.group_id, this.board.join('\n'));
  }

  // // 创建棋盘
  // start() {
  //   // 棋盘大小
  //   const boardSize = 9;

  //   for (let i = 0, j = 0; i <= boardSize; j++) {
  //     if (j === 0) this.board[i] = [];

  //     switch (i) {
  //       case 0:
  //         this.board[i].push(j === 0 ? '┌' : (j === boardSize ? '┐' : '┬'));
  //         break;
  //       case boardSize:
  //         this.board[i].push(j === 0 ? '└' : (j === boardSize ? '┘' : '┴'));
  //         break;

  //       default:
  //         this.board[i].push(j === 0 ? '├' : (j === boardSize ? '┤' : '┼'));
  //         break;
  //     }

  //     j === boardSize && this.board[i].unshift(Gobang.alphabet[i]), i++, j = -1;
  //   }

  //   Gobang.numbers.length = boardSize + 2;
  //   this.board.unshift(Gobang.numbers);
  //   bot.sendGroupMsg(this.group_id, this.board.join('\n'))
  // }

  // // 悔棋
  // rollback(user_id) {
  //   // 既不是黑棋手也不是白棋手则指指点点
  //   if (user_id !== this.white && user_id !== this.black) return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 你以后下象棋必被人指指点点！<( ￣^￣)(θ(θ☆( >_<`);

  //   const [x, y] = this.history[this.history.length - 1];

  //   this.board[x][y] = '┼';
  //   bot.sendGroupMsg(this.group_id, this.board.join('\n'));
  // }

  // // 落子
  // move() {

  //   // 白棋未录入棋手则判断记录
  //   if (!this.white && this.black !== user_id) {
  //     this.white = user_id;
  //     bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 加入当前对局`);
  //   }

  //   // 既不是黑棋手也不是白棋手则指指点点
  //   if (user_id !== this.white && user_id !== this.black) return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 你以后下象棋必被人指指点点！<( ￣^￣)(θ(θ☆( >_<`);

  //   // 坐标越界
  //   if (!this.board[x][y]) return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 越界了，亲 (╯▔皿▔)╯`);

  //   // const pieces = new Set(['●', '○']);
  //   if (this.board[x][y] === '●' || this.board[x][y] === '○') return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 当前位置已经有棋子啦，换个位置下吧`);

  //   const state = user_id === this.black ? 'black' : 'white';
  //   if (this.state !== state) {
  //     return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${user_id}] 还没到你的回合呢，你急啥 (lll￢ω￢)`);
  //   }

  //   this.board[x][y] = state === 'black' ? '●' : '○';

  //   // 换手
  //   this.state = this.black === 'white' ? 'black' : 'white';

  //   // 历史记录
  //   this.history.push([x, y]);

  //   // 邻子数
  //   this.chessman.push([x, y]);

  //   // 落子后发送新的棋盘数据
  //   bot.sendGroupMsg(this.group_id, this.board.join('\n'));

  //   // 循环遍历五子棋数组规则
  //   for (const [last, next] of Gobang.delta) {
  //     let newX, newY = null;

  //     for (let i = 1, j = true; i < 5; i++) {
  //       // 初次循环 j = true 即落子后，则返回棋子左侧坐标
  //       newX = x + (j ? last[0] : next[0]) * i;
  //       newY = y + (j ? last[1] : next[1]) * i;

  //       // 邻处有相同棋子则继续遍历
  //       if (this.board[newX][newY] === this.board[x][y]) {
  //         this.chessman.push([newX, newY]);

  //         if (this.chessman.length < 5) continue;
  //         else {
  //           allBattle.delete(this.group_id);
  //           bot.sendGroupMsg(this.group_id, `check mate！恭喜 [CQ:at,qq=${user_id}] 获得本轮胜利~ ヾ(≧▽≦*)o`);
  //           return;
  //         }
  //       } else {
  //         // 左侧没相同棋子则返回右侧坐标 j = false
  //         if (j) {
  //           j = !j, i = 0;
  //         } else {
  //           j = !j;
  //           this.chessman.length = 1;
  //           break;
  //         }
  //       }
  //     }
  //   }
  // }
}

module.exports = Gobang