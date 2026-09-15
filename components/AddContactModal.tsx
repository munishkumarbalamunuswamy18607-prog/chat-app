"use client";
import { useState } from "react";
import supabase from "@/lib/supabase";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddContactModal({ onClose, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; username: string; display_name: string }[]>([]);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout>>();
  const [adding, setAdding] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(val: string) {
    setQuery(val);
    setErrorMsg("");
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
    setAdding(username);
    setErrorMsg("");
    const { error } = await supabase.rpc("add_contact", { target_username: username });
    setAdding(null);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    onAdded();
    onClose();
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
        {errorMsg && <p className="text-red-500 text-xs mb-2">{errorMsg}</p>}
        <div className="max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.username}
              disabled={adding === r.username}
              onClick={() => addContact(r.username)}
              className="w-full flex items-center px-3 py-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                {r.display_name[0]?.toUpperCase()}
              </div>
              <div className="ml-3 text-left">
                <p className="font-medium text-sm">{r.display_name}</p>
                <p className="text-xs text-gray-500">@{r.username}</p>
              </div>
              {adding === r.username && <span className="ml-auto text-xs text-gray-400">Adding…</span>}
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
