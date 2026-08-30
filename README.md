# PIANO LEARNING V6.2.1

## 本版修正重點

### 1. 拍子與樂譜移動改成真正同一個時間軸
V6.2.1 的 `Transport` 使用 Web Audio `AudioContext.currentTime` 作為 Master Clock。

- 節拍器：排程到同一個 AudioContext 時間點
- 樂譜位置：直接由目前 musical beat 計算
- 紅線：只負責預備與固定拍點
- 琴鍵：讀同一個 beat
- BPM：由 Transport 統一管理

樂譜不再用一個獨立「每秒移動多少 px」的動畫計時器。

### 2. 新增 TimelineMap
`js/score/timeline-map.js`

ScoreScroller 不再自己假設固定速度，而是問：
`現在這個 beat 在樂譜的哪個 X？`

之後即使改成 MusicXML / VexFlow，音符排版不是完全等距，也可以把真正的音符 X 座標放進 TimelineMap，練習時間軸不需要重寫。

### 3. 音符圖案重新整理
之前自製 SVG 最大的問題是所有音值都畫成同一種黑色音頭。

V6.2.1 修正：
- 全音符：空心、沒有符桿
- 二分音符：空心、有符桿
- 四分音符：實心、有符桿
- 八分音符：實心、符桿、Beam / Flag
- 十六分音符：預留雙 Beam
- Beam 斜率限制更嚴格，避免出現巨型黑色斜線
- 升降記號獨立處理
- D Major 使用正式 F# / C# 調號，F# / C# 音符不重複顯示臨時升號

### 4. 左右手五線譜間距
左右手不再黏在一起。

本版使用：
- Right-hand staff
- 明確 system gap
- Left-hand staff

即使放大練習譜，也能一眼分辨左右手。

## 後續
目前仍是網站自己的 SVG engraving engine。
若要做到出版級樂譜的所有細節，下一階段可把 `ScoreRenderer` 換成 VexFlow / MusicXML renderer；
由於已經有 `TimelineMap`，Transport、節拍器、鍵盤、評分不必跟著重寫。
