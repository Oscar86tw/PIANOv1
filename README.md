# PIANO LEARNING V6.2.8

## 整張樂譜模式
V6.2.8 取消 V6.2.7 的「每 4 拍切一段」。

現在：
- 整首目前歌曲一次完整顯示。
- 樂譜固定不動。
- 不會每 4 拍重新換頁／重畫。
- 紅線從歌曲開始位置一路移到歌曲結束位置。

## 紅線速度
修正 V6.2.7 看起來突然加速的問題。

舊方式：
- 每 4 拍把紅線 0% → 100%。
- 換段時重新計算，視覺上會有重置與速度變化。

新方式：
- `redLineProgress = currentBeat / totalBeats`
- currentBeat 直接由 Transport 的 AudioContext Master Clock 提供。
- 紅線沒有自己的 timer。
- CSS transition 關閉。
- BPM 60 就完全依 BPM 60 的 musical beat 走。
- BPM 改變時仍由 Transport 統一更新。

預備四拍：
- 紅線從左側準備區，等速移到歌曲第一拍位置。
- 第四拍完成後才進入正式歌曲時間。
