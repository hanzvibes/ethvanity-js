const http = require('http');

const dashboardHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ethvanity live monitor</title>
<style>
:root{color-scheme:dark;--bg:#0b0d0f;--panel:#121519;--line:#242a30;--text:#f4f6f8;--muted:#8c97a3;--accent:#d8ba7e;--ok:#95c78f;--warn:#d3aa63;--bad:#d27c7c}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}main{max-width:1100px;margin:0 auto;padding:22px}.top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}.brand{font-size:20px;font-weight:800;letter-spacing:-.03em}.sub{color:var(--muted);margin-top:3px}.pill{border:1px solid var(--line);border-radius:999px;padding:7px 10px;color:var(--muted)}.pill b{color:var(--text)}.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--warn);margin-right:7px}.status-dot.found{background:var(--ok)}.status-dot.error{background:var(--bad)}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:20px 0}.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px;min-width:0}.label{color:var(--muted);font-size:12px}.value{font-size:22px;font-weight:800;margin-top:5px;overflow-wrap:anywhere}.wide{grid-column:span 2}.meter{height:8px;background:#1b2025;border-radius:99px;overflow:hidden;margin-top:10px}.meter>i{display:block;height:100%;background:var(--accent);width:0%;transition:width .25s ease}.section-title{margin:22px 0 9px;font-weight:800}.workers{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.worker{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:11px}.worker .row{display:flex;justify-content:space-between;gap:8px}.worker small{color:var(--muted)}.address{font-size:13px;overflow-wrap:anywhere;color:var(--ok)}.foot{margin-top:18px;color:var(--muted);font-size:12px}@media(max-width:720px){main{padding:14px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wide{grid-column:span 2}.value{font-size:18px}}@media(max-width:390px){.grid{grid-template-columns:1fr}.wide{grid-column:span 1}}
</style>
</head>
<body>
<main>
  <div class="top">
    <div><div class="brand">ethvanity · live monitor</div><div class="sub">Local telemetry only. Private keys are never exposed here.</div></div>
    <div class="pill"><span id="dot" class="status-dot"></span><b id="status">connecting</b></div>
  </div>

  <div class="grid">
    <div class="card"><div class="label">Target</div><div id="target" class="value">—</div></div>
    <div class="card"><div class="label">Workers</div><div id="workersCount" class="value">—</div></div>
    <div class="card"><div class="label">Total attempts</div><div id="attempts" class="value">—</div></div>
    <div class="card"><div class="label">Throughput</div><div id="rate" class="value">—</div></div>
    <div class="card wide"><div class="label">Chance found by now</div><div id="chance" class="value">—</div><div class="meter"><i id="chanceBar"></i></div></div>
    <div class="card"><div class="label">Uptime</div><div id="uptime" class="value">—</div></div>
    <div class="card"><div class="label">Mean search time @ current rate</div><div id="eta" class="value">—</div></div>
  </div>

  <div id="foundWrap" class="card" style="display:none"><div class="label">Public address found</div><div id="foundAddress" class="address"></div></div>

  <div class="section-title">Worker health</div>
  <div id="workers" class="workers"></div>
  <div class="foot">This is probabilistic search. “Chance found by now” is not deterministic completion progress.</div>
</main>
<script>
const $=id=>document.getElementById(id);
const nf=new Intl.NumberFormat('en-US');
const pct=n=>Number.isFinite(n)?(n*100).toFixed(n<.01?3:2)+'%':'—';
const duration=seconds=>{if(!Number.isFinite(seconds)||seconds<0)return '—';const s=Math.floor(seconds%60),m=Math.floor(seconds/60)%60,h=Math.floor(seconds/3600)%24,d=Math.floor(seconds/86400);return [d?d+'d':null,h?String(h).padStart(2,'0')+'h':null,String(m).padStart(2,'0')+'m',String(s).padStart(2,'0')+'s'].filter(Boolean).join(' ')};
async function refresh(){
  try{
    const r=await fetch('/api/status',{cache:'no-store'}); if(!r.ok)throw new Error('status '+r.status); const s=await r.json();
    $('status').textContent=s.status; $('dot').className='status-dot '+(s.status==='found'?'found':s.status==='error'?'error':'');
    $('target').textContent=(s.isSuffix?'…':'0x')+s.pattern+(s.isSuffix?'':'…');
    $('workersCount').textContent=s.activeWorkers+' / '+s.workerCount;
    $('attempts').textContent=nf.format(s.totalAttempts||0);
    $('rate').textContent=nf.format(s.totalRate||0)+' addr/s';
    $('chance').textContent=pct(s.chanceFound||0); $('chanceBar').style.width=Math.min(100,(s.chanceFound||0)*100)+'%';
    $('uptime').textContent=duration((Date.now()-s.startedAt)/1000);
    $('eta').textContent=s.meanSecondsAtCurrentRate?duration(s.meanSecondsAtCurrentRate):'—';
    if(s.foundAddress){$('foundWrap').style.display='block';$('foundAddress').textContent=s.foundAddress}else{$('foundWrap').style.display='none'}
    $('workers').replaceChildren(...s.workers.map(w=>{const el=document.createElement('div');el.className='worker';const age=Math.max(0,(Date.now()-w.lastSeen)/1000);el.innerHTML='<div class="row"><b>#'+w.id+'</b><small>'+w.status+'</small></div><div class="row"><span>'+nf.format(w.attempts||0)+'</span><small>'+nf.format(w.rate||0)+'/s</small></div><small>heartbeat '+age.toFixed(1)+'s ago</small>';return el;}));
  }catch(e){$('status').textContent='disconnected';$('dot').className='status-dot error'}
}
refresh();setInterval(refresh,1000);
</script>
</body>
</html>`;

const startMonitor = ({ host = '127.0.0.1', port = 4173, getSnapshot }) => {
    if (typeof getSnapshot !== 'function') throw new Error('getSnapshot must be a function.');

    const server = http.createServer((req, res) => {
        if (req.url === '/api/status') {
            const payload = JSON.stringify(getSnapshot());
            res.writeHead(200, {
                'content-type': 'application/json; charset=utf-8',
                'cache-control': 'no-store'
            });
            res.end(payload);
            return;
        }

        if (req.url === '/' || req.url === '/index.html') {
            res.writeHead(200, {
                'content-type': 'text/html; charset=utf-8',
                'cache-control': 'no-store'
            });
            res.end(dashboardHtml);
            return;
        }

        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Not found');
    });

    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
            server.removeListener('error', reject);
            resolve(server);
        });
    });
};

module.exports = { startMonitor };
