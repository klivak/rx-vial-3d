import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aurel Daily - Care that comes to you",
  description: "A scroll-driven 3D product page for a fictional telehealth brand, built with React Three Fiber and Next.js.",
  openGraph: {
    title: "Aurel Daily - Care that comes to you",
    description: "Scroll-driven 3D product page with AR, built with React Three Fiber.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F4F1EC",
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
