import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType = 'new_report' | 'status_update' | 'alert' | 'info';

export interface INotification extends Document {
  message: string;
  type: NotificationType;
  recipient: Types.ObjectId;
  report?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['new_report', 'status_update', 'alert', 'info'],
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    report: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });
// Auto-delete read notifications after 30 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { read: true } }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
