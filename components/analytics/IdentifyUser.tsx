"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

type Props = {
  userId: string | null;
  email: string | null;
};

export function IdentifyUser({ userId, email }: Props) {
  useEffect(() => {
    if (userId) {
      posthog.identify(userId, email ? { email } : undefined);
    }
  }, [userId, email]);

  return null;
}
