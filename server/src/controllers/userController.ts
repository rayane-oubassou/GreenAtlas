import { Response, NextFunction } from 'express';
import User from '../models/User';
import Report from '../models/Report';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const getAllUsers = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users, total: users.length });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, role } = req.body;
    const isAdmin = req.user!.role === 'admin';
    const isSelf = req.params.id === req.user!._id.toString();

    if (!isAdmin && !isSelf) {
      res.status(403).json({ success: false, message: 'Not authorized.' });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role && isAdmin) updates.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({ success: true, message: 'User updated', data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.params.id === req.user!._id.toString()) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
      return;
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Cascade: delete all reports by this user, then all notifications that
    // reference those reports or were addressed to this user.
    const userReports = await Report.find({ user: req.params.id }).select('_id');
    const reportIds = userReports.map((r) => r._id);

    await Promise.all([
      Report.deleteMany({ user: req.params.id }),
      Notification.deleteMany({
        $or: [
          { recipient: req.params.id },
          ...(reportIds.length ? [{ report: { $in: reportIds } }] : []),
        ],
      }),
    ]);

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
