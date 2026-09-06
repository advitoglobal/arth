import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anek_Latin, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const anek = Anek_Latin({
  variable: "--font-anek",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "arth, for auto retail",
    template: "%s · arth",
  },
  description:
    "Other systems tell you your telecaller made forty calls. Arth tells you which of those calls came from a source costing ₹9,200 a booking.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${anek.variable} ${plex.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--arth-n05)] font-sans text-[var(--arth-ink)]">
        {children}
      </body>
    </html>
  );
}
