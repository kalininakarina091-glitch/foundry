import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decodeProfile } from "@/lib/personal-profile";
import ProfileEditor from "@/components/profile-editor";
export default async function Personalization() {
  const user = await requireUser();
  return (
    <div className="page-container">
      <ProfileEditor
        settings
        initial={decodeProfile(
          await prisma.userProfile.findUnique({ where: { userId: user.id } }),
        )}
      />
    </div>
  );
}
