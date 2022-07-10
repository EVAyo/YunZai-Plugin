import { getPluginRender } from "../../../lib/render.js";
import { segment } from "oicq";
import lodash from "lodash";
import fs from "fs";
import { Cfg,Gcfun } from "../components/index.js";

export const rule = {
  Genshingacha: {
    reg: "^#*(10|[武器池]*[十]+|抽|单)[连抽卡奖][123武器池]*$",
    priority: 10,
    describe: "【十连，十连2，十连武器】模拟原神抽卡",
  },
  weaponBing: {
    reg: "^#*定轨$", //匹配的正则
    priority: 99, //优先级，越小优先度越高
    describe: "【定轨】武器池定轨", //描述说明
  },
};

//创建html文件夹
if (!fs.existsSync(`./data/html/genshin/gacha/`)) {
  fs.mkdirSync(`./data/html/genshin/gacha/`);
}

const _path = process.cwd();
let gachaChizi= JSON.parse(fs.readFileSync(`${_path}/plugins/gacha-plugin/resources/gacha/gacha.json`, "utf8"));

//五星角色
let role5 = gachaChizi.genshin.role5;
//五星武器
let weapon5 = gachaChizi.genshin.weapon5;
//四星角色
let role4 = gachaChizi.genshin.role4;
//四星武器
let weapon4 = gachaChizi.genshin.weapon4;
//三星武器
let weapon3 = gachaChizi.genshin.weapon3;

//回复统计
let count = {};
let gachaConfig = {};
let element = {};
let genshin = {};

await init();

export async function init(isUpdate) {
  gachaConfig = JSON.parse(fs.readFileSync("./config/genshin/gacha.json", "utf8"));
  element = JSON.parse(fs.readFileSync("./config/genshin/element.json", "utf8"));
  let version = isUpdate ? new Date().getTime() : 0;
  genshin = await import(`../../../config/genshin/roleId.js?version=${version}`);
  count = {};
}

//获取概率
function getchance(key, config){
  return Cfg.get(key, config);
}


