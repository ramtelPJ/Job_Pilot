"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function ResetAnalytics() {
  useEffect(() => {
    posthog.reset();
  }, []);

  return null;
}
