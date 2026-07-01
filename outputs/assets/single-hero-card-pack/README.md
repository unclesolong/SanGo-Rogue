# 單英雄角色卡資料包

用途：給 `match-card-battle-prototype` 改成「只有一位英雄上場」時使用。

## 主要檔案

- `heroes.json`：英雄資料庫
- `cards/hero_zhao_yun_card.png`：完整角色卡圖片
- `art/portraits/hero_zhao_yun_portrait.png`：AI 立繪原圖
- `art/battle-icons/hero_zhao_yun_battle_icon.png`：戰鬥中的小圖
- `art/skills/skill_dragon_spear_thrust.png`：主動技能圖示
- `art/skills/skill_fearless_courage.png`：被動技能圖示

## 主程式連結方式

主程式可以讀：

```text
heroes.json
```

目前第一位英雄：

```text
heroes[0]
```

圖片路徑都在：

```text
heroes[0].art.portrait
heroes[0].art.battleIcon
heroes[0].art.card
```

以上路徑是相對於這個資料包資料夾。

## 趙雲技能

- 主動技能：龍膽突刺
  - CD：6
  - 效果：造成 450% 基礎攻擊傷害量
- 被動技能：渾身是膽
  - 觸發：消除紅珠時
  - 機率：10%
  - 效果：獲取攻擊力數值的護盾

## 建議遊戲資料結構

單英雄模式可以先讓遊戲保存：

```js
currentHeroId = "hero_zhao_yun";
```

戰鬥開始時用 `currentHeroId` 從 `heroes.json` 找英雄資料，再讀取：

```js
hero.stats.hp
hero.stats.attack
hero.stats.recovery
hero.activeSkill
hero.passiveSkill
hero.art.battleIcon
```

技能圖示路徑：

```js
hero.activeSkill.icon
hero.passiveSkill.icon
```