//#十连
export async function Genshingacha(e) {
  if (e.img || e.hasReply ||!Cfg.get("gacha.DIY", true) || Cfg.get("gacha.type", 1) != 1) {
    return;
  }
  let user_id = e.user_id;
  let name = e.sender.card;
  let group_id = e.group_id;
  let type = e.msg.includes("武器") ? "weapon" : "role";

  let upType = 1;
  if (e.msg.indexOf("2") != -1) {
    upType = 2; //角色up卡池2
  }
  if (e.msg.indexOf("3") != -1) {
    upType = 3;
  }


  //每日抽卡次数
  let dayNum = e.groupConfig.gachaDayNum || 1;
  //角色，武器抽卡限制是否分开
  let LimitSeparate = e.groupConfig.LimitSeparate || 0;

  let key = `genshin:gacha:${user_id}`;

  let gachaData = await global.redis.get(key);

  //获取结算时间
  let end = getEnd();

  if (!count[end.dayEnd]) {
    count = {};
    count[end.dayEnd] = {};
  }
  if (count[end.dayEnd][user_id]) {
    count[end.dayEnd][user_id]++;
  } else {
    count[end.dayEnd][user_id] = 1;
  }

  if (!e.isMaster && count[end.dayEnd][user_id] && count[end.dayEnd][user_id] > Number(dayNum) * (LimitSeparate + 1) + 2) {
    if (count[end.dayEnd][user_id] <= Number(dayNum) * (LimitSeparate + 1) + 4) {
      e.reply(`每天只能抽${dayNum}次`);
    }
    return true;
  }

  if (!gachaData) {
    gachaData = {
      num4: 0, //4星保底数
      isUp4: 0, //是否4星大保底
      num5: 0, //5星保底数
      isUp5: 0, //是否5星大保底
      week: { num: 0, expire: end.weekEnd },
      today: { role: [], expire: end.dayEnd, num: 0, weaponNum: 0 },
      weapon: {
        num4: 0, //4星保底数
        isUp4: 0, //是否4星大保底
        num5: 0, //5星保底数
        isUp5: 0, //是否5星大保底
        lifeNum: 0, //命定值
        type: 1, //0-取消 1-武器1 2-武器2
      },
    };
  } else {
    gachaData = JSON.parse(gachaData);
    if (new Date().getTime() >= gachaData.today.expire) {
      gachaData.today = { num: 0, weaponNum: 0, role: [], expire: end.dayEnd };
    }
    if (new Date().getTime() >= gachaData.week.expire) {
      gachaData.week = { num: 0, expire: end.weekEnd };
    }
  }
  let todayNum = gachaData.today.num;
  if (type == "weapon" && LimitSeparate) {
    todayNum = gachaData.today.weaponNum;
  }

  if (todayNum >= dayNum && !e.isMaster) {
    let msg = lodash.truncate(name, { length: 8 });
    if (gachaData.today.role.length > 0) {
      msg += "\n今日五星：";
      if(gachaData.today.role.length>=4){
        msg += `${gachaData.today.role.length}个\n`;
      }else{
        for (let val of gachaData.today.role) {
          msg += `${val.name}(${val.num})\n`;
        }
      }
      msg = msg.trim("\n");

      if (gachaData.week.num - gachaData.today.role.length >= 1) {
        msg += `\n本周：${gachaData.week.num}个五星`;
      }
    } else {
      if (gachaData.weapon && e.msg.includes("武器")) {
        msg += `今日武器已抽\n累计${gachaData.weapon.num5}抽无五星`;
      } else {
        msg += `今日角色已抽\n累计${gachaData.num5}抽无五星`;
      }
      if (gachaData.week.num >= 2) {
        msg += `\n本周：${gachaData.week.num}个五星`;
      }
    }
    //回复消息
    e.reply(msg);
    //返回true不再向下执行
    return true;
  }

  let { up4, up5, upW4, upW5, poolName } = getNowPool(upType);
  if (e.msg.includes("武器")) {
    return gachaWeapon(e, gachaData, upW4, upW5);
  }
  //去除当前up的四星
  role4 = lodash.difference(role4, up4);
  //每日抽卡数+1
  gachaData.today.num++;
  //数据重置
  let res5 = [],
    resC4 = [],
    resW4 = [],
    resW3 = [];

  //是否大保底
  let isBigUP = false;

  //循环十次
  for (let i = 1; i <= 10; i++) {
    let tmpChance5 = Gcfun.getthechance(getchance("gacha.c5", 60),gachaData.num5++,gachaData.week.num);
    //抽中五星
    if (getRandomInt(10000) <= tmpChance5) {
      //当前抽卡数
      let nowCardNum = gachaData.num5;

      //五星抽卡数清零
      gachaData.num5 = 0;
      //没有四星，四星保底数+1
      gachaData.num4++;

      let tmpUp = getchance("gacha.wai", 50);

      if (gachaData.isUp5 == 1) {
        tmpUp = 101;
      }

      let tmp_name = "";

      //当祈愿获取到5星角色时，有50%的概率为本期UP角色
      if (getRandomInt(100) <= tmpUp) {
        if (gachaData.isUp5 == 1) {
          isBigUP = true;
        }
        //大保底清零
        gachaData.isUp5 = 0;
        //up 5星
        tmp_name = up5[getRandomInt(up5.length)];
      } else {
        //大保底
        gachaData.isUp5 = 1;
        tmp_name = role5[getRandomInt(role5.length)];
      }

      gachaData.today.role.push({ name: tmp_name, num: nowCardNum });
      gachaData.week.num++;

      redispushdata(res5,tmp_name,5,"character",nowCardNum);
      continue;
    }

    let tmpChance4 = Gcfun.getthechance4(getchance("gacha.c4", 510),gachaData.num4++);

    //抽中四星
    if (getRandomInt(10000) <= tmpChance4) {
      //保底四星数清零
      gachaData.num4 = 0;
      if (gachaData.isUp4 == 1) {
        //必出四星清零
        gachaData.isUp4 = 0;
        var tmpUp = 100;
      } else {
        var tmpUp = 50;
      }
      //当祈愿获取到4星物品时，有50%的概率为本期UP角色
      if (Math.ceil(Math.random() * 100) <= tmpUp) {
        //up 4星
        redispushdata(resC4,up4[getRandomInt(up4.length)],4,"character",undefined);
      } else {
        gachaData.isUp4 = 1;
        //一半概率武器 一半4星
        if (getRandomInt(100) <= 50) {
          redispushdata(resC4,role4[getRandomInt(role4.length)],4,"character",undefined);
        } else {
          redispushdata(resW4,weapon4[getRandomInt(weapon4.length)],4,"weapon",undefined);
        }
      }
      continue;
    }

    //随机三星武器
    redispushdata(resW3,weapon3[getRandomInt(weapon3.length)],3,"weapon",undefined);
  }

  let list = [...res5, ...resC4, ...resW4, ...resW3];

  let info = `累计「${gachaData.num5}抽」`;

  if (res5.length > 0) {
    let role5 = res5[res5.length - 1];
    info = `${role5.name}「${role5.num}抽」`;
    if (isBigUP) {
      info += "大保底";
    }
  }else if (res5.length >= 4) {
    info = "";
  }

  let base64 = await getPluginRender("gacha-plugin")("gacha", "genshin", {
    save_id: user_id,
    name: name,
    info: info,
    list: list,
    poolName: poolName,
    fiveNum:res5.length,
  });

  if (base64) {
    redis.set(key, JSON.stringify(gachaData), {
      EX: end.keyEnd,
    });

    let msg = segment.image(`base64://${base64}`);
    let msgRes = await e.reply(msg);

    if (msgRes && msgRes.message_id && e.isGroup && e.groupConfig.delMsg && res5.length <= 0 && resC4.length <= 2) {
      setTimeout(() => {
        e.group.recallMsg(msgRes.message_id);
      }, e.groupConfig.delMsg);
    }
  }
  return true;
}

