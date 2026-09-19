import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eduardo Sfreddo Trindade",
  description: "Software & Energy Engineer — personal blog and portfolio",
  icons: {
    icon: "/icon.svg",
  },
};

// Applies the saved theme before first paint, so dark mode doesn't flash white
// on load. Runs inline in <head>, ahead of React; Header keeps it in sync after.
const themeScript = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The script above may add "dark" before hydration, so the class can differ from the server HTML.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} antialiased bg-white text-black flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
