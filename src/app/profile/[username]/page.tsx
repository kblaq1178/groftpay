import type { Metadata } from "next";

import { ProfileView } from "@/components/profile-view";
import { findDemoProfile } from "@/lib/profiles";

type ProfilePageProps = PageProps<"/profile/[username]">;

export async function generateMetadata(props: ProfilePageProps): Promise<Metadata> {
  const { username } = await props.params;
  const demo = findDemoProfile(username);

  if (demo) {
    return {
      title: `${demo.displayName} - request a CC payment`,
      description: `${demo.headline ?? "Canton payment profile"}. ${demo.bio}`,
    };
  }

  // Local profiles are not visible to the server, so the page is not indexable.
  return {
    title: `@${username.trim().toLowerCase() || "profile"}`,
    description: "A GroftPay payment profile.",
    robots: { index: false, follow: false },
  };
}

export default async function ProfilePage(props: ProfilePageProps) {
  const { username } = await props.params;
  return <ProfileView username={username} />;
}