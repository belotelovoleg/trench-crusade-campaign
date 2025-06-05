import { Suspense } from "react";
import BattlePageInner from "./BattlePageInner";

export default function BattlePage() {
  return (
    <Suspense fallback={null}>
      <BattlePageInner />
    </Suspense>
  );
}
