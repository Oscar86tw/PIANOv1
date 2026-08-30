
window.PianoScore = window.PianoScore || {};
PianoScore.SongLoader = class SongLoader {
  constructor(indexUrl="data/songs.json"){ this.indexUrl=indexUrl; this.index=null; this.cache=new Map(); }
  async loadIndex(){
    if(this.index) return this.index;
    const r=await fetch(this.indexUrl,{cache:"no-store"});
    if(!r.ok) throw new Error(`歌曲索引載入失敗：${r.status}`);
    this.index=await r.json();
    return this.index;
  }
  async list(){ return (await this.loadIndex()).songs||[]; }
  async load(id){
    if(this.cache.has(id)) return this.cache.get(id);
    const meta=(await this.list()).find(s=>s.id===id);
    if(!meta) throw new Error(`找不到歌曲：${id}`);
    const r=await fetch(meta.file,{cache:"no-store"});
    if(!r.ok) throw new Error(`歌曲檔案載入失敗：${meta.file} (${r.status})`);
    const data=await r.json();
    const model=new PianoScore.ScoreModel(data);
    model.id=data.id||id; model.composer=data.composer||meta.composer||""; model.category=data.category||meta.category||"";
    this.cache.set(id,model);
    return model;
  }
};
