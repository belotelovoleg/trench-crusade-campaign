import { Suspense } from "react";
import BattlePageInner from "@/app/battle/BattlePageInner";

export const dynamic = "force-dynamic";

export default function BattlePage() {
  return (
    <Suspense fallback={null}>
      <BattlePageInner />
    </Suspense>
  );
}
