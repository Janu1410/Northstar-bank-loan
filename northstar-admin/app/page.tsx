"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getStoredAdminToken } from "../lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (getStoredAdminToken()) {
      router.replace("/dashboard");
      return;
    }

    router.replace("/login");
  }, [router]);

  return null;
}
