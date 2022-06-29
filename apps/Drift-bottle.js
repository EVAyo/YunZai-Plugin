import { segment } from "oicq";
import fetch from "node-fetch";

// By：渔火[1761869682]
// 使用方法：
// #漂流瓶
// #扔漂流瓶 要写进漂流瓶的内容
// 插件使用中如果遇到问题请@渔火[1761869682]反馈~

//项目路径
const _path = process.cwd();
//===============================下面设置捞瓶子CD=================================
let laoCD = false; // 改为true则捞瓶子有CD  改完请重启
let rengCD = false; // 改为true则扔瓶子有CD  改完请重启
let time = 5; //捞漂流瓶CD,单位是分钟，不建议写0会出现未知冗余
let rengtime = 5; //扔漂流瓶CD,单位是分钟，不建议写0会出现未知冗余



//1.定义命令规则
export const rule = {
  driftBottle: {
    reg: "^#?(漂流瓶|捞漂流瓶|捡漂流瓶)$", //匹配消息正则，命令正则
    // reg: "^#(|捞)漂流瓶$", //匹配消息正则，命令正则     有没有人告诉我这样简写正则对不对TT
    priority: 5000, //优先级，越小优先度越高
    describe: "【#漂流瓶】捡一个漂流瓶", //【命令】功能说明
  },
  sendBottle: {
    reg: "^#?扔漂流瓶(.*)$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "【#扔漂流瓶】扔一个漂流瓶", //【命令】功能说明
  },
};

//捞漂流瓶=======================================================================================
export async function driftBottle(e) {

  let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_remarkplp`); //先获取这个笨比 看看有没有去进程在线
  if (data) {
    console.log(data)
    data = JSON.parse(data)
    if (laoCD) {
      if (data.num != 0) {
        e.reply([segment.at(e.user_id), "捞瓶子有" + time + "分钟CD哦~"]);
        return true;
    }
    }
  }

  
  //从api请求一个漂流瓶
  let url = `http://ovooa.com/API/Piao/api.php?Select=0`;
  let response = await fetch(url);
  let res = await response.json();

  if (res.code == -1) {
    e.reply("参数错误！");
    return true
  }

  // 发送漂流瓶中的消息
  let msg = [
    segment.at(e.user_id),
    "\n",
    "标题：",
    segment.text(res.data[0].title),
    "\n",
    "内容：",
    segment.text(res.data[0].text),
    "\n",
    "发送时间：",
    segment.text(res.data[0].time),
  ];

  redis.set(`Yunzai:setlinshimsg:${e.user_id}_remarkplp`, `{"num":1,"boolCD":${laoCD}}`, { //写入缓存值
		EX: parseInt(60 * time)
	});

  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}



//扔漂流瓶==========================================================================================
export async function sendBottle(e) {

  let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_remarkReng`); //先获取这个逼 看看有没有去进程在线
  if (data) {
    console.log(data)
    data = JSON.parse(data)
    if (rengCD) {
      if (data.num != 0) {
        e.reply([segment.at(e.user_id), "扔瓶子有" + rengtime + "分钟CD哦~"]);
        return true;
    }
    }
  }

  let msg = e.msg;

  if (e.img) {
    e.reply("仅支持把文字装入漂流瓶哦");
    return true;
  }

  //替换掉#和命令，仅保留要扔的内容
  msg = msg.replace(/#|扔漂流瓶/g, "").trim();

  //构造一个漂流瓶
  let url = `http://ovooa.com/API/Piao/api.php?Select=1&title=么得标题~&msg=${(msg)}&QQ=${(e.user_id)}`;
  // console.log(url);

  //扔漂流瓶，获取返回结果
  let response = await fetch(url);
  let res = await response.json();

  // console.log(res.code);

  // 处理错误码：
  // -2:空内容
  if (res.code == -2) {
    e.reply("漂流瓶内容不能为空哦！");
    return true
  }
  // -6：违禁词
  if (res.code == -6) {
    e.reply("漂流瓶内容包含了违禁词哦！");
    return true
  }
  // -7：重复内容
  if (res.code < 1 && res.code != -7) {
    e.reply("哎呀，漂流瓶被海鸥吃掉了！");
    return true
  }

  // 替换提示文本
  res.text = res.text.replace("请不要发重复内容", "请不要扔重复内容的漂流瓶哦~").trim();

  msg = [
    //@用户
    segment.at(e.user_id),
    //扔漂流瓶的反馈
    segment.text(res.text)
  ];
  e.reply(msg);
  

  redis.set(`Yunzai:setlinshimsg:${e.user_id}_remarkReng`, `{"num":1,"boolCD":${rengCD}}`, { //写入缓存值
		EX: parseInt(60 * rengtime)
	});

  return true; //返回true 阻挡消息不再往下
}