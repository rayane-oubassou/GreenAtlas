import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReportCategory = 'wildfire' | 'illegal_logging' | 'water_leak' | 'pollution';
export type ReportStatus = 'pending' | 'verified' | 'resolved';

export interface IReport extends Document {
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  status: ReportStatus;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: ['wildfire', 'illegal_logging', 'water_leak', 'pollution'],
      required: [true, 'Category is required'],
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'resolved'],
      default: 'pending',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

ReportSchema.index({ latitude: 1, longitude: 1 });
ReportSchema.index({ category: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IReport>('Report', ReportSchema);
