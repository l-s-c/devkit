// 三才五格评分引擎
// 康熙笔画数据（姓氏+常用取名字）
// 天格 = 姓笔画 + 1（单姓）或 姓1+姓2（复姓）
// 人格 = 姓末字 + 名首字
// 地格 = 名字各字笔画之和（单字+1）
// 外格 = 总格 - 人格 + 1
// 总格 = 所有字笔画之和

const WUGE_LUCKY = {
  // 1-81 数理吉凶表 (1=吉,0=凶,2=半吉)
  1:1,2:2,3:1,4:0,5:1,6:1,7:1,8:1,9:0,10:0,
  11:1,12:0,13:1,14:0,15:1,16:1,17:2,18:1,19:0,20:0,
  21:1,22:0,23:1,24:1,25:1,26:0,27:2,28:0,29:1,30:2,
  31:1,32:1,33:1,34:0,35:1,36:2,37:1,38:2,39:1,40:2,
  41:1,42:2,43:0,44:0,45:1,46:0,47:1,48:1,49:0,50:0,
  51:2,52:1,53:2,54:0,55:0,56:0,57:1,58:2,59:0,60:0,
  61:1,62:0,63:1,64:0,65:1,66:0,67:1,68:1,69:0,70:0,
  71:2,72:0,73:2,74:0,75:2,76:0,77:2,78:2,79:0,80:0,
  81:1
};

// 五行对应: 1,2=木 3,4=火 5,6=土 7,8=金 9,10=水 (取尾数)
function strokeToWuxing(n) {
  const d = n % 10;
  if (d === 1 || d === 2) return "木";
  if (d === 3 || d === 4) return "火";
  if (d === 5 || d === 6) return "土";
  if (d === 7 || d === 8) return "金";
  return "水";
}

// 三才配置吉凶表 (天人地五行组合)
// 简化版: 相生为吉, 相克为凶
const WUXING_SHENG = {"木":"火","火":"土","土":"金","金":"水","水":"木"};
const WUXING_KE = {"木":"土","土":"水","水":"火","火":"金","金":"木"};

function sanCaiScore(tian, ren, di) {
  let score = 60;
  const tw = strokeToWuxing(tian);
  const rw = strokeToWuxing(ren);
  const dw = strokeToWuxing(di);
  // 天→人 相生+15, 同+10, 相克-10
  if (WUXING_SHENG[tw] === rw) score += 15;
  else if (tw === rw) score += 10;
  else if (WUXING_KE[tw] === rw) score -= 10;
  // 人→地 同理
  if (WUXING_SHENG[rw] === dw) score += 15;
  else if (rw === dw) score += 10;
  else if (WUXING_KE[rw] === dw) score -= 10;
  // 天→地
  if (WUXING_SHENG[tw] === dw) score += 5;
  else if (tw === dw) score += 5;
  else if (WUXING_KE[tw] === dw) score -= 5;
  return Math.min(100, Math.max(0, score));
}

function calcWuge(surnameStrokes, nameStrokes) {
  // surnameStrokes: [笔画] (单姓1个, 复姓2个)
  // nameStrokes: [笔画] (单字1个, 双字2个)
  const isFuxing = surnameStrokes.length > 1;
  const sSum = surnameStrokes.reduce((a,b) => a+b, 0);
  const nSum = nameStrokes.reduce((a,b) => a+b, 0);

  const tian = isFuxing ? surnameStrokes[0] + surnameStrokes[1] : surnameStrokes[0] + 1;
  const ren = surnameStrokes[surnameStrokes.length-1] + nameStrokes[0];
  const di = nameStrokes.length > 1 ? nameStrokes[0] + nameStrokes[1] : nameStrokes[0] + 1;
  const zong = sSum + nSum;
  const wai = zong - ren + 1;

  const luckyLabel = (n) => {
    const k = ((n - 1) % 81) + 1;
    const v = WUGE_LUCKY[k];
    return v === 1 ? "吉" : v === 2 ? "半吉" : "凶";
  };

  const sanCai = sanCaiScore(tian, ren, di);

  return {
    tian: { value: tian, wuxing: strokeToWuxing(tian), lucky: luckyLabel(tian) },
    ren:  { value: ren,  wuxing: strokeToWuxing(ren),  lucky: luckyLabel(ren) },
    di:   { value: di,   wuxing: strokeToWuxing(di),   lucky: luckyLabel(di) },
    wai:  { value: wai,  wuxing: strokeToWuxing(wai),  lucky: luckyLabel(wai) },
    zong: { value: zong, wuxing: strokeToWuxing(zong), lucky: luckyLabel(zong) },
    sanCai: sanCai,
    sanCaiWuxing: [strokeToWuxing(tian), strokeToWuxing(ren), strokeToWuxing(di)]
  };
}

// 声调检测
function checkTones(pinyinArr) {
  // pinyinArr: ["lǐ", "chéng", "zé"] 带声调拼音
  // 提取声调: 1234
  function getTone(py) {
    const toneMap = {"ā":1,"á":2,"ǎ":3,"à":4,"ē":1,"é":2,"ě":3,"è":4,
      "ī":1,"í":2,"ǐ":3,"ì":4,"ō":1,"ó":2,"ǒ":3,"ò":4,
      "ū":1,"ú":2,"ǔ":3,"ù":4,"ǖ":1,"ǘ":2,"ǚ":3,"ǜ":4};
    for (const ch of py) {
      if (toneMap[ch]) return toneMap[ch];
    }
    return 0; // 轻声
  }
  const tones = pinyinArr.map(getTone);
  // 三连同调不好
  const allSame = tones.length >= 3 && tones[0] === tones[1] && tones[1] === tones[2];
  // 评分
  let score = 80;
  if (allSame) score -= 30;
  // 有去声(4声)结尾加分(响亮)
  if (tones[tones.length-1] === 4) score += 10;
  // 有变化加分
  const unique = new Set(tones).size;
  score += unique * 5;
  return { tones, score: Math.min(100, score), allSame };
}

if (typeof module !== "undefined") module.exports = { calcWuge, checkTones, strokeToWuxing };
