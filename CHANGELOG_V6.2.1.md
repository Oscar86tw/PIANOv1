# CHANGELOG — V6.2.1

## Timing Sync
- Transport 改用 AudioContext.currentTime 當 Master Clock。
- Count-in 與正式播放使用同一條連續音樂時間軸。
- Metronome 改為排程到 Transport 的 AudioContext，不再靠 requestAnimationFrame 才發聲。
- ScoreScroller 改成 `X = judgmentLine - TimelineMap.xAtBeat(currentBeat)`。
- 拍子、紅線、樂譜、琴鍵共用同一 beat。
- BPM 改變時重新建立時間原點，減少節拍漂移。

## Notation
- 五線譜比例重新調整，不再只有單純放大。
- 左右手譜表增加明確間隔。
- 全音符 / 二分 / 四分 / 八分音符使用不同正確圖案。
- D Major 加入 F# / C# 調號。
- 避免在 F# / C# 音符前重複印升號。
- Beam slope 限制為小角度。
- Beam 只在同一拍內群組，避免跨太遠產生大斜線。
- 支援孤立八分音符 flag。
- 預留十六分音符雙 Beam。

## Architecture
- 新增 `js/score/timeline-map.js`。
- ScoreRenderer 回傳 TimelineMap 給 ScoreScroller。
- 未來改 VexFlow / MusicXML，不需要重寫 Transport。

## Version
- 網站、VERSION、README、CHANGELOG 同步 V6.2.1。
