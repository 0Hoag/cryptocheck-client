import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import CryptoTicker from "@/components/CryptoTicker";
import NewsTicker from "@/components/NewsTicker";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CryptoCheck | Tin tức và phân tích crypto",
  description: "Theo dõi thị trường crypto, đọc tin tức đáng tin cậy và quét rủi ro token trong một nơi.",
  keywords: ["crypto", "cryptocurrency", "bitcoin", "ethereum", "blockchain", "news"],
  authors: [{ name: "CryptoCheck" }],
  openGraph: {
    title: "CryptoCheck",
    description: "Tin tức, dữ liệu thị trường và quét rủi ro token.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <LanguageProvider>
        <div className="min-h-screen bg-transparent">
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <Header />
          <CryptoTicker />
          <NewsTicker />
          <div id="main-content" tabIndex={-1}>{children}</div>
          <Footer />
        </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
