import { BackButton } from "@/components/common/back-button";
import { DetailSkeleton } from "@/components/common/detail-skeleton";

// Next.js route-level loading UI — shown while the season detail Server
// Component resolves its Prisma fetch.
export default function SeasonDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <BackButton fallbackHref="/seasons" />
      <DetailSkeleton />
    </main>
  );
}
