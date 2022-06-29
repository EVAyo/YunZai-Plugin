import { segment } from "oicq";
import fetch from "node-fetch";

// By：渔火[1761869682]

// 使用方法：
// ·文字转二维码：#二维码渔火今天翻车了吗         //文字二维码现在QQ扫不出来了，用微信或者其他扫码工具可以扫出来
// ·图片转二维码：#二维码【附图片】           //有概率二维码加载不出来，再来一次就好了


//在第【43】行和第【46】行可以自定义文字二维码的相关功能的开启关闭
//在第【62】行和第【67】【68】行可以自定义图片转二维码的有关功能开关


//项目路径
const _path = process.cwd();

//1.定义命令规则
export const rule = {
  qrcode: {
    reg: "^#二维码(.*)$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "【#二维码】文字生成二维码", //【命令】功能说明
  },
};


//文字转二维码
export async function qrcode(e) {
  let msg = e.msg;
  if (e.img) {
    return imgQRcode(e);   //如果是图片，转到下面的imgQRcode图片转二维码
  }
  msg = msg.replace(/#|二维码/g, "").trim();
  if (!msg) return;

  let url = `http://ovooa.com/API/qrcode/api.php?text=${encodeURI(msg)}&size=100px`;

  let text = msg;
  msg = [
    //@用户
    segment.at(e.user_id),  //文字转二维码如果不想要艾特可以把这行注释掉
    //二维码
    segment.image(url),
    text    //text是发送文字二维码包含的的文字内容，如果不想要二维码后附带文字，可以把这里的text注释掉
  ];

  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}



//图片转二维码
export async function imgQRcode(e) {
  let url = "https://api.pwmqr.com/qrcode/create/?url=" + e.img;
  let text = e.img;
  let msg = [
    //@用户
    segment.at(e.user_id),    //图片转二维码如果不想要艾特可以把这行注释掉
    //图片二维码
    segment.image(url),
  ];

  e.reply(msg);     //发送图片的二维码，如果不想要二维码，只想要链接，可以把这行注释掉
  e.reply(e.img);   //发送图片的链接，如果不想要机器人把图片的链接发出来，可以把这行注释掉

  return true;//返回true 阻挡消息不再往下
}

