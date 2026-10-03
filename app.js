(function(){
var d=document,root=d.documentElement,SH=/[?&]shot/.test(location.search),rm=SH||matchMedia('(prefers-reduced-motion:reduce)').matches;if(SH)root.classList.add('nm');
function $(s,c){return (c||d).querySelector(s)}function $$(s,c){return [].slice.call((c||d).querySelectorAll(s))}
// theme
var tg=$('.tog');if(tg)tg.onclick=function(){var t=root.dataset.theme==='light'?'dark':'light';root.dataset.theme=t;try{localStorage.setItem('sg-theme',t)}catch(e){}};
// burger
var bg=$('.burger'),nl=$('.nl');if(bg)bg.onclick=function(){nl.classList.toggle('open')};
(function(){var c=$('.nb-c'),b=$('.nb-b');if(c)c.onclick=function(){nl.classList.remove('open')};if(b)b.onclick=function(){nl.classList.remove('open');if(history.length>1&&d.referrer&&d.referrer.indexOf(location.host)>-1)history.back()}})();
// prefetch nav pages
setTimeout(function(){$$('.nl a[href]').forEach(function(a){var h=a.getAttribute('href');if(!h||h[0]==='#'||/^(https?:|mailto:|tel:)/.test(h))return;var l=d.createElement('link');l.rel='prefetch';l.href=h;d.head.appendChild(l)})},1200);
// loader once per session
var ld=$('#ld');function ready(){root.classList.add('ready');if(ld)ld.classList.add('off')}
var seen=0;try{seen=sessionStorage.getItem('sg-ld')}catch(e){}
if(ld&&!seen&&!rm){try{sessionStorage.setItem('sg-ld','1')}catch(e){}setTimeout(ready,650)}else{if(ld)ld.remove();root.classList.add('ready')}
// page wipe
var wp=$('#wipe');
if(wp&&!rm){if(d.referrer&&d.referrer.indexOf(location.host)>-1||history.length>1){wp.className='dn';setTimeout(function(){wp.className=''},450)}
$$('a[href]').forEach(function(a){var h=a.getAttribute('href');if(!h||h[0]==='#'||/^(https?:|mailto:|tel:)/.test(h)||a.target)return;a.addEventListener('click',function(e){if(e.metaKey||e.ctrlKey)return;e.preventDefault();wp.className='up';setTimeout(function(){location.href=h},260)})});
addEventListener('pageshow',function(e){if(e.persisted){wp.className=''}})}
// header+progress
var hd=$('header'),pr=$('#prog');function sc(){var y=scrollY,m=d.body.scrollHeight-innerHeight;if(hd)hd.classList.toggle('s',y>8);if(pr)pr.style.width=(m>0?y/m*100:0)+'%'}addEventListener('scroll',sc,{passive:true});sc();
// reveal
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);if(e.target.dataset.count!==undefined)cu(e.target)}})},{threshold:.12});
$$('.rv,.gg,[data-count]').forEach(function(x){io.observe(x)});
// count up
function cu(el){var to=+el.dataset.count,t0=null,dur=1400;if(rm){el.textContent=to;return}function f(t){if(!t0)t0=t;var p=Math.min((t-t0)/dur,1);el.textContent=Math.round(to*(1-Math.pow(1-p,4)));if(p<1)requestAnimationFrame(f)}requestAnimationFrame(f)}
// tilt + glow
if(matchMedia('(hover:hover)').matches&&!rm){$$('.card').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;c.style.setProperty('--mx',x+'px');c.style.setProperty('--my',y+'px');if(!c.dataset.nt)c.style.transform='perspective(900px) rotateX('+((y/r.height-.5)*-5)+'deg) rotateY('+((x/r.width-.5)*6)+'deg) translateY(-3px)'});c.addEventListener('pointerleave',function(){c.style.transform=''})});
// magnetic
$$('.btn.p').forEach(function(b){b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.translate=((e.clientX-r.left-r.width/2)*.2)+'px '+((e.clientY-r.top-r.height/2)*.3)+'px'});b.addEventListener('pointerleave',function(){b.style.translate=''})});
// cursor
var cu2=$('#cur');if(cu2){var cx=0,cy=0,tx=0,ty=0;addEventListener('pointermove',function(e){tx=e.clientX;ty=e.clientY;cu2.style.opacity=1});(function l(){cx+=(tx-cx)*.2;cy+=(ty-cy)*.2;cu2.style.transform='translate('+cx+'px,'+cy+'px)';requestAnimationFrame(l)})();$$('a,button,.card,.row').forEach(function(x){x.addEventListener('pointerenter',function(){cu2.classList.add('h')});x.addEventListener('pointerleave',function(){cu2.classList.remove('h')})})}}
// graph
var S=window.SG;$$('[data-graph]').forEach(function(g){if(!S)return;var n=+g.dataset.graph||S.days.length;if(innerWidth<700&&n>190)n=189;var days=S.days.slice(-n);g.style.gridTemplateColumns='none';var cols=Math.ceil(days.length/7);g.style.gridTemplateColumns='repeat('+cols+',1fr)';g.innerHTML=days.map(function(x,i){return '<i data-l="'+x[1]+'" title="'+x[2]+' contributions on '+x[0]+'" style="transition-delay:'+(i*3)+'ms"></i>'}).join('')});
$$('[data-ach]').forEach(function(el){if(!S)return;var seen={};el.innerHTML=S.ach.filter(function(a){return seen[a.name]?0:seen[a.name]=1}).map(function(a){return '<div class="bd"><img src="'+a.img+'" alt="'+a.name+' achievement" loading="lazy">'+a.name+'</div>'}).join('')});
$$('[data-fill]').forEach(function(el){if(!S)return;var k=el.dataset.fill;el.dataset.count=k==='total'?S.total:S.publicRepos});
// filters
$$('.fl').forEach(function(f){f.onclick=function(){$$('.fl').forEach(function(x){x.classList.remove('on')});f.classList.add('on');var t=f.dataset.f;$$('.row').forEach(function(r){r.classList.toggle('hide',t!=='all'&&r.dataset.t.indexOf(t)<0)})}});
// repos
var rl=$('#repos');if(rl&&S){rl.innerHTML=S.repos.map(function(r){return '<a class="rp rv" href="'+r.url+'" target="_blank" rel="noopener"><b>'+r.name+'</b><span>'+(r.desc||'')+'</span><em>'+(r.lang||'Docs')+' · '+r.created.slice(0,7)+'</em></a>'}).join('');$$('.rp',rl).forEach(function(x){io.observe(x)})}
// intake form -> mailto
var f=$('#intake');if(f)f.addEventListener('submit',function(e){e.preventDefault();var v=function(n){return f.elements[n].value.trim()};var body='Name: '+v('name')+'\nEmail: '+v('email')+'\nProject type: '+v('type')+'\n\n'+v('msg');location.href='mailto:souravgarai.bwn@gmail.com?subject='+encodeURIComponent('Project enquiry: '+v('type'))+'&body='+encodeURIComponent(body)});

