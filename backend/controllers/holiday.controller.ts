import { Request, Response } from 'express';
import Holiday from '../models/Holiday.model';

export const getHolidays = async (req: Request, res: Response) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ success: true, data: holidays });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addHoliday = async (req: Request, res: Response) => {
  try {
    const { name, date, type, country, isPaid } = req.body;

    const existing = await Holiday.findOne({ date });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Holiday already exists on this date' });
    }

    const year = new Date(date).getFullYear();

    const newHoliday = await Holiday.create({ name, date, type, country, isPaid, year });
    res.status(201).json({ success: true, data: newHoliday });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Holiday deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHoliday = async (req: Request, res: Response) => {
  try {
    const { name, date, type, country, isPaid } = req.body;
    let year = undefined;
    if (date) {
      year = new Date(date).getFullYear();
    }
    
    const updatedHoliday = await Holiday.findByIdAndUpdate(
      req.params.id,
      { name, date, type, country, isPaid, ...(year && { year }) },
      { new: true, runValidators: true }
    );

    if (!updatedHoliday) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }

    res.json({ success: true, data: updatedHoliday });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};