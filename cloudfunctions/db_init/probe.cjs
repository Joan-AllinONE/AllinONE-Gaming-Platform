/**
 * 检查 CloudBase node-sdk API 并尝试设置安全规则
 */
const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({
  env: 'allinonegaming-d4gmsmrzz573264f6',
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY,
});

const RULES = {
  users:              { read: "auth.uid == doc._openid",              write: "auth.uid == doc._openid" },
  transactions:       { read: "auth.uid == doc.userId",               write: false },
  voucher_templates:  { read: true,                                   write: "auth.uid != null" },
  vouchers:           { read: "auth.uid == doc.holderId",             write: false },
  purchases:          { read: "auth.uid == doc.userId",               write: false },
  proposals:          { read: true,                                   write: "auth.uid != null" },
  inventories:        { read: "auth.uid == doc.userId",               write: false },
  game_connectors:    { read: true,                                   write: "auth.uid != null" },
};

async function main() {
  // 列出 app 的可调用方法
  var appMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(app))
    .filter(function(k) { return typeof app[k] === 'function' && k !== 'constructor'; });
  console.log('=== app 方法 ===');
  console.log(appMethods.join(', '));
  console.log('');

  // 检查是否有 admin / auth / 权限相关
  var admin = app.admin ? app.admin() : null;
  if (!admin) {
    console.log('app.admin() 不可用');
  } else {
    var adminMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(admin))
      .filter(function(k) { return typeof admin[k] === 'function'; });
    console.log('=== admin 方法 ===');
    console.log(adminMethods.join(', '));
  }

  // 列出 db API
  var db = app.database();
  var dbMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(db))
    .filter(function(k) { return typeof db[k] === 'function'; });
  console.log('\n=== database 方法 ===');
  console.log(dbMethods.join(', '));

  // 尝试设置安全规则
  console.log('\n=== 尝试设置安全规则 ===');
  for (var col in RULES) {
    try {
      var rule = JSON.stringify(RULES[col]);
      // 尝试通过 RESTful API
      var result = await app.callFunction({
        name: 'db_setRule',
        data: { collection: col, rule: rule }
      });
      console.log(col + ': 云函数方式 - ' + JSON.stringify(result));
    } catch (e1) {
      // 尝试直接 HTTP 请求
      try {
        var httpResult = await app.httpRequest({
          url: 'https://tcb-api.tencentcloudapi.com/admin?env=' + process.env.TCB_ENV_ID,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: { action: 'setRule', collection: col, rule: rule }
        });
        console.log(col + ': HTTP方式 - ' + JSON.stringify(httpResult));
      } catch (e2) {
        console.log(col + ': 不支持程序化设置 - 需手动操作');
        break;
      }
    }
  }
}

main().catch(function(e) { console.error(e.message); });
