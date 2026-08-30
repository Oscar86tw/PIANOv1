
window.PianoPractice = window.PianoPractice || {};

PianoPractice.ScoreScroller = class ScoreScroller {
  constructor(track,renderer,playhead){
    this.track=track;
    this.renderer=renderer;
    this.playhead=playhead;
    this.timeline=null;
  }

  setTimeline(timeline){
    this.timeline=timeline;
    this.reset();
  }

  reset(){
    if(!this.timeline) return;

    // First note is waiting at the final judgment point.
    const x0=this.timeline.xAtBeat(0);
    const tx=this.playhead.targetX()-x0;
    this.track.style.transform=`translate3d(${tx}px,0,0)`;
  }

  update({phase,beat=0}){
    if(!this.timeline) return;

    if(phase==="idle"||phase==="countin"){
      this.reset();
      return;
    }

    const currentX=this.timeline.xAtBeat(beat);
    const tx=this.playhead.targetX()-currentX;

    // Score position is a direct function of musical beat, not an independent animation.
    this.track.style.transform=`translate3d(${tx}px,0,0)`;
  }
};
