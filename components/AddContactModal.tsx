"use client";
import { useState } from "react";
import supabase from "@/lib/supabase";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddContactModal({ onClose, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ username: string; display_name: string }[]>([]);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout>>();

  function handleChange(val: string) {
    setQuery(val);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => doSearch(val), 300);
    setTimer(t);
  }

  async function doSearch(q: string) {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const { data } = await supabase.rpc("search_users", { query: q });
    setResults(data || []);
  }

  async function addContact(username: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (userRow) {
      await supabase.from("contacts").insert({
        user_id: user.id,
        contact_id: userRow.id,
        status: "accepted",
      });
      onAdded();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg mb-4">Add Contact</h2>
        <input
          type="text"
          placeholder="Search by name or @username"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus
          className="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div className="max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.username}
              onClick={() => addContact(r.username)}
              className="w-full flex items-center px-3 py-2 hover:bg-gray-100 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                {r.display_name[0]?.toUpperCase()}
              </div>
              <div className="ml-3 text-left">
                <p className="font-medium text-sm">{r.display_name}</p>
                <p className="text-xs text-gray-500">@{r.username}</p>
              </div>
            </button>
          ))}
          {query.length >= 2 && results.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">No users found</p>
          )}
        </div>
        <button onClick={onClose} className="mt-4 w-full text-gray-500 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}
