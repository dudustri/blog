import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Eduardo Sfreddo Trindade.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact",
    description: "Get in touch with Eduardo Sfreddo Trindade.",
    url: "/contact",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
