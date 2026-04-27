import User from '../models/User';
import Report from '../models/Report';
import { ReportCategory } from '../models/Report';

export const CATEGORY_POINTS: Record<ReportCategory, number> = {
  wildfire: 30,
  illegal_logging: 20,
  water_leak: 15,
  pollution: 10,
};

export const VERIFIED_BONUS = 20;
export const RESOLVED_BONUS = 10;

export const BADGE_IDS = [
  'first_report',
  'fire_watcher',
  'forest_guardian',
  'water_sentinel',
  'eco_warrior',
  'verified_hero',
  'top_ranger',
] as const;

export async function awardPointsAndRefreshBadges(userId: string, points: number): Promise<void> {
  await User.findByIdAndUpdate(userId, { $inc: { greenScore: points } });
  await refreshBadges(userId);
}

export async function refreshBadges(userId: string): Promise<void> {
  const [user, reports] = await Promise.all([
    User.findById(userId),
    Report.find({ user: userId }),
  ]);
  if (!user) return;

  const totalReports = reports.length;
  const wildfireCount = reports.filter(r => r.category === 'wildfire').length;
  const loggingCount = reports.filter(r => r.category === 'illegal_logging').length;
  const waterCount = reports.filter(r => r.category === 'water_leak').length;
  const verifiedOrResolved = reports.filter(r => r.status === 'verified' || r.status === 'resolved').length;

  const earned: string[] = [];
  if (totalReports >= 1)                      earned.push('first_report');
  if (wildfireCount >= 3)                     earned.push('fire_watcher');
  if (loggingCount >= 3)                      earned.push('forest_guardian');
  if (waterCount >= 3)                        earned.push('water_sentinel');
  if (totalReports >= 10)                     earned.push('eco_warrior');
  if (verifiedOrResolved >= 5)                earned.push('verified_hero');
  if ((user.greenScore ?? 0) >= 100)          earned.push('top_ranger');

  await User.findByIdAndUpdate(userId, { badges: earned });
}
