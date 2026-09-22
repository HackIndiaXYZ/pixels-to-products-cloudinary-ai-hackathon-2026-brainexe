import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const DESCRIPTION =
  "Upload one rough product photo and get a clean shot, four platform crops, and the listing copy. Built on Cloudinary.";

export const metadata: Metadata = {
  title: "Photo to Catalog",
  description: DESCRIPTION,
  applicationName: "Photo to Catalog",
  openGraph: {
    title: "Photo to Catalog",
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Photo to Catalog",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <head>
        {/* Anything that animates in starts hidden. Without scripting it
            would stay hidden, so reveal it all up front. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important}`}</style>
        </noscript>
      </head>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
