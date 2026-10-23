// Renders window.CERTS into any container with [data-certs]. data-limit=N caps the list.
// Per cert: n=name, i=issuer, d=date, x=description, v=issuer verify URL (optional),
// f=hosted certificate file path (optional proof).
(function(){
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function card(c){var links='';
if(c.v)links+='<a class="go" href="'+esc(c.v)+'" target="_blank" rel="noopener">Verify</a>';
if(c.f)links+='<a class="go" href="'+esc(c.f)+'" target="_blank" rel="noopener">View certificate</a>';
var img=c.img?'<a class="cimg" href="'+esc(c.img)+'" target="_blank" rel="noopener"><img src="'+esc(c.img)+'" alt="'+esc(c.n)+' certificate" loading="lazy"></a>':'';
return '<div class="card mid rv" data-nt data-k="'+c.k+'">'+img
+'<div class="ct"><span>'+esc(c.i)+'</span><span>'+esc(c.d)+'</span></div>'
+'<h3>'+esc(c.n)+'</h3>'
+'<p>'+esc(c.x)+'</p>'
+(links?'<div class="clinks">'+links+'</div>':'')
+'</div>'}
document.querySelectorAll('[data-certs]').forEach(function(g){
var lim=+g.getAttribute('data-limit')||0,list=window.CERTS||[];
if(lim>0)list=list.slice(0,lim);
g.innerHTML=list.map(card).join('');
});
// Keep any "All N certificates" count honest: fill [data-certs-count] with the
// real record count so the homepage can never drift from certs.js again.
document.querySelectorAll('[data-certs-count]').forEach(function(el){
el.textContent=String((window.CERTS||[]).length);
});
document.querySelectorAll('.fl').forEach(function(f){f.addEventListener('click',function(){
var k=f.dataset.f;
document.querySelectorAll('[data-certs] .card').forEach(function(c){c.classList.toggle('hide',k!=='all'&&c.dataset.k!==k)});
})});
})();
