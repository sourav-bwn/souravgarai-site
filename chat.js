(function(){var KB=window.KB||[],root=document.getElementById('bot');if(!root||!KB.length)return;
var stop='a an the is are was of to in on for and or do does did you your he his him sourav can what how who where when which about tell me i it with this that have has be any there'.split(' ');
function tok(s){return s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(function(w){return w&&stop.indexOf(w)<0})}
function stem(w){return w.replace(/(ing|es|s)$/,'')}
function find(q){var t=tok(q).map(stem),best=null,bs=0;if(!t.length)return null;KB.forEach(function(e){var k=tok(e.k).map(stem),sc=0;t.forEach(function(w){if(k.indexOf(w)>=0)sc+=2;else if(w.length>3&&k.some(function(x){return x.indexOf(w)===0||w.indexOf(x)===0&&x.length>3}))sc+=1});if(sc>bs){bs=sc;best=e}});return bs>=2?best:null}
root.innerHTML='<button class="bt" aria-label="Ask about Sourav">Ask</button><div class="bw" hidden><div class="bh"><b>Ask about Sourav</b><span>Answers come only from this site</span><button class="bx" aria-label="Close">×</button></div><div class="bm"></div><div class="bs"></div><form class="bf"><input placeholder="Ask a question..." aria-label="Your question" autocomplete="off"><button>Send</button></form></div>';
var bt=root.querySelector('.bt'),bw=root.querySelector('.bw'),bm=root.querySelector('.bm'),bs=root.querySelector('.bs'),fm=root.querySelector('form'),inp=fm.querySelector('input');
function add(t,who,l){var d=document.createElement('div');d.className='m '+who;d.textContent=t;if(l){var a=document.createElement('a');a.href=l[1];a.textContent=l[0]+' →';if(/^https?:/.test(l[1]))a.target='_blank';d.appendChild(document.createElement('br'));d.appendChild(a)}bm.appendChild(d);bm.scrollTop=bm.scrollHeight}
var sug=['What has he built?','What are his skills?','How do I hire him?','Where is the resume?'];
sug.forEach(function(s){var b=document.createElement('button');b.type='button';b.textContent=s;b.onclick=function(){ask(s)};bs.appendChild(b)});
function ask(q){add(q,'u');var e=find(q);if(e)add(e.a,'b',e.l);else add("I only know what is on this site, and I could not find that. Try asking about his projects, skills, services, education or how to contact him.",'b',['Contact','contact.html']);d()}
function d(){}
add("Hi. I answer questions about Sourav and his work using only what is written on this site.",'b');
fm.onsubmit=function(ev){ev.preventDefault();var q=inp.value.trim();if(!q)return;inp.value='';ask(q)};
bt.onclick=function(){bw.hidden=!bw.hidden;if(!bw.hidden)setTimeout(function(){inp.focus()},50)};root.querySelector('.bx').onclick=function(){bw.hidden=true};
})();
