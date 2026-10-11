import type { Metadata, Viewport } from "next";
import { AppNav, navScript } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import { fraunces, poppins } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Paiol · Ferramentas internas", template: "%s · Paiol" },
  description: "Etiquetas, marca e ofertas da Paiol Produtos Naturais.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#ffffff", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-nav is set before hydration by navScript, so React must not compare it.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: navScript }} />
      </head>
      <body className={`${poppins.variable} ${fraunces.variable} font-sans antialiased`}>
        <div className="min-h-dvh md:grid md:grid-cols-[var(--nav-width)_1fr] md:transition-[grid-template-columns] md:duration-200">
          <AppNav />
          <main className="min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
        </div>
        <Toaster position="bottom-right" mobileOffset={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }} />
      </body>
    </html>
  );
}
