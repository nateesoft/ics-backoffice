import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import LiveChat from "@/components/site/LiveChat";
import ScrollAnimator from "@/components/site/ScrollAnimator";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ICS — In Concept Service",
  description:
    "ICS (In Concept Service) ผู้เชี่ยวชาญด้านการพัฒนาซอฟต์แวร์ POS บริการ Colocation Server และระบบเครือข่าย LAN/WiFi ครบวงจร",
  keywords:
    "software development, POS software, colocation, server, network setup, LAN, WiFi, ไอซีเอส, ระบบซอฟต์แวร์",
  openGraph: {
    title: "ICS — In Concept Service",
    description:
      "ผู้เชี่ยวชาญด้านเทคโนโลยีสารสนเทศครบวงจร ตั้งแต่พัฒนาซอฟต์แวร์ไปจนถึงโครงสร้างพื้นฐานระบบเครือข่าย",
    type: "website",
  },
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${inter.variable} min-h-screen bg-[#f0f2f5] text-[#1c1e21] antialiased`}
      style={{
        fontFamily:
          "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Navbar />
      <main>{children}</main>
      <Footer />
      <LiveChat />
      <ScrollAnimator />
    </div>
  );
}
