import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AppNavigation } from "@/components/app-navigation";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Succulent Sphere Orders",
  description:
    "Internal order management tool for creating WhatsApp orders and printable packing slips.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(74,222,128,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_22%),linear-gradient(180deg,_#f8f4ec_0%,_#f3eee5_100%)]">
        <Providers />
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 sm:px-6 lg:px-8">
          <AppNavigation />
          <main className="flex-1 pb-20 pt-6 sm:pt-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
