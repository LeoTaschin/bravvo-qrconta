import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QRConta",
  description: "Pague a conta da sua mesa direto pelo celular",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col bg-[#f3f3f3]"
        style={{
          backgroundImage: 'radial-gradient(ellipse 900px 700px at 50% 0%, rgba(133,22,25,0.06), transparent 60%)',
        }}
      >
        {children}
      </body>
    </html>
  );
}
