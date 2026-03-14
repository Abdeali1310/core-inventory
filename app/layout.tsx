import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoreInventory",
  description: "Modular Inventory Management System",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            closeButton
          />
        </Providers>
      </body>
    </html>
  );
}
