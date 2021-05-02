class Battle {
  constructor(user_id, board) {
    this.black = user_id;
    this.white = 0;
    this._board = board;
    this.offensive = true;
    this.history = [];
  }

  get board() {
    return this._board;
  }

  set board(val) {
    // 换手
    this.offensive = !this.offensive;

    this._board = val;
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

    bot.sendGroupMsg(this.group_id, battle.board.join('\n'));

    setTimeout(() => {
      this.over('因长时间未分出胜负');
    }, 3600000);
  }

  // 落子
  move() {
    if (!Gobang.all_battle.has(this.group_id)) return bot.sendGroupMsg(this.group_id, `当前群聊未开启对局`);
    
    const battle = Gobang.all_battle.get(this.group_id);
    const { board, offensive } = battle;

    // 白棋未录入棋手则判断记录
    if (!battle.white && battle.black !== this.user_id) {
      battle.white = this.user_id;
      bot.sendGroupMsg(this.group_id, `${this.card ? this.card : this.nickname} 加入当前对局`);
    }

    let msg = null;
    const { black, white } = battle;

    switch (true) {
      case !Gobang.all_battle.has(this.group_id):
        msg = `当前群聊未开启对局`;
        break;
      case this.user_id !== white && this.user_id !== black:
        msg = `[CQ:at,qq=${this.user_id}] 你以后下象棋必被人指指点点！<( ￣^￣)(θ(θ☆( >_<)`;
        break;
      case this.user_id === black && !offensive || this.user_id === white && offensive:
        msg = `[CQ:at,qq=${this.user_id}] 还没到你的回合呢，你急啥 (lll￢ω￢)`;
        break;
    }

    if (msg) return bot.sendGroupMsg(this.group_id, msg);

    // 落子坐标
    const reg = Gobang.reg;
    const x = this.raw_message.match(reg.x).join().toUpperCase().charCodeAt() - 64;
    const y = parseInt(this.raw_message.match(reg.y).join());

    // 已有棋子
    if (Gobang.chess.has(board[x][y])) {
      bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 当前位置已经有棋子啦，换个位置下吧`);
      return;
    }
    // 坐标越界
    if (!board[x][y]) return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 越界了，亲 (╯▔皿▔)╯`);

    board[x][y] = offensive ? '●' : '○';
    battle.board = board;

    // 记录落子
    battle.history.push([x, y]);

    // 落子后发送新的棋盘数据
    bot.sendGroupMsg(this.group_id, board.join('\n'));

    // 循环遍历五子棋数组规则
    for (const [last, next] of Gobang.delta) {
      let new_x, new_y = null;

      for (let i = 1, j = true; i < 5; i++) {
        // 初次循环 j = true 即落子后，则返回棋子左侧坐标
        new_x = x + (j ? last[0] : next[0]) * i;
        new_y = y + (j ? last[1] : next[1]) * i;

        // 邻处有相同棋子则继续遍历
        if (board[new_x][new_y] === board[x][y]) {
          if (i < 4) continue;

          Gobang.all_battle.delete(this.group_id);
          bot.sendGroupMsg(this.group_id, `check mate！恭喜 [CQ:at,qq=${this.user_id}] 获得本轮胜利~ ヾ(≧▽≦*)o`);
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

  // 悔棋
  rollback() {
    if (!Gobang.all_battle.has(this.group_id)) return bot.sendGroupMsg(this.group_id, `当前群聊未开启对局`);

    const battle = Gobang.all_battle.get(this.group_id);
    const { black, white, board, history } = battle;

    // 既不是黑棋手也不是白棋手则指指点点
    if (this.user_id !== white && this.user_id !== black) {
      bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 你以后下象棋必被人指指点点！<( ￣^￣)(θ(θ☆( >_<)`);
      return;
    }

    if (battle.history.length < 1) {
      return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 当前对局没有历史记录`);
    }

    const [x, y] = history[history.length - 1];

    board = board[x][y] = '┼';
    battle.board = board;

    bot.sendGroupMsg(this.group_id, board.join('\n'));
  }

  // 结束对局
  over(msg = `${this.card ? this.card : this.nickname} 认输`) {
    if (!Gobang.all_battle.has(this.group_id)) return;

    Gobang.all_battle.delete(this.group_id);
    bot.sendGroupMsg(this.group_id, `${msg}，已中止当前五子棋对局`);
  }
}

module.exports = Gobang;