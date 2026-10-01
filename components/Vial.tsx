"use client";

import { useEffect, useMemo } from "react";
import { useQuality } from "@/lib/quality";
import { buildVial } from "@/lib/scene/buildVial";
import { theme } from "@/lib/theme";

export function Vial() {
  const quality = useQuality();
  const parts = useMemo(() => buildVial({ quality, capColor: theme.capColors[0].value }), [quality]);
  useEffect(() => parts.dispose, [parts]);
  return <primitive object={parts.group} />;
}
