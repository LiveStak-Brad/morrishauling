import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { GoogleAnalytics } from "@/components/seo/GoogleAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.morris-services.com"),
  title: {
    default: "Morris Service Group | Junk Removal, Hauling, Land Clearing & Site Work",
    template: "%s | Morris Services",
  },
  description:
    "Morris Service Group LLC — junk removal, hauling, land clearing, site work, and equipment services. Request an estimate or call (636) 751-4645.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/MorrisServicesLogo.png?v=6", type: "image/png" }],
    apple: [{ url: "/MorrisServicesLogo.png?v=6", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.morris-services.com",
    siteName: "Morris Services",
    title: "Morris Service Group LLC | Morris Services",
    description:
      "Junk removal, hauling, land clearing, site work, and equipment services from Morris Service Group LLC.",
    images: [
      {
        url: "/og/og-morris-services.png",
        width: 1200,
        height: 630,
        alt: "Morris Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Morris Service Group LLC | Morris Services",
    description:
      "Junk removal, hauling, land clearing, site work, and equipment services from Morris Service Group LLC.",
    images: ["/og/og-morris-services.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Morris Services",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#9B1B30",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background">
        <GoogleAnalytics />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
