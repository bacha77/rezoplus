import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSubscription } from "@/lib/stripe-db";

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Admin / Test Account Bypass
    const email = user?.emailAddresses[0]?.emailAddress;
    const isAdmin = email === "bacha7@gmail.com";

    const subscription = await getSubscription(userId);

    const isActive = isAdmin || subscription?.status === "active" || subscription?.status === "trialing";

    return NextResponse.json({ isActive, subscription, isAdmin });
  } catch (error) {
    console.error("[SUBSCRIPTION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
