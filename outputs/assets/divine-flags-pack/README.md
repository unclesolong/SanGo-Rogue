# 5 消神令旗資料包

用途：給 `match-card-battle-prototype` 帶入 5 消觸發的神令旗系統。

## 主要檔案

- `divine_flags.json`：神令旗資料庫
- `icons/`：每面神令旗的遊戲縮圖
- `preview/divine_flags_preview_sheet.png`：縮圖總覽

## 觸發規則

```json
{
  "type": "match_count",
  "minCount": 5
}
```

也就是消除 5 顆以上同色珠時，可觸發神令旗。

## 神令旗列表

1. 火攻：將隨機顏色珠變成紅珠
2. 借東風：當局火珠變成強化火珠，傷害 1.2 倍
3. 青龍現世：下一次消除紅珠，傷害 x3
4. 七星燈：生成 3 顆彩虹珠
5. 萬箭齊發：所有敵人受到固定傷害 500
6. 八陣圖：無敵 2 回合
7. 空城計：降低敵人攻擊力 50%，持續 3 回合
8. 天降神雷：指定一種顏色，全部炸掉
9. 奇門遁甲：交換任意兩種珠子的顏色
10. 天公將軍：黃色珠子也能發動攻擊，持續 3 回合

## 主程式建議讀取方式

主程式讀取：

```text
divine_flags.json
```

使用：

```js
flags[i].id
flags[i].name
flags[i].description
flags[i].category
flags[i].effect.type
flags[i].effect.params
flags[i].icon
```

`icon` 是相對於本資料包資料夾的路徑。
