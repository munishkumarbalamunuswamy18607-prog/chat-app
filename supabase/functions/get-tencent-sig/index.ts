import { createClient } from "npm:@supabase/supabase-js@2";
import { TLSSigAPIv2 } from "npm:tls-sig-api-v2";

const SDK_APP_ID = Number(Deno.env.get("TENCENT_SDK_APP_ID")!);
const SECRET_KEY = Deno.env.get("TENCENT_SECRET_KEY")!;

Deno.serve(async (req) => {
  const token = req.headers.get("Authorization")!.replace("Bearer ", "");
  const payload = JSON.parse(atob(token.split(".")[1]));
  const userId: string = payload.sub;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("tencent_user_id")
    .eq("id", userId)
    .single();

  if (!profile?.tencent_user_id) {
    return new Response(JSON.stringify({ error: "No Tencent ID" }), { status: 404 });
  }

  const api = new TLSSigAPIv2.Api(SDK_APP_ID, SECRET_KEY);
  const userSig = api.genSig(profile.tencent_user_id, 86400);

  return new Response(
    JSON.stringify({ sdkAppId: SDK_APP_ID, userId: profile.tencent_user_id, userSig }),
    { headers: { "Content-Type": "application/json" } }
  );
});   