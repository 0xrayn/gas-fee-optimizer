import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "GasWatch Pro",
  description: "Real-time Ethereum gas fee optimizer  multi-chain, live alerts, smart insights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          FIX: Inline script ini dieksekusi secara sinkron sebelum browser
          me-render body, sehingga theme yang benar langsung diterapkan ke DOM
          tanpa flash dark → light saat user memiliki preferensi light mode.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('gw-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}else if(window.matchMedia('(prefers-color-scheme: light)').matches){document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
