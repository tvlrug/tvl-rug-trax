import type { Metadata } from "next";
import { Suspense } from "react";
import BRNavigationIndicator from "@/components/BRNavigationIndicator";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRAX | Train Reporting & Analytics eXplorer",
  description: "TVL-RUG historical railway reporting application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        {children}
        <Suspense fallback={null}>
          <BRNavigationIndicator />
        </Suspense>
      </body>
    </html>
  );
}
