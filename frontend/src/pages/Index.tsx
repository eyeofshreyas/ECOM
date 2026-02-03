import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { PromoSection } from '@/components/home/PromoSection';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { NewsletterSection } from '@/components/home/NewsletterSection';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CategorySection />
        <FeaturedProducts />
        <PromoSection />
        <TrendingProducts />
        <NewsletterSection />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export default Index;