// live GitHub refresh (falls back to baked numbers)
(function(){function put(n){$$('[data-fill=repos]').forEach(function(e){e.dataset.count=n;setTimeout(function(){if(e.classList.contains('in'))e.textContent=n},1700)})}
try{var c=JSON.parse(localStorage.getItem('sg-gh')||'null');if(c&&Date.now()-c.t<36e5){if(c.r)put(c.r);return}}catch(e){}
fetch('https://api.github.com/users/sourav-bwn').then(function(r){return r.ok?r.json():null}).then(function(u){if(!u||!u.public_repos)return;put(u.public_repos);try{localStorage.setItem('sg-gh',JSON.stringify({t:Date.now(),r:u.public_repos}))}catch(e){}}).catch(function(){})})();
})();
(function(){function ln(){var m=document.querySelector('.mt'),i=m&&m.querySelector('.mt-idx'),h=m&&m.querySelector('.hx-b');if(!h)return;var l=m.querySelector('.mt-ln');if(!l){l=document.createElement('div');l.className='mt-ln';m.appendChild(l)}var M=m.getBoundingClientRect(),I=i.getBoundingClientRect(),H=h.getBoundingClientRect();l.style.left=(I.left+I.width/2-M.left)+'px';l.style.top=(I.bottom-M.top+4)+'px';l.style.height=Math.max(0,H.top-I.bottom-4)+'px'}
addEventListener('load',ln);addEventListener('resize',ln);setTimeout(ln,600);setTimeout(ln,2000)})();
