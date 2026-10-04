(function(){
var API='https://video-api-gjmr.onrender.com';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function fmt(n){if(n<1024)return n+' B';if(n<1048576)return (n/1024).toFixed(0)+' KB';return (n/1048576).toFixed(1)+' MB'}
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('Could not load a library. Check your connection.'))};document.head.appendChild(s)})}
var libs={};
function needLib(k){
  if(libs[k])return libs[k];
  if(k==='pdflib')libs[k]=window.PDFLib?Promise.resolve():loadScript('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js');
  else libs[k]=window.pdfjsLib?Promise.resolve():loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js').then(function(){pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'});
  libs[k].catch(function(){libs[k]=null});
  return libs[k];
}
function save(blob,name){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},4000)}

/* tabs */
var tabs=$$('.tab'),panels=$$('.tp');
function show(id){var vw=$('#viewer');if(vw)vw.hidden=false;tabs.forEach(function(t){t.classList.toggle('on',t.dataset.t===id)});panels.forEach(function(p){p.hidden=p.id!=='tp-'+id});if(id==='video')wake();if(id==='news')loadNews();try{history.replaceState(null,'','#'+id)}catch(e){}}
tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.t)})});

/* ---------- VIDEO ---------- */
var woke=false,srv=$('#v-srv');
function wake(){
  if(woke||!API)return;woke=true;
  srv.textContent='Server waking up…';srv.className='srv';
  var t0=Date.now();
  fetch(API+'/api/ping',{cache:'no-store'}).then(function(r){return r.json()}).then(function(){srv.textContent='Server ready';srv.className='srv ok'}).catch(function(){srv.textContent='Server not reachable';srv.className='srv bad';woke=false});
}
var vState={url:'',q:null,info:null};
var vin=$('#v-url'),vbtn=$('#v-fetch'),vmsg=$('#v-msg'),vres=$('#v-res');
function vErr(m){vmsg.innerHTML='<div class="err">'+esc(m)+'</div>'}
function dur(s){if(!s)return '';var m=Math.floor(s/60),x=Math.floor(s%60);return m+':'+(x<10?'0':'')+x}
vbtn.addEventListener('click',function(){
  var u=vin.value.trim();vmsg.innerHTML='';vres.innerHTML='';vres.hidden=true;
  if(!/^https?:\/\/\S+$/i.test(u)){vErr('Paste a full video link that starts with http or https.');return}
  vState.url=u;vbtn.disabled=true;vbtn.textContent='Checking…';
  vmsg.innerHTML='<div class="note">Looking up the video. If the server was asleep this can take up to a minute.</div>';
  var ctl=new AbortController();var to=setTimeout(function(){ctl.abort()},100000);
  fetch(API+'/api/info?url='+encodeURIComponent(u),{signal:ctl.signal}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})}).then(function(x){
    clearTimeout(to);vbtn.disabled=false;vbtn.textContent='Fetch';
    if(!x.ok){vErr(x.j&&x.j.message||'Could not read this link.');return}
    vmsg.innerHTML='';renderVideo(x.j)
  }).catch(function(e){clearTimeout(to);vbtn.disabled=false;vbtn.textContent='Fetch';vErr(e.name==='AbortError'?'The server took too long to answer. Try again in a minute.':'Could not reach the download server. Try again in a minute.')});
});
vin.addEventListener('keydown',function(e){if(e.key==='Enter')vbtn.click()});
function renderVideo(i){
  vState.info=i;
  var opts=[];(i.heights||[]).forEach(function(h){opts.push([String(h),h+'p','MP4'])});
  if(!opts.length)opts.push(['best','Best available','MP4']);
  opts.push(['audio','Audio only','MP3']);
  vState.q=opts.some(function(o){return o[0]==='720'})?'720':opts[0][0];
  var h='<div class="pv">'+(i.thumbnail?'<img class="th" src="'+esc(i.thumbnail)+'" alt="" referrerpolicy="no-referrer" loading="lazy">':'<div class="th">▶</div>')+'<div><b>'+esc(i.title||'Video')+'</b><small>'+esc([i.uploader,dur(i.duration),i.site].filter(Boolean).join(' · '))+'</small></div></div>';
  h+='<div class="qs">'+opts.map(function(o){return '<button type="button" class="q'+(o[0]===vState.q?' on':'')+'" data-q="'+o[0]+'"><b>'+o[1]+'</b><small>'+o[2]+'</small></button>'}).join('')+'</div>';
  h+='<button type="button" class="btn p wide" id="v-dl"></button><div id="v-prog" hidden><div class="pr"><i></i></div><div class="note" id="v-ptxt"></div></div>';
  vres.innerHTML=h;vres.hidden=false;
  var dl=$('#v-dl');function lbl(){var o=opts.filter(function(x){return x[0]===vState.q})[0];dl.textContent='⬇ Download '+o[1]}lbl();
  $$('.q',vres).forEach(function(b){b.addEventListener('click',function(){vState.q=b.dataset.q;$$('.q',vres).forEach(function(x){x.classList.toggle('on',x===b)});lbl()})});
  dl.addEventListener('click',function(){download(dl)});
}
function download(btn){
  var prog=$('#v-prog'),bar=$('#v-prog .pr i'),txt=$('#v-ptxt');
  btn.disabled=true;prog.hidden=false;bar.style.width='6%';bar.classList.add('ind');txt.textContent='Preparing your file on the server. Longer videos take longer.';vmsg.innerHTML='';
  fetch(API+'/api/download?url='+encodeURIComponent(vState.url)+'&q='+vState.q).then(function(r){
    var ct=r.headers.get('Content-Type')||'';
    if(!r.ok||ct.indexOf('json')>-1){return r.json().then(function(j){throw new Error(j.message||'Download failed.')})}
    var name='video';var cd=r.headers.get('Content-Disposition')||'';var m=/filename\*?=(?:UTF-8'')?"?([^";]+)/i.exec(cd);if(m){try{name=decodeURIComponent(m[1])}catch(e){name=m[1]}}
    var total=+r.headers.get('Content-Length')||0,got=0,parts=[];bar.classList.remove('ind');
    if(!r.body||!r.body.getReader)return r.blob().then(function(b){return {b:b,name:name}});
    var rd=r.body.getReader();
    function pump(){return rd.read().then(function(x){if(x.done)return {b:new Blob(parts),name:name};parts.push(x.value);got+=x.value.length;if(total){var p=Math.round(got/total*100);bar.style.width=p+'%';txt.textContent='Downloading… '+p+'% ('+fmt(got)+' of '+fmt(total)+')'}else txt.textContent='Downloading… '+fmt(got);return pump()})}
    return pump();
  }).then(function(x){bar.style.width='100%';txt.textContent='Done. Saved '+fmt(x.b.size)+'.';save(x.b,x.name);btn.disabled=false}).catch(function(e){bar.classList.remove('ind');prog.hidden=true;btn.disabled=false;vErr(e.message==='Failed to fetch'?'Could not reach the download server. Try again in a minute.':e.message)});
}

