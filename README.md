# PIANO LEARNING V6.2.0

## Practice Engine Refactor
V6.2.0 不再把五線譜、節拍器、紅線、鍵盤與時間控制全部塞在同一個 app.js。

### 獨立模組
- `js/core/note-utils.js`：音名解析
- `js/score/score-model.js`：樂譜資料
- `js/score/score-renderer.js`：五線譜、音符、連桿渲染
- `js/practice/transport.js`：唯一 Master Clock
- `js/practice/playhead.js`：紅色拍點線
- `js/practice/score-scroller.js`：樂譜水平移動
- `js/practice/metronome.js`：節拍器
- `js/practice/keyboard.js`：底部琴鍵
- `js/practice/practice-controller.js`：練習流程協調
- `js/app.js`：UI 與模組組裝

## 預備四拍
1. 按開始時，第一個音符已停在正式拍點位置。
2. 紅線從畫面左側開始。
3. 1、2、3、4 四拍期間，紅線逐步移向第一個音符。
4. 第四拍完成後，紅線固定不動。
5. 樂譜才開始依 BPM 從右向左移動。

## 同步原則
所有練習物件都讀同一個 `Transport`：
- BPM
- 現在 beat
- count-in beat
- play / pause / stop
因此不再各自用不同 timer。

## 樂譜渲染
V6.2.0 重新調整：
- 五線比例
- 音符頭比例
- 符桿長度
- 升降記號
- 加線
- 八分音符 Beam slope 上限

特別限制 Beam 的傾斜角，避免之前出現超長黑色斜線。

## 錯誤
保留即時錯誤跳窗與錯誤診斷抽屜。
