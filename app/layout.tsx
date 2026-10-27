import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ethvanity.js — Make the address yours", description: "An open-source, local-first Node.js CLI for searching Ethereum vanity address patterns.", openGraph: { title: "ethvanity.js — Make the address yours", description: "Explore patterns, read the source, and get started.", type: "website" }, twitter: { card: "summary" } };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
