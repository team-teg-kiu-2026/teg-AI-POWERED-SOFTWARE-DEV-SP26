import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { TopBar, BottomNav } from "./_chrome";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NutriSmart — Vitality",
  description: "AI-powered nutrition assistant for students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`light ${manrope.variable} ${inter.variable}`}>
      <body className="bg-surface font-body text-on-surface min-h-screen pb-36">
        <TopBar />
        <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
          {children}
          <footer className="mt-12 pt-6 border-t border-outline-variant/30 text-center text-xs text-on-surface-variant leading-relaxed">
            NutriSmart is not a medical or dietary tool. Always consult a professional for clinical decisions.
          </footer>
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
