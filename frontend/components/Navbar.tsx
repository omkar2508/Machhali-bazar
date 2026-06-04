'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Fish, ShoppingCart, Menu, X, LogIn, LogOut } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { UserRole } from '@/lib/types';

const roleLabels: Record<UserRole, string> = {
  customer: 'Customer',
  fisherman: 'Fisherman',
  qa: 'QA Team',
  admin: 'Admin',
};

const roleColors: Record<UserRole, string> = {
  customer: 'bg-primary text-primary-foreground',
  fisherman: 'bg-blue-800 text-white',
  qa: 'bg-accent text-accent-foreground',
  admin: 'bg-orange-500 text-white',
};

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, role, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = !user || !role
    ? [{ to: '/browse', label: 'Browse Fish' }]
    : role === 'customer'
    ? [{ to: '/browse', label: 'Browse Fish' }, { to: '/orders', label: 'My Orders' }]
    : role === 'fisherman'
    ? [{ to: '/fisherman', label: 'My Listings' }, { to: '/browse', label: 'Market Prices' }]
    : role === 'qa'
    ? [{ to: '/qa', label: 'QA Dashboard' }]
    : [{ to: '/admin', label: 'Admin Dashboard' }];

  const handleSignOut = () => {
    signOut();
    router.push('/');
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-ocean">
            <Fish className="h-5 w-5 text-white" />
          </div>
          <span className="font-serif text-xl font-bold text-foreground">MachhliBazaar</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <Link
              key={l.to}
              href={l.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === l.to ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user && role && (
            <Badge className={`hidden sm:inline-flex text-xs ${roleColors[role]}`}>
              {roleLabels[role]}
            </Badge>
          )}

          {user && role === 'customer' && (
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {user.name || user.email}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/auth">
              <Button variant="outline" size="sm" className="gap-1.5">
                <LogIn className="h-4 w-4" /> Sign In
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4">
          {navLinks.map(l => (
            <Link
              key={l.to}
              href={l.to}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-foreground hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={handleSignOut}
              className="block w-full text-left py-2 text-sm font-medium text-destructive hover:text-destructive/80"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/auth"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-primary"
            >
              Sign In / Sign Up
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
