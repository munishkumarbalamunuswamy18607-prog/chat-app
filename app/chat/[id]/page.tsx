"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function TOTPPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function enroll() {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "My Authenticator",
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrDataUrl(data.totp!.qr_code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (error) throw error;
      router.push("/chat");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Enable 2FA (TOTP)</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {!qrDataUrl ? (
          <button
            onClick={enroll}
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium"
          >
            {loading ? "Generating..." : "Generate QR Code"}
          </button>
        ) : (
          <div className="text-center">
            <img src={qrDataUrl} alt="TOTP QR" className="mx-auto mb-4" width={200} height={200} />
            <p className="text-sm text-gray-600 mb-4">
              Scan with Aegis, FreeOTP, or Google Authenticator
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full border rounded-lg px-4 py-2 text-center text-lg tracking-widest"
            />
            <button
              onClick={verify}
              disabled={code.length !== 6 || loading}
              className="mt-4 w-full bg-green-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
            >
              Verify & Enable
            </button>
          </div>
        )}

        <button onClick={() => router.push("/chat")} className="mt-4 w-full text-gray-500 text-sm">
          Skip for now
        </button>
      </div>
    </div>
  );
}
