# CHANGELOG — V6.2.8

## Whole Score
- 取消 ScorePager 分段顯示。
- 取消每 4 拍切換一排。
- 目前歌曲完整固定顯示。
- ScoreRenderer 依練習區寬度重新計算整首音符的水平位置。

## Playhead Timing
- 紅線位置改成 `currentBeat / totalBeats`。
- 不再依每段 local progress 計算。
- 不再有分段重置造成的突然加速。
- 關閉 playhead CSS transition。
- 每一 frame 直接顯示 Master Clock 對應的正確位置。
- 預備拍也改成線性移動，不使用 easing。

## Version
- 網站、README、VERSION、CHANGELOG 同步 V6.2.8。
