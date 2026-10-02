import type { Metadata, Viewport } from "next";
import "./youtube.css";

export const metadata: Metadata = {
  title: "YouTube Channel Audit by AIR - find what holds your channel back",
  description: "A scroll-driven 3D page for YouTube creators: a 0–100 channel score, the main bottleneck and a plan to grow, from a free check to a full audit.",
  openGraph: {
    title: "YouTube Channel Audit by AIR",
    description: "Find what holds your channel back: a 0–100 score, the main bottleneck and a plan to grow.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0D1A",
  colorScheme: "dark",
};

export default function YoutubeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="yt-page">{children}</div>;
}
