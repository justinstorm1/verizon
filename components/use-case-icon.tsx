import { Gamepad2, ShieldCheck, Store, Truck, Video } from "lucide-react"

import type { UseCaseId } from "@/lib/config"

export const USE_CASE_ICONS: Record<UseCaseId, typeof Video> = {
  livestream: Video,
  "food-trucks": Truck,
  esports: Gamepad2,
  "popup-retail": Store,
  "safety-comms": ShieldCheck,
}
