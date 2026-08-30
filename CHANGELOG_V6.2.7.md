# CHANGELOG — V6.2.7

## Practice mode
- 移除正式播放時的 ScoreScroller 水平移動。
- 新增 ScorePager。
- 樂譜固定顯示。
- 紅線由左往右移動。
- 每排 4 拍。
- 排尾自動切下一排。
- 切排後紅線回到左側重新走。
- 預備四拍保留。
- 鋼琴聲音、琴鍵高亮、節拍聲仍共用 Transport Master Clock。

## Architecture
- 新增 `js/practice/score-pager.js`。
- `PracticeController` 改由 ScorePager 管理目前顯示排。
- Playhead 改為 ready/start/end 三段位置。

## Version
- 網站、README、VERSION、CHANGELOG 同步 V6.2.7。
