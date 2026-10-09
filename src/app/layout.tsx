import type { Metadata, Viewport } from "next";

import { GroftyRoot } from "@/components/grofty/grofty-root";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GroftPay — Canton payment requests",
    template: "%s · GroftPay",
  },
  description:
    "GroftPay turns a Canton party id into a shareable payment request. Create a request, share a link, settle in CC through Grofty Wallet.",
  applicationName: "GroftPay",
  keywords: ["Canton", "CC", "payment request", "Grofty", "CIP-0103", "dApp"],
};

export const viewport: Viewport = {
  themeColor: "#04060b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <GroftyRoot>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </GroftyRoot>
      </body>
    </html>
  );
}
