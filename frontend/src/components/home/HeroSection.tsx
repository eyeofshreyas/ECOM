import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <section className="relative gradient-hero overflow-hidden">
      <div className="container mx-auto py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              New Season Collection
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-balance">
              Discover Products
              <span className="block text-primary">You'll Love</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              Curated collections of premium products designed for the modern lifestyle.
              Quality meets elegance in every detail.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/products">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/category/new">
                  New Arrivals
                </Link>
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">On orders over ₹2,500</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm">Easy Returns</p>
                  <p className="text-xs text-muted-foreground">30-day return policy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square animate-float">
              <div className="absolute inset-0 rounded-3xl bg-primary/10 transform rotate-6" />
              <div className="absolute inset-0 rounded-3xl bg-primary/5 transform -rotate-3" />
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
                alt="Premium products showcase"
                className="relative rounded-3xl object-cover w-full h-full shadow-large"
              />
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-medium p-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <span className="text-2xl">⭐</span>
                </div>
                <div>
                  <p className="font-semibold">4.9 Rating</p>
                  <p className="text-xs text-muted-foreground">50K+ Reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
