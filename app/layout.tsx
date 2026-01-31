import type { Metadata } from "next";
import { Geist, Geist_Mono, Google_Sans } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PlayerBar } from "@/components/playerbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthConfig } from "./provider/AuthConfig";
import { Titlebar } from "@/components/titlebar";
import { TitlebarProvider } from "@/contexts/titlebar-context";

// const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const googleSans = Google_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yee Music",
  description: "A simple music player.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${googleSans.variable} antialiased`}
      >
        <AuthConfig />

        <SidebarProvider>
          <AppSidebar />

          <div className="relative w-full flex flex-1 flex-col h-screen overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              <TitlebarProvider>
                <div className="w-full flex flex-col pb-24">
                  <Titlebar />
                  {children}
                </div>
              </TitlebarProvider>
            </main>
            <PlayerBar />
          </div>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
