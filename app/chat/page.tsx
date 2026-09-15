"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import AddContactModal from "@/components/AddContactModal";

interface Contact {
  id: string;
  username: string;
  display_name: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [myName, setMyName] = useState("");

  useEffect(() => {
    loadContacts();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("users").select("display_name").eq("id", user.id).single()
          .then(({ data }) => setMyName(data?.display_name || ""));
      }
    });
  }, []);

  async function loadContacts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("contacts")
      .select("contact_id, users!contacts_contact_id_fkey(username, display_name)")
      .eq("user_id", user.id);

    if (data) {
      setContacts(
        data
          .map((row: any) => ({
            id: row.contact_id,
            username: row.users?.username || "",
            display_name: row.users?.display_name || "Unknown",
          }))
          .filter((c: Contact) => c.display_name !== "Unknown")
      );
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg">{myName || "Chat"}</h1>
        <button onClick={() => setShowAdd(true)} className="text-blue-600 font-medium text-sm">
          + Add Contact
        </button>
      </header>
      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">No contacts yet. Add one!</p>
        ) : (
          contacts.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/chat/${c.id}`)}
              className="w-full flex items-center px-4 py-3 hover:bg-gray-100 border-b"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                {c.display_name[0]?.toUpperCase()}
              </div>
              <div className="ml-3 text-left">
                <p className="font-medium">{c.display_name}</p>
                <p className="text-xs text-gray-500">@{c.username}</p>
              </div>
            </button>
          ))
        )}
      </div>
      {showAdd && <AddContactModal onClose={() => setShowAdd(false)} onAdded={loadContacts} />}
    </div>
  );
}
