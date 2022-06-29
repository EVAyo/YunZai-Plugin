import { segment } from "oicq";
import fetch from "node-fetch";

// By：渔火[1761869682]

// 使用方法：
// #影视 片名

const _path = process.cwd();

let siliao = true  //是否允许私聊使用，设为false则禁止私聊（主任除外）

export const rule = {
  kanpian: {
    reg: "^#?影视(.*)$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "#影视+片名", //【命令】功能说明
  },
};

export async function kanpian(e) {
  if (!siliao)
    if (e.isPrivate&&!e.isMaster) {
      return true;
    }
  let msg = e.msg;
  msg = msg.replace(/#|影视/g, "").trim();
  if (!msg) return;

  let url = `https://mika.ovooa.com/api/video/%E5%85%A8%E7%BD%91%E5%BD%B1%E8%A7%86.php?msg=${msg}`;
  // console.log(url);

  let response = await fetch(url);
  let res = await response.json();

  if (res.code == 404) {
    e.reply(["人家找不到“" + msg + "”哦", segment.face(106)]);
    return true;
  }
  if (res.code != 200) {
    e.reply("未知错误~");
    return true;
  }

  let title = res.list[0].title;//标题
  let category = res.list[0].category;//类型
  let update = res.list[0].update;//更新至
  let date = res.list[0].date;//更新时间

  response = await fetch(res.list[0].vod_list);
  res = await response.json();

  if (res.code != 200) {
    e.reply("未知错误~");
    return true;
  }

  // console.log(res);
  let cover = res.vod_img;//封面
  let drama = res.vod_drama;//简介
  let tag = res.vod_class;//标签
  let show = res.vod_show;//上映时间
  let play = res.vod_play;//观看地址

  let tip = "";
  if (category != "动漫") {
    tip = "\n如果播放不了请尝试换源";
  }

  msg = [
    segment.text(title),
    segment.image(cover),
    "类型：",
    segment.text(category),
    "\n标签：",
    segment.text(tag),
    "\n上映时间：",
    segment.text(show),
    "\n更新至：",
    segment.text(update),
    "\n更新时间：",
    segment.text(date),
    "\n简介：",
    segment.text(drama),
    "\n[观看地址]：",
    segment.text(play),
    segment.text(tip),

  ];

  e.reply(msg);
  return true;//返回true 阻挡消息不再往下
}

