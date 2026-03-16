import mongoose, { Schema, Document } from 'mongoose';

export interface ITAPolicy extends Document {
  lateGracePeriodMins: number;
  standardWorkHours: number;
  maxMissedPunches: number;
  halfDayLateThresholdMins: number;
  updatedBy?: mongoose.Types.ObjectId;
}

const TAPolicySchema = new Schema<ITAPolicy>(
  {
    lateGracePeriodMins: { 
      type: Number, 
      default: 15, 
      required: true 
    },
    standardWorkHours: { 
      type: Number, 
      default: 9, 
      required: true 
    },
    maxMissedPunches: { 
      type: Number, 
      default: 3, 
      required: true 
    },
    halfDayLateThresholdMins: { 
      type: Number, 
      default: 120, 
      required: true 
    },
    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }
  },
  { timestamps: true }
);

export default mongoose.model<ITAPolicy>('TAPolicy', TAPolicySchema);