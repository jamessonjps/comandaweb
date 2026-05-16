import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-body',
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: "Comanda Web | Gestão Ágil de Restaurantes",
  description: "Substitua o papel e a caneta com extrema agilidade.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Comanda Web",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased bg-[#0A0A0B] text-[#F4F4F5]">
        {children}
      </body>
    </html>
  );
}
