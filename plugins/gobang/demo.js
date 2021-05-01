class Gobang{
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

    bot.sendGroupMsg(this.group_id, battle.board.join('\n'))
  }
}