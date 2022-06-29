import { version } from "./components/Changelog.js";
import { roles_Strategy2 } from "./apps/roles_Strategy2.js";
import { roles_Strategy3 } from "./apps/roles_Strategy3.js";
import { versionInfo } from "./apps/help.js";
import {
  qinglibenbi,
  qinglibenbi2
} from "./apps/qinglibenbi.js";
import { decrease } from "./apps/Delete-Cookie.js";
import {
  ercyFUN,
  chengfenFUN,
  daanFUN,
  qiuqianFUN,
  kantouxiangFUN,
  shenzhiyanFUN,
  cangtouFUN
} from "./apps/amusement.js";
import {
  dragonKing,
  saoma,
  denglu
} from "./apps/Dragon-King.js";
import {
  driftBottle,
  sendBottle
} from "./apps/Drift-bottle.js";
import { BDbaike } from "./apps/encyclopedia.js";
import { kanpian } from "./apps/Film.js";
import { qrcode } from "./apps/QR-code.js";
import {
  HpicMarker,
  Hpicmark
} from "./apps/SeTu-Grade.js";
import { HpicListener } from "./apps/SeTu-Listening.js";
import {
  beian,
  beianren,
  ping
} from "./apps/site.js";
import { chehui } from "./apps/withdraw.js";


export {
  roles_Strategy2,
  roles_Strategy3,
  versionInfo,
  chehui,
  qinglibenbi,
  qinglibenbi2,
  decrease,
  HpicMarker,
  Hpicmark,
  HpicListener,
  ercyFUN,
  chengfenFUN,
  daanFUN,
  qiuqianFUN,
  kantouxiangFUN,
  shenzhiyanFUN,
  cangtouFUN,
  dragonKing,
  saoma,
  denglu,
  driftBottle,
  sendBottle,
  BDbaike,
  kanpian,
  qrcode,
  beian,
  beianren,
  ping
};


