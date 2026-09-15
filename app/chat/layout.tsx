"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { getChatClient } from "@/lib/chat";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      try {
        await getChatClient();
      } catch {}
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><p>Connecting...</p></div>;
  }

  return <div className="max-w-md mx-auto h-screen flex flex-col">{children}</div>;
}
