const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(`${__yumemi}/data/db/yumemi.db`);

const get = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get(sql, params, (err, row) => {
        !err ? resolve(row ? row : null) : reject(err);
      });
    });
  })
}

const all = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(sql, params, (err, rows) => {
        !err ? resolve(rows) : reject(err);
      });
    });
  })
}

const run = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(sql, params, err => {
        !err ? resolve('ok') : reject(err);
      });
    });
  })
}

module.exports = { get, all, run }