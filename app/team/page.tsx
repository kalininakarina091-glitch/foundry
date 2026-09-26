import { DemoNotice } from "@/components/product-ui";
import { teamMembers } from "@/lib/mock-data";

export default function TeamPage() {
  return (
    <div className="px-8 py-7">
      <DemoNotice />
      <h1 className="text-3xl font-semibold text-white">Команда</h1>
      <p className="mt-2 text-neutral-400">
        Общее пространство и Company Brain для всей AI-команды.
      </p>

      <div className="mt-8 space-y-3">
        {teamMembers.map((member) => (
          <article
            key={member.email}
            className="foundry-card flex items-center justify-between rounded-2xl p-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#FF6B00]/20 font-semibold text-[#FF6B00]">
                {member.name[0]}
              </div>
              <div>
                <p className="font-medium text-white">{member.name}</p>
                <p className="text-sm text-neutral-500">{member.role}</p>
              </div>
            </div>
            <p className="text-sm text-neutral-400">{member.email}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