/* ---------- NEWS ---------- */
var CATS=[['india','India'],['world','World'],['tech','Tech'],['sports','Sports'],['movies','Movies'],['ai','AI News'],['trending','Trending'],['github','GitHub']];
var nData=null,nCat='india',nLoading=false;
function ago(d){if(!d)return '';var m=Math.round((Date.now()-new Date(d).getTime())/60000);if(m<2)return 'just now';if(m<60)return m+' min ago';var h=Math.round(m/60);if(h<24)return h+' h ago';return Math.round(h/24)+' d ago'}
function loadNews(){
  if(nData||nLoading)return;nLoading=true;
  fetch('news.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){nData=j;nLoading=false;drawNews()}).catch(function(){nLoading=false;$('#n-list').innerHTML='<div class="err">Could not load today\'s digest. Try again in a bit.</div>'});
}
function drawNews(){
  $('#n-cats').innerHTML=CATS.map(function(c){return '<button type="button" class="cat'+(c[0]===nCat?' on':'')+'" data-c="'+c[0]+'">'+c[1]+'</button>'}).join('');
  $$('#n-cats .cat').forEach(function(b){b.addEventListener('click',function(){nCat=b.dataset.c;drawNews()})});
  var l=(nData.c[nCat]||[]);
  $('#n-list').innerHTML=l.length?l.map(function(s,i){return '<a class="st" href="'+esc(s.u)+'" target="_blank" rel="noopener"><span class="n">'+(i+1)+'</span><div><b>'+esc(s.t)+'</b>'+(s.x?'<small class="dsc">'+esc(s.x)+'</small>':'')+'<small>'+esc([s.s,ago(s.d)].filter(Boolean).join(' · '))+'</small></div></a>'}).join(''):'<div class="err">Nothing here right now.</div>';
  try{var d=new Date(nData.updated);$('#n-up').textContent='Updated '+d.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})+' IST. Headlines link to the original publishers.'}catch(e){}
}

