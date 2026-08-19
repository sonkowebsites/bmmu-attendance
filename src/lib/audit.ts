import { UAParser } from 'ua-parser-js';
import { prisma } from './db';

type AuditInput = {
  action: string;
  entityType: 'AttendanceRecord' | 'User' | 'Auth';
  entityId?: string;
  recordId?: string;
  userId?: string | null;
  details?: string;
  request: Request;
};

/** Pulls a best-effort client IP from common proxy headers (Vercel/Neon-friendly). */
function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip');
}

function describeDevice(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';
  const parsed = UAParser(userAgent);
  const browser = [parsed.browser.name, parsed.browser.version?.split('.')[0]].filter(Boolean).join(' ');
  const os = [parsed.os.name, parsed.os.version].filter(Boolean).join(' ');
  const device = parsed.device.model ? ` on ${parsed.device.vendor ?? ''} ${parsed.device.model}` : '';
  return [browser, os].filter(Boolean).join(' · ') + device;
}

export async function logAudit({ action, entityType, entityId, recordId, userId, details, request }: AuditInput) {
  const userAgent = request.headers.get('user-agent');
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        recordId,
        userId: userId ?? null,
        details,
        device: describeDevice(userAgent),
        userAgent,
        ipAddress: getClientIp(request)
      }
    });
  } catch (err) {
    // Auditing must never break the primary action - log to console as a fallback.
    console.error('Failed to write audit log', err);
  }
}
