import mongoose, { Document, Schema } from 'mongoose';

export interface IMeeting extends Document {
  title: string;
  description?: string;
  meeting_type: string;
  date: string; // YYYY-MM-DD format
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  organizer_id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  department?: string;
  location?: string;
  meeting_link?: string;
  agenda?: string;
  reminder?: string;
  status: string; // Upcoming, Ongoing, Completed, Cancelled
  created_by: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  meeting_type: { type: String, required: true },
  date: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  organizer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  department: { type: String, default: '' },
  location: { type: String, default: '' },
  meeting_link: { type: String, default: '' },
  agenda: { type: String, default: '' },
  reminder: { type: String, default: 'None' },
  status: { type: String, default: 'Upcoming', enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'] },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IMeeting>('Meeting', MeetingSchema);
