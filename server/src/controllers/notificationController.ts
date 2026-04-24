import { Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notifications = await Notification.find({ recipient: req.user!._id })
      .populate('report', 'title category')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user!._id,
      read: false,
    });

    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user!._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Notification.updateMany(
      { recipient: req.user!._id, read: false },
      { read: true }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user!._id,
    });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};
