import {
  AbsoluteFill,
  Sequence,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const PREVIEW_WIDTH = 1280;
export const PREVIEW_HEIGHT = 720;
export const PREVIEW_FPS = 30;
export const PREVIEW_DURATION_IN_FRAMES = 300;

const HEX = "0123456789abcdef";
const PATTERN = "cafe";

function candidateAddress(attempt: number) {
  return (
    "0x" +
    Array.from({ length: 40 }, (_, i) => HEX[Math.floor(random(`candidate-${attempt}-${i}`) * 16)]).join("")
  );
}

function matchAddress() {
  return (
    "0x" +
    PATTERN +
    Array.from({ length: 36 }, (_, i) => HEX[Math.floor(random(`match-${i}`) * 16)]).join("")
  );
}

function Intro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const rise = interpolate(pop, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#171915",
        color: "#f7f6f2",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ opacity, transform: `translateY(${rise}px) scale(${0.96 + pop * 0.04})`, textAlign: "center" }}>
        <p style={{ fontSize: 22, letterSpacing: 6, color: "#a3e635", fontWeight: 700, margin: 0 }}>
          ETHVANITY.JS
        </p>
        <h1 style={{ fontSize: 72, lineHeight: 1.05, margin: "24px 0 0", maxWidth: 900 }}>
          Bikin alamat Ethereum dengan pola pilihanmu.
        </h1>
        <p style={{ fontSize: 26, color: "#d4d4d4", marginTop: 24 }}>
          Kode terbuka · Berjalan lokal · Tanpa server pencarian
        </p>
      </div>
    </AbsoluteFill>
  );
}

function Search() {
  const frame = useCurrentFrame();
  const attempt = Math.floor(frame / 12);
  const current = candidateAddress(attempt);
  const previous = attempt > 0 ? candidateAddress(attempt - 1) : null;
  const progress = interpolate(frame, [0, 140], [6, 96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#171915",
        color: "#f7f6f2",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ width: 980 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}>
          <span style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "#f87171" }} />
          <span style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "#facc15" }} />
          <span style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "#4ade80" }} />
          <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 20, color: "#a3a3a3" }}>
            ethvanity — pratinjau demo
          </span>
        </div>
        <p style={{ fontFamily: "monospace", fontSize: 30, color: "#a3e635", margin: "0 0 12px" }}>
          $ run CAFE
        </p>
        <p style={{ fontFamily: "monospace", fontSize: 22, color: "#d4d4d4", margin: "0 0 28px" }}>
          Pola yang dicari: <span style={{ color: "#bef264" }}>0xCAFE</span> · Mode: awalan
        </p>
        {previous ? (
          <p style={{ fontFamily: "monospace", fontSize: 24, color: "#737373", margin: "0 0 10px", wordBreak: "break-all" }}>
            {previous}
          </p>
        ) : null}
        <p style={{ fontFamily: "monospace", fontSize: 30, color: "#fafafa", margin: 0, wordBreak: "break-all" }}>
          {current}
        </p>
        <div style={{ height: 10, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 999, marginTop: 32, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "#a3e635" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, fontFamily: "monospace", fontSize: 20, color: "#a3a3a3" }}>
          <span>KANDIDAT DEMO: {attempt + 1}</span>
          <span style={{ color: "#a3e635" }}>LAGI CEK…</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Match() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });
  const address = matchAddress();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#171915",
        color: "#f7f6f2",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ width: 980, textAlign: "center", transform: `scale(${0.94 + pop * 0.06})`, opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }) }}>
        <p style={{ display: "inline-block", backgroundColor: "#a3e635", color: "#171915", fontWeight: 800, fontSize: 22, padding: "10px 22px", borderRadius: 999, margin: 0 }}>
          ✓ KETEMU (SIMULASI)
        </p>
        <p style={{ fontFamily: "monospace", fontSize: 34, margin: "36px 0 0", wordBreak: "break-all" }}>
          0x<span style={{ backgroundColor: "#a3e635", color: "#171915", padding: "0 6px", borderRadius: 6 }}>CAFE</span>
          {address.slice(6)}
        </p>
        <p style={{ fontSize: 24, color: "#d4d4d4", marginTop: 28 }}>
          Pola CAFE ada di awalan alamat — ini contoh visual, bukan hasil pencarian asli.
        </p>
      </div>
    </AbsoluteFill>
  );
}

function Outro() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [30, 39], [1, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#a3e635",
        color: "#171915",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
        opacity: opacity * fadeOut,
        textAlign: "center",
      }}
    >
      <div>
        <h2 style={{ fontSize: 64, margin: 0 }}>Jalankan lokal di perangkatmu.</h2>
        <p style={{ fontFamily: "monospace", fontSize: 28, marginTop: 24 }}>
          github.com/hanzvibes/ethvanity-js
        </p>
        <p style={{ fontSize: 20, marginTop: 24, opacity: 0.75 }}>
          Demo visual Remotion — bukan dompet atau private key asli.
        </p>
      </div>
    </AbsoluteFill>
  );
}

export function EthvanityPreview() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#171915" }}>
      <Sequence from={0} durationInFrames={60}>
        <Intro />
      </Sequence>
      <Sequence from={55} durationInFrames={145}>
        <Search />
      </Sequence>
      <Sequence from={200} durationInFrames={60}>
        <Match />
      </Sequence>
      <Sequence from={260} durationInFrames={40}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
}
