import { Response, NextFunction } from 'express';
import Report from '../models/Report';
import Notification from '../models/Notification';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getAllReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, status, limit = '50', page = '1' } = req.query;

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id).populate('user', 'name email role');

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

export const createReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, category, latitude, longitude } = req.body;
    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : undefined;

    const report = await Report.create({
      title,
      description,
      category,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      imageUrl,
      user: req.user!._id,
    });

    await report.populate('user', 'name email role');

    // Notify all agents and admins about new report
    const staffUsers = await User.find({ role: { $in: ['agent', 'admin'] } }).select('_id');
    const notifications = staffUsers
      .filter((u) => u._id.toString() !== req.user!._id.toString())
      .map((staff) => ({
        message: `New ${category.replace(/_/g, ' ')} report: "${title}"`,
        type: 'new_report' as const,
        recipient: staff._id,
        report: report._id,
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ success: true, message: 'Report submitted successfully', data: report });
  } catch (error) {
    next(error);
  }
};

export const updateReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    const userRole = req.user!.role;
    const isOwner = report.user.toString() === req.user!._id.toString();

    if (userRole === 'citizen' && !isOwner) {
      res.status(403).json({ success: false, message: 'Not authorized to update this report.' });
      return;
    }

    const previousStatus = report.status;
    const allowedUpdates: Record<string, unknown> = {};

    if (req.body.title && isOwner) allowedUpdates.title = req.body.title;
    if (req.body.description && isOwner) allowedUpdates.description = req.body.description;
    if (req.body.status && (userRole === 'agent' || userRole === 'admin')) {
      allowedUpdates.status = req.body.status;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      res.status(400).json({ success: false, message: 'No valid fields to update.' });
      return;
    }

    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).populate('user', 'name email role');

    // Notify report author if status changed
    if (req.body.status && previousStatus !== req.body.status) {
      await Notification.create({
        message: `Your report "${report.title}" status changed to ${req.body.status}.`,
        type: 'status_update',
        recipient: report.user,
        report: report._id,
      });
    }

    res.json({ success: true, message: 'Report updated', data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    const userRole = req.user!.role;
    const isOwner = report.user.toString() === req.user!._id.toString();

    if (userRole === 'citizen' && !isOwner) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this report.' });
      return;
    }

    await report.deleteOne();
    // Cascade: remove all notifications that reference this report
    await Notification.deleteMany({ report: report._id });
    res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getReportStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [total, byCategory, byStatus, recent] = await Promise.all([
      Report.countDocuments(),
      Report.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        { $limit: 30 },
      ]),
    ]);

    res.json({
      success: true,
      data: { total, byCategory, byStatus, recent },
    });
  } catch (error) {
    next(error);
  }
};
