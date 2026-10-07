import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "@/styles/keystone.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keystone Collective · Architects & Builders",
  description:
    "Keystone Collective, the stone that holds everything together. Custom homes designed and built in Boulder, Colorado since 2004.",
  keywords: [
    "architects",
    "custom homes",
    "Boulder Colorado",
    "design build",
    "Keystone Collective",
  ],
  authors: [{ name: "Keystone Collective" }],
  openGraph: {
    title: "Keystone Collective · Architects & Builders",
    description:
      "The stone that holds everything together. Custom homes designed and built in Boulder, Colorado since 2004.",
    type: "website",
  },
  icons: {
    icon: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const themeBoot = `try{if(localStorage.getItem('kc-theme')==='dark')document.documentElement.classList.add('theme-dark');if(localStorage.getItem('kc-motion')==='reduced')document.documentElement.classList.add('reduced');}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500;1,600&family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="kc-theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        {children}
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              "<style>#preloader{display:none !important}html.booting{overflow:auto}</style>",
          }}
        />
        <Toaster />
      </body>
    </html>
  );
}
