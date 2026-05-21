import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriSmart",
  description: "AI-powered nutrition assistant for students",
};

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/log", label: "Log Meal" },
  { href: "/inventory", label: "Inventory" },
  { href: "/history", label: "History" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-brand text-white shadow-md">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-8">
            <span className="font-bold text-xl tracking-tight">NutriSmart</span>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-sm font-medium hover:text-brand-light transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-6">
          NutriSmart is not a medical tool. Always consult a professional for dietary advice.
        </footer>
      </body>
    </html>
  );
}
