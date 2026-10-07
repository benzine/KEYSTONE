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

// Pre-paint theme boot: dark is the default. The dark class is applied FIRST
// and removed only when the visitor explicitly stored "light" (earlier toggles
// persist; if storage access throws, dark stays). Console marker makes the
// running build instantly verifiable in F12.
const themeBoot = `var d=document.documentElement;try{d.classList.add('theme-dark');if(localStorage.getItem('kc-theme')==='light')d.classList.remove('theme-dark');if(localStorage.getItem('kc-motion')==='reduced')d.classList.add('reduced');}catch(e){};console.info('[KC] THEME BOOT · '+(d.classList.contains('theme-dark')?'DARK default':'LIGHT stored'));`;

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
