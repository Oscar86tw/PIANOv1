# PIANO LEARNING V6.2.3

## 修正：換歌後仍顯示上一首樂譜
前一版歌曲清單只改了標題，真正的 ScoreModel 沒有換，所以樂譜、音符、BPM、鋼琴聲音仍是上一首。

V6.2.3 改成真正資料驅動：
- `data/songs/lesson-01.json`
- `data/songs/canon-demo.json`
- `data/songs/scale-01.json`
- `js/score/song-loader.js`

切換歌曲會同步更換：
1. ScoreModel
2. 五線譜與音符
3. BPM
4. totalBeats
5. 底部琴鍵事件
6. 鋼琴播放音符
7. 音源 preload

鋼琴聲音現在直接讀「目前歌曲的 ScoreModel event」，所以畫面音符與聲音是同一份資料來源。

拍照轉譜 OMR 尚未完成前，網站不會再拿舊 demo 樂譜假裝成新歌曲。
