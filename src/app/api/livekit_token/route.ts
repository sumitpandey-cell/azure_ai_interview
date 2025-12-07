import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function GET() {
  // Generate unique identity for the candidate
  const candidateIdentity = "candidate-" + Math.random().toString(36).substring(7);

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity: candidateIdentity }
  );

  token.addGrant({
    roomJoin: true,
    room: "interview-room",
    canPublish: true,
    canSubscribe: true,
  });

  return NextResponse.json({
    url: process.env.LIVEKIT_URL!,
    token: await token.toJwt(),
  });
}
