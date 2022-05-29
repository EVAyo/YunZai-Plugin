import fetch from "node-fetch";
import moment from "moment";
import { Character } from "./models.js";
import lodash from "lodash";

const ignoreIds = [495,// 有奖问卷调查开启！
  1263,  // 米游社《原神》专属工具一览
  423,  // 《原神》玩家社区一览
  422,  // 《原神》防沉迷系统说明
  762,  // 《原神》公平运营声明
  762,  // 《原神》公平运营声明
]

const ignoreReg = /(内容专题页|版本更新说明|调研|防沉迷|米游社|专项意见|更新修复与优化|问卷调查|版本更新通知|更新时间说明|预下载功能|周边限时返场)/;
const fulltimeReg = /(魔神任务)/;

let Cal = {
  async reqCalData() {
    let listApi = "https://hk4e-api.mihoyo.com/common/hk4e_cn/announcement/api/getAnnList?game=hk4e&game_biz=hk4e_cn&lang=zh-cn&bundle_id=hk4e_cn&platform=pc&region=cn_gf01&level=55&uid=100000000";

    let request = await fetch(listApi);
    let listData = await request.json();

    let timeMap;
    let timeMapCache = await redis.get("cache:calendar:detail");
    if (timeMapCache) {
      timeMap = JSON.parse(timeMapCache) || {};
    } else {
      let detailApi = "https://hk4e-api.mihoyo.com/common/hk4e_cn/announcement/api/getAnnContent?game=hk4e&game_biz=hk4e_cn&lang=zh-cn&bundle_id=hk4e_cn&platform=pc&region=cn_gf01&level=55&uid=100000000";
      let request2 = await fetch(detailApi);
      let detailData = await request2.json();
      timeMap = {}
      if (detailData && detailData.data && detailData.data.list) {
        let versionTime = {};
        lodash.forEach(detailData.data.list, (ds) => {
          let vRet = /(\d\.\d)版本更新通知/.exec(ds.title)
          if (vRet && vRet[1]) {
            let content = /(?:更新时间)\s*〓([^〓]+)(?:〓|$)/.exec(ds.content);
            if (content && content[1]) {
              let tRet = /([0-9\\/\\: ]){9,}/.exec(content[1]);
              if (tRet && tRet[0]) {
                versionTime[vRet[1]] = tRet[0].replace("06:00", "11:00");
              }
            }
          }
        })
        lodash.forEach(detailData.data.list, (ds) => {
          let { ann_id, content, title } = ds;
          if (ignoreReg.test(title)) {
            return;
          }
          content = content.replace(/(<|&lt;)[\w "%:;=\-\\/\\(\\)\,\\.]+(>|&gt;)/g, "");
          content = /(?:活动时间|祈愿介绍|任务开放时间|冒险....包)\s*〓([^〓]+)(〓|$)/.exec(content);
          if (!content || !content[1]) {
            return;
          }
          content = content[1];
          let annTime = [];

          // 第一种简单格式
          let timeRet = /活动时间(?:〓|\s)*([0-9\\/\\: ~]*)/.exec(content);
          if (timeRet && timeRet[1]) {
            annTime = timeRet[1].split("~");
          } else if (/\d\.\d版本更新后/.test(content)) {
            let vRet = /(\d\.\d)版本更新后/.exec(content);
            let vTime = '';
            if (vRet && vRet[1] && versionTime[vRet[1]]) {
              vTime = versionTime[vRet[1]];
            }
            if (!vTime) {
              return;
            }
            if (/永久开放/.test(content)) {
              annTime = [vTime, '2099/01/01 00:00:00'];
            } else {
              timeRet = /([0-9\\/\\: ]){9,}/.exec(content);
              if (timeRet && timeRet[0]) {
                annTime = [vTime, timeRet[0]];
              }
            }

          }

          if (annTime.length === 2) {
            timeMap[ann_id] = {
              start: annTime[0].trim().replace(/\//g, "-"),
              end: annTime[1].trim().replace(/\//g, "-")
            }
          }
        })
      }
      await redis.set("cache:calendar:detail", JSON.stringify(timeMap), { EX: 60 * 10 });
    }
    return { listData, timeMap };
  },

  getDateList() {
    let today = moment();
    let temp = today.add(-7, 'days');
    let dateList = [], month = 0, date = [];

    let startDate, endDate;

    for (let idx = 0; idx < 13; idx++) {
      let temp = today.add(1, 'days'),
        m = temp.month() + 1, d = temp.date();
      if (month === 0) {
        startDate = temp.format("YYYY-MM-DD");
        month = m;
      }
      if (month !== m && date.length > 0) {
        dateList.push({
          month,
          date
        })
        date = [];
        month = m;
      }
      date.push(d);
      if (idx === 12) {
        dateList.push({
          month,
          date
        })
        endDate = temp.format("YYYY-MM-DD");
      }
    }

    let startTime = moment(startDate + " 00:00:00"),
      endTime = moment(endDate + " 23:59:59");

    let totalRange = endTime - startTime
    return {
      dateList,
      startTime,
      endTime,
      totalRange,
      nowLeft: (moment() - startTime) / totalRange * 100
    }
  },

  getAbyssCal(s1, e1) {
    let now = moment();
    let check = [], f = "YYYY-MM";
    let last = now.add(-1, 'M').format(f),
      lastM = now.format("MMMM"),
      curr = now.add(1, "M").format(f),
      currM = now.format("MMMM"),
      next = now.add(1, "M").format(f),
      nextM = now.format("MMMM");

    check.push([moment(`${last}-16 04:00:00`), moment(`${curr}-01 03:59:59`), lastM + "下半"]);
    check.push([moment(`${curr}-01 04:00:00`), moment(`${curr}-16 03:59:59`), currM + "上半"]);
    check.push([moment(`${curr}-16 04:00:00`), moment(`${next}-01 03:59:59`), currM + "下半"]);
    check.push([moment(`${next}-01 04:00:00`), moment(`${next}-16 03:59:59`), nextM + "上半"]);

    let ret = [];
    lodash.forEach(check, (ds) => {
      let [s2, e2] = ds;
      if ((s2 <= s1 && s1 <= e2) || (s2 <= e1 && e1 <= e2)) {
        ret.push(ds)
      }
    })
    return ret;
  },

  getList(ds, target, { startTime, endTime, totalRange, now, timeMap = {} }, isAct = false,) {
    let type = isAct ? "activity" : "normal",
      id = ds.ann_id,
      title = ds.title,
      banner = isAct ? ds.banner : '',
      extra = { sort: isAct ? 5 : 10 },
      detail = timeMap[id] || {};


    if (ignoreIds.includes(id) || ignoreReg.test(title)) {
      return;
    }


    if (/神铸赋形/.test(title)) {
      type = "weapon";
      title = title.replace(/(单手剑|双手剑|长柄武器|弓|法器|·)/g, "");
      extra.sort = 2;
    } else if (/祈愿/.test(title)) {
      type = "character";
      let regRet = /·(.*)\(/.exec(title);
      if (regRet[1]) {
        let char = Character.get(regRet[1]);
        extra.banner2 = `/meta/character/${regRet[1]}/party.png`;
        extra.character = regRet[1];
        extra.elem = char.elem;
        extra.sort = 1;
      } else if (/纪行/.test(title)) {
        type = "pass"
      } else if ('深渊' === title) {
        type = "abyss";
      }
    }

    let sDate = moment(detail.start || ds.start_time),
      eDate = moment(detail.end || ds.end_time);
    let sTime = moment.max(sDate, startTime),
      eTime = moment.min(eDate, endTime);

    let sRange = sTime - startTime,
      eRange = eTime - startTime;

    let left = sRange / totalRange * 100,
      width = eRange / totalRange * 100 - left;

    let label = "";
    if (fulltimeReg.test(title) || eDate - sDate > 365 * 24 * 3600 * 1000) {
      if (sDate < now) {
        left = 0;
        width = 100;
      }
      label = "永久有效";
    } else if (now > sDate && eDate > now) {
      label = eDate.format("MM-DD HH:mm") + " (" + moment.duration(eDate - now).humanize() + "后结束)"
      if (width > (isAct ? 38 : 55)) {
        label = sDate.format("MM-DD HH:mm") + " ~ " + label;
      }
    } else if (sDate > now) {
      label = sDate.format("MM-DD HH:mm") + " (" + moment.duration(sDate - now).humanize() + "后开始)"
    } else if (isAct) {
      label = sDate.format("MM-DD HH:mm") + " ~ " + eDate.format("MM-DD HH:mm");
    }

    target.push({
      ...extra,
      id,
      title,
      type,
      banner,
      icon: ds.tag_icon,
      left,
      width,
      label,
      duration: eTime - sTime,
      start: sDate.format("MM-DD HH:mm"),
      end: eDate.format("MM-DD HH:mm")
    });
  },

  async get() {

    moment.locale("zh-cn");

    let now = moment();

    let { listData, timeMap } = await Cal.reqCalData();

    let dl = Cal.getDateList();

    let list = [], abyss = [];

    lodash.forEach(listData.data.list[1].list, (ds) => Cal.getList(ds, list, { ...dl, now, timeMap }, true))
    lodash.forEach(listData.data.list[0].list, (ds) => Cal.getList(ds, list, { ...dl, now, timeMap }, false));

    let abyssCal = Cal.getAbyssCal(dl.startTime, dl.endTime);
    lodash.forEach(abyssCal, (t) => {
      Cal.getList({
        title: `「深境螺旋」· ${t[2]}`,
        start_time: t[0].format("YYYY-MM-DD HH:mm"),
        end_time: t[1].format("YYYY-MM-DD HH:mm")
      }, abyss, { ...dl, now }, true)
    });

    list = lodash.sortBy(list, ["sort", 'start', 'duration']);

    let charCount = 0, charOld = 0;
    let weaponCount = 0;
    lodash.forEach(list, (li) => {
      if (li.type === "character") {
        charCount++;
        li.left === 0 && charOld++;
        li.idx = charCount;
      }
      if (li.type === "weapon") {
        weaponCount++;
        li.idx = weaponCount;
      }
    })

    return {
      ...dl,
      list,
      abyss,
      charMode: `char-${charCount}-${charOld}`,
      nowTime: now.format("YYYY-MM-DD HH:mm"),
      nowDate: now.date(),
    }
  }
}

export default Cal;