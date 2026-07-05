import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfileForm from './_components/profile-form';
import PasswordForm from './_components/password-form';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/');

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });

  if (!user) redirect('/');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal information and password.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm
          defaultName={user.name}
          defaultEmail={user.email}
          joinedAt={user.createdAt.toISOString()}
        />
        <PasswordForm />
      </div>
    </div>
  );
}
