# 安裝 Hi‑Fi 三角鋼琴音源（V6.1.0）

## 目標
GitHub Pages 仍維持輕量，但網站可使用真正錄製的 Yamaha C5 三角鋼琴聲音。

## 本版使用的 Web Profile
建議從 Salamander Grand Piano V3 製作 4 個力度層：

- v4：弱
- v8：中弱
- v11：中強
- v15：強

每層使用採樣根音：
A0, C1, D#1, F#1 ... 直到 C7（約 26 個根音），網站對中間琴鍵做 pitch interpolation。

完整四層 web 檔案約 20～25 MB 左右，遠低於把 1.18 GiB 原始 WAV 全部放進 GitHub Pages。

## 資料夾
assets/audio/piano/grand/
  v4/
  v8/
  v11/
  v15/
  manifest.json

檔名例如：
  C4v4.mp3
  C4v8.mp3
  C4v11.mp3
  C4v15.mp3

D# 在網址／檔案建議保存為：
  Ds4v11.mp3
或原始 D#4v11.mp3；若採原名，建置時要 URL encode。

## 啟用
音源放好後，把：
assets/audio/piano/grand/manifest.json

中的：
"installed": false

改成：
"installed": true

網站就會優先使用 Hi‑Fi profile；若檔案缺少，會自動回退 demo，不會整頁壞掉。

## 正式更高階方案
日後若空間足夠，可升級成：
- 8～16 velocity layers
- release samples
- pedal resonance
- round robin
- FLAC/Opus/OGG adaptive profile

但 GitHub Pages 初期建議先用四力度層。
