import { careerDigest } from "@/app/data/digest";

export const dynamic = "force-static";

export function GET() {
  return new Response(careerDigest(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
