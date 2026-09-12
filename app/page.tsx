import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Gift,
  Languages,
  Map,
  Notebook,
  Receipt,
  ShoppingBasket,
  Smartphone,
  Sprout,
  Tractor,
} from "lucide-react";
import { auth } from "@/auth";
import { entityTheme } from "@/lib/entity-theme";
import { LandingNav } from "@/app/_landing/landing-nav";
import { FeatureSection } from "@/app/_landing/feature-section";
import { FeatureVisual } from "@/app/_landing/feature-visual";
import { DeviceFrame } from "@/app/_landing/device-frame";
import { Reveal } from "@/app/_landing/reveal";

export const metadata: Metadata = {
  title: "AgroDitari — Menaxho fermën tënde thjesht",
  description:
    "Gjurmo ferma, parcela, sezone, aktivitete, shpenzime dhe korrje — me raporte automatike mbi kosto/njësi dhe marxhin. Falas, në shqip, ndërtuar për fermerë të vegjël në Kosovë dhe Shqipëri.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AgroDitari — Menaxho fermën tënde thjesht",
    description:
      "Gjurmo ferma, parcela, sezone, aktivitete, shpenzime dhe korrje — me raporte automatike mbi kosto/njësi dhe marxhin.",
    siteName: "AgroDitari",
    images: [{ url: "/screenshot-wide.png", width: 1280, height: 720 }],
    locale: "sq_AL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgroDitari — Menaxho fermën tënde thjesht",
    description:
      "Gjurmo ferma, parcela, sezone, aktivitete, shpenzime dhe korrje — me raporte automatike mbi kosto/njësi dhe marxhin.",
    images: ["/screenshot-wide.png"],
  },
};

const steps = [
  {
    number: "1",
    title: "Shto fermën",
    description: "Regjistro fermën dhe parcelat e tua në pak minuta.",
  },
  {
    number: "2",
    title: "Regjistro punët e shpenzimet",
    description:
      "Shëno aktivitetet, inputet, shpenzimet dhe korrjet gjatë sezonit.",
  },
  {
    number: "3",
    title: "Shiko raportet",
    description: "Kupto kostot, marxhin dhe rendimentin, sezon pas sezoni.",
  },
];

const valueProps = [
  {
    icon: Languages,
    title: "Shqip",
    description: "I gjithi në gjuhën shqipe, pa fjalë të huaja të vështira.",
  },
  {
    icon: Gift,
    title: "Falas",
    description: "Falas për fermerë të vegjël — pa kosto të fshehura.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description: "Bërë për t'u përdorur nga fusha, direkt nga telefoni.",
  },
  {
    icon: Sprout,
    title: "I thjeshtë",
    description: "Pa nevojë për njohuri teknike — hap llogarinë dhe fillo.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <main className="flex min-h-screen flex-col bg-bg-page">
      <LandingNav isLoggedIn={isLoggedIn} />

      {/* Hero */}
      <section className="px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          <h1 className="max-w-3xl text-4xl font-bold text-text-primary sm:text-5xl">
            Menaxho fermën, shpenzimet dhe të korrat — në një vend.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-text-secondary">
            Bërë për fermerë të vegjël në Kosovë dhe Shqipëri, që duan të dinë
            saktësisht sa u kushton çdo kulturë.
          </p>

          <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Shko te paneli
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Fillo falas
                </Link>
                <Link
                  href="/login"
                  className="flex h-12 items-center justify-center rounded-lg border border-primary px-8 text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
                >
                  Hyr
                </Link>
              </>
            )}
          </div>

          <div className="mt-14 w-full max-w-lg">
            <DeviceFrame
              src="/assets/img.png"
              alt="Ballina e AgroDitari me përmbledhjen e parcelave, sezoneve, shpenzimeve dhe të ardhurave"
              width={1091}
              height={880}
              urlPath="agroditari.app/dashboard"
              sizes="(min-width: 512px) 512px, 100vw"
              priority
            />
          </div>
        </div>
      </section>

      {/* Feature sections */}
      <section id="vecorite" className="scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Veçoritë
            </p>
            <h2 className="mt-2 text-3xl font-bold text-text-primary sm:text-4xl">
              Gjithçka që të duhet për fermën tënde
            </h2>
          </div>

          <div className="mt-16 flex flex-col gap-20 sm:gap-24">
            <Reveal>
              <FeatureSection
                icon={Map}
                color={entityTheme.parcels.color}
                kicker="Fermat & Parcelat"
                title="Organizo tokën tënde qartë"
                body="Shto çdo fermë dhe parcelë, me sipërfaqen në hektarë ose ari — siç e njeh ti. Di gjithmonë ku çfarë mbillet."
                visual={
                  <DeviceFrame
                    src="/assets/img_2.png"
                    alt="Lista e fermave në AgroDitari, me vendndodhjen dhe përmbledhjen e parcelave për secilën"
                    width={1958}
                    height={690}
                    urlPath="agroditari.app/farms"
                  />
                }
              />
            </Reveal>

            <Reveal>
              <FeatureSection
                icon={Sprout}
                color={entityTheme.seasons.color}
                kicker="Sezonet & Kulturat"
                title="Ndiq çdo kulturë, sezon pas sezoni"
                body="Regjistro çfarë mbolle, kur, dhe si po shkon — nga mbjellja te korrja. Shiko menjëherë cilat sezone janë aktive."
                reverse
                visual={
                  <FeatureVisual
                    icon={Sprout}
                    color={entityTheme.seasons.color}
                    rows={[
                      { label: "Domate — Vera 2026", value: "Aktiv" },
                      { label: "Grurë — Dimri 2025", value: "Korrur" },
                      { label: "Speca — Vera 2025", value: "Korrur" },
                    ]}
                  />
                }
              />
            </Reveal>

            <Reveal>
              <FeatureSection
                icon={Notebook}
                color={entityTheme.activities.color}
                kicker="Ditari i aktiviteteve"
                title="Ditari yt i punëve në arë"
                body="Shëno ujitjet, plehërimin, spërkatjet dhe çdo punë tjetër — si një ditar i thjeshtë, gjithmonë në dorë."
                visual={
                  <DeviceFrame
                    src="/assets/img_3.png"
                    alt="Ditari i aktiviteteve në AgroDitari, me punët e regjistruara për çdo parcelë"
                    width={2168}
                    height={918}
                    urlPath="agroditari.app/activities"
                  />
                }
              />
            </Reveal>

            <Reveal>
              <FeatureSection
                icon={Receipt}
                color={entityTheme.expenses.color}
                kicker="Shpenzimet"
                title="Di saktësisht sa po shpenzon"
                body="Regjistro çdo shpenzim sipas kategorisë — sasi × çmim — dhe shiko kostot e fermës pa u mërzitur me letra apo Excel."
                reverse
                visual={
                  <DeviceFrame
                    src="/assets/img_4.png"
                    alt="Lista e shpenzimeve në AgroDitari, sipas kategorisë dhe sasisë"
                    width={1095}
                    height={765}
                    urlPath="agroditari.app/expenses"
                  />
                }
              />
            </Reveal>

            <Reveal>
              <FeatureSection
                icon={ShoppingBasket}
                color={entityTheme.harvests.color}
                kicker="Të korrat"
                title="Mat çdo korrje, deri në centin e fundit"
                body="Shëno sasinë e korrjes dhe të ardhurat për çdo sezon, e krahaso vitet me njëri-tjetrin pa llogaritje me dorë."
                visual={
                  <DeviceFrame
                    src="/assets/img_5.png"
                    alt="Lista e korrjeve në AgroDitari, me sasinë dhe të ardhurat për secilën"
                    width={2174}
                    height={988}
                    urlPath="agroditari.app/harvests"
                  />
                }
              />
            </Reveal>

            <Reveal>
              <FeatureSection
                icon={BarChart3}
                color={entityTheme.farms.color}
                kicker="Raporte"
                title="Numrat që vendosin nëse ia vlen"
                body="AgroDitari llogarit vetë kosto/njësi, rendimentin dhe marxhin për çdo kulturë — që të dish çka të mbjellësh vitin tjetër."
                reverse
                visual={
                  <DeviceFrame
                    src="/assets/img_6.png"
                    alt="Raportet e AgroDitari me kosto/njësi, marxhin dhe të ardhurat kundrejt shpenzimeve"
                    width={2384}
                    height={1786}
                    urlPath="agroditari.app/reports"
                  />
                }
              />
            </Reveal>

            <Reveal>
              <FeatureSection
                icon={Bell}
                color={entityTheme.reminders.color}
                kicker="Kujtesa"
                title="Mos harro asnjë punë të rëndësishme"
                body="Vendos kujtesa për ujitje, plehërim apo korrje, dhe merr një përmbledhje me email për punët që të presin."
                visual={
                  <DeviceFrame
                    src="/assets/img_7.png"
                    alt="Kujtesat e afërta në AgroDitari, për ujitje, plehërim dhe korrje"
                    width={1934}
                    height={912}
                    urlPath="agroditari.app/reminders"
                  />
                }
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Si funksionon */}
      <section
        id="si-funksionon"
        className="scroll-mt-16 bg-surface px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Si funksionon
            </p>
            <h2 className="mt-2 text-3xl font-bold text-text-primary sm:text-4xl">
              Tri hapa, dhe je gati
            </h2>
          </div>

          <Reveal className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-border bg-bg-page p-6 text-center"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-base font-bold text-primary">
                  {step.number}
                </div>
                <h3 className="mt-4 text-base font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-text-secondary">
                  {step.description}
                </p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Pse AgroDitari */}
      <section
        id="pse-agroditari"
        className="scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Pse ne
            </p>
            <h2 className="mt-2 text-3xl font-bold text-text-primary sm:text-4xl">
              Ndërtuar për fermerë, jo për inxhinierë
            </h2>
          </div>

          <Reveal className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.map((prop) => {
              const Icon = prop.icon;
              return (
                <div
                  key={prop.title}
                  className="rounded-2xl border border-border bg-surface p-6 text-center"
                >
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-text-primary">
                    {prop.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-text-secondary">
                    {prop.description}
                  </p>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* Final CTA band */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mx-auto flex max-w-4xl flex-col items-center rounded-3xl bg-primary px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Gati të fillosh?
          </h2>
          <p className="mt-3 max-w-md text-primary-light">
            Regjistrohu falas dhe fillo të gjurmosh fermën tënde që sot.
          </p>
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex h-12 items-center justify-center rounded-lg bg-white px-8 text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
              >
                Shko te paneli
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="flex h-12 items-center justify-center rounded-lg bg-white px-8 text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
                >
                  Regjistrohu falas
                </Link>
                <Link
                  href="/login"
                  className="flex h-12 items-center justify-center rounded-lg border border-white/60 px-8 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Hyr
                </Link>
              </>
            )}
          </div>
        </Reveal>
      </section>

      <footer className="mt-auto border-t border-border px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div>
            <div className="flex items-center justify-center gap-2.5 sm:justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <Tractor className="h-4 w-4 text-primary" strokeWidth={2} />
              </div>
              <span className="text-base font-semibold text-text-primary">
                AgroDitari
              </span>
            </div>
            <p className="mt-2 max-w-xs text-xs text-text-secondary">
              Projekt teze Bachelor, Fakulteti i Inxhinierisë Mekanike dhe
              Kompjuterike (FIMK).
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 text-sm sm:items-end">
            <div className="flex items-center gap-4">
              <Link
                href="#vecorite"
                className="font-medium text-text-secondary hover:text-text-primary"
              >
                Veçoritë
              </Link>
              <Link
                href="#si-funksionon"
                className="font-medium text-text-secondary hover:text-text-primary"
              >
                Si funksionon
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
                Hyr
              </Link>
              <Link
                href="/register"
                className="font-medium text-primary hover:text-primary-dark"
              >
                Regjistrohu
              </Link>
            </div>
            <p className="mt-2 text-xs text-text-secondary">
              © {new Date().getFullYear()} AgroDitari. Të gjitha të drejtat e
              rezervuara.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
