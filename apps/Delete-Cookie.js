import User  from "../../../lib/components/models/User.js";
import MysUser from "../../../lib/components/models/MysUser.js";
import { cookieContext, saveJson} from "../../../lib/app/dailyNote.js"
import { segment } from "oicq";
import lodash from "lodash";

//By:TTTT☀️[1033167701]

//==========================================//
// 打开/root/Yunzai-Bot/lib/app/dailyNote.js
// 搜索let cookieContext = {}; //添加cookie上下文
// 在前面 加上export 加一个空格
// 更新的时候记得把export删了  不然会冲突
//==========================================//

//监听退群消息
Bot.on("notice.group.decrease", (e) => {
  decrease(e)
});

//1.定义命令规则
export const rule = {
  decrease: {
    reg: "^###退群清CK###$", //匹配消息正则，命令正则
    priority: 50000, //优先级，越小优先度越高
    describe: "退群自动清CK", //【命令】功能说明
  },
};

//退群通知
export async function decrease(e) {
  if (e.sub_type == "decrease") {
    let name = e.member?.card ? e.member.card : e.member?.nickname;
    try  {
      delCookie(e)
    }
    catch (p){
      e.group.sendMSg(p)
    }
    e.group.sendMsg(`${name}(${e.user_id}) 笨比退群了，人家现在就把TA的Cookie吃掉.`)
  }
  return true;
}

export async function delCookie(e) {
  let selfUser = await User.get(e.user_id);
  console.log(e)
  if (e.sub_type == 'decrease') {
    if (!NoteCookie[e.user_id]) {
      return true;
    }
    if (cookieContext[e.user_id]) {
      delete cookieContext[e.user_id];
    }
    // 将用户从MysUser缓存中删除
    await MysUser.delNote(NoteCookie[e.user_id]);
    delete NoteCookie[e.user_id];
    saveJson();
    Bot.logger.mark(`删除cookie:${e.user_id}`);

    let mUsers = await selfUser.getAllMysUser();
    if (mUsers.length > 0) {
      await selfUser.bindMysUser(mUsers[0]);
      e.reply(`体力配置cookie已删除。已切换至uid: ${selfUser.uid}`);
    } else {
      
    }
  }
}
