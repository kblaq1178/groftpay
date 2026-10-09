import type { Metadata } from "next";

import { ProfileDirectory } from "@/components/profile-directory";

export const metadata: Metadata = {
  title: "Canton payment profiles",
  description:
    "GroftPay gives a Canton Party ID a human handle and a page to be paid from. Connect Grofty to create yours.",
};

export default function ProfileDirectoryPage() {
  return <ProfileDirectory />;
}