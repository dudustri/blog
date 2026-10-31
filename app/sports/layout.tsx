import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sports",
  description: "Every recorded training session since the Garmin, and the pizzas earned along the way.",
  alternates: { canonical: "/sports" },
  openGraph: {
    title: "Sports",
    description: "Every recorded training session since the Garmin, and the pizzas earned along the way.",
    url: "/sports",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
