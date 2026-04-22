import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PitchIt - Pipeline Intelligence by Blostem",
  description: "AI-powered B2B pipeline intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background flex flex-col`}>
        <Navigation />
        <main className="flex-1 p-6 lg:px-12 w-full max-w-[1600px] mx-auto overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
