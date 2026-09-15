import TencentCloudChat from "@tencentcloud/chat";
import supabase from "./supabase";

let tim: ReturnType<typeof TencentCloudChat.create> | null = null;

export async function getChatClient() {
  if (tim) return tim;

  const { data, error } = await supabase.functions.invoke("get-tencent-sig");
  if (error) throw error;

  tim = TencentCloudChat.create({
    SDKAppID: data.sdkAppId,
  });

  await tim.login({ userID: data.userId, userSig: data.userSig });

  tim.on(TencentCloudChat.EVENT.KICKED_OUT, async (event: any) => {
    if (event.data.type === TencentCloudChat.TYPES.KICKED_OUT_USERSIG_EXPIRED) {
      const { data: fresh } = await supabase.functions.invoke("get-tencent-sig");
      if (fresh) await tim!.login({ userID: fresh.userId, userSig: fresh.userSig });
    }
  });

  return tim;
}
