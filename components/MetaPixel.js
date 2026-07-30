"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function MetaPixel() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    // O primeiro PageView já é disparado pelo script carregado no layout.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  return null;
}
