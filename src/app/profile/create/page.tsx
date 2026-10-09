import type { Metadata } from "next";

import { ProfileSetup } from "@/components/profile-setup";

export const metadata: Metadata = {
  title: "Create your payment profile",
  description: "Connect Grofty, detect your Canton identity, and choose a GroftPay username.",
};

export default function CreateProfilePage() {
  return <ProfileSetup />;
}