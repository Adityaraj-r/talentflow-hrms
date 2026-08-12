import { Request, Response } from 'express';
import Meeting from '../models/meeting.model';
import User from '../models/User.model';

export const createMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingData = {
      ...req.body,
      created_by: req.user._id // Assuming auth middleware sets req.user
    };

    if (!meetingData.organizer_id) {
      meetingData.organizer_id = req.user._id;
    }

    const meeting = new Meeting(meetingData);
    await meeting.save();
    
    // Populate the newly created meeting to return full details
    await meeting.populate('organizer_id', 'firstName lastName email profilePicture');
    await meeting.populate('participants', 'firstName lastName email profilePicture');

    res.status(201).json({ success: true, data: meeting });
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getMeetings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.user.role?.name?.toLowerCase() || '';
    const userId = req.user._id;
    
    let query = {};
    
    // If regular employee, only show meetings where they are organizer or in participants
    if (userRole !== 'hr' && userRole !== 'admin' && userRole !== 'superadmin') {
      query = {
        $or: [
          { organizer_id: userId },
          { participants: userId }
        ]
      };
    }
    
    const meetings = await Meeting.find(query)
      .populate('organizer_id', 'firstName lastName email profilePicture')
      .populate('participants', 'firstName lastName email profilePicture')
      .sort({ date: 1, start_time: 1 });
      
    res.status(200).json({ success: true, data: meetings });
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Add permission check if needed here, but relying on route middleware usually
    const meeting = await Meeting.findByIdAndUpdate(id, req.body, { new: true })
      .populate('organizer_id', 'firstName lastName email profilePicture')
      .populate('participants', 'firstName lastName email profilePicture');
      
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: meeting });
  } catch (error: any) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findByIdAndDelete(id);
    
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }
    
    res.status(200).json({ success: true, message: 'Meeting cancelled/deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
