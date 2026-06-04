import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Fish, Truck, ShieldCheck, Star } from 'lucide-react';

const features = [
  { icon: Fish, title: 'Ocean Fresh', desc: 'Direct from Ratnagiri fishermen to your doorstep in Pune' },
  { icon: ShieldCheck, title: 'Quality Assured', desc: 'Every batch inspected by our QA team at port' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Same-day delivery from coast to city' },
  { icon: Star, title: 'Trusted Sellers', desc: 'Rated fishermen with transparent pricing' },
];

const steps = [
  { step: '1', title: 'Fishermen List', desc: 'Fresh catch listed before reaching Ratnagiri port' },
  { step: '2', title: 'You Order', desc: 'Browse, select quantity, and place your order' },
  { step: '3', title: 'QA Inspection', desc: 'Our team checks freshness and quality at port' },
  { step: '4', title: 'Delivered Fresh', desc: 'Packed in ice and delivered to your door in Pune' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-gradient-to-br from-blue-900 to-blue-600">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="container relative z-10 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              Fresh Fish,<br />Straight from the Ocean
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
              Connecting Ratnagiri's finest fishermen directly with customers in Pune. Quality assured, freshness guaranteed.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/browse">
                <Button size="lg" className="text-base px-8 py-6 rounded-xl bg-yellow-400 text-black hover:bg-yellow-300 font-semibold">
                  Shop Fresh Fish
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-xl border-white/50 text-black hover:bg-white/10 font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-sand">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">Why MachhliBazaar?</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            From the coast of Ratnagiri to the tables of Pune — transparency at every step
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="rounded-xl bg-card p-6 shadow-card hover:shadow-card-hover transition-shadow text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map(s => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full gradient-ocean text-white font-bold text-lg">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 MachhliBazaar — Ratnagiri to Pune, Ocean to Table</p>
        </div>
      </footer>
    </div>
  );
}
