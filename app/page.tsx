import { Header } from "@/components/home/header";
import { Hero } from "@/components/home/hero-section";
import { Features } from "@/components/home/features";
import { PricingSection } from "@/components/home/pricing";
import { CtaSection } from "@/components/home/cta-section";
import { Footer } from "@/components/home/footer";

const Home = () => {
  return (
    <main>
      <Header />
      <Hero />
      <Features />
      <PricingSection />
      <CtaSection />
      <Footer />
    </main>
  );
};
export default Home;
