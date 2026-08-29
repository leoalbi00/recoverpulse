import { auth } from "@/auth";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ProblemSolution } from "@/components/landing/problem-solution";
import { Features } from "@/components/landing/features";
import { RoiCalculator } from "@/components/landing/roi-calculator";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-zinc-100 font-sans">
      <Navbar user={session?.user} />
      <main className="flex-1">
        <Hero />
        <ProblemSolution />
        <Features />
        <RoiCalculator />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
