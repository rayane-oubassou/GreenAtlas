import mongoose, { Document, Schema } from 'mongoose';

export type FireRiskLevel = 'Low' | 'Medium' | 'High' | 'Very High' | 'Extreme';

export interface IForestData extends Document {
  fireRiskLevel: FireRiskLevel;
  healthIndex: number;
  location: string;
  area: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  timestamp: Date;
  notes?: string;
}

const ForestDataSchema = new Schema<IForestData>(
  {
    fireRiskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Very High', 'Extreme'],
      required: true,
    },
    healthIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    area: {
      type: Number,
      required: true,
      min: 0,
    },
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    windSpeed: {
      type: Number,
      required: true,
      min: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

ForestDataSchema.index({ timestamp: -1 });
ForestDataSchema.index({ location: 1 });

export default mongoose.model<IForestData>('ForestData', ForestDataSchema);
