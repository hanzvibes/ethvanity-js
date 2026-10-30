import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ethvanity.js — Cari alamat Ethereum dengan pola pilihanmu",
  description:
    "CLI Node.js open-source dan local-first untuk mencari alamat Ethereum dengan awalan atau akhiran pilihanmu. Coba simulasi, hitung kesulitan pola, lalu jalankan di perangkatmu sendiri.",
  openGraph: {
    title: "ethvanity.js — Cari alamat Ethereum dengan pola pilihanmu",
    description:
      "Coba simulasi CLI-nya, hitung kesulitan pola, dan mulai pencarian lokal dari kode terbuka.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
