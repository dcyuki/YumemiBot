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
  let boardSize = null;
  let [boardLeft, boardRight] = [null, null];
  const board = [];
  const alphabet = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ';
  const numbers = ['　', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];

  const start = (size = 10) => {
    if (allboard[messageData.group_id] !== undefined) {
      bot.sendGroupMsg(messageData.group_id, `当前群聊对局尚未结束，请勿重复开启`);
    } else {
      boardSize = size;
      for (let [i, j] = [0, 0]; i < boardSize; j++) {
        if (j === 0) board[i] = [], j += 3;
        switch (i) {
          case 0:
            board[i].push('┬');
            boardLeft = '┌';
            boardRight = '┐';
            break;
          case boardSize - 1:
            board[i].push('┴');
            boardLeft = '└';
            boardRight = '┘';
            break;
          default:
            board[i].push('┼');
            boardLeft = '├';
            boardRight = '┤';
            break;
        }

        if (j === boardSize) board[i].push(boardRight), board[i].unshift(boardLeft), board[i].unshift(alphabet[i]), i++, j = -1;
      }

      numbers.length = boardSize + 1;
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
    if (allboard[messageData.group_id] === undefined) {
      bot.sendGroupMsg(messageData.group_id, `当前群聊未开启对局`);
      return;
    }
    if (allboard[messageData.group_id].white === null && messageData.user_id !== allboard[messageData.group_id].black) {
      allboard[messageData.group_id].white = messageData.user_id;
      bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] 加入当前对局`);
    }
    // const position = [];
    let reg = /[a-zA-Z]/g;
    const x = messageData.raw_message.match(reg).join().toUpperCase().charCodeAt() - 64;
    reg = /[0-9]/g;
    const y = parseInt(messageData.raw_message.match(reg).join(''));

    if (allboard[messageData.group_id].state === 'black' && messageData.user_id === allboard[messageData.group_id].black) {
      if ( allboard[messageData.group_id].board[x][y] === '●' || allboard[messageData.group_id].board[x][y] === '○') {
        bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] 当前位置已经有棋子啦，换个位置下吧`);
        return;
      }
      allboard[messageData.group_id].state = 'white';
      allboard[messageData.group_id].board[x][y] = '●';
    } else if (allboard[messageData.group_id].state === 'white' && messageData.user_id === allboard[messageData.group_id].white) {
      if ( allboard[messageData.group_id].board[x][y] === '●' || allboard[messageData.group_id].board[x][y] === '○') {
        bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] 当前位置已经有棋子啦，换个位置下吧`);
        return;
      }
      allboard[messageData.group_id].state = 'black';
      allboard[messageData.group_id].board[x][y] = '○';
    } else if (messageData.user_id === allboard[messageData.group_id].black || messageData.user_id === allboard[messageData.group_id].white) {
      bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] 还没到你的回合呢，你急啥`);
      return;
    } else {
      bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] 你以后下象棋必被人指指点点！`);
      return;
    }
    // allboard[messageData.group_id].board[x][y] = messageData.user_id === allboard[messageData.group_id].black ?
    //   '●' :
    //   (
    //     messageData.user_id === allboard[messageData.group_id].white ?
    //       '○' :
    //       bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] 你以后下象棋必被人指指点点！`)
    //   );
    // const [x, y] = position;
    for (const [left, right] of delta) {
      let newX, newY, rightX, rightY = null;
      for (let [i, j] = [1, 1]; i < 5; i++) {
        if (j === 1) {
          newX = x + left[0] * i;
          newY = y + left[1] * i;
        } else {
          newX = rightX + right[0] * i;
          newY = rightY + right[1] * i;
        }
        // newX = x + (j === 1 ? left[0] : right[0]) * i;
        // newY = y + (j === 1 ? left[1] : right[1]) * i;
        console.log(`i: ${i}`);
        if (i === 4 && allboard[messageData.group_id].board[newX][newY] === allboard[messageData.group_id].board[x][y]) {
          bot.sendGroupMsg(messageData.group_id, allboard[messageData.group_id].board.join('\n'));
          bot.sendGroupMsg(messageData.group_id, `check mate！恭喜 [CQ:at,qq=${messageData.user_id}] 获得本轮胜利~`);
          delete allboard[messageData.group_id];
          return;
        }
        console.log(newX, newY)
        // 判断是否有邻子
        if (allboard[messageData.group_id].board[newX][newY] !== allboard[messageData.group_id].board[x][y]) {
          // 判断是否越界
          if (newX < 1 || newY < 1 || newX > boardSize || newY > boardSize) {
            console.log('越界');
          } else {
            console.log(`${j === 1 ? '左侧' : '右侧'} 没邻子`);
          }
          rightX = x + left[0] * (i - 1);
          rightY = y + left[1] * (i - 1);
          if (j === 1) { j++; i = 0; } else { j--; break; }
        }
      }
    }

    bot.sendGroupMsg(messageData.group_id, allboard[messageData.group_id].board.join('\n'));
  }

  const over = () => {
    delete allboard[messageData.group_id];
    bot.sendGroupMsg(messageData.group_id, `已结束当前对局`);
  }
  eval(`${option}()`);
}