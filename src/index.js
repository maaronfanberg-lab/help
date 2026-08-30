const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#06110c">
<title>City Scanner</title>
<style>
:root{color-scheme:dark;--bg:#06110c;--panel:#0d1d15;--line:#214431;--text:#ecfff4;--muted:#8eaa9a;--green:#65ffae;--red:#ff5d73}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 50% -10%,#173b29 0,#06110c 44%);color:var(--text);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.app{max-width:760px;margin:auto;padding:calc(22px + env(safe-area-inset-top)) 16px calc(120px + env(safe-area-inset-bottom))}.top{display:flex;justify-content:space-between;align-items:center}.brand{letter-spacing:.2em;color:var(--green);font-size:13px}.live{font-size:12px;color:#cbe6d6;display:flex;gap:7px;align-items:center}.dot{width:9px;height:9px;border-radius:50%;background:var(--red);box-shadow:0 0 12px var(--red)}h1{font:700 36px/1 system-ui,sans-serif;margin:28px 0 10px}.sub{color:var(--muted);font:14px/1.55 system-ui,sans-serif;margin:0 0 22px}.search{display:grid;grid-template-columns:1fr auto;gap:8px}.search input,.direct input{width:100%;padding:16px;border-radius:14px;border:1px solid var(--line);background:#081710;color:var(--text);font-size:16px;outline:none}.search input:focus,.direct input:focus{border-color:var(--green)}button{border:0;border-radius:13px;padding:0 17px;background:var(--green);color:#03140b;font-weight:800}.meter{height:78px;border:1px solid var(--line);border-radius:16px;margin:18px 0 24px;padding:14px;display:flex;gap:4px;align-items:end;background:#09170f}.bar{width:5px;background:var(--green);border-radius:4px 4px 0 0}.section{margin-top:22px}.section h2{font-size:12px;letter-spacing:.16em;color:#a8c7b6;text-transform:uppercase}.card,.empty{border:1px solid var(--line);border-radius:16px;padding:16px;background:linear-gradient(145deg,#10231a,#09170f);margin:9px 0}.empty{color:var(--muted);font:14px/1.5 system-ui,sans-serif}.name{font:600 16px system-ui,sans-serif}.meta{color:var(--muted);font:12px/1.45 system-ui,sans-serif;margin-top:5px}.actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.link{display:block;text-align:center;text-decoration:none;color:#e6fff1;border:1px solid var(--line);background:#0c1d14;border-radius:13px;padding:13px;font:600 13px system-ui,sans-serif}.direct{display:grid;grid-template-columns:1fr auto;gap:8px}.status{min-height:18px;margin-top:8px;color:var(--muted);font:12px system-ui,sans-serif}.player{display:none;position:fixed;left:50%;bottom:0;transform:translateX(-50%);width:min(760px,100%);padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:#0a1811f2;border-top:1px solid var(--line);backdrop-filter:blur(14px)}.player.show{display:block}.now{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px}.stop{background:#21372b;color:#eafff2;padding:7px 11px}.nowname{font:600 13px system-ui,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}audio{width:100%;height:38px}.fine{font:11px/1.45 system-ui,sans-serif;color:#6f8e7d;margin-top:14px}
</style>
</head>
<body>
<main class="app">
<div class="top"><div class="brand">CITY SCANNER</div><div class="live"><span class="dot"></span>LIVE AUDIO</div></div>
<h1>Pick a place. Hear what is live.</h1>
<p class="sub">Search a U.S. city, town, county or ZIP. This app is built for internet-accessible public scanner feeds and provider APIs, without requiring SDR hardware.</p>
<div class="search"><input id="place" placeholder="City, town, county or ZIP"><button id="scan">SCAN</button></div>
<div class="meter" id="meter"></div>
<section class="section"><h2 id="heading">Available sources</h2><div id="result" class="empty">Search a place to find live scanner sources.</div><div class="actions" id="actions" hidden><a class="link" id="broadcastify" target="_blank" rel="noopener">Broadcastify live feeds</a><a class="link" id="scannerRadio" target="_blank" rel="noopener">Scanner Radio directory</a></div></section>
<section class="section"><h2>Direct live stream</h2><div class="direct"><input id="stream" placeholder="Public MP3 / AAC / HLS URL"><button id="play">PLAY</button></div><div class="status" id="status"></div><div class="fine">Official provider APIs that require credentials can be added as Cloudflare Worker secrets. The app will not invent streams that do not exist or bypass encrypted radio traffic.</div></section>
</main>
<div class="player" id="player"><div class="now"><div class="nowname" id="now">Live stream</div><button class="stop" id="stop">STOP</button></div><audio id="audio" controls playsinline></audio></div>
<script>
const $=s=>document.querySelector(s),meter=$('#meter'),place=$('#place'),result=$('#result'),actions=$('#actions'),audio=$('#audio'),player=$('#player'),status=$('#status');
for(let i=0;i<42;i++){const b=document.createElement('i');b.className='bar';b.style.height=(8+Math.random()*52)+'px';meter.appendChild(b)}
setInterval(()=>[...meter.children].forEach((b,i)=>b.style.height=(8+Math.abs(Math.sin(Date.now()/420+i*.63))*54)+'px'),430);
function scan(){const p=place.value.trim();if(!p)return;localStorage.setItem('cityScanner:place',p);$('#heading').textContent='Available sources · '+p;result.className='card';result.innerHTML='<div class="name">Public live-feed directories</div><div class="meta">Open a directory to choose a currently available feed for this location. Direct API results will appear here when provider credentials are connected.</div>';actions.hidden=false;$('#broadcastify').href='https://www.broadcastify.com/listen/?q='+encodeURIComponent(p);$('#scannerRadio').href='https://scannerradio.app/?q='+encodeURIComponent(p)}
$('#scan').onclick=scan;place.onkeydown=e=>{if(e.key==='Enter')scan()};
$('#play').onclick=()=>{const u=$('#stream').value.trim();if(!/^https?:\/\//i.test(u)){status.textContent='Enter a valid public stream URL.';return}audio.src=u;$('#now').textContent=place.value.trim()||'Live stream';player.classList.add('show');audio.play().then(()=>status.textContent='Playing live audio.').catch(()=>status.textContent='This source blocked browser playback or requires authentication.');localStorage.setItem('cityScanner:stream',u)};
$('#stop').onclick=()=>{audio.pause();audio.removeAttribute('src');audio.load();player.classList.remove('show')};
const p=localStorage.getItem('cityScanner:place');if(p){place.value=p;scan()}const s=localStorage.getItem('cityScanner:stream');if(s)$('#stream').value=s;
</script>
</body></html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ok:true,app:"city-scanner",build:"20260829-v2",mode:"standalone"},{headers:{"cache-control":"no-store","access-control-allow-origin":"*"}});
    }
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});
    }
    return new Response("Not found",{status:404});
  }
};
