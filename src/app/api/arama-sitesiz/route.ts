import { sagMenuAramasi } from "@/lib/sagMenuArama";

// Sanayi Dışı firmalarda ara (kurumsal firmalar hariç)
export async function GET(request: Request) {
  return sagMenuAramasi(request, "sitesiz");
}