/* ---------- PDF ---------- */
var pOp='merge',pFiles=[],pBusy=false;
var OPS={merge:{t:'Merge',d:'Combine PDFs in the order you set.',multi:true,acc:'application/pdf',cta:'Merge'},split:{t:'Split',d:'Pull out pages or a range from one PDF.',multi:false,acc:'application/pdf',cta:'Extract pages'},compress:{t:'Compress',d:'Shrink a PDF by re-saving its pages as images.',multi:false,acc:'application/pdf',cta:'Compress'},img2pdf:{t:'Images to PDF',d:'Turn photos into one PDF.',multi:true,acc:'image/*',cta:'Create PDF'},pdf2img:{t:'PDF to images',d:'Save every page as a picture.',multi:false,acc:'application/pdf',cta:'Convert'}};
var pTiles=$('#p-tiles'),pDrop=$('#p-drop'),pIn=$('#p-in'),pList=$('#p-list'),pOpt=$('#p-opt'),pGo=$('#p-go'),pOut=$('#p-out');
pTiles.innerHTML=Object.keys(OPS).map(function(k){return '<button type="button" class="tl'+(k===pOp?' on':'')+'" data-o="'+k+'"><b>'+OPS[k].t+'</b><small>'+OPS[k].d+'</small></button>'}).join('');
$$('.tl',pTiles).forEach(function(b){b.addEventListener('click',function(){pOp=b.dataset.o;pFiles=[];$$('.tl',pTiles).forEach(function(x){x.classList.toggle('on',x===b)});pOut.innerHTML='';pSetup()})});
function pSetup(){var o=OPS[pOp];pIn.accept=o.acc;pIn.multiple=o.multi;$('#p-dt').textContent=o.multi?'＋ Drop files here or tap to choose':'＋ Drop a file here or tap to choose';pOpts();pDraw()}
function pOpts(){
  if(pOp==='split')pOpt.innerHTML='<label class="fld">Pages to keep<input id="o-range" type="text" inputmode="text" placeholder="e.g. 1-3, 5, 8-10"></label>';
  else if(pOp==='compress')pOpt.innerHTML='<div class="qs"><button type="button" class="q" data-l="low"><b>Smallest</b><small>Lower quality</small></button><button type="button" class="q on" data-l="mid"><b>Balanced</b><small>Good for most</small></button><button type="button" class="q" data-l="high"><b>Sharper</b><small>Bigger file</small></button></div><div class="note">Compress turns each page into an image, so text can no longer be selected or searched.</div>';
  else if(pOp==='pdf2img')pOpt.innerHTML='<div class="note">Up to 40 pages. Each page is saved as a PNG.</div>';
  else pOpt.innerHTML='';
  $$('.q',pOpt).forEach(function(b){b.addEventListener('click',function(){$$('.q',pOpt).forEach(function(x){x.classList.toggle('on',x===b)})})});
}
function addFiles(list){
  var o=OPS[pOp];list=[].slice.call(list);
  list=list.filter(function(f){return o.acc==='image/*'?/^image\//.test(f.type):(f.type==='application/pdf'||/\.pdf$/i.test(f.name))});
  if(!list.length){pOut.innerHTML='<div class="err">That file type does not fit this tool.</div>';return}
  pOut.innerHTML='';
  if(!o.multi)pFiles=[];
  list.forEach(function(f){pFiles.push({f:f,pages:null})});pDraw();
  if(o.acc!=='image/*')needLib('pdflib').then(function(){return Promise.all(pFiles.map(function(x){if(x.pages!=null)return;return x.f.arrayBuffer().then(function(b){return PDFLib.PDFDocument.load(b,{ignoreEncryption:true})}).then(function(d){x.pages=d.getPageCount()}).catch(function(){x.pages=-1})}))}).then(pDraw).catch(function(){});
}
pDrop.addEventListener('click',function(){pIn.click()});
pIn.addEventListener('change',function(){addFiles(pIn.files);pIn.value=''});
['dragover','dragenter'].forEach(function(e){pDrop.addEventListener(e,function(ev){ev.preventDefault();pDrop.classList.add('hot')})});
['dragleave','drop'].forEach(function(e){pDrop.addEventListener(e,function(ev){ev.preventDefault();pDrop.classList.remove('hot')})});
pDrop.addEventListener('drop',function(ev){addFiles(ev.dataTransfer.files)});
function pDraw(){
  pList.innerHTML=pFiles.map(function(x,i){var meta=fmt(x.f.size)+(x.pages>0?' · '+x.pages+' page'+(x.pages>1?'s':''):x.pages===-1?' · could not read':'');
    return '<div class="fl"><span class="pg">'+(OPS[pOp].acc==='image/*'?'IMG':'PDF')+'</span><div class="fn"><b>'+esc(x.f.name)+'</b><small>'+meta+'</small></div><div class="ctl">'+(OPS[pOp].multi&&pFiles.length>1?'<button type="button" data-a="up" data-i="'+i+'" aria-label="Move up">↑</button><button type="button" data-a="dn" data-i="'+i+'" aria-label="Move down">↓</button>':'')+'<button type="button" data-a="rm" data-i="'+i+'" aria-label="Remove">✕</button></div></div>'}).join('');
  $$('.ctl button',pList).forEach(function(b){b.addEventListener('click',function(){var i=+b.dataset.i,a=b.dataset.a;if(a==='rm')pFiles.splice(i,1);else if(a==='up'&&i>0){var t=pFiles[i];pFiles[i]=pFiles[i-1];pFiles[i-1]=t}else if(a==='dn'&&i<pFiles.length-1){var t2=pFiles[i];pFiles[i]=pFiles[i+1];pFiles[i+1]=t2}pDraw()})});
  var n=pFiles.length,need=(pOp==='merge')?2:1;
  pGo.hidden=n<need;pGo.disabled=pBusy;
  pGo.textContent=OPS[pOp].cta+(pOp==='merge'?' '+n+' files':'')+' →';
}
function status(t,pct){pOut.innerHTML='<div class="pr"><i'+(pct==null?' class="ind"':' style="width:'+pct+'%"')+'></i></div><div class="note">'+esc(t)+'</div>'}
function result(blob,name,extra){pOut.innerHTML='<div class="done"><b>Ready</b><small>'+esc(name)+' · '+fmt(blob.size)+(extra?' · '+esc(extra):'')+'</small><button type="button" class="btn p wide" id="p-dl">⬇ Download</button></div>';$('#p-dl').addEventListener('click',function(){save(blob,name)})}
function pErr(e){pOut.innerHTML='<div class="err">'+esc(e&&e.message||'Something went wrong with that file. It may be damaged or protected by a password.')+'</div>'}
function baseName(n){return n.replace(/\.[^.]+$/,'')}
function parseRange(s,max){
  var set=[];s.split(',').forEach(function(p){p=p.trim();if(!p)return;var m=/^(\d+)(?:\s*-\s*(\d+))?$/.exec(p);if(!m)throw new Error('Use page numbers like 1-3, 5, 8-10.');var a=+m[1],b=m[2]?+m[2]:a;if(a<1||b<a||b>max)throw new Error('That range is outside the document ('+max+' pages).');for(var i=a;i<=b;i++)set.push(i-1)});
  if(!set.length)throw new Error('Enter the pages you want to keep.');return set}
pGo.addEventListener('click',function(){
  if(pBusy)return;pBusy=true;pGo.disabled=true;status('Loading tools…');
  var run=({merge:doMerge,split:doSplit,compress:doCompress,img2pdf:doImg,pdf2img:doP2I})[pOp];
  Promise.resolve().then(run).catch(pErr).then(function(){pBusy=false;pGo.disabled=false});
});
function doMerge(){return needLib('pdflib').then(function(){return PDFLib.PDFDocument.create()}).then(function(out){
  var i=0;function next(){if(i>=pFiles.length)return out.save();var f=pFiles[i++].f;status('Adding '+f.name+'…',Math.round(i/pFiles.length*90));return f.arrayBuffer().then(function(b){return PDFLib.PDFDocument.load(b,{ignoreEncryption:true})}).then(function(d){return out.copyPages(d,d.getPageIndices())}).then(function(pgs){pgs.forEach(function(p){out.addPage(p)});return next()})}
  return next()}).then(function(bytes){result(new Blob([bytes],{type:'application/pdf'}),'merged.pdf')})}
function doSplit(){var f=pFiles[0].f,rng=$('#o-range').value;return needLib('pdflib').then(function(){return f.arrayBuffer()}).then(function(b){return PDFLib.PDFDocument.load(b,{ignoreEncryption:true})}).then(function(d){var idx=parseRange(rng,d.getPageCount());return PDFLib.PDFDocument.create().then(function(o){return o.copyPages(d,idx).then(function(pgs){pgs.forEach(function(p){o.addPage(p)});return o.save()})}).then(function(bytes){result(new Blob([bytes],{type:'application/pdf'}),baseName(f.name)+'-pages.pdf',idx.length+' page'+(idx.length>1?'s':''))})})}
function renderPage(pdf,n,scale,type,q){return pdf.getPage(n).then(function(pg){var vp=pg.getViewport({scale:scale});var c=document.createElement('canvas');c.width=Math.floor(vp.width);c.height=Math.floor(vp.height);var ctx=c.getContext('2d');if(type==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height)}return pg.render({canvasContext:ctx,viewport:vp}).promise.then(function(){return new Promise(function(res){c.toBlob(function(b){res({blob:b,w:c.width,h:c.height,pw:pg.getViewport({scale:1}).width,ph:pg.getViewport({scale:1}).height})},type,q)})})})}
function doCompress(){var f=pFiles[0].f,lv=($('.q.on',pOpt)||{dataset:{l:'mid'}}).dataset.l,cfg={low:[1.0,.5],mid:[1.4,.65],high:[1.9,.8]}[lv];
  return Promise.all([needLib('pdflib'),needLib('pdfjs')]).then(function(){return f.arrayBuffer()}).then(function(buf){return pdfjsLib.getDocument({data:buf.slice(0)}).promise.then(function(pdf){return PDFLib.PDFDocument.create().then(function(out){var N=pdf.numPages,i=1;function next(){if(i>N)return out.save();status('Compressing page '+i+' of '+N+'…',Math.round((i-1)/N*95));var n=i++;return renderPage(pdf,n,cfg[0],'image/jpeg',cfg[1]).then(function(r){return r.blob.arrayBuffer().then(function(ab){return out.embedJpg(ab)}).then(function(img){var p=out.addPage([r.pw,r.ph]);p.drawImage(img,{x:0,y:0,width:r.pw,height:r.ph})})}).then(next)}return next()})})}).then(function(bytes){var b=new Blob([bytes],{type:'application/pdf'});
    if(b.size>=f.size){pOut.innerHTML='<div class="err">This file is already small. Compressing would make it bigger ('+fmt(f.size)+' to '+fmt(b.size)+'), so nothing was changed. Try the Smallest setting or keep the original.</div>';return}
    result(b,baseName(f.name)+'-compressed.pdf',fmt(f.size)+' → '+fmt(b.size)+' (-'+Math.round((1-b.size/f.size)*100)+'%)')})}
function doImg(){return needLib('pdflib').then(function(){return PDFLib.PDFDocument.create()}).then(function(out){var i=0;function next(){if(i>=pFiles.length)return out.save();var f=pFiles[i++].f;status('Adding '+f.name+'…',Math.round(i/pFiles.length*90));return f.arrayBuffer().then(function(ab){if(/jpe?g$/i.test(f.type))return out.embedJpg(ab);if(/png$/i.test(f.type))return out.embedPng(ab);return toJpg(f).then(function(b){return b.arrayBuffer()}).then(function(x){return out.embedJpg(x)})}).then(function(img){var p=out.addPage([img.width,img.height]);p.drawImage(img,{x:0,y:0,width:img.width,height:img.height})}).then(next)}return next()}).then(function(bytes){result(new Blob([bytes],{type:'application/pdf'}),'images.pdf',pFiles.length+' page'+(pFiles.length>1?'s':''))})}
function toJpg(f){return new Promise(function(res,rej){var im=new Image();im.onload=function(){var c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0);c.toBlob(res,'image/jpeg',.9)};im.onerror=function(){rej(new Error('Could not read '+f.name+'.'))};im.src=URL.createObjectURL(f)})}
function doP2I(){var f=pFiles[0].f;return needLib('pdfjs').then(function(){return f.arrayBuffer()}).then(function(buf){return pdfjsLib.getDocument({data:buf}).promise}).then(function(pdf){var N=Math.min(pdf.numPages,40),i=1,out=[];function next(){if(i>N)return out;status('Rendering page '+i+' of '+N+'…',Math.round((i-1)/N*95));var n=i++;return renderPage(pdf,n,2,'image/png').then(function(r){out.push({n:n,b:r.blob});return next()})}return next().then(function(imgs){
    pOut.innerHTML='<div class="done"><b>'+imgs.length+' image'+(imgs.length>1?'s':'')+' ready'+(pdf.numPages>N?' (first 40 pages)':'')+'</b><div class="thumbs">'+imgs.map(function(x){return '<button type="button" class="tn" data-n="'+x.n+'"><img alt="Page '+x.n+'" src="'+URL.createObjectURL(x.b)+'"><small>Page '+x.n+' · '+fmt(x.b.size)+'</small></button>'}).join('')+'</div><button type="button" class="btn p wide" id="p-all">⬇ Download all</button></div>';
    var byN={};imgs.forEach(function(x){byN[x.n]=x.b});var base=baseName(f.name);
    $$('.tn',pOut).forEach(function(b){b.addEventListener('click',function(){save(byN[b.dataset.n],base+'-page-'+b.dataset.n+'.png')})});
    $('#p-all').addEventListener('click',function(){imgs.forEach(function(x,k){setTimeout(function(){save(x.b,base+'-page-'+x.n+'.png')},k*350)})})})})}
pSetup();
var h=(location.hash||'').slice(1);
if(['video','news','pdf'].indexOf(h)>-1){show(h);setTimeout(function(){var v=$('#viewer');if(v)v.scrollIntoView({behavior:'smooth',block:'start'})},300)}
$$('[data-open]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();show(a.dataset.open);var v=$('#viewer');if(v)v.scrollIntoView({behavior:'smooth',block:'start'})})});
$$('.fbtn').forEach(function(b){b.addEventListener('click',function(){var f=b.dataset.f;$$('.fbtn').forEach(function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false')});$$('.tool-directory a').forEach(function(a){a.hidden=!(f==='all'||a.dataset.cat===f)})})});
})();
