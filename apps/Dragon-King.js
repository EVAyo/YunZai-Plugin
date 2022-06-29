import { segment } from "oicq";
import fetch from "node-fetch";

// By：渔火[1761869682]

// 食用方法：第一次食用，请先发送#扫码， 扫码登录QQ群应用后，回到机器人发送#获取key.
// 后续：在群里发送#谁是龙王，即可查看该群吹逼王
// 有问题找@渔火[1761869682]

// //项目路径
const _path = process.cwd();

//简单应用示例

//1.定义命令规则
export const rule = {
  dragonKing: {
    // reg: "^#*(谁|哪个吊毛|哪个屌毛|哪个叼毛)是(龙王|群龙王)(|？|?)$", //这个正则似乎写的不对.......有没有大佬愿意指正下(*^_^*)
    reg: "^#?谁是龙王$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "【#谁是龙王】查询本群龙王", //【命令】功能说明
  },
  saoma: {
    reg: "^#扫码$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "", //【命令】功能说明
  },
  denglu: {
    reg: "^#获取key$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "", //【命令】功能说明
  },

};

// 谁是龙王============================================================================================
export async function dragonKing(e) {
  //e.msg 用户的命令消息
  let data = await redis.get(`Yunzai:setlinshimsg:longwang:skey`);
  if(!data){
    e.reply("请先私聊人家发送#扫码，以获取key");
    return true;
  }
  // console.log("log2",data);
  data = JSON.parse(data);

  //查询龙王
  let url = `https://ovooa.com/API/Dragon/api?QQ=${(data.QQ)}&Skey=${(data.Skey)}&pskey=${(data.pskey)}&Group=${(e.group_id)}`; 
  console.log(url);

  let response = await fetch(url); //调用接口获取数据
  let res = await response.json(); //结果json字符串转对象
  console.log(res);
  if(res.code==-6){
    e.reply("key已过期，请发送#扫码，重新获取");
    return true;
  }
  let msg = [
    "本群龙王：",
    segment.text(res.data.Nick),
    segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${res.data.Uin}`),
    "蝉联天数：",
    segment.text(res.data.Day),"天",
  ];
  
  //发送消息
  e.reply(msg);
  
  return true; //返回true 阻挡消息不再往下
}



// 先请求二维码并保存qrsig==================================================
export async function saoma(e) {
  let url = `https://ovooa.com/API/Skey/api.php?type=qun.qq.com`; 
  let response = await fetch(url); //调用接口获取数据
  let res = await response.json(); //结果json字符串转对象
  console.log("log1:",res.data.qrsig);
  redis.set(`Yunzai:setlinshimsg:longwang:qrsig`, `{"qrsig":"${res.data.qrsig}"}`, { //写入qrsig
    EX: parseInt(999999999)
  });
  
  
  // // ==================
  // let data = await redis.get(`Yunzai:setlinshimsg:longwang:qrsig`);
  // console.log("log2",data);
  // data = JSON.parse(data);
  // // eval('(' + data + ')');
  // console.log("log3:",data);
  // console.log("log4:",data.qrsig);
  // // ====================
  
  
  let msg = [
    "请扫码后点击允许登录：",
    segment.image(res.data.url),
    "登录后，\n【向机器人发送#获取key】",
    ];
  
  //发送消息
  e.reply(msg);
  
  return true; //返回true 阻挡消息不再往下
}

// 登录qun.qq.com后，获取skey和pskey=========================================
export async function denglu(e) {
  
  let data = await redis.get(`Yunzai:setlinshimsg:longwang:qrsig`);
  console.log(data);
  data = JSON.parse(data);
  console.log(data);
  let url = `https://ovooa.com/API/Skey/api.php?type=qun.qq.com&qrsig=${data.qrsig}`;
  console.log(url);
  let response = await fetch(url); //调用接口获取数据
  let res = await response.json(); //结果json字符串转对象
  console.log(res);

  redis.set(`Yunzai:setlinshimsg:longwang:skey`, `{"QQ":"${res.data.uin}","Skey":"${res.data.skey}","pskey":"${res.data.p_skey}"}`, { //写入skey
    EX: parseInt(999999999)
  });
// ================================
  // data = await redis.get(`Yunzai:setlinshimsg:longwang:skey`);
  // console.log("log2",data);
  // data = JSON.parse(data);
  // // eval('(' + data + ')');
  // console.log("log3:",data);
  // console.log("log4:",data.QQ);
  // console.log("log5:",data.Skey);
// ========================================
  e.reply("Skey获取成功，您可以在群里使用#谁是龙王，来查看该群龙王了",);
  
  return true; //返回true 阻挡消息不再往下
}
