import { segment } from "oicq";
import fetch from "node-fetch";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fs from "fs";
import { promisify } from "util";
import { pipeline } from "stream";

// By：渔火[1761869682]

//！！！注意！！！先在Yunzai目录下执行： cnpm install baidu-aip-sdk    或者： npm install baidu-aip-sdk 

//==请按照   https://www.wolai.com/uL6J7wwGgftqdKywXprAy6     的教程，配置并在下面填入百度图片内容识别key。
// 注意，如果你同时也在用色图监听，请不要直接把色图监听的key拿来用，而是要创建另一个应用，因为这两个插件需要使用不同的审核策略
var APP_ID = "你的 App ID";
var API_KEY = "你的 Api Key";
var SECRET_KEY = "你的 Secret Key";

// =====下面是评分从0-100时对图片的评价,可以自行修改引号中的内容====
var dic = {
  0: "就这就这？不要小瞧色图啊混蛋！",//0-10分的评价
  1: "就这就这？不要小瞧色图啊混蛋！",//10-20分的评价
  2: "就这就这？不要小瞧色图啊混蛋！",//20-30分的评价
  3: "啧，一般",//30-40分的评价
  4: "啧，一般",//40-50分的评价
  5: "啧，一般",//50-60分的评价
  6: "我超太涩了(//// ^ ////)快撤回别让狗管理看见！",//60-70分的评价
  7: "我超太涩了(//// ^ ////)快撤回别让狗管理看见！",//70-80分的评价
  8: "我超太涩了(//// ^ ////)快撤回别让狗管理看见！",//80-90分的评价
  9: "我超太涩了(//// ^ ////)快撤回别让狗管理看见！",//90-100分的评价
}

// =======设置CD开关和CD时长===============================
let isCD = false //设为false则无CD，设为true则有CD，主人不受影响
let CD = 1        //CD时长，单位分钟，最小为1

// v 1.0
// 插件使用中如果遇到问题可@渔火反馈   渔糕就读的幼稚园：924017116


//项目路径
const _path = process.cwd();
let markUser = {};

//1.定义命令规则
export const rule = {
  HpicMarker: {
    reg: "^#?有多(涩|色)|这个(涩|色)吗|这(个|张|图|张图|个图)(涩|色)不(涩|色)|(涩|色)不(涩|色)$", //匹配消息正则，命令正则
    priority: 1000, //优先级，越小优先度越高
    describe: "", //【命令】功能说明
  },
  Hpicmark: {
    reg: "",
    priority: 1001,
    describe: "",
  },
};

export async function HpicMarker(e) {

  let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_hpicmark`);
  if (data && isCD && !e.isMaster) {
    e.reply([segment.at(e.user_id), "该命令有" + CD + "分钟CD~"]);
    return true;
  }

  if (e.hasReply) {
    // console.log(e);
    let reply;
    if (e.isGroup) {
      reply = (await e.group.getChatHistory(e.source.seq, 1)).pop()?.message;
    } else {
      reply = (await e.friend.getChatHistory(e.source.time, 1)).pop()?.message;
    }
    if (reply) {
      for (let val of reply) {
        if (val.type == "image") {
          e.img = [val.url];
          break;
        }
      }
    }
  }

  if (!e.img) {
    if (markUser[e.user_id]) {
      clearTimeout(markUser[e.user_id]);
    }

    markUser[e.user_id] = setTimeout(() => {
      if (markUser[e.user_id]) {
        delete markUser[e.user_id];
      }
    }, 60000);

    e.reply([segment.at(e.user_id), " 请发送需要打分的图片"]);
    return true;
  }

  markUser[e.user_id] = true;
  return Hpicmark(e);
  return true;
}

export async function Hpicmark(e) {

  if (!markUser[e.user_id]) return;
  if (!e.img) {
    cancel(e);
    return true;
  }

  var AipContentCensorClient = require("baidu-aip-sdk").contentCensor;
  var client = new AipContentCensorClient(APP_ID, API_KEY, SECRET_KEY);
  client.imageCensorUserDefined(e.img[0], 'url').then(function (data) {
    // console.log("【色图打分】：data:", data)
    if (data.error_code == 14) {
      // console.log("【色图打分】：IAM认证失败，请确认你的百度apikey有效并且填写正确。")
      e.reply("IAM认证失败，请确认你的百度apikey有效并且填写正确。")
      return true;
    }
    if (data.error_code == 18) {
      // console.log("【色图打分】：触发QPS限制。可能是请求频率过高，或你没有在百度云控制台开通“内容审核-图像”资源，或开通时间过短（小于15分钟）")
      e.reply("触发QPS限制。可能是请求频率过高，或你没有在百度云控制台开通“内容审核-图像”资源，或开通时间过短（小于15分钟）")
      return true;
    }

    var score = 0.0;
    if (data.conclusionType == 2 || data.conclusionType == 3) {
      var arr = new Array();
      let j = 0;
      for (let i = 0; i < data.data.length; i++)
        if (data.data[i].probability * 1 > 0.00001)
          arr[j++] = data.data[i].probability * 1;
      // console.log(arr);
      if (arr.length == 0)
        var max = 0.0
      else
        var max = arr.sort().reverse()[0];

      console.log("【涩图打分】：", max)
      score = max * 100
    } else if (data.conclusionType == 1) {
      score = 0
    } else {
      console.log("【涩图打分】：审核失败")
    }

    e.reply(["涩度：", segment.text(score.toFixed(2)), "%\n", segment.at(e.user_id), " ", segment.text(dic[parseInt(score / 10)])]);

    redis.set(`Yunzai:setlinshimsg:${e.user_id}_hpicmark`, `{"mark":1}`, { //写入缓存值
      EX: parseInt(60 * CD)
    });

    return true;
  },
    (err) => {
      console.error("error", err);
      e.reply(`error！\n${err}`);
    });

  cancel(e);
  return true; //返回true 阻挡消息不再往下
}

function cancel(e) {
  if (markUser[e.user_id]) {
    clearTimeout(markUser[e.user_id]);
    delete markUser[e.user_id];
  }
}