let rule = {
  roles_Strategy2: {
    reg: "^#*[^-~]+攻略2+$",
    describe: "【#角色攻略2】获取第二份已有角色攻略概览",
  },
  roles_Strategy3: {
    reg: "^#*[^-~]+攻略3+$",
    describe: "【#角色攻略2】获取第三份已有角色攻略概览",
  },
  versionInfo: {
    reg: "^#?伊伊版本$",
    describe: "伊伊版本",
  },
  chehui: {
  // 1.主人：看到任意想要撤回的消息，对其回复“撤回”二字，即可撤回该条消息（若机器人不是管理员，则只能撤回机器人两分钟内的消息）
  // 2.群员：若机器人发了不当消息，群员可以对该消息回复“撤回”，即可让机器人撤回该条消息。群员仅能撤回机器人发出的消息
  // ※群员撤回机器人消息的权限，可前往/Yunzai-Bot/plugins/yiyi-plugin/apps/withdraw.js里面，把第24行关闭
  // PS:好像有点问题，放yiyi-plugin里面没法撤回文字，还是本来就不能，我不太清楚（被AI.js拦截了）啧
    reg: "^撤回$",
    describe: "【撤回】对目标消息回复撤回即可撤回该条消息",
  },
  qinglibenbi: {
    reg: "^#?清理笨比(.*)$",
    describe: "【清理1个月没叭叭的笨比】",
  },
  qinglibenbi2: {
    reg: "^#?清理(2个月没叭叭的笨比|笨比2)(.*)$",
    describe: "【清理2个月没叭叭的笨比】",
  },
  decrease: {
  // 打开/Yunzai-Bot/lib/app/dailyNote.js
  // 搜索let cookieContext = {}; //添加cookie上下文
  // 在前面 加上export 加一个空格
  // 更新的时候记得把export删了  不然会冲突
    reg: "^###退群清CK###$",//无须触发
    describe: "退群自动清CK",
  },
  HpicMarker: {
  // 先在Yunzai-Bot目录下执行： cnpm install baidu-aip-sdk 或者： npm install baidu-aip-sdk
  // 然后去/Yunzai-Bot/plugins/yiyi-plugin/apps/SeTu-Grade.js里面查看详细配置教程
    reg: "^#?有多(涩|色)|这个(涩|色)吗|这(个|张|图|张图|个图)(涩|色)不(涩|色)|(涩|色)不(涩|色)$",
    describe: "",
  },
  //咱不知道下面这个是干嘛的，我只会CV
  Hpicmark: {
    reg: "",
    describe: "",
  },
  HpicListener: {
  // CV接着CV,这个与上面一样，在Yunzai-Bot目录下执行： cnpm install baidu-aip-sdk 或者： npm install baidu-aip-sdk
  // 然后去/Yunzai-Bot/plugins/yiyi-plugin/apps/SeTu-Listening.js里面查看详细配置教程
    reg: "",
    describe: "",
  },
  dragonKing: {
  // 食用方法：第一次食用，请先发送#扫码， 扫码登录QQ群应用后，回到机器人发送#获取key.
    reg: "^#?谁是龙王$",
    describe: "【#谁是龙王】查询本群龙王",
  },
  //下面这俩个与龙王是一体的
  saoma: {
    reg: "^#扫码$",
    describe: "",
  },
  denglu: {
    reg: "^#获取key$",
    describe: "",
  },
  qrcode: {
  // 使用方法：
  // 文字转二维码：#二维码我爱你
  // 图片转二维码：#二维码【附图片】 
    reg: "^#二维码(.*)$",
    describe: "【#二维码】图、文生成二维码",
  },
  ercyFUN: {
    reg: "^#?二次元的我$",
    describe: "【#二次元的我】查看我的二次元属性",
  },
  chengfenFUN: {
    reg: "^#?我的成分$",
    describe: "【#我的成分】查看你是由什么组成的",
  },
  daanFUN: {
    reg: "^#?答案之书(.*)$",
    describe: "【#答案之书】会告诉你答案",
  },
  qiuqianFUN: {
    reg: "^#?观音灵签$",
    describe: "【#观音灵签】看看今天的运势",
  },
  kantouxiangFUN: {
    reg: "^#?看头像(.*)$",
    describe: "【头像@xxx】看看头像大图",
  },
  shenzhiyanFUN: {
  //会被AI.js拦截，无法艾特Bot，啧
    reg: "^#?神之眼(.*)$",
    describe: "【神之眼@xxx】看看ta的神之眼",
  },
  cangtouFUN: {
    reg: "^#?藏(头|尾)诗(.*)$",
    describe: "【藏头诗九章是男同】生成藏头诗",
  },
    driftBottle: {
    reg: "^#?(漂流瓶|捞漂流瓶|捡漂流瓶)$",
    describe: "【#漂流瓶】捡一个漂流瓶",
  },
  sendBottle: {
    reg: "^#?扔漂流瓶(.*)$",
    describe: "【#扔漂流瓶】扔一个漂流瓶",
  },
  BDbaike: {
    reg: "^#?百科(.*)$",
    describe: "【#百科】搜百度百科",
  },
  kanpian: {
    reg: "^#?影视(.*)$",
    describe: "#影视+片名",
  },
  beian: {
    reg: "^#?查备案(.*)$",
    describe: "【#查备案】后面接网址",
  },
  beianren: {
    reg: "^#?备案人(.*)$",
    describe: "【#备案人】后面接人名",
  },
  ping: {
    reg: "^#?ping(.*)$",
    describe: "【#ping】后面接网址",
  },
};

export { rule };

console.log(`伊伊插件${version}初始化~`);

setTimeout(async function () {
  let msgStr = await redis.get("yiyi:restart-msg");
  if (msgStr) {
    let msg = JSON.parse(msgStr);
    await common.relpyPrivate(msg.qq, msg.msg);
    await redis.del("yiyi:restart-msg");
    let msgs = [`当前伊伊版本: ${version}`, `您可使用 #伊伊版本 命令查看更新信息`];
    await common.relpyPrivate(msg.qq, msgs.join("\n"));
  }
}, 1000);