# CHANGELOG — V6.1.4

## 已確認並修正的實際錯誤
錯誤：
`Uncaught TypeError: Cannot read properties of null (reading '3')`

原因：
- 樂譜資料使用 `Fs5`、`Cs5` 表示 F#5、C#5。
- V6.1.3 `diatonicStep()` / `nameToMidi()` 的正則只接受 `#`、`b`。
- 遇到 `Fs5` 時 Regex 回傳 null。
- 程式繼續讀取 `m[3]`，造成主程式初始化中斷。
- 因 renderScore() 在 DOMContentLoaded 初始化中拋錯，所以後面的按鈕事件沒有完成綁定，形成「整頁看得到但全部點不到」。

## V6.1.4 修正
- 新增統一 `parseNoteName()`。
- 支援 C4 / F#5 / Fs5 / Bb3。
- `nameToMidi()` 與 `diatonicStep()` 共用同一音名解析器。
- 升降記號不改變五線譜字母位置計算。
- 非法音名改成明確錯誤 `INVALID_NOTE_NAME`。
- 非法音名會送入網站即時錯誤診斷視窗。
- 保留 V6.1.3 的即時錯誤跳窗、超大五線譜與點擊遮罩修正。

## 版本
- 網站、VERSION、README、CHANGELOG 同步 V6.1.4。
