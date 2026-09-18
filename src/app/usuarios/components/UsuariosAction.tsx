'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';

export async function promoteToSuperAdmin(userId: string) {
  try {
    const session = await getSessionUser();

    if (!session || !session.isSuperAdmin) {
      throw new Error('Apenas Super Administradores podem realizar esta ação.');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isSuperAdmin: true },
    });

    revalidatePath('/usuarios');

    return {
      success: true,
      user: { email: user.email, isSuperAdmin: user.isSuperAdmin }
    };
  } catch (error: any) {
    console.error('[promoteToSuperAdmin] error:', error);
    return {
      success: false,
      error: error.message || 'Ocorreu um erro ao promover o usuário.'
    };
  }
}

export async function demoteFromSuperAdmin(userId: string) {
  try {
    const session = await getSessionUser();

    if (!session || !session.isSuperAdmin) {
      throw new Error('Apenas Super Administradores podem realizar esta ação.');
    }

    // Prevent self-demotion to avoid locking everyone out
    if (session.id === userId) {
      throw new Error('Você não pode remover seus próprios privilégios de Super Admin.');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isSuperAdmin: false },
    });

    revalidatePath('/usuarios');

    return {
      success: true,
      user: { email: user.email, isSuperAdmin: user.isSuperAdmin }
    };
  } catch (error: any) {
    console.error('[demoteFromSuperAdmin] error:', error);
    return {
      success: false,
      error: error.message || 'Ocorreu um erro ao remover privilégios.'
    };
  }
}
