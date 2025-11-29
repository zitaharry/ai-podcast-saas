import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";
import { ConvexClientProvider } from "@/app/convex-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Podcast Assistant",
  description:
    "Transform your podcasts with AI - Get transcripts, summaries, social posts, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <html lang="en">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            {children}
            {/*<Toaster />*/}
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
