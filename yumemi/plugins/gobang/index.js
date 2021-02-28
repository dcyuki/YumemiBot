const board = [];
const piece = ['●', '○'];
const alphabet = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ';
const numbers = ['　', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
const delta = [
  // 横向
  [[0, -1], [0, 1]],
  // 纵向
  [[-1, 0], [1, 0]],
  // 左斜
  [[-1, -1], [1, 1]],
  // 右斜
  [[-1, 1], [1, -1]],
];
const allboard = {};

module.exports = (messageData, option) => {
  const start = (size = 8) => {
    if (allboard[messageData.group_id] !== undefined) bot.sendGroupMsg(messageData.group_id, `当前群聊对局尚未结束，请勿重复开启`);
    else {
      boardSize = size;

      for (let [i, j] = [0, 0]; i <= boardSize; j++) {
        if (j === 0) board[i] = [];
        switch (i) {
          case 0:
            board[i].push(j === 0 ? '┌' : (j === boardSize ? '┐' : '┬'));
            break;
          case boardSize:
            board[i].push(j === 0 ? '└' : (j === boardSize ? '┘' : '┴'));
            break;

          default:
            board[i].push(j === 0 ? '├' : (j === boardSize ? '┤' : '┼'));
            break;
        }

        if (j === boardSize) board[i].unshift(alphabet[i]), i++, j = -1;
      }

      numbers.length = boardSize + 2;
      board.unshift(numbers);

      allboard[messageData.group_id] = {
        board: board,
        black: messageData.user_id,
        white: null,
        state: 'black',
      };

      bot.sendGroupMsg(messageData.group_id, `${allboard[messageData.group_id].board.join('\n')}\n暂时还没有做悔棋功能（笑`);
    }
  }

  const moves = () => {
    let reg = {
      x: /[a-zA-Z]/g,
      y: /[0-9]/g,
    };
    const x = messageData.raw_message.match(reg.x).join().toUpperCase().charCodeAt() - 64;
    const y = parseInt(messageData.raw_message.match(reg.y).join(''));
    const chessman = [[x, y]];

    if (allboard[messageData.group_id] === undefined) return bot.sendGroupMsg(messageData.group_id, `当前群聊未开启对局`);

    if (allboard[messageData.group_id].white === null && allboard[messageData.group_id].black !== messageData.user_id) {
      allboard[messageData.group_id].white = messageData.user_id;
      bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] 加入当前对局`);
    }

    if (messageData.user_id === allboard[messageData.group_id].white || messageData.user_id === allboard[messageData.group_id].black) {
      if (allboard[messageData.group_id].board[x][y] === undefined) return bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] 越界了，亲 (╯▔皿▔)╯`);
      if (allboard[messageData.group_id].board[x][y] === piece[0] || allboard[messageData.group_id].board[x][y] === piece[1]) return bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] 当前位置已经有棋子啦，换个位置下吧`);
      // allboard[messageData.group_id].state = 
      // allboard[messageData.group_id].black === messageData.user_id && allboard[messageData.group_id].state?
      // 'white'?'black'
      if (allboard[messageData.group_id].black === messageData.user_id && allboard[messageData.group_id].state === 'black') {
        allboard[messageData.group_id].state = 'white';
        allboard[messageData.group_id].board[x][y] = piece[0];
      } else if (allboard[messageData.group_id].white === messageData.user_id && allboard[messageData.group_id].state === 'white') {
        allboard[messageData.group_id].state = 'black';
        allboard[messageData.group_id].board[x][y] = piece[1];
      } else {
        bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] 还没到你的回合呢，你急啥 (lll￢ω￢)`);
        return;
      }
      bot.sendGroupMsg(messageData.group_id, allboard[messageData.group_id].board.join('\n'));
    } else {
      bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] 你以后下象棋必被人指指点点！<( ￣^￣)(θ(θ☆( >_<`);
      return;
    }

    for (const [left, right] of delta) {
      let newX, newY = null;
      for (let [i, j] = [1, 1]; i < 5; i++) {
        if (chessman.length === 5) {
          bot.sendGroupMsg(messageData.group_id, `check mate！恭喜 [CQ:at,qq=${messageData.user_id}] 获得本轮胜利~ ヾ(≧▽≦*)o`);
          delete allboard[messageData.group_id];
          return;
        }

        newX = x + (j === 1 ? left[0] : right[0]) * i;
        newY = y + (j === 1 ? left[1] : right[1]) * i;

        if (board[newX][newY] === board[x][y]) {
          chessman.push([newX, newY]);
        } else {
          if (j === 1) {
            j++, i = 0;
          } else {
            j--;
            chessman.length = 1;
            break;
          }
        }
      }
    }
  }
  const over = () => {
    delete allboard[messageData.group_id];
    bot.sendGroupMsg(messageData.group_id, `已中止当前对局`);
  }
  eval(`${option}()`);
}