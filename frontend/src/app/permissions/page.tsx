import type { Metadata } from 'next';
import { PermissionsPage } from '@/features/permissions/PermissionsPage';

export const metadata: Metadata = {
  title: 'Permissions · Developer User Module',
};

export default function Page() {
  return <PermissionsPage />;
}
