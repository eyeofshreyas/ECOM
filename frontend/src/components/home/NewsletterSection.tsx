import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="py-16 lg:py-24 gradient-hero">
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4">
            Stay in the Loop
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Subscribe for exclusive offers, early access to new arrivals, and curated style inspiration.
          </p>

          {isSubscribed ? (
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-accent text-accent-foreground animate-scale-in">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-medium">Thanks for subscribing!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 input-search text-center sm:text-left"
                required
              />
              <Button type="submit" className="shrink-0">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
