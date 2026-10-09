import { sagMenuAramasi } from "@/lib/sagMenuArama";

// Kurumsal firmalarda ara
export async function GET(request: Request) {
  return sagMenuAramasi(request, "kurumsal");
}
