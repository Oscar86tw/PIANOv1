
window.PianoPractice = window.PianoPractice || {};

PianoPractice.ScoreScroller = class ScoreScroller {
  constructor(track,renderer,playhead){
    this.track=track;
    this.renderer=renderer;
    this.playhead=playhead;
    this.baseX=0;
  }

  reset(){
    // At count-in start, beat 0 / first note is already waiting at the final judgment position.
    // The red line starts left and moves toward it during the four preparation beats.
    this.baseX=this.playhead.targetX()-this.renderer.CONTENT_START;
    this.track.style.transform=`translateX(${this.baseX}px)`;
  }

  update({phase,beat=0}){
    if(phase==="countin"||phase==="idle"){
      this.track.style.transform=`translateX(${this.baseX}px)`;
      return;
    }
    const x=this.baseX-beat*this.renderer.BEAT_PX;
    this.track.style.transform=`translateX(${x}px)`;
  }
};
