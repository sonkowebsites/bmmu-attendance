import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { deleteDriveFile } from '@/lib/drive';

// Deletion is restricted to administrators - removing a scanned page is
// permanent (both here and in Google Drive), so this deliberately mirrors
// the same admin-only bar as removing a centre or activity type.
export async function DELETE(request: Request, { params }: { params: { id: string; imageId: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only an administrator can delete an uploaded image.' }, { status: 403 });
  }

  const image = await prisma.recordImage.findUnique({ where: { id: params.imageId } });
  if (!image || image.recordId !== params.id) {
    return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
  }

  if (image.driveFileId) {
    try {
      await deleteDriveFile(image.driveFileId);
    } catch (err) {
      // Don't block the delete on a Drive hiccup - the record shouldn't be
      // stuck showing an image the user already asked to remove. Logged so
      // an admin can clean up the orphaned Drive file manually if needed.
      console.error('Could not delete Drive file for image', image.id, err);
    }
  }

  await prisma.recordImage.delete({ where: { id: image.id } });

  await logAudit({
    action: 'IMAGE_DELETED',
    entityType: 'AttendanceRecord',
    entityId: params.id,
    recordId: params.id,
    userId: session.userId,
    details: `Removed an uploaded image (page ${image.order + 1})`,
    request
  });

  return NextResponse.json({ ok: true });
}
