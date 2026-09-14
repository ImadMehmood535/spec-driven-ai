import type { Metadata } from 'next';
import { UsersPage } from '@/features/users/UsersPage';

export const metadata: Metadata = {
  title: 'Users · Developer User Module',
};

export default function Page() {
  return <UsersPage />;
}
