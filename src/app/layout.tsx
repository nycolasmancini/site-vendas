import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/contexts/SessionContext";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import { CartSidebar } from "@/components/cart/CartSidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PMCELL São Paulo - Acessórios para Celular no Atacado",
  description: "Compre acessórios para celular no atacado com os melhores preços. Capas, películas, fones, carregadores e muito mais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <NextAuthProvider>
          <SessionProvider>
            {children}
            <CartSidebar />
          </SessionProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
