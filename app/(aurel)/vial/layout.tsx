import type { Metadata, Viewport } from "next";

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
};

export default function VialLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
