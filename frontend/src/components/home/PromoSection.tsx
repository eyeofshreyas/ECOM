import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function PromoSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Promo Card 1 */}
          <div className="relative rounded-3xl overflow-hidden min-h-[320px] group">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
              alt="Premium Electronics"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/20" />
            <div className="relative p-8 lg:p-10 h-full flex flex-col justify-end">
              <span className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wide mb-2">
                Limited Time
              </span>
              <h3 className="font-display text-2xl lg:text-3xl font-semibold text-primary-foreground mb-3">
                Premium Electronics
              </h3>
              <p className="text-primary-foreground/80 mb-6 max-w-xs">
                Up to 40% off on selected items. Free shipping included.
              </p>
              <Button
                variant="secondary"
                className="w-fit"
                asChild
              >
                <Link to="/category/electronics">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Promo Card 2 */}
          <div className="relative rounded-3xl overflow-hidden min-h-[320px] group">
            <img
              src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80"
              alt="Home & Living"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/20" />
            <div className="relative p-8 lg:p-10 h-full flex flex-col justify-end">
              <span className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wide mb-2">
                New Collection
              </span>
              <h3 className="font-display text-2xl lg:text-3xl font-semibold text-primary-foreground mb-3">
                Home & Living
              </h3>
              <p className="text-primary-foreground/80 mb-6 max-w-xs">
                Transform your space with our curated home essentials.
              </p>
              <Button
                className="w-fit bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <Link to="/category/home">
                  Explore
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
