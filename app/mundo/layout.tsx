import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mundo",
  description: "An interactive globe of the countries Eduardo Sfreddo Trindade has visited and the ones still on the list.",
  alternates: { canonical: "/mundo" },
  openGraph: {
    title: "Mundo",
    description: "An interactive globe of the countries Eduardo Sfreddo Trindade has visited and the ones still on the list.",
    url: "/mundo",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
