import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoffeeChat",
  description: "Chat with Coffee",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased w-screen h-screen max-w-screen max-h-[90vh] bg-gray-200`}
    >
      <Navbar />
      <body className="antialiased w-full h-full bg-gray-200">
        <main className="flex flex-col items-center align-middle h-full ">
          <div className="flex overflow-hidden items-center justify-center w-full h-full align-middle content-center">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
