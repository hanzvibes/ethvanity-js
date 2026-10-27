"use client";

import { useEffect, useState } from "react";

const DEMO_SCENES = [
  ["$ npm start", "Mode interaktif siap."],
  ["$ run CAFE", "Mencari pola awalan: CAFE", "Mengecek kandidat alamat…"],
  ["✓ 0xCAFE7a91b3d4e5f60718293a4b5c6d7e8f901234", "Pola cocok (SIMULASI)"],
  ["$ explain CAFE", "16^4 = 65.536 kandidat rata-rata."],
  ["$ security", "Jaga private key. Jangan unggah atau commit.", "Demo kembali ke awal…"],
];

export default function Home() {
  const [cliLoop, setCliLoop] = useState(true);
  const [cliPhase, setCliPhase] = useState(0);
  const [cliInput, setCliInput] = useState("");
  const [cliLines, setCliLines] = useState<string[]>([
    "ethvanity.js — demo terminal",
    "Hasil di bawah disimulasikan. Tidak ada wallet atau private key yang dibuat.",
  ]);

  useEffect(() => {
    if (!cliLoop) return;
    const id = window.setInterval(
      () => setCliPhase((phase) => (phase + 1) % DEMO_SCENES.length),
      2000,
    );
    return () => window.clearInterval(id);
  }, [cliLoop]);

  const lines = cliLoop
    ? ["ethvanity.js — demo terminal", ...DEMO_SCENES[cliPhase]]
    : cliLines;

  function executeCli(raw: string) {
    const command = raw.trim();
    if (!command) return;
    setCliLoop(false);
    const args = command.toLowerCase().split(/\s+/);
    const name = args[0];
    let output: string[];
    if (name === "clear") {
      setCliLines([]);
      setCliInput("");
      return;
    }
    if (name === "help") {
      output = ["run CAFE · run CAFE --suffix · explain CAFE · security · clear"];
    } else if (name === "run") {
      const pattern = (args[1] || "cafe").replace(/^0x/, "").replace(/[^0-9a-f]/g, "").slice(0, 8);
      const suffix = args.includes("--suffix");
      const hex = "0123456789abcdef";
      const randomPart = Array.from({ length: 40 - pattern.length }, () => hex[Math.floor(Math.random() * 16)]).join("");
      const candidate = "0x" + (suffix ? randomPart + pattern : pattern + randomPart);
      output = [
        `Pola ${suffix ? "akhiran" : "awalan"}: ${pattern || "(kosong)"}`,
        `✓ ${candidate}`,
        "Hasil simulasi — bukan pencarian nyata.",
      ];
    } else if (name === "explain") {
      const pattern = (args[1] || "cafe").replace(/^0x/, "").replace(/[^0-9a-f]/g, "").slice(0, 8);
      output = [`Pola: ${pattern}`, `Perkiraan ruang pencarian: 16^${pattern.length} = ${(16 ** pattern.length).toLocaleString("en-US")} kandidat.`];
    } else if (name === "security") {
      output = ["Pencarian asli berjalan lokal lewat Node.js.", "Jangan bagikan private key atau seed phrase."];
    } else if (name === "quit" || name === "exit") {
      output = ["Sesi demo berhenti. Muat ulang halaman untuk memulai lagi."];
    } else {
      output = ['Perintah tidak dikenal. Coba ketik "help".'];
    }
    setCliLines((current) => [...current, `$ ${command}`, ...output].slice(-12));
    setCliInput("");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f6f2] text-[#22231f]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[560px] overflow-hidden">
        <div className="absolute -right-24 -top-24 size-[28rem] rounded-full bg-lime-300/25 blur-[100px]" />
        <div className="absolute -left-40 top-48 size-[24rem] rounded-full bg-cyan-200/20 blur-[100px]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-[min(1080px,calc(100%-32px))] flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-neutral-200">
          <a href="#" className="text-lg font-bold tracking-tight">
            ethvanity<span className="text-neutral-400">.js</span>
          </a>
          <a
            href="https://github.com/hanzvibes/ethvanity-js"
            className="rounded-full bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-700"
          >
            GitHub ↗
          </a>
        </header>

        <section className="grid flex-1 content-center gap-8 py-10 md:grid-cols-[0.85fr_1.15fr] md:items-center md:gap-12 md:py-12">
          <div className="reveal">
            <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-neutral-500">
              <span className="size-2 rounded-full bg-lime-500" />
              Open-source · Node.js · Ethereum
            </p>
            <h1 className="max-w-xl text-[clamp(3.4rem,8vw,6.2rem)] font-semibold leading-[.9] tracking-[-.085em]">
              Alamat Ethereum. <span className="relative z-0 inline-block">Pola kamu.<span className="absolute bottom-1 left-0 -z-10 h-[24%] w-full -rotate-1 bg-lime-300" /></span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-neutral-600 sm:text-base sm:leading-7">
              Cari alamat dengan awalan atau akhiran pilihanmu. Pencarian asli berjalan lokal di perangkatmu.
            </p>
            <p className="mt-4 text-[11px] text-neutral-500">Pratinjau di samping hanya simulasi, bukan pembuat wallet.</p>
          </div>

          <div className="terminal-float overflow-hidden rounded-2xl border border-neutral-800 bg-[#171915] text-neutral-100 shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#22241f] px-4 py-3">
              <i className="size-2.5 rounded-full bg-red-400" />
              <i className="size-2.5 rounded-full bg-amber-300" />
              <i className="size-2.5 rounded-full bg-green-400" />
              <span className="ml-auto font-mono text-[10px] text-neutral-400">terminal demo</span>
            </div>
            <div className="p-4 sm:p-5">
              <div aria-live="polite" className="min-h-[176px] space-y-2 font-mono text-xs leading-6 sm:text-[13px]">
                {lines.map((line, index) => (
                  <p key={index} className={line.startsWith("$") || line.startsWith("✓") ? "break-all text-lime-300" : "break-words text-neutral-300"}>
                    {line}
                  </p>
                ))}
              </div>
              <form
                className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 font-mono text-xs"
                onSubmit={(event) => {
                  event.preventDefault();
                  executeCli(cliInput);
                }}
              >
                <span className="text-lime-300">❯</span>
                <input
                  aria-label="Perintah terminal"
                  value={cliInput}
                  onChange={(event) => setCliInput(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent py-2 text-neutral-100 outline-none placeholder:text-neutral-600"
                  placeholder="Coba: run cafe"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="submit" className="rounded-md bg-lime-300 px-3 py-2 font-sans text-[11px] font-bold text-neutral-950 transition hover:bg-lime-200">
                  Jalankan
                </button>
              </form>
              <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-neutral-500">
                <span>{cliLoop ? "Demo otomatis berulang" : "Mode perintah · simulasi"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setCliLines(["ethvanity.js — demo terminal", "Hasil disimulasikan. Tidak ada wallet atau private key yang dibuat."]);
                    setCliPhase(0);
                    setCliInput("");
                    setCliLoop(true);
                  }}
                  className="underline underline-offset-4 transition hover:text-lime-200"
                >
                  {cliLoop ? "Ulangi demo" : "Demo otomatis"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 py-5 text-[10px] text-neutral-500">
          <span>ethvanity.js · Open-source CLI</span>
          <span>Jaga private key. Jangan commit file hasil.</span>
        </footer>
      </div>
    </main>
  );
}
