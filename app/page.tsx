"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const RemotionPreview = dynamic(() => import("../components/RemotionPreview"), {
  ssr: false,
  loading: () => (
    <div className="grid aspect-video place-items-center rounded-2xl border border-neutral-800 bg-[#171915] text-sm text-neutral-400">
      Memuat pratinjau motion…
    </div>
  ),
});

type Mode = "prefix" | "suffix";

const hex = "0123456789abcdef";
const MAX_PATTERN = 12;
const DEMO_STEPS = 6;
const TICK_MS = 250;
const SIMULATED_RATE = Math.round(1000 / TICK_MS);
const seed = ["0x8a4d1c70e9b3f6a2d5c1b7e04f8a9d3c6b2e1f70"];

function randomAddress() {
  return (
    "0x" +
    Array.from({ length: 40 }, () => hex[Math.floor(Math.random() * 16)]).join("")
  );
}

function cleanPattern(value: string) {
  return value.toLowerCase().replace(/[^0-9a-f]/g, "").slice(0, MAX_PATTERN);
}

function matches(value: string, pattern: string, mode: Mode) {
  if (!pattern) return false;
  const body = value.slice(2);
  return mode === "prefix" ? body.startsWith(pattern) : body.endsWith(pattern);
}

function formatCount(value: number) {
  return value.toLocaleString("id-ID");
}

function formatDuration(seconds: number) {
  if (seconds < 1) return "<1 dtk";
  if (seconds < 60) return `${Math.ceil(seconds)} dtk`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} mnt`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)} jam`;
  return `${Math.ceil(seconds / 86400)} hari`;
}

function difficultyFor(length: number) {
  if (length === 0) return "Masukkan pola dulu";
  if (length <= 4) return "Relatif cepat";
  if (length <= 6) return "Butuh kesabaran";
  if (length <= 8) return "Sangat berat";
  return "Ekstrem — pikirkan ulang polanya";
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? `Salin ${text}`}
      className="shrink-0 rounded-md border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-300 transition hover:border-lime-300/50 hover:text-lime-200"
    >
      {copied ? "Tersalin ✓" : "Salin"}
    </button>
  );
}

export default function Home() {
  const [pattern, setPattern] = useState("deadbeef");
  const [mode, setMode] = useState<Mode>("prefix");
  const [running, setRunning] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [rows, setRows] = useState(seed);
  const [match, setMatch] = useState("");

  const p = cleanPattern(pattern);
  const expectedAttempts = p.length ? 16 ** p.length : 0;
  const progress = match ? 100 : Math.min(100, Math.round((attempts / DEMO_STEPS) * 100));

  const [calcPattern, setCalcPattern] = useState("cafe");
  const calc = cleanPattern(calcPattern);
  const calcExpected = calc.length ? 16 ** calc.length : 0;

  const [cliInput, setCliInput] = useState("");
  const [cliLoop, setCliLoop] = useState(true);
  const [cliPhase, setCliPhase] = useState(0);
  const [cliLines, setCliLines] = useState<string[]>([
    "ethvanity.js — terminal demo",
    "Mode demo: output disimulasikan, tidak ada wallet/private key yang dibuat.",
    'Ketik "help" untuk melihat perintah yang tersedia.',
  ]);

  const demoScenes = [
    ["$ npm start", "Memulai ethvanity.js CLI…", "Mode interaktif siap."],
    ["$ run CAFE", "Mode: awalan · Pola: CAFE", "Membuat kandidat alamat contoh…", "Mencocokkan awalan alamat…"],
    [
      "  kandidat: 0xCAFE7a91b3d4e5f60718293a4b5c6d7e8f901234",
      "  pola      CAFE",
      "  status    cocok (SIMULASI)",
    ],
    ["$ explain CAFE", "Ruang kemungkinan: 16^4 = 65.536 kandidat rata-rata.", "Ini estimasi matematis, bukan jaminan waktu selesai."],
    [
      "$ security",
      "Pencarian asli berjalan lokal di perangkatmu.",
      "Jaga file hasil: berisi private key. Jangan unggah atau commit.",
      "Demo selesai — mengulang alur dari awal…",
    ],
  ];

  const displayCliLines = cliLoop
    ? [
        "ethvanity.js — terminal demo",
        "Alur ilustratif berdasarkan perintah di README. Bukan proses pencarian nyata.",
        ...demoScenes[cliPhase],
      ]
    : cliLines;

  useEffect(() => {
    if (!cliLoop) return;
    const id = window.setInterval(
      () => setCliPhase((phase) => (phase + 1) % demoScenes.length),
      2200,
    );
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      next.push(
        "Perintah yang tersedia:",
        "  run CAFE             cari awalan 0xcafe",
        "  run CAFE --suffix    cari akhiran cafe",
        "  explain CAFE         jelaskan pola dan estimasi",
        "  security             tips keamanan",
        "  clear                bersihkan terminal",
        "  quit                 akhiri sesi demo",
      );
    } else if (name === "run") {
      const rawPattern = cleanPattern((args[1] || "cafe").replace(/^0x/, ""));
      const suffix = args.includes("--suffix");
      const tail = Array.from(
        { length: Math.max(0, 40 - rawPattern.length) },
        () => hex[Math.floor(Math.random() * 16)],
      ).join("");
      const candidate = "0x" + (suffix ? tail + rawPattern : rawPattern + tail);
      next.push(
        `Mode: ${suffix ? "akhiran" : "awalan"} · Pola: ${rawPattern || "(kosong)"}`,
        "Menjalankan demo pencarian…",
        "Menguji kandidat alamat contoh…",
        `✓ Pola cocok (SIMULASI): ${candidate}`,
        "Catatan: ini hasil visual buatan demo, bukan hasil brute-force sungguhan.",
      );
    } else if (name === "explain") {
      const pat = cleanPattern((args[1] || "cafe").replace(/^0x/, ""));
      next.push(
        `Pola: ${pat || "(kosong)"}`,
        `Ruang kemungkinan: 16^${pat.length} = ${formatCount(16 ** pat.length)} kandidat rata-rata secara matematis.`,
        "Semakin panjang pola, semakin lama pencariannya. Angka ini bukan benchmark perangkatmu.",
      );
    } else if (name === "security") {
      next.push(
        "Pencarian asli berjalan lokal lewat Node.js.",
        "Jangan pernah membagikan private key atau seed phrase.",
        "Periksa kode sebelum menjalankannya; proyek ini belum diaudit independen.",
      );
    } else if (name === "quit" || name === "exit") {
      next.push("Sesi demo diakhiri. Muat ulang demo dengan mengetik help.");
    } else {
      next.push(`Perintah tidak dikenal: ${name}`, 'Ketik "help" untuk daftar perintah.');
    }
    setCliLines((lines) => [...lines, ...next].slice(-28));
    setCliInput("");
  };

  useEffect(() => {
    if (!running) return;
    let step = 0;
    const id = window.setInterval(() => {
      step += 1;
      const candidate =
        step >= DEMO_STEPS
          ? mode === "prefix"
            ? "0x" + p + Array.from({ length: 40 - p.length }, () => hex[Math.floor(Math.random() * 16)]).join("")
            : "0x" + Array.from({ length: 40 - p.length }, () => hex[Math.floor(Math.random() * 16)]).join("") + p
          : randomAddress();
      setAttempts((n) => n + 1);
      setElapsed((n) => n + TICK_MS / 1000);
      setRows([candidate]);
      if (step >= DEMO_STEPS) {
        setMatch(candidate);
        setRunning(false);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running, p, mode]);

  const restartDemo = () => {
    setRunning(false);
    setAttempts(0);
    setElapsed(0);
    setMatch("");
    setRows(seed);
    window.setTimeout(() => setRunning(true), 100);
  };

  const changePattern = (value: string) => {
    setPattern(value);
    setMatch("");
    setAttempts(0);
    setElapsed(0);
    setRows(seed);
    setRunning(true);
  };

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setMatch("");
    setAttempts(0);
    setElapsed(0);
    setRows(seed);
    setRunning(true);
  };

  const highlight = (value: string) => {
    if (!matches(value, p, mode)) return value;
    const start = mode === "prefix" ? 2 : value.length - p.length;
    return (
      <>
        {value.slice(0, start)}
        <span className="rounded-sm bg-lime-300 px-0.5 text-neutral-950">
          {value.slice(start, start + p.length)}
        </span>
        {value.slice(start + p.length)}
      </>
    );
  };

  const installSteps = [
    { label: "Clone repo", command: "git clone https://github.com/hanzvibes/ethvanity-js.git" },
    { label: "Masuk folder", command: "cd ethvanity-js" },
    { label: "Install dependensi", command: "npm install" },
    { label: "Jalankan CLI interaktif", command: "npm start" },
    { label: "Mode paralel + monitor lokal", command: "npm run parallel -- CAFE --workers 4" },
  ];

  const faqs = [
    {
      q: "Apakah demo di halaman ini membuat dompet atau private key?",
      a: "Tidak. Semua demo di halaman ini hanya animasi dan teks contoh. Pencarian asli hanya berjalan lewat CLI Node.js di perangkatmu, dan file hasilnya tetap di perangkatmu.",
    },
    {
      q: "Kenapa demo selalu cepat menemukan pola?",
      a: "Demo sengaja dipercepat dan menampilkan kecocokan setelah beberapa kandidat contoh, supaya kamu bisa melihat tampilannya. Di pencarian asli, peluang menemukan pola sepanjang n karakter adalah 1 dari 16^n — jadi pola panjang bisa butuh waktu sangat lama.",
    },
    {
      q: "Apakah saya harus percaya server atau mengunggah kunci?",
      a: "Tidak. Proyek ini dirancang local-first: tidak ada server pencarian dan kamu tidak perlu mengunggah private key atau seed phrase ke mana pun. Justru jangan pernah membagikannya.",
    },
    {
      q: "Perintah apa yang dipakai untuk website-nya sendiri?",
      a: "Untuk pengembangan website pakai npm run dev, untuk build pakai npm run build, dan untuk menjalankan hasil build pakai npm run web. Perintah npm start tetap dipakai untuk CLI interaktif, bukan untuk website.",
    },
  ];

  return (
    <main className="site-shell relative overflow-hidden">
      <div aria-hidden="true" className="site-atmosphere pointer-events-none absolute inset-x-0 top-0 h-[1050px] overflow-hidden">
        <div className="absolute -right-40 top-16 size-[34rem] rounded-full bg-lime-300/20 blur-[110px]" />
        <div className="absolute -left-48 top-72 size-[30rem] rounded-full bg-cyan-300/15 blur-[120px]" />
        <svg viewBox="0 0 320 420" className="ethereum-watermark absolute right-[2%] top-28 hidden h-[520px] w-[400px] lg:block" fill="none">
          <path d="M160 10 35 218 160 291 285 218 160 10Z" fill="currentColor" />
          <path d="M160 10 35 218 160 174V10Z" fill="#8b8b83" />
          <path d="M160 10 285 218 160 174V10Z" fill="#c8c8bd" />
          <path d="M160 315 35 241 160 410 285 241 160 315Z" fill="currentColor" />
          <path d="M160 315 35 241 160 275V410L35 241Z" fill="#8b8b83" />
          <path d="M160 315 285 241 160 275V410L285 241Z" fill="#c8c8bd" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-[min(1180px,calc(100%-32px))]">
        <header className="flex h-[72px] items-center justify-between border-b border-neutral-200">
          <a href="#" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl border border-neutral-800 bg-neutral-950 text-lime-300 shadow-[0_0_24px_rgba(163,230,53,0.12)]">
              <svg viewBox="0 0 32 32" aria-hidden="true" className="size-6 fill-current">
                <path d="M16 2.5 5.7 17.1 16 23.2l10.3-6.1L16 2.5Zm0 22.8L5.7 19.2 16 29.5l10.3-10.3L16 25.3Z" />
              </svg>
            </span>
            ethvanity<span className="text-neutral-400">.js</span>
          </a>
          <nav aria-label="Navigasi utama" className="flex items-center gap-5 text-xs text-neutral-600">
            <a className="hidden md:block" href="#preview">Preview</a>
            <a className="hidden md:block" href="#playground">Simulasi</a>
            <a className="hidden md:block" href="#kalkulator">Kalkulator</a>
            <a className="hidden md:block" href="#install">Mulai pakai</a>
            <a className="rounded-full bg-neutral-950 px-4 py-2.5 font-semibold text-white" href="https://github.com/hanzvibes/ethvanity-js">Buka GitHub ↗</a>
          </nav>
        </header>

        <section className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="reveal">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-neutral-500">
              <span className="size-2 rounded-full bg-lime-500" /> Kode terbuka · Jalan di perangkatmu · Ethereum
            </p>
            <h1 className="mt-6 text-[clamp(2.9rem,9vw,6.7rem)] font-semibold leading-[.92] tracking-[-.09em]">
              Bikin alamat Ethereum
              <br />
              dengan pola{" "}
              <span className="relative inline-block">
                pilihanmu
                <span className="absolute -bottom-0.5 left-0 -z-10 h-[27%] w-full -rotate-1 bg-lime-300" />
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
              ethvanity.js membantu kamu mencari alamat Ethereum dengan awalan atau akhiran yang kamu tentukan sendiri.
              Pencarian aslinya dijalankan lewat Node.js di perangkatmu, bukan di server website ini.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#playground" className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">Lihat simulasinya ↘</a>
              <a href="#install" className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold">Mulai pakai ↗</a>
            </div>
            <p className="mt-4 text-[11px] text-neutral-500">Simulasi di halaman ini cuma contoh tampilan, bukan pembuat dompet kripto.</p>
          </div>

          <div className="terminal-float rounded-2xl border border-neutral-800 bg-[#22241f] p-5 text-neutral-100 shadow-2xl sm:p-7">
            <div className="flex items-center gap-1.5 border-b border-white/10 pb-4">
              <i className="size-2 rounded-full bg-red-400" />
              <i className="size-2 rounded-full bg-amber-300" />
              <i className="size-2 rounded-full bg-green-400" />
              <span className="ml-auto font-mono text-[10px] text-neutral-400">ethvanity — pratinjau demo</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <label htmlFor="hero-pattern" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Pola (hex, maks 12)</label>
                <input
                  id="hero-pattern"
                  value={pattern}
                  onChange={(e) => changePattern(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-white/[.04] px-3 py-2.5 font-mono text-sm uppercase text-lime-200 outline-none placeholder:text-neutral-600 focus:border-lime-300/60"
                  placeholder="deadbeef"
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="mt-1.5 text-[10px] text-neutral-500">Hanya 0–9 dan A–F. Karakter lain otomatis diabaikan.</p>
              </div>
              <div>
                <span id="hero-mode-label" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Posisi pola</span>
                <div role="group" aria-labelledby="hero-mode-label" className="mt-2 flex gap-2">
                  <button type="button" aria-pressed={mode === "prefix"} onClick={() => changeMode("prefix")} className={`rounded-lg px-3 py-2.5 text-xs font-semibold ${mode === "prefix" ? "bg-lime-300 text-neutral-950" : "border border-white/15 text-neutral-300"}`}>Awalan</button>
                  <button type="button" aria-pressed={mode === "suffix"} onClick={() => changeMode("suffix")} className={`rounded-lg px-3 py-2.5 text-xs font-semibold ${mode === "suffix" ? "bg-lime-300 text-neutral-950" : "border border-white/15 text-neutral-300"}`}>Akhiran</button>
                </div>
              </div>
            </div>

            <div className="py-5 font-mono text-xs leading-7">
              <p className="text-neutral-500">$ run {p || "(pola kosong)"}{mode === "suffix" ? " --suffix" : ""}</p>
              <p><span className="text-lime-300">✓</span> Pola yang dicari: <span className="text-lime-200">0x{p.toUpperCase() || "…"}</span></p>
              <p className="text-blue-200">↳ ngecek alamat satu per satu (demo)</p>
              <div className="my-4 h-px bg-white/10" />
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500">
                <span>Alamat yang dicek</span>
                <span className="animate-pulse text-lime-300">{match ? "KETEMU (SIMULASI)" : running ? "LAGI CEK…" : "DIJEDA"}</span>
              </div>
              <div className="address-row min-h-16 rounded-lg border border-white/10 bg-white/[.04] p-3">
                <code className="break-all text-[10px] leading-6 text-neutral-200 sm:text-xs">{highlight(rows[0] || seed[0])}</code>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="progress-bar h-full rounded-full bg-lime-300" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div><p className="text-[9px] uppercase tracking-wider text-neutral-500">Cek demo</p><p className="mt-1 text-sm">{attempts.toLocaleString("id-ID")}</p></div>
                <div><p className="text-[9px] uppercase tracking-wider text-neutral-500">Kecepatan demo</p><p className="mt-1 text-sm">≈{SIMULATED_RATE}/dtk</p></div>
                <div><p className="text-[9px] uppercase tracking-wider text-neutral-500">Waktu demo</p><p className="mt-1 text-sm">{formatDuration(elapsed)}</p></div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-[11px] leading-5 text-neutral-400">
                Rata-rata matematis: <span className="font-semibold text-neutral-200">{p.length ? `16^${p.length} = ${formatCount(expectedAttempts)} kandidat` : "—"}</span>
                {" · "}{difficultyFor(p.length)}
              </p>
              <button type="button" onClick={restartDemo} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-neutral-200 transition hover:border-lime-300/50 hover:text-lime-200">Ulangi simulasi ↻</button>
            </div>
            <p className="mt-3 text-[10px] leading-5 text-neutral-500">Demo dipercepat: kecocokan ditampilkan setelah beberapa kandidat contoh. Ini bukan kecepatan atau hasil pencarian asli.</p>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-5 border-y border-neutral-200 py-6">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-neutral-500">Pencarian di perangkatmu</p>
          <div className="flex flex-wrap gap-6 text-xs text-neutral-500"><span>⌘ Node.js</span><span>◈ Proses paralel</span><span>⌁ Jalan di perangkatmu</span><span>↗ Kode terbuka</span></div>
        </section>

        <section id="preview" className="scroll-mt-6 py-20 sm:py-24">
          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-500">Preview motion · Remotion</p>
              <h2 className="mt-4 text-4xl font-semibold leading-none tracking-[-.075em] sm:text-6xl">Lihat dulu, sebelum jalanin.</h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-neutral-600">
              Mockup gerak 10 detik ini dibuat dengan Remotion: dari judul, terminal pencarian, sampai kecocokan pola CAFE.
              Ini tetap simulasi visual — bukan pencarian asli dan tidak membuat wallet atau private key.
            </p>
          </div>
          <RemotionPreview />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-[#fffefa] p-4"><p className="text-sm font-semibold">Alur 4 adegan</p><p className="mt-1 text-xs leading-5 text-neutral-500">Intro → terminal pencarian → kecocokan → ajakan menjalankan secara lokal.</p></div>
            <div className="rounded-xl border border-neutral-200 bg-[#fffefa] p-4"><p className="text-sm font-semibold">Bisa diputar &amp; digeser</p><p className="mt-1 text-xs leading-5 text-neutral-500">Pakai kontrol player untuk play, pause, dan scrub ke adegan tertentu.</p></div>
            <div className="rounded-xl border border-neutral-200 bg-[#fffefa] p-4"><p className="text-sm font-semibold">Kode di repo</p><p className="mt-1 text-xs leading-5 text-neutral-500">Komposisinya ada di <code className="font-mono">remotion/EthvanityPreview.tsx</code>, siap dipakai ulang atau di-render jadi video.</p></div>
          </div>
        </section>

        <section id="playground" className="scroll-mt-6 py-20 sm:py-24">
          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-500">01 / Terminal interaktif</p>
              <h2 className="mt-4 text-4xl font-semibold leading-none tracking-[-.075em] sm:text-6xl">Rasain alur CLI-nya.</h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-neutral-600">Coba perintah seperti di terminal native. Demo ini meniru alur CLI ethvanity.js, tetapi tidak menjalankan proses pencarian asli dan tidak membuat wallet atau private key.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#171915] text-neutral-100 shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#22241f] px-4 py-3">
              <i className="size-2.5 rounded-full bg-red-400" />
              <i className="size-2.5 rounded-full bg-amber-300" />
              <i className="size-2.5 rounded-full bg-green-400" />
              <span className="ml-2 font-mono text-[11px] text-neutral-400">rehan@machine: ~/ethvanity-js</span>
              <span className="ml-auto rounded-full border border-amber-300/30 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-200">Simulasi CLI</span>
            </div>
            <div className="grid gap-0 lg:grid-cols-[1fr_240px]">
              <div className="min-w-0 p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-2 font-mono text-xs text-lime-300"><span>➜</span><span>ethvanity</span><span className="text-neutral-500">--interactive</span></div>
                <div aria-live="polite" className="min-h-[290px] max-h-[420px] space-y-1 overflow-y-auto font-mono text-xs leading-6 sm:text-sm">
                  {displayCliLines.map((line, i) => (
                    <p key={i} className={line.startsWith("$") ? "text-lime-300" : line.includes("SIMULASI") || line.includes("demo") ? "text-amber-200" : "break-words text-neutral-300"}>{line}</p>
                  ))}
                </div>
                <form className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 font-mono text-xs" onSubmit={(e) => { e.preventDefault(); executeCli(cliInput); }}>
                  <label htmlFor="cli-command" className="shrink-0 text-lime-300">❯</label>
                  <input id="cli-command" value={cliInput} onChange={(e) => setCliInput(e.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-neutral-100 outline-none placeholder:text-neutral-600" placeholder="ketik perintah, mis. run cafe --suffix" autoComplete="off" spellCheck={false} />
                  <button type="submit" className="rounded-md bg-lime-300 px-3 py-2 font-sans text-[11px] font-bold text-neutral-950 transition hover:bg-lime-200">Jalankan ↵</button>
                </form>
                <p className="mt-3 text-[10px] text-neutral-500">{cliLoop ? "Demo otomatis berulang setiap beberapa detik · klik perintah untuk mencoba sendiri" : "Mode interaktif manual · output tetap simulasi visual"}</p>
                <button type="button" onClick={() => { setCliLines(["ethvanity.js — terminal demo", "Mode demo: output disimulasikan, tidak ada wallet/private key yang dibuat.", 'Ketik "help" untuk melihat perintah yang tersedia.']); setCliLoop(true); setCliPhase(0); setCliInput(""); }} className="mt-3 rounded-md border border-white/15 px-3 py-2 text-[10px] text-neutral-300 transition hover:border-lime-300/50 hover:text-lime-200">{cliLoop ? "Putar ulang alur" : "Kembali ke demo otomatis ↻"}</button>
              </div>
              <aside className="border-t border-white/10 bg-white/[.025] p-4 sm:p-5 lg:border-l lg:border-t-0">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-neutral-500">Perintah cepat</p>
                <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
                  {["help", "run cafe", "run cafe --suffix", "explain cafe", "security", "clear"].map((cmd) => (
                    <button key={cmd} onClick={() => executeCli(cmd)} className="rounded-lg border border-white/10 px-3 py-2.5 text-left font-mono text-[10px] text-neutral-300 transition hover:border-lime-300/50 hover:bg-lime-300/10 hover:text-lime-200">{cmd}</button>
                  ))}
                </div>
                <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-semibold text-lime-200">Di terminal asli</p>
                  <p className="mt-2 text-[10px] leading-5 text-neutral-400">Perintah dijalankan di perangkatmu dengan Node.js. Cek README di GitHub untuk instruksi instalasi yang sesuai dengan versi repo.</p>
                  <a href="https://github.com/hanzvibes/ethvanity-js" className="mt-3 inline-block text-[10px] font-semibold text-lime-200 underline underline-offset-4">Buka source code ↗</a>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="kalkulator" className="scroll-mt-6 border-t border-neutral-200 py-20 sm:py-24">
          <p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-500">02 / Kalkulator kesulitan</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-.075em] sm:text-6xl">Seberapa berat polamu?</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">Setiap karakter hex tambahan mengalikan usaha rata-rata 16 kali. Kalkulator ini hanya memakai matematika 16^n — bukan benchmark CPU-mu, dan bukan janji waktu selesai.</p>

          <div className="mt-9 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-2xl border border-neutral-200 bg-[#fffefa] p-6">
              <label htmlFor="calc-pattern" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Coba pola (hex, maks 12)</label>
              <input id="calc-pattern" value={calcPattern} onChange={(e) => setCalcPattern(e.target.value)} className="mt-3 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 font-mono text-lg uppercase outline-none focus:border-lime-500" placeholder="cafe" autoComplete="off" spellCheck={false} />
              <p className="mt-2 text-xs text-neutral-500">Pola yang dipakai: <span className="font-mono font-semibold text-neutral-800">0x{calc.toUpperCase() || "…"}</span> · {calc.length} karakter</p>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between gap-4 border-b border-neutral-100 pb-3"><dt className="text-neutral-500">Rata-rata kandidat</dt><dd className="font-mono font-semibold text-right">{calc.length ? formatCount(calcExpected) : "—"}</dd></div>
                <div className="flex justify-between gap-4 border-b border-neutral-100 pb-3"><dt className="text-neutral-500">Peluang per kandidat</dt><dd className="font-mono font-semibold text-right">{calc.length ? `1 / ${formatCount(calcExpected)}` : "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-neutral-500">Penilaian</dt><dd className="font-semibold text-right">{difficultyFor(calc.length)}</dd></div>
              </dl>
              <p className="mt-6 rounded-lg bg-lime-100 px-3 py-2.5 text-xs leading-5 text-neutral-700">Tips: mulai dari 4 karakter dulu untuk merasakan alurnya, baru naik pelan-pelan.</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950 text-xs uppercase tracking-wider text-neutral-300">
                  <tr><th className="px-4 py-3">Panjang pola</th><th className="px-4 py-3 text-right">Rata-rata kandidat</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                    <tr key={n} className={calc.length === n ? "bg-lime-50 font-semibold" : undefined}>
                      <td className="px-4 py-3 font-mono">{n} karakter</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCount(16 ** n)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-neutral-100 bg-[#fffefa] px-4 py-3 text-[11px] leading-5 text-neutral-500">Angka di atas adalah ekspektasi statistik dari README, bukan hitungan mundur. Hasil bisa datang lebih cepat atau jauh lebih lama.</p>
            </div>
          </div>
        </section>

        <section id="workflow" className="border-t border-neutral-200 py-20 sm:py-24">
          <p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-500">03 / Cara kerjanya</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-.075em] sm:text-6xl">Mulai dari yang sederhana.</h2>
          <div className="mt-9 grid gap-3 md:grid-cols-3">
            {[
              { n: "01", title: "Pilih polanya", text: "Tentukan rangkaian karakter yang ingin muncul di awal atau akhir alamat Ethereum.", code: 'pattern = "cafe"' },
              { n: "02", title: "Jalankan di perangkatmu", text: "Jalankan pencarian lewat Node.js di perangkatmu. Mode paralel dapat memanfaatkan beberapa inti CPU.", code: "npm run parallel -- cafe" },
              { n: "03", title: "Jaga tetap aman", text: "Baca kode sebelum menjalankannya dan simpan hasil rahasia dengan aman. Jangan unggah private key atau seed phrase ke GitHub.", code: "# your machine, your keys" },
            ].map((s) => (
              <article key={s.n} className="flex min-h-56 flex-col rounded-2xl border border-neutral-200 bg-[#fffefa] p-6">
                <span className="font-mono text-xs text-neutral-500">{s.n} / STEP</span>
                <h3 className="mt-7 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-neutral-600">{s.text}</p>
                <code className="mt-5 overflow-x-auto rounded-lg bg-neutral-950 px-3 py-3 text-[11px] text-lime-200">{s.code}</code>
              </article>
            ))}
          </div>
        </section>

        <section id="install" className="scroll-mt-6 border-t border-neutral-200 py-20 sm:py-24">
          <div className="grid gap-9 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-500">04 / Mulai pakai</p>
              <h2 className="mt-4 text-4xl font-semibold leading-none tracking-[-.075em] sm:text-6xl">Dari clone<br />sampai jalan.</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-neutral-600">Salin perintah satu per satu, atau buka README lengkapnya di GitHub. Pastikan kamu menjalankannya di perangkat yang kamu percaya.</p>
              <a href="https://github.com/hanzvibes/ethvanity-js#install" className="mt-6 inline-block rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold">Baca instalasi lengkap ↗</a>
            </div>
            <div className="space-y-3">
              {installSteps.map((step) => (
                <div key={step.command} className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-[#171915] p-3 pl-4 text-neutral-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{step.label}</p>
                    <code className="mt-1 block truncate font-mono text-xs text-lime-200 sm:text-sm">{step.command}</code>
                  </div>
                  <CopyButton text={step.command} label={`Salin perintah ${step.label}`} />
                </div>
              ))}
              <p className="text-[11px] leading-5 text-neutral-500">Mode paralel membuka monitor lokal di http://127.0.0.1:4173 selama proses berjalan. Monitor itu menampilkan alamat publik saja, bukan private key.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-9 border-t border-neutral-200 py-20 md:grid-cols-2 md:gap-16">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-500">05 / Keamanan dulu</p>
            <h2 className="mt-4 text-4xl font-semibold leading-none tracking-[-.075em] sm:text-6xl">Rahasiamu<br />tetap milikmu.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-neutral-600">Pencarian sebenarnya dijalankan secara lokal lewat alat Node.js. Demo di halaman ini terpisah dan tidak membuat dompet atau private key.</p>
          </div>
          <div className="space-y-3">
            {[
              { t: "Berjalan di perangkatmu", d: "Pencarian asli dijalankan lewat Node.js di perangkatmu. Website ini hanya menampilkan demo." },
              { t: "Periksa sebelum dipakai", d: "Proyek ini belum diaudit keamanannya secara independen. Baca dan pahami kodenya sebelum menggunakannya untuk aset bernilai." },
              { t: "Lindungi file hasil", d: "Private key dan seed phrase memberi akses ke dompetmu. Simpan dengan aman dan jangan pernah commit ke Git." },
            ].map((x) => (
              <div key={x.t} className="flex gap-4 rounded-xl border border-neutral-200 bg-[#fffefa] p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-lime-100 text-green-800">✓</span>
                <div><h3 className="text-sm font-semibold">{x.t}</h3><p className="mt-1 text-xs leading-5 text-neutral-500">{x.d}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-neutral-200 py-20 sm:py-24">
          <p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-500">06 / Pertanyaan umum</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-.075em] sm:text-6xl">Sebelum kamu jalanin.</h2>
          <div className="mt-9 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="rounded-2xl border border-neutral-200 bg-[#fffefa] p-5">
                <summary className="cursor-pointer text-sm font-semibold sm:text-base">{faq.q}</summary>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="flex flex-col justify-between gap-6 rounded-2xl bg-lime-300 p-7 sm:p-11 md:flex-row md:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.17em] text-neutral-700">Mau coba sendiri?</p>
            <h2 className="mt-3 text-4xl font-semibold leading-none tracking-[-.075em] sm:text-5xl">Cari alamat dengan pola pilihanmu.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-neutral-700">Buka repositorinya untuk melihat kode, cara instalasi, dan cara menjalankan pencarian di perangkatmu.</p>
          </div>
          <a className="self-start rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white md:self-center" href="https://github.com/hanzvibes/ethvanity-js">Lihat proyek di GitHub ↗</a>
        </section>

        <footer className="flex flex-col justify-between gap-3 py-7 text-[11px] text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} ethvanity.js · Kode terbuka · berjalan lokal.</p>
          <div className="flex gap-5">
            <a href="#kalkulator">Kalkulator</a>
            <a href="https://github.com/hanzvibes/ethvanity-js">GitHub</a>
            <a href="#playground">Balik ke simulasi ↑</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
