import type { Metadata } from 'next';
import { RolesPage } from '@/features/roles/RolesPage';

export const metadata: Metadata = {
  title: 'Roles · Developer User Module',
};

export default function Page() {
  return <RolesPage />;
}
