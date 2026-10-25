import { Nav } from "@/components/Nav";
import { Evaluation, Footer, Hero, HowItWorks, Marquee, OpenSource, Phones } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <Phones />
        <Evaluation />
        <OpenSource />
      </main>
      <Footer />
    </>
  );
}
