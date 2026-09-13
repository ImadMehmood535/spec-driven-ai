import { KeyRound, Shield, Users } from 'lucide-react';
import Link from 'next/link';

const SECTIONS = [
  {
    href: '/users',
    label: 'Users',
    icon: Users,
    description: 'Create users, manage their details, and assign a role.',
  },
  {
    href: '/roles',
    label: 'Roles',
    icon: Shield,
    description: 'Define roles and the permissions they grant.',
  },
  {
    href: '/permissions',
    label: 'Permissions',
    icon: KeyRound,
    description: 'Maintain the actions the platform can authorise.',
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight">Access control</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Users receive permissions through the single role assigned to them.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ href, label, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <span className="flex items-center gap-2 font-medium">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
