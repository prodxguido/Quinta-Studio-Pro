// Exact pitch-class recognition. Never invent a full chord from one or two notes.
function detectHarmony(notes,templates,preferredRoot){
 const pc=n=>(n%12+12)%12,pcs=[...new Set(notes.map(n=>pc(n.pitch)))];
 if(pcs.length<3)return [];
 const bass=pc(Math.min(...notes.map(n=>n.pitch))),matches=[];
 for(let root=0;root<12;root++)for(const [q,intervals] of Object.entries(templates)){
  const target=[...new Set(intervals.map(n=>pc(n+root)))];
  if(target.length===pcs.length&&target.every(n=>pcs.includes(n)))matches.push({root,q,bass});
 }
 return matches.sort((a,b)=>(Number(b.root===preferredRoot)*2+Number(b.root===bass))-(Number(a.root===preferredRoot)*2+Number(a.root===bass)));
}
// Group near-simultaneous onsets (up to 60ms) while ignoring later melody notes.
function harmonyGroups(notes,tempo){
 const sorted=[...notes].sort((a,b)=>a.start-b.start),groups=[],tolerance=.06*tempo/60;
 for(const n of sorted){let g=groups.at(-1);if(!g||n.start-g.start>tolerance){g={start:n.start,notes:[]};groups.push(g)}g.notes.push(n)}
 return groups;
}
if(typeof module!=='undefined')module.exports={detectHarmony,harmonyGroups};
