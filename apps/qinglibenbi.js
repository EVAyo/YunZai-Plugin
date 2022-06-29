import { segment } from "oicq";
import fetch from "node-fetch";

//By：煌[2608259582]
const _path = process.cwd();

export const rule = {
  qinglibenbi: {
    reg: "^#?清理笨比(.*)$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "【清理1个月没叭叭的笨比】", //【命令】功能说明
  },
  qinglibenbi2: {
    reg: "^#?清理(2个月没叭叭的笨比|笨比2)(.*)$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "【清理2个月没叭叭的笨比】", //【命令】功能说明
  },
};

export async function qinglibenbi(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);
     if (!e.isGroup) {
      return false
     }
    // owner 群主
    // member 群员
    // admin 管理员
   if (!(e.isMaster || e.sender.role === 'owner' || e.sender.role === 'admin')) {
                e.reply([segment.at(e.user_id), '\n', ' 笨蛋，你想干嘛？'])
                 return false
  }
  var s=await e.group.getMemberMap();
  var d=new Date();
  var str="清理中：\n";
  d.setMonth(d.getMonth()-1);
  var oldTime=Date.parse(d).toString().substr(0,10);
  var count=0;
  for(let temp of s){
   if(temp[1].last_sent_time<=oldTime)
   {
     str+="过期用户:"+temp[1].user_id+"\n"; 
     e.group.kickMember(temp[1].user_id,0);
     count++;
  }
}
 if(count==0)
 {
  str="笨比已经都滚蛋啦！";
 }
  //最后回复消息
  let msg = [
    //@用户
    segment.at(e.user_id),
    //文本消息
    "\n"+str
    //图片
    //segment.image("https://api.r10086.com/img-api.php?type=P%E7%AB%99%E7%B3%BB%E5%88%974"),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}

export async function qinglibenbi2(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);
     if (!e.isGroup) {
      return false
     }
    // owner 群主
    // member 群员
    // admin 管理员
   if (!(e.isMaster || e.sender.role === 'owner' || e.sender.role === 'admin')) {
                e.reply([segment.at(e.user_id), '\n', ' 笨蛋，你想干嘛？'])
                 return false
  }
  var s=await e.group.getMemberMap();
  var d=new Date();
  var str="清理中：\n";
  d.setMonth(d.getMonth()-2);
  var oldTime=Date.parse(d).toString().substr(0,10);
  var count=0;
  for(let temp of s){
   if(temp[1].last_sent_time<=oldTime)
   {
     str+="过期用户:"+temp[1].user_id+"\n"; 
     e.group.kickMember(temp[1].user_id,0);
     count++;
  }
}
 if(count==0)
 {
  str="笨比已经都滚蛋啦！";
 }
  //最后回复消息
  let msg = [
    //@用户
    segment.at(e.user_id),
    //文本消息
    "\n"+str
    //图片
    //segment.image("https://api.r10086.com/img-api.php?type=P%E7%AB%99%E7%B3%BB%E5%88%974"),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}