import { createFileRoute } from "@tanstack/react-router";
import { EqualIcon, StoreIcon, TrendingUpIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import ImageWrapper from "#/components/ui/wrappers/image";
import { useTheme } from "#/lib/providers/theme";
import Link from "#/lib/router";

const team = [
  {
    name: "Keshuram Ramani",
    initials: "KR",
    imageUrl: "/assets/people/keshu.jpg",
    profileUrl: "https://linkedin.com/in/keshuramramani",
  },
  {
    name: "Iqbal Amran",
    initials: "IA",
    imageUrl: "/assets/people/iqbal.jpg",
    profileUrl: "https://linkedin.com/in/iqbal-amran-b0842131b",
  },
  {
    name: "Dennise Catolos",
    initials: "DC",
    imageUrl: "/assets/people/dennise.jpg",
    profileUrl: "https://dennise.me/go/linkedin",
  },
  {
    name: "Zuhair Hussain",
    initials: "ZH",
    imageUrl: "/assets/people/zuhair.jpg",
    profileUrl: "https://linkedin.com/in/mohammed-zuhair-hussain-689606350",
  },
  {
    name: "Aryan Desai",
    initials: "AD",
    imageUrl: "/assets/people/aryan.jpg",
    profileUrl: "https://linkedin.com/in/aryan-d-781b08317",
  },
  {
    name: "Ivan Dochev",
    initials: "ID",
    imageUrl: "/assets/people/ivan.jpg",
    profileUrl: "https://linkedin.com/in/ivan-dochev-961957319",
  },
];

export const Route = createFileRoute("/_platform/about/")({ component: Page });

export default function Page() {
  const { resolvedTheme } = useTheme();

  return (
    <main className={"w-full space-y-16 overflow-x-hidden px-4 py-8 sm:space-y-24 sm:px-6 sm:py-12 lg:px-8"}>
      {/* Welcome to Initiate */}
      <section>
        <header className={"mb-10 text-center sm:mb-14"}>
          <h1 className={"text-balance"}>
            <ImageWrapper
              className={"mx-auto h-14 w-auto sm:h-24 md:h-32"}
              src={resolvedTheme === "dark" ? "/assets/title-light.png" : "/assets/title-dark.png"}
              alt={"Initiate"}
              height={293}
              priority
              width={873}
            />
          </h1>
          <p className={"text-muted-foreground mx-auto mt-3 max-w-2xl text-base text-pretty sm:mt-4 sm:text-lg"}>
            The Digital Marketplace for AI Solutions
          </p>
        </header>

        <div className={"grid gap-8 lg:grid-cols-2 lg:gap-12"}>
          {/* Our Mission */}
          <article className={"min-w-0"}>
            <h2 className={"mb-3 text-xl font-semibold text-balance sm:text-2xl"}>Our Mission</h2>
            <p className={"text-muted-foreground text-base leading-7 text-pretty sm:text-lg"}>
              Our mission at Initiate is to be a digital marketplace for AI solutions. We connect businesses, startups,
              and investors with AI-driven matchmaking, fostering growth and successful partnerships through our
              platform.
            </p>
          </article>

          {/* Our Vision */}
          <article className={"min-w-0"}>
            <h2 className={"mb-3 text-xl font-semibold text-balance sm:text-2xl"}>Our Vision</h2>
            <p className={"text-muted-foreground text-base leading-7 text-pretty sm:text-lg"}>
              Our vision is to be the leading digital marketplace for AI solutions, empowering businesses and startups
              to thrive through innovative AI-driven matchmaking and collaboration.
            </p>
          </article>
        </div>

        {/* Features */}
        <div className={"mt-10 sm:mt-12"}>
          <h2 className={"sr-only"}>What We Do</h2>
          <div className={"grid gap-4 md:grid-cols-3"}>
            <article
              className={
                "flex min-w-0 flex-col items-start rounded-xl border p-5 text-left sm:items-center sm:p-6 sm:text-center"
              }
            >
              <EqualIcon aria-hidden={true} className={"mb-3 size-8 shrink-0"} />
              <h3 className={"mb-2 text-lg font-semibold text-balance"}>AI Matchmaking</h3>
              <p className={"text-muted-foreground text-sm"}>
                Our AI matches startups, investors, and businesses, tailoring connections to your needs.
              </p>
            </article>
            <article
              className={
                "flex min-w-0 flex-col items-start rounded-xl border p-5 text-left sm:items-center sm:p-6 sm:text-center"
              }
            >
              <StoreIcon aria-hidden={true} className={"mb-3 size-8 shrink-0"} />
              <h3 className={"mb-2 text-lg font-semibold text-balance"}>Unified AI Marketplace</h3>
              <p className={"text-muted-foreground text-sm"}>
                Explore a central hub for AI solutions, connecting businesses and investors with AI-driven insights.
              </p>
            </article>
            <article
              className={
                "flex min-w-0 flex-col items-start rounded-xl border p-5 text-left sm:items-center sm:p-6 sm:text-center"
              }
            >
              <TrendingUpIcon aria-hidden={true} className={"mb-3 size-8 shrink-0"} />
              <h3 className={"mb-2 text-lg font-semibold text-balance"}>Collaborative Growth</h3>
              <p className={"text-muted-foreground text-sm"}>
                Join a community of businesses, startups, and investors for shared knowledge and growth in Singapore.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section>
        {/* Header */}
        <header className={"mb-8 text-center sm:mb-12"}>
          <h2 className={"mb-3 text-3xl font-bold text-balance sm:mb-4 sm:text-4xl"}>Meet The Team</h2>
          <p className={"text-muted-foreground text-base text-pretty sm:text-lg"}>
            The people behind Initiate, driving innovation.
          </p>
        </header>

        {/* Content */}
        <div className={"grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"}>
          {team.map((member) => (
            <article
              key={member.name}
              className={"flex min-w-0 flex-col items-center rounded-xl border p-4 text-center sm:p-6"}
            >
              <Avatar className={"mb-4 size-24 sm:size-32 lg:size-36"}>
                <ImageWrapper src={member.imageUrl} alt={member.name} avatar />
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
              <div className={"min-w-0"}>
                {member.profileUrl ? (
                  <h3 className={"text-lg font-semibold text-balance sm:text-xl"}>
                    <Link
                      className={
                        "focus-visible:ring-ring inline-flex min-h-11 items-center rounded-md px-2 break-words hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      }
                      href={member.profileUrl}
                    >
                      {member.name}
                    </Link>
                  </h3>
                ) : (
                  <h3 className={"text-lg font-semibold text-balance sm:text-xl"}>{member.name}</h3>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
