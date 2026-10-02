import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Shared shell only: each page group sets its own title, description and theme colour.
export const metadata: Metadata = {
  title: "rx-vial-3d",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="is-loading">
      <head>
        <noscript>
          <style>{`.loader{display:none}html.is-loading{overflow:auto}`}</style>
        </noscript>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