function getNowPool(upType) {
  let end, up4, up5, upW4, upW5, poolName, raw_up5;
  gachaChizi = JSON.parse(fs.readFileSync(`${_path}/plugins/gacha-plugin/resources/gacha/gacha.json`, "utf8"));
  //数据过时，刷新
  if(new Date().getTime() >= new Date(gachaChizi.genshinUp.endTime).getTime()){
    for (let val of gachaConfig) {
      if (new Date().getTime() <= new Date(val.endTime).getTime()) {
        end = val;
        break;
      }
    }
    if (!end) {
      end = gachaConfig.pop();
    }
    gachaChizi.genshinUp = end;
  }

  if(upType == 3 ){
    end = lodash.sample(gachaConfig);
    upType = lodash.random(1, 2);
  }else {
    end = gachaChizi.genshinUp;
  }

  up4 = end.up4;
  if (upType == 1) {
    up5 = end.up5;
  } else {
    up5 = end.up5_2;
  }
  upW4 = end.weapon4;
  upW5 = end.weapon5;

  poolName = genshin.abbr[up5[0]] ? genshin.abbr[up5[0]] : up5[0];
  poolName = `角色池:${poolName}`;
  raw_up5 = [...end.up5, ...end.up5_2];
  return { up4, up5, upW4, upW5, poolName, raw_up5 }
}

//返回随机整数
function getRandomInt(max = 10000) {
  return Math.floor(Math.random() * max);
}

function getEnd() {
  let now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();
  let dayEnd = "";
  //每日数据-凌晨4点更新
  if (now.getHours() < 4) {
    dayEnd = new Date(year, month, day, "03", "59", "59").getTime();
  } else {
    dayEnd = new Date(year, month, day, "23", "59", "59").getTime() + 3600 * 4 * 1000;
  }
  //每周结束时间
  let weekEnd = dayEnd + 86400 * (7 - now.getDay()) * 1000;
  //redis过期时间
  let keyEnd = Math.ceil((dayEnd + 86400 * 5 * 1000 - now.getTime()) / 1000);

  return { dayEnd, weekEnd, keyEnd };
}

