import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decodeProfile } from "@/lib/personal-profile";
import ProfileEditor from "@/components/profile-editor";
export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<{ restart?: string }>;
}) {
  const user = await requireUser();
  const profile = decodeProfile(
    await prisma.userProfile.findUnique({ where: { userId: user.id } }),
  );
  if ((await searchParams).restart === "1") profile.onboardingStep = 0;
  return (
    <main className="account-screen">
      <ProfileEditor initial={profile} />
    </main>
  );
}
