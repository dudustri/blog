import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import JsonLd from "./components/JsonLd";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://eduardo.dk";

const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Eduardo Sfreddo Trindade",
  url: SITE_URL,
  image: `${SITE_URL}/images/og.png`,
  jobTitle: "Software & Energy Engineer",
  address: { "@type": "PostalAddress", addressLocality: "Copenhagen", addressCountry: "DK" },
  sameAs: [
    "https://github.com/dudustri",
    "https://linkedin.com/in/eduardo-sfreddo-trindade",
  ],
};
const TITLE = "Eduardo Sfreddo Trindade";
const DESCRIPTION = "Software & Energy Engineer, personal blog and portfolio";

export const metadata: Metadata = {
  // absolute urls for the share card, relative paths below resolve against it
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s · ${TITLE}`,
  },
  description: DESCRIPTION,
  // no explicit icons entry: app/icon.svg and app/favicon.ico are picked up by
  // the file convention, which appends a content hash so a changed icon busts
  // the browser's very sticky favicon cache
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": [{ url: "/feed.xml", title: TITLE }] },
  },
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en",
    images: [
      {
        url: "/images/og.png",
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/og.png"],
  },
};

// applies saved theme before first paint, so dark mode doesn't flash white on
// load. runs inline in <head>, ahead of React. Header keeps it in sync after
const themeScript = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // script above may add "dark" before hydration, so class can differ from server HTML
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} antialiased bg-white text-black flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <JsonLd data={PERSON} />
      </body>
    </html>
  );
}