//#十连武器
async function gachaWeapon(e, gachaData, upW4, upW5) {
  let user_id = e.user_id;
  //角色，武器抽卡限制是否分开
  let LimitSeparate = e.groupConfig.LimitSeparate || 0;

  if (!gachaData.weapon) {
    gachaData.weapon = {
      num4: 0, //4星保底数
      isUp4: 0, //是否4星大保底
      num5: 0, //5星保底数
      isUp5: 0, //是否5星大保底
      lifeNum: 0, //命定值
      type: 1, //0-取消 1-武器1 2-武器2
      bingWeapon: upW5[0],
    };
  } else {
    if (gachaData.weapon.bingWeapon) {
      if (!upW5.includes(gachaData.weapon.bingWeapon)) {
        gachaData.weapon.bingWeapon = upW5[0];
        gachaData.weapon.type = 1;
        gachaData.weapon.lifeNum = 0;
      }
    } else if (gachaData.weapon.type == 1) {
      gachaData.weapon.bingWeapon = upW5[0];
      gachaData.weapon.lifeNum = 0;
    }
  }

  let bingWeapon;
  if (gachaData.weapon.type > 0) {
    if (upW5[gachaData.weapon.type - 1]) {
      bingWeapon = upW5[gachaData.weapon.type - 1];
    }
  }

  //去除当前up的四星
  weapon4 = lodash.difference(weapon4, upW4);
  weapon5 = lodash.difference(weapon5, upW5);

  //每日抽卡数+1
  if (LimitSeparate) {
    if (!gachaData.today.weaponNum) {
      gachaData.today.weaponNum = 0;
    }
    gachaData.today.weaponNum++;
  } else {
    if (!gachaData.today.Num) {
      gachaData.today.num = 0;
    }
    gachaData.today.num++;
  }

  let res5 = [],
    resC4 = [],
    resW4 = [],
    resW3 = [];

  let isBigUP = false; //是否大保底
  let isBing = false; //是否定轨获取

  //循环十次
  for (let i = 1; i <= 10; i++) {


    //抽中五星
    if (getRandomInt(10000) <= Gcfun.gettheweaponchance(getchance("gacha.w5", 70),gachaData.weapon.num5++,gachaData.week.num)) {
      //当前抽卡数
      let nowCardNum = gachaData.weapon.num5 + 1;
      //五星抽卡数清零
      gachaData.weapon.num5 = 0;
      //没有四星，四星保底数+1
      gachaData.weapon.num4++;
      let tmpUp = 75;
      if (gachaData.weapon.isUp5 == 1) {
        tmpUp = 101;
      }
      let tmp_name = "";
      if (gachaData.weapon.lifeNum >= 2) {
        tmp_name = bingWeapon;
        gachaData.weapon.lifeNum = 0;
        isBing = true;
        isBigUP = false;
      }
      //当祈愿获取到5星武器时，有75%的概率为本期UP武器
      else if (getRandomInt(100) <= tmpUp) {
        if (gachaData.weapon.isUp5 == 1) {
          isBigUP = true;
        } else {
          isBigUP = false;
        }
        //大保底清零
        gachaData.weapon.isUp5 = 0;
        //up 5星
        tmp_name = upW5[getRandomInt(upW5.length)];
        if (tmp_name == bingWeapon) {
          gachaData.weapon.lifeNum = 0;
        }
        isBing = false;
      } else {
        //大保底
        gachaData.weapon.isUp5 = 1;
        tmp_name = weapon5[getRandomInt(weapon5.length)];
        isBigUP = false;
        isBing = false;
      }
      if (gachaData.weapon.type > 0 && tmp_name != bingWeapon) {
        gachaData.weapon.lifeNum++;
      }
      gachaData.today.role.push({ name: tmp_name, num: nowCardNum });
      gachaData.week.num++;
      redispushdata(res5,tmp_name,5,"weapon",nowCardNum);
      continue;
    }

    //抽中四星
    if (getRandomInt(10000) <= Gcfun.getthechance4(getchance("gacha.w4", 600),gachaData.weapon.num4++)) {
      //保底四星数清零
      gachaData.weapon.num4 = 0;
      if (gachaData.weapon.isUp4 == 1) {
        //是否必出四星清零
        gachaData.weapon.isUp4 = 0;
        var tmpUp = 100;
      } else {
        var tmpUp = 75;
      }
      //当祈愿获取到4星物品时，有75%的概率为本期UP武器
      if (Math.ceil(Math.random() * 100) <= tmpUp) {
        //up 4星
        redispushdata(resW4,upW4[getRandomInt(upW4.length)],4,"weapon",undefined);
      } else {
        gachaData.weapon.isUp4 = 1;
        //一半概率武器 一半角色
        if (getRandomInt(100) <= 50) {
          redispushdata(resC4,role4[getRandomInt(role4.length)],4,"character",undefined);
        } else {
          redispushdata(resW4,weapon4[getRandomInt(weapon4.length)],4,"weapon",undefined);
        }
      }
      continue;
    }
    //随机三星武器
    redispushdata(resW3,weapon3[getRandomInt(weapon3.length)],3,"weapon",undefined);
  }
  let key = `genshin:gacha:${user_id}`;
  await global.redis.set(key, JSON.stringify(gachaData), {
    EX: getEnd().keyEnd,
  });
  let list = [...res5, ...resC4, ...resW4, ...resW3];
  let info = `累计「${gachaData.weapon.num5}抽」`;
  if (res5.length > 0) {
    let role5 = res5[res5.length - 1];
    info = `${role5.name}「${role5.num}抽」`;
  }
  if (isBing) {
    info += "定轨";
  }
  if (isBigUP) {
    info += "大保底";
  }
  let base64 = await getPluginRender("gacha-plugin")("gacha", "genshin", {
    save_id: user_id,
    name: e.sender.card,
    info: info,
    list: list,
    isWeapon: true,
    bingWeapon: bingWeapon,
    lifeNum: gachaData.weapon.lifeNum,
    fiveNum:res5.length,
  });

  if (base64) {
    let msg = segment.image(`base64://${base64}`);
    let msgRes = await e.reply(msg);
    if (msgRes && msgRes.message_id && e.isGroup && e.groupConfig.delMsg && res5.length <= 0 && resC4.length <= 2) {
      setTimeout(() => {
        e.group.recallMsg(msgRes.message_id);
      }, e.groupConfig.delMsg);
    }
  }

  return true;
}

