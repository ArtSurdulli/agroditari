import Link from "next/link";
import { Tractor } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-page px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
        <Tractor className="h-8 w-8 text-primary" strokeWidth={2} />
      </div>
      <p className="text-5xl font-bold text-primary">404</p>
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          Faqja nuk u gjet
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Faqja që kërkove nuk ekziston ose është zhvendosur.
        </p>
      </div>
      <Button render={<Link href="/" />} className="mt-2">
        Kthehu te ballina
      </Button>
    </div>
  );
}