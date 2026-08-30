
window.PianoScore = window.PianoScore || {};

/**
 * Beat <-> X mapping.
 * ScoreScroller no longer assumes "pixels per beat".
 * It asks this object where the musical beat actually lives on the rendered score.
 * Future VexFlow / MusicXML renderers can provide non-linear anchors without changing playback.
 */
PianoScore.TimelineMap = class TimelineMap {
  constructor(anchors=[]){
    this.setAnchors(anchors);
  }

  setAnchors(anchors){
    this.anchors=[...anchors]
      .filter(a=>Number.isFinite(a.beat)&&Number.isFinite(a.x))
      .sort((a,b)=>a.beat-b.beat);

    if(this.anchors.length<2){
      this.anchors=[{beat:0,x:0},{beat:1,x:1}];
    }
  }

  xAtBeat(beat){
    const b=Number(beat)||0;
    const a=this.anchors;

    if(b<=a[0].beat){
      const p=a[0],q=a[1];
      return p.x+(b-p.beat)*(q.x-p.x)/(q.beat-p.beat||1);
    }

    for(let i=1;i<a.length;i++){
      if(b<=a[i].beat){
        const p=a[i-1],q=a[i];
        const t=(b-p.beat)/(q.beat-p.beat||1);
        return p.x+(q.x-p.x)*t;
      }
    }

    const p=a[a.length-2],q=a[a.length-1];
    return q.x+(b-q.beat)*(q.x-p.x)/(q.beat-p.beat||1);
  }
};
