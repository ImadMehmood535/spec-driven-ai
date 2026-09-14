'use client';

import { KeyRound, LogOut, Menu, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAVIGATION = [
  { href: '/users', label: 'Users', icon: Users },
  { href: '/roles', label: 'Roles', icon: Shield },
  { href: '/permissions', label: 'Permissions', icon: KeyRound },
];

/**
 * Navigation collapses on small screens rather than overflowing (FR-UI10).
 * Nothing here depends on hover, so it works on touch.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { claims, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isActive = (href: string) => pathname?.startsWith(href) ?? false;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="font-semibold tracking-tight">
            Developer User Module
          </Link>

          <nav
            aria-label="Main"
            className="hidden md:flex md:items-center md:gap-1"
          >
            {NAVIGATION.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {claims ? (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {claims.username}
              </span>
            ) : null}
            <ThemeToggle />
            {claims ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {menuOpen ? (
          <nav aria-label="Main" className="border-t px-4 pb-3 md:hidden">
            {NAVIGATION.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                  isActive(href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
