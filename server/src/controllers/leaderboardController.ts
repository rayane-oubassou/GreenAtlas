import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import User from '../models/User';
import Report from '../models/Report';
import { AuthRequest } from '../middleware/auth';

export const getLeaderboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const period = req.query.period === 'monthly' ? 'monthly' : 'alltime';
    const userId = req.user!._id.toString();

    if (period === 'alltime') {
      const topUsers = await User.find()
        .select('name role greenScore badges')
        .sort({ greenScore: -1 })
        .limit(20);

      const userIds = topUsers.map(u => u._id);
      const reportCounts = await Report.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
      ]);
      const countMap = new Map<string, number>(
        reportCounts.map(r => [r._id.toString(), r.count])
      );

      const entries = topUsers.map((u, i) => ({
        rank: i + 1,
        userId: u._id,
        name: u.name,
        role: u.role,
        greenScore: u.greenScore ?? 0,
        badges: u.badges ?? [],
        reportCount: countMap.get(u._id.toString()) ?? 0,
      }));

      const currentUserDoc = await User.findById(userId).select('greenScore badges');
      const currentScore = currentUserDoc?.greenScore ?? 0;
      const higherCount = await User.countDocuments({ greenScore: { $gt: currentScore } });
      const currentUserReportCount = await Report.countDocuments({ user: userId });

      res.json({
        success: true,
        data: {
          period: 'alltime',
          entries,
          currentUser: {
            rank: higherCount + 1,
            greenScore: currentScore,
            badges: currentUserDoc?.badges ?? [],
            reportCount: currentUserReportCount,
          },
        },
      });
    } else {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyEntries = await Report.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        { $unwind: '$userInfo' },
        {
          $project: {
            userId: '$_id',
            name: '$userInfo.name',
            role: '$userInfo.role',
            greenScore: '$userInfo.greenScore',
            badges: '$userInfo.badges',
            reportCount: '$count',
          },
        },
      ]);

      const entries = monthlyEntries.map((u, i) => ({
        rank: i + 1,
        userId: u.userId,
        name: u.name,
        role: u.role,
        greenScore: u.greenScore ?? 0,
        badges: u.badges ?? [],
        reportCount: u.reportCount,
      }));

      const currentUserMonthlyCount = await Report.countDocuments({
        user: new Types.ObjectId(userId),
        createdAt: { $gte: startOfMonth },
      });

      const higherMonthlyCount = await Report.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $match: { count: { $gt: currentUserMonthlyCount } } },
        { $count: 'total' },
      ]);
      const monthlyRank = (higherMonthlyCount[0]?.total ?? 0) + 1;

      const currentUserDoc = await User.findById(userId).select('greenScore badges');

      res.json({
        success: true,
        data: {
          period: 'monthly',
          entries,
          currentUser: {
            rank: currentUserMonthlyCount > 0 ? monthlyRank : null,
            greenScore: currentUserDoc?.greenScore ?? 0,
            badges: currentUserDoc?.badges ?? [],
            reportCount: currentUserMonthlyCount,
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
