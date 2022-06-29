import { segment } from "oicq";
import fetch from "node-fetch";

// By：渔火[1761869682]

// 使用方法：
// #查备案 baidu.com
// #备案人雷军
// #ping baidu.com

//项目路径
const _path = process.cwd();

//1.定义命令规则
export const rule = {
  beian: {
    reg: "^#?查备案(.*)$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "【#查备案】后面接网址", //【命令】功能说明
  },
  beianren: {
    reg: "^#?备案人(.*)$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "【#备案人】后面接人名", //【命令】功能说明
  },
  ping: {
    reg: "^#?ping(.*)$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "【#ping】后面接网址", //【命令】功能说明
  },
};

//查备案=======================================================================================
export async function beian(e) {

  let msg = e.msg;
  //替换掉#和命令，仅保留网站
  msg = msg.replace(/#|查备案/g, "").trim();

  //构造一个查询请求
  let url = `https://api.vvhan.com/api/icp?url=${(msg)}`;
  console.log("请求的内容：", url);

  //调用接口，获取返回结果
  try {
    let response = await fetch(url);
    // console.log("\n返回的response:\n", response);

    let res = await response.json();

    console.log("\n返回的json:\n", res);
    //错误提醒
    if (res.message == "此域名未备案") {
      e.reply("此域名未备案，或未在国内备案");
      return true;
    }

    if (res.message == "请输入正确的域名") {
      e.reply("请输入正确的域名");
      return true;
    }

    if (res.message == "参数输入不完整") {
      e.reply("请在#查备案后带上正确的域名");
      return true;
    }

    if (!res.success) {
      e.reply("查询失败");
      return true;
    }

    // 发送查询到的网站信息
    msg = [
      // segment.at(e.user_id),
      // "\n",
      "主办单位名称：",
      segment.text(res.info.name),
      "\n",
      "主办单位性质：",
      segment.text(res.info.nature),
      "\n",
      "网站备案、许可证号：",
      segment.text(res.info.icp),
      "\n",
      "网站名称：",
      segment.text(res.info.title),
      "\n",
      "审核时间：",
      segment.text(res.info.time),
      "\n",
      "网站首页：",
      segment.text(res.domain),
    ];

    e.reply(msg);
    return true; //返回true 阻挡消息不再往下
  } catch (error) {
    console.log(error);
    // e.reply(error, "\n\n出错了，可能访问api失败了，请联系开发者反馈");
    return beian2(e);
  }

}

//第一个api报错的话转到这个api
export async function beian2(e) {

  let msg = e.msg;
  //替换掉#和命令，仅保留网站
  msg = msg.replace(/#|查备案/g, "").trim();

  //构造一个查询请求
  let url = `https://icp.dwz.today/free/icp?domain=${(msg)}`;
  console.log("请求的内容：", url);

  //调用接口，获取返回结果
  try {
    let response = await fetch(url);
    // console.log("\n返回的response:\n", response);
    let res = await response.json();
    // console.log("\n返回的json:\n", res);

    //错误提醒
    if (res.code == 400) {
      e.reply("请在#查备案后输入正确的域名");
      return true;
    }
    if (res.code == 429) {
      e.reply("请求超额，请稍后重试");
      return true;
    }
    if (res.data.is_icp == false) {
      e.reply("此域名未备案，或未在国内备案");
      return true;
    }
    // 发送查询到的网站信息
    msg = [
      "主办单位名称：",
      segment.text(res.data.company_name),
      "\n",
      "主办单位性质：",
      segment.text(res.data.type),
      "\n",
      "网站备案、许可证号：",
      segment.text(res.data.icp),
      "\n",
      // "网站名称：",
      // segment.text(res.data.title),
      "审核时间：",
      segment.text(res.data.date),
      "\n",
      "网站首页：",
      segment.text(res.data.home_url),
    ];

    e.reply(msg);
    return true; //返回true 阻挡消息不再往下
  } catch (error) {
    console.log(error);
    e.reply(error, "\n\n出错了，可能访问api失败了，请联系开发者反馈");
    return true;
  }

}


//查备案人=====================================================================================
export async function beianren(e) {

  let msg = e.msg;
  //替换掉#和命令，仅保留网站
  msg = msg.replace(/#|备案人/g, "").trim();

  //构造一个查询请求
  let url = `https://icp.dwz.today/free/icp/name?name=${encodeURI(msg)}`;
  console.log("请求的内容：", url);

  //调用接口，获取返回结果
  try {
    let response = await fetch(url);
    // console.log("\n返回的response:\n", response);

    let res = await response.json();
    if (res.code == 500) {
      e.reply("服务器内部错误,可能没有收录该主办单位");
      return true;
    }
    if (res.code == 10003) {
      e.reply("错误码10003");
      return true;
    }
    if (res.code == 10004) {
      e.reply("主办单位名称错误");
      return true;
    }

    console.log("\n返回的json:\n", res);


    let resultmsg = [
      "主办单位名称：",
      segment.text(msg),
      "\n有如下备案网站：",
    ];
    let one = [];
    for (let i = 0; i < res.data.length; i++) {
      one = [
        "\n",
        segment.text(i + 1),
        ".",
        "网站首页：",
        segment.text(res.data[i].home_url),
        "\n",
        "主办单位性质：",
        segment.text(res.data[i].type),
        "\n",
        "网站备案、许可证号：",
        segment.text(res.data[i].icp),
        "\n",
        // "网站名称：",
        // segment.text(res.data[i].title),
        "审核时间：",
        segment.text(res.data[i].date),
      ];
      resultmsg = resultmsg.concat(one);
    }
    e.reply(resultmsg);
    // console.log(res.data[3].company_name);
    // console.log(one);
    // console.log(res.data.length);
    return true; //返回true 阻挡消息不再往下
  } catch (error) {
    console.log(error);
    e.reply(error, "\n\n出错了，可能访问api失败了，你可以联系开发者反馈");
    return true;
  }

}






//ping=======================================================================================
export async function ping(e) {

  let msg = e.msg;
  //替换掉#和命令，仅保留网站
  msg = msg.replace(/#|ping/g, "").trim();

  //告知用户等待
  e.reply(`ping ${(msg)}中......`);

  //构造一个ping请求                         
  let num = 5;    //num是ping的次数，取值范围1-10,次数越大等待的时间越长
  let url = `http://ovooa.com/API/ping/?url=${(msg)}&num=${(num)}`;
  // console.log(url);

  //调用接口，获取返回结果
  let response = await fetch(url);
  let res = await response.json();

  // 对于返回错误码，可能是http网址，尝试加上www.在尝试一次
  if (res.code == -1) {
    msg = "www." + msg;
    url = `http://ovooa.com/API/ping/?url=${(msg)}&num=${(num)}`;
    response = await fetch(url);
    res = await response.json();
    // 加上www.依然返回错误码，那应该是网址本身输错了。
    if (res.code == -1) {
      e.reply("请输入正确的网址");
      return true;
    }

  }

  // 发送ping的结果
  msg = [
    // segment.at(e.user_id),
    // "\n",
    segment.text(res.data.url),
    "\n",
    "IP:",
    segment.text(res.data.IP),
    "\n",
    "IP属地：",
    segment.text(res.data.address),
    "\n",
    "最小延迟：",
    segment.text(res.data.small), "ms",
    "\n",
    "最大延迟：",
    segment.text(res.data.max), "ms",
    "\n",
    "平均延迟：",
    segment.text(res.data.average), "ms",
    "\n",
    "发送数据包：：",
    segment.text(res.data.num), "个",
    "\n",
    "接收数据包：：",
    segment.text(res.data.receive), "个",
    "\n",
    "丢包率：",
    segment.text(res.data.abandon),
    "\n",
    "总耗时：",
    segment.text(res.data.Times), "ms"
  ];

  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}