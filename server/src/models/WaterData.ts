import mongoose, { Document, Schema } from 'mongoose';

export interface IWaterData extends Document {
  level: number;
  location: string;
  source: string;
  timestamp: Date;
  status: 'critical' | 'low' | 'normal' | 'high';
  notes?: string;
}

const WaterDataSchema = new Schema<IWaterData>(
  {
    level: {
      type: Number,
      required: [true, 'Water level is required'],
      min: [0, 'Level cannot be negative'],
      max: [100, 'Level cannot exceed 100%'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    source: {
      type: String,
      required: [true, 'Water source name is required'],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['critical', 'low', 'normal', 'high'],
      default: 'normal',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

WaterDataSchema.pre('save', function (next) {
  if (this.level < 20) this.status = 'critical';
  else if (this.level < 40) this.status = 'low';
  else if (this.level < 80) this.status = 'normal';
  else this.status = 'high';
  next();
});

WaterDataSchema.index({ timestamp: -1 });
WaterDataSchema.index({ location: 1 });

export default mongoose.model<IWaterData>('WaterData', WaterDataSchema);
