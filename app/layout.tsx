import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
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
    default: "Morris Services | Your home, restored.",
    template: "%s | Morris Services",
  },
  description:
    "Morris Services — Junk Removal and Hauling for Warren, Lincoln & St. Charles Counties, MO. Book online today.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/MorrisServicesLogo.png", type: "image/png" }],
    apple: [{ url: "/MorrisServicesLogo.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.morris-services.com",
    siteName: "Morris Services",
    title: "Morris Services | Your home, restored.",
    description:
      "The standard for home services. Starting with Morris Junk Removal in Warren, Lincoln & St. Charles Counties, MO.",
    images: [
      {
        url: "/MorrisServicesLogo.png",
        width: 1334,
        height: 820,
        alt: "Morris Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Morris Services | Your home, restored.",
    description:
      "The standard for home services. Starting with Morris Junk Removal in Warren, Lincoln & St. Charles Counties, MO.",
    images: ["/MorrisServicesLogo.png"],
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
  maximumScale: 1,
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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
