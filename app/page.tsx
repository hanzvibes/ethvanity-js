"use client";
import { useEffect, useState } from "react";
type Mode = "prefix" | "suffix";
const hex = "0123456789abcdef";
function address() {
  return "0x" + Array.from({ length: 40 }, () => hex[Math.floor(Math.random() * 16)]).join("");
}
function matches(value: string, pattern: string, mode: Mode) {
  if (!pattern) return false;
  const body = value.slice(2);
  return mode === "prefix" ? body.startsWith(pattern) : body.endsWith(pattern);
}
const seed = ["0x8a4d1c70e9b3f6a2d5c1b7e04f8a9d3c6b2e1f70"];
const BATCH_SIZE = 1;
const TICK_MS = 250;
const DEMO_STEPS = 6;
const SIMULATED_RATE = Math.round((BATCH_SIZE * 1000) / TICK_MS);
function formatDuration(seconds: number) {
  if (seconds < 1) return "<1 dtk";
  if (seconds < 60) return `${Math.ceil(seconds)} dtk`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} mnt`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)} jam`;
  return `${Math.ceil(seconds / 86400)} hari`;
}
export default function Home() {
 const [pattern,setPattern]=useState("deadbeef"), [mode,setMode]=useState<Mode>("prefix"), [running,setRunning]=useState(true), [attempts,setAttempts]=useState(0), [elapsed,setWaktu]=useState(0), [rows,setRows]=useState(seed), [match,setMatch]=useState("");
 const p=pattern.toLowerCase().replace(/[^0-9a-f]/g,"").slice(0,8);
 const expectedAttempts = p.length ? 16 ** p.length : 0;

 const averageSeconds = expectedAttempts / SIMULATED_RATE;
 const [cliInput, setCliInput] = useState("");
 const [cliLoop, setCliLoop] = useState(true);
 const [cliPhase, setCliPhase] = useState(0);
 const [cliLines, setCliLines] = useState<string[]>([
  "ethvanity.js — terminal demo",
  "Mode demo: output disimulasikan, tidak ada wallet/private key yang dibuat.",
  "Ketik \"help\" untuk melihat perintah yang tersedia."
 ]);
 const demoScenes = [
  ["$ npm start", "Memulai ethvanity.js CLI…", "Mode interaktif siap."],
  ["$ run CAFE", "Mode: awalan · Pola: CAFE", "Membuat kandidat alamat contoh…", "Mencocokkan awalan alamat…"],
  ["  kandidat: 0xCAFE7a91b3d4e5f60718293a4b5c6d7e8f901234", "  pola      CAFE", "  status    cocok (SIMULASI)"],
  ["$ explain CAFE", "Ruang kemungkinan: 16^4 = 65.536 kandidat rata-rata.", "Ini estimasi matematis, bukan jaminan waktu selesai."],
  ["$ security", "Pencarian asli berjalan lokal di perangkatmu.", "Jaga file hasil: berisi private key. Jangan unggah atau commit.", "Demo selesai — mengulang alur dari awal…"]
 ];
 const displayCliLines = cliLoop
  ? ["ethvanity.js — terminal demo", "Alur ilustratif berdasarkan perintah di README. Bukan proses pencarian nyata.", ...demoScenes[cliPhase]]
  : cliLines;
 useEffect(() => {
  if (!cliLoop) return;
  const id = window.setInterval(() => setCliPhase(phase => (phase + 1) % demoScenes.length), 2200);
  return () => window.clearInterval(id);
 }, [cliLoop]);
 const executeCli = (raw: string) => {
  setCliLoop(false);
  const command = raw.trim();
  if (!command) return;
  const args = command.toLowerCase().split(/\s+/);
  const name = args[0];
  const next: string[] = [`$ ${command}`];
  if (name === "clear") {
   setCliLines([]);
   setCliInput("");
   return;
  }
  if (name === "help") {
   next.push("Perintah yang tersedia:", "  run CAFE             cari awalan 0xcafe", "  run CAFE --suffix    cari akhiran cafe", "  explain CAFE         jelaskan pola dan estimasi", "  security             tips keamanan", "  clear                bersihkan terminal", "  quit                 akhiri sesi demo");
  } else if (name === "run") {
   const rawPattern = (args[1] || "cafe").replace(/^0x/, "").replace(/[^0-9a-f]/g, "").slice(0, 8);
   const suffix = args.includes("--suffix");
   const tail = Array.from({length: Math.max(0, 40 - rawPattern.length)}, () => hex[Math.floor(Math.random() * 16)]).join("");
   const candidate = "0x" + (suffix ? tail + rawPattern : rawPattern + tail);
   next.push(`Mode: ${suffix ? "akhiran" : "awalan"} · Pola: ${rawPattern || "(kosong)"}`, "Menjalankan demo pencarian…", "Menguji kandidat alamat contoh…", `✓ Pola cocok (SIMULASI): ${candidate}`, "Catatan: ini hasil visual buatan demo, bukan hasil brute-force sungguhan.");
  } else if (name === "explain") {
   const pat = (args[1] || "cafe").replace(/^0x/, "").replace(/[^0-9a-f]/g, "").slice(0, 8);
   next.push(`Pola: ${pat || "(kosong)"}`, `Ruang kemungkinan: 16^${pat.length} = ${(16 ** pat.length).toLocaleString("en-US")} kandidat rata-rata secara matematis.`, "Semakin panjang pola, semakin lama pencariannya. Angka ini bukan benchmark perangkatmu.");
  } else if (name === "security") {
   next.push("Pencarian asli berjalan lokal lewat Node.js.", "Jangan pernah membagikan private key atau seed phrase.", "Periksa kode sebelum menjalankannya; proyek ini belum diaudit independen.");
  } else if (name === "quit" || name === "exit") {
   next.push("Sesi demo diakhiri. Muat ulang demo dengan mengetik help.");
  } else {
   next.push(`Perintah tidak dikenal: ${name}`, 'Ketik "help" untuk daftar perintah.');
  }
  setCliLines(lines => [...lines, ...next].slice(-28));
  setCliInput("");
 };

 useEffect(()=>{
  if(!running)return;
  let step = 0;
  const id=window.setInterval(()=>{
   step++;
   const candidate = step >= DEMO_STEPS
    ? mode === "prefix"
      ? "0x" + p + Array.from({length:40-p.length},()=>hex[Math.floor(Math.random()*16)]).join("")
      : "0x" + Array.from({length:40-p.length},()=>hex[Math.floor(Math.random()*16)]).join("") + p
    : address();
   setAttempts(n=>n+1);
   setWaktu(n=>n+TICK_MS/1000);
   setRows([candidate]);
   if(step >= DEMO_STEPS){setMatch(candidate);setRunning(false)}
  },TICK_MS);
  return()=>window.clearInterval(id)
 },[running,p,mode]);
 const reset=()=>{setRunning(false);setAttempts(0);setWaktu(0);setMatch("");setRows(seed);window.setTimeout(()=>setRunning(true),100)};
 const highlight=(value:string)=>{if(!matches(value,p,mode))return value;const start=mode==="prefix"?2:value.length-p.length;return <>{value.slice(0,start)}<span className="rounded-sm bg-lime-300 px-0.5 text-neutral-950">{value.slice(start,start+p.length)}</span>{value.slice(start+p.length)}</>};
 return <main className="site-shell relative overflow-hidden"><div aria-hidden="true" className="site-atmosphere pointer-events-none absolute inset-x-0 top-0 h-[1050px] overflow-hidden"><div className="absolute -right-40 top-16 size-[34rem] rounded-full bg-lime-300/20 blur-[110px]"/><div className="absolute -left-48 top-72 size-[30rem] rounded-full bg-cyan-300/15 blur-[120px]"/><svg viewBox="0 0 320 420" className="ethereum-watermark absolute right-[2%] top-28 hidden h-[520px] w-[400px] lg:block" fill="none"><path d="M160 10 35 218 160 291 285 218 160 10Z" fill="currentColor"/><path d="M160 10 35 218 160 174V10Z" fill="#8b8b83"/><path d="M160 10 285 218 160 174V10Z" fill="#c8c8bd"/><path d="M160 315 35 241 160 410 285 241 160 315Z" fill="currentColor"/><path d="M160 315 35 241 160 275V410L35 241Z" fill="#8b8b83"/><path d="M160 315 285 241 160 275V410L285 241Z" fill="#c8c8bd"/></svg></div><div className="relative z-10 mx-auto w-[min(1180px,calc(100%-32px))]">
 <header className="flex h-[72px] items-center justify-between border-b border-neutral-200"><a href="#" className="flex items-center gap-2 text-lg font-bold tracking-tight"><span className="grid size-9 place-items-center rounded-xl border border-neutral-800 bg-neutral-950 text-lime-300 shadow-[0_0_24px_rgba(163,230,53,0.12)]"><svg viewBox="0 0 32 32" aria-hidden="true" className="size-6 fill-current"><path d="M16 2.5 5.7 17.1 16 23.2l10.3-6.1L16 2.5Zm0 22.8L5.7 19.2 16 29.5l10.3-10.3L16 25.3Z"/></svg></span>ethvanity<span className="text-neutral-400">.js</span></a><nav className="flex items-center gap-5 text-xs text-neutral-600"><a className="hidden sm:block" href="#playground">Simulasi</a><a className="hidden sm:block" href="#workflow">Cara kerja</a><a className="rounded-full bg-neutral-950 px-4 py-2.5 font-semibold text-white" href="https://github.com/hanzvibes/ethvanity-js">Buka GitHub ↗</a></nav></header>
 <section className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24"><div className="reveal"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-neutral-500"><span className="size-2 rounded-full bg-lime-500"/> Kode terbuka · Jalan di perangkatmu · Ethereum</p><h1 className="mt-6 text-[clamp(3.7rem,9vw,6.7rem)] font-semibold leading-[.88] tracking-[-.09em]">Bikin alamat Ethereum<br/>dengan pola <span className="relative inline-block">pilihanmu<span className="absolute -bottom-0.5 left-0 -z-10 h-[27%] w-full -rotate-1 bg-lime-300"/></span></h1><p className="mt-7 max-w-lg text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">ethvanity.js membantu kamu mencari alamat Ethereum dengan awalan atau akhiran yang kamu tentukan sendiri. Pencarian aslinya dijalankan lewat Node.js di perangkatmu, bukan di server website ini.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#playground" className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">Lihat simulasinya ↘</a><a href="https://github.com/hanzvibes/ethvanity-js#install" className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold">Mulai pakai ↗</a></div><p className="mt-4 text-[11px] text-neutral-500">Simulasi di halaman ini cuma contoh tampilan, bukan pembuat dompet kripto.</p></div>
 <div className="terminal-float rounded-2xl border border-neutral-800 bg-[#22241f] p-5 text-neutral-100 shadow-2xl sm:p-7"><div className="flex items-center gap-1.5 border-b border-white/10 pb-4"><i className="size-2 rounded-full bg-red-400"/><i className="size-2 rounded-full bg-amber-300"/><i className="size-2 rounded-full bg-green-400"/><span className="ml-auto font-mono text-[10px] text-neutral-400">ethvanity — pratinjau</span></div><div className="py-5 font-mono text-xs leading-7"><p className="text-neutral-500">$ vanity --prefix 0xDEADBEEF</p><p><span className="text-lime-300">✓</span> Pola yang dicari: <span className="text-lime-200">0xDEADBEEF</span></p><p className="text-blue-200">↳ ngecek alamat satu per satu</p><div className="my-4 h-px bg-white/10"/><div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500"><span>Alamat yang dicek</span><span className="animate-pulse text-lime-300">{match ? "KETEMU (SIMULASI)" : running ? "LAGI CEK…" : "DIJEDA"}</span></div><div className="address-row min-h-16 rounded-lg border border-white/10 bg-white/[.04] p-3"><code className="break-all text-[10px] leading-6 text-neutral-200 sm:text-xs">{highlight(rows[0] || seed[0])}</code></div><div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10"><div className="progress-bar h-full rounded-full bg-lime-300" style={{width:match?"100%":"28%"}}/></div><div className="mt-4 grid grid-cols-3 gap-2"><div><p className="text-[9px] uppercase tracking-wider text-neutral-500">Jumlah cek</p><p className="mt-1 text-sm">{attempts.toLocaleString("en-US")}</p></div><div><p className="text-[9px] uppercase tracking-wider text-neutral-500">Kecepatan</p><p className="mt-1 text-sm">≈{SIMULATED_RATE}/s</p></div><div><p className="text-[9px] uppercase tracking-wider text-neutral-500">Waktu</p><p className="mt-1 text-sm">{Math.floor(elapsed/60)}m {Math.floor(elapsed%60)}s</p></div></div></div><p className="mt-3 text-[10px] text-neutral-400">Cuma simulasi tampilan · tidak membuat dompet atau kunci rahasia</p></div></section>
 <section className="flex flex-wrap items-center justify-between gap-5 border-y border-neutral-200 py-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-neutral-500">Pencarian di perangkatmu</p><div className="flex flex-wrap gap-6 text-xs text-neutral-500"><span>⌘ Node.js</span><span>◈ Proses paralel</span><span>⌁ Jalan di perangkatmu</span><span>↗ Kode terbuka</span></div></section>
 <section id="playground" className="scroll-mt-6 py-20 sm:py-24"><div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-500">01 / Terminal interaktif</p><h2 className="mt-4 text-4xl font-semibold leading-none tracking-[-.075em] sm:text-6xl">Rasain alur CLI-nya.</h2></div><p className="max-w-sm text-sm leading-7 text-neutral-600">Coba perintah seperti di terminal native. Demo ini meniru alur CLI ethvanity.js, tetapi tidak menjalankan proses pencarian asli dan tidak membuat wallet atau private key.</p></div><div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#171915] text-neutral-100 shadow-2xl"><div className="flex items-center gap-1.5 border-b border-white/10 bg-[#22241f] px-4 py-3"><i className="size-2.5 rounded-full bg-red-400"/><i className="size-2.5 rounded-full bg-amber-300"/><i className="size-2.5 rounded-full bg-green-400"/><span className="ml-2 font-mono text-[11px] text-neutral-400">rehan@machine: ~/ethvanity-js</span><span className="ml-auto rounded-full border border-amber-300/30 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-200">Simulasi CLI</span></div><div className="grid gap-0 lg:grid-cols-[1fr_240px]"><div className="min-w-0 p-4 sm:p-6"><div className="mb-4 flex items-center gap-2 font-mono text-xs text-lime-300"><span>➜</span><span>ethvanity</span><span className="text-neutral-500">--interactive</span></div><div aria-live="polite" className="min-h-[290px] max-h-[420px] space-y-1 overflow-y-auto font-mono text-xs leading-6 sm:text-sm">{displayCliLines.map((line,i)=><p key={i} className={line.startsWith("$")?"text-lime-300":line.includes("SIMULASI")||line.includes("demo")?"text-amber-200":"break-words text-neutral-300"}>{line}</p>)}</div><form className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 font-mono text-xs" onSubmit={e=>{e.preventDefault();executeCli(cliInput)}}><label htmlFor="cli-command" className="shrink-0 text-lime-300">❯</label><input id="cli-command" value={cliInput} onChange={e=>setCliInput(e.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-neutral-100 outline-none placeholder:text-neutral-600" placeholder="ketik perintah, mis. run cafe --suffix" autoComplete="off" spellCheck={false}/><button type="submit" className="rounded-md bg-lime-300 px-3 py-2 font-sans text-[11px] font-bold text-neutral-950 transition hover:bg-lime-200">Jalankan ↵</button></form><p className="mt-3 text-[10px] text-neutral-500">{cliLoop ? "Demo otomatis berulang setiap beberapa detik · klik perintah untuk mencoba sendiri" : "Mode interaktif manual · output tetap simulasi visual"}</p><button type="button" onClick={() => {setCliLines(["ethvanity.js — terminal demo", "Mode demo: output disimulasikan, tidak ada wallet/private key yang dibuat.", "Ketik \"help\" untuk melihat perintah yang tersedia."]);setCliLoop(true);setCliPhase(0);setCliInput("");}} className="mt-3 rounded-md border border-white/15 px-3 py-2 text-[10px] text-neutral-300 transition hover:border-lime-300/50 hover:text-lime-200">{cliLoop ? "Putar ulang alur" : "Kembali ke demo otomatis ↻"}</button></div><aside className="border-t border-white/10 bg-white/[.025] p-4 sm:p-5 lg:border-l lg:border-t-0"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-neutral-500">Perintah cepat</p><div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">{["help","run cafe","run cafe --suffix","explain cafe","security","clear"].map(cmd=><button key={cmd} onClick={()=>executeCli(cmd)} className="rounded-lg border border-white/10 px-3 py-2.5 text-left font-mono text-[10px] text-neutral-300 transition hover:border-lime-300/50 hover:bg-lime-300/10 hover:text-lime-200">{cmd}</button>)}</div><div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] font-semibold text-lime-200">Di terminal asli</p><p className="mt-2 text-[10px] leading-5 text-neutral-400">Perintah dijalankan di perangkatmu dengan Node.js. Cek README di GitHub untuk instruksi instalasi yang sesuai dengan versi repo.</p><a href="https://github.com/hanzvibes/ethvanity-js" className="mt-3 inline-block text-[10px] font-semibold text-lime-200 underline underline-offset-4">Buka source code ↗</a></div></aside></div></div></section>
 <section id="workflow" className="border-t border-neutral-200 py-20 sm:py-24"><p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-500">02 / Cara kerjanya</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.075em] sm:text-6xl">Mulai dari yang sederhana.</h2><div className="mt-9 grid gap-3 md:grid-cols-3">{[{n:"01",title:"Pilih polanya",text:"Tentukan rangkaian karakter yang ingin muncul di awal atau akhir alamat Ethereum.",code:'pattern = "cafe"'},{n:"02",title:"Jalankan di perangkatmu",text:"Jalankan pencarian lewat Node.js di perangkatmu. Mode paralel dapat memanfaatkan beberapa inti CPU.",code:"npm run parallel -- cafe"},{n:"03",title:"Jaga tetap aman",text:"Baca kode sebelum menjalankannya dan simpan hasil rahasia dengan aman. Jangan unggah private key atau seed phrase ke GitHub.",code:"# your machine, your keys"}].map(s=><article key={s.n} className="flex min-h-56 flex-col rounded-2xl border border-neutral-200 bg-[#fffefa] p-6"><span className="font-mono text-xs text-neutral-500">{s.n} / STEP</span><h3 className="mt-7 text-xl font-semibold">{s.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-neutral-600">{s.text}</p><code className="mt-5 overflow-x-auto rounded-lg bg-neutral-950 px-3 py-3 text-[11px] text-lime-200">{s.code}</code></article>)}</div></section>
 <section className="grid gap-9 border-t border-neutral-200 py-20 md:grid-cols-2 md:gap-16"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-500">03 / Keamanan dulu</p><h2 className="mt-4 text-4xl font-semibold leading-none tracking-[-.075em] sm:text-6xl">Rahasiamu<br/>tetap milikmu.</h2><p className="mt-5 max-w-md text-sm leading-7 text-neutral-600">Pencarian sebenarnya dijalankan secara lokal lewat alat Node.js. Demo di halaman ini terpisah dan tidak membuat dompet atau private key.</p></div><div className="space-y-3">{[{t:"Berjalan di perangkatmu",d:"Pencarian asli dijalankan lewat Node.js di perangkatmu. Website ini hanya menampilkan demo."},{t:"Periksa sebelum dipakai",d:"Proyek ini belum diaudit keamanannya secara independen. Baca dan pahami kodenya sebelum menggunakannya untuk aset bernilai."},{t:"Lindungi file hasil",d:"Private key dan seed phrase memberi akses ke dompetmu. Simpan dengan aman dan jangan pernah commit ke Git."}].map(x=><div key={x.t} className="flex gap-4 rounded-xl border border-neutral-200 bg-[#fffefa] p-4"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-lime-100 text-green-800">✓</span><div><h3 className="text-sm font-semibold">{x.t}</h3><p className="mt-1 text-xs leading-5 text-neutral-500">{x.d}</p></div></div>)}</div></section>
 <section className="flex flex-col justify-between gap-6 rounded-2xl bg-lime-300 p-7 sm:p-11 md:flex-row md:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-700">Mau coba sendiri?</p><h2 className="mt-3 text-4xl font-semibold leading-none tracking-[-.075em] sm:text-5xl">Cari alamat dengan pola pilihanmu.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-neutral-700">Buka repositorinya untuk melihat kode, cara instalasi, dan cara menjalankan pencarian di perangkatmu.</p></div><a className="self-start rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white md:self-center" href="https://github.com/hanzvibes/ethvanity-js">Lihat proyek di GitHub ↗</a></section>
 <footer className="flex flex-col justify-between gap-3 py-7 text-[11px] text-neutral-500 sm:flex-row"><p>© {new Date().getFullYear()} ethvanity.js · Kode terbuka · berjalan lokal.</p><a href="#playground">Balik ke simulasi ↑</a></footer></div></main>
}