//定轨
export async function weaponBing(e) {
  let user_id = e.user_id;
  let upW5 = [];
  for (let val of gachaConfig) {
    if (new Date().getTime() <= new Date(val.endTime).getTime()) {
      upW5 = val.weapon5;
      break;
    }
  }
  if (upW5.length <= 0) {
    upW5 = gachaConfig[gachaConfig.length - 1].weapon5;
  }
  let key = `genshin:gacha:${user_id}`;
  let gachaData = await global.redis.get(key);
  gachaData = JSON.parse(gachaData);
  if (!gachaData) {
    gachaData = {
      num4: 0, //4星保底数
      isUp4: 0, //是否4星大保底
      num5: 0, //5星保底数
      isUp5: 0, //是否5星大保底
      week: { num: 0, expire: getEnd().weekEnd },
      today: { role: [], expire: getEnd().dayEnd, num: 0 },
      weapon: {
        num4: 0, //4星保底数
        isUp4: 0, //是否4星大保底
        num5: 0, //5星保底数
        isUp5: 0, //是否5星大保底
        lifeNum: 0, //命定值
        type: 0, //0-取消 1-武器1 2-武器2
        bingWeapon: upW5[0],
      },
    };
  } else if (!gachaData.weapon) {
    gachaData.weapon = {
      num4: 0, //4星保底数
      isUp4: 0, //是否4星大保底
      num5: 0, //5星保底数
      isUp5: 0, //是否5星大保底
      lifeNum: 0, //命定值
      type: 1, //0-取消 1-武器1 2-武器2
      bingWeapon: upW5[0],
    };
  }
  let msg = [];

  if (gachaData.weapon.type >= 2) {
    gachaData.weapon.type = 0;
    gachaData.weapon.bingWeapon = "";
    msg = "定轨已取消";
  } else {
    gachaData.weapon.type++;
    gachaData.weapon.bingWeapon = upW5[gachaData.weapon.type - 1];
    for(let i in upW5){
      if(gachaData.weapon.type - 1 == i){
        msg.push(`[√] ${upW5[i]}`);
      }
      else{
        msg.push(`[  ] ${upW5[i]}`);
      }
    }
    msg = " 定轨成功\n" + msg.join("\n");
  }
  gachaData.weapon.lifeNum = 0;
  await global.redis.set(key, JSON.stringify(gachaData), {
    EX: getEnd().keyEnd,
  });
  let sendMsg = [];
  if (e.isGroup) {
    let name = lodash.truncate(e.sender.card, { length: 8 });
    sendMsg.push(segment.at(e.user_id, name));
  }
  sendMsg.push(msg);
  e.reply(sendMsg);
  return true;
}


//添加角色数据
function redispushdata(object,tmp_name,starnum,typename,nowCardNum) {
  return object.push({
    name: tmp_name,
    star: starnum,
    type: typename,
    num: nowCardNum,
    element: trownullelement(element[tmp_name]),
  });
}


function trownullelement(name) {
  //去除空图片
  if(name===undefined)
  {
    name="null";
  }
  return name;
}