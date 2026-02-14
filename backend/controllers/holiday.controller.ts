import { Request, Response } from 'express';
import Holiday from '../models/Holiday.model';

export const getHolidays = async (req: Request, res: Response) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ success: true, data: holidays });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addHoliday = async (req: Request, res: Response) => {
  try {
    const { name, date, type } = req.body;

    const existing = await Holiday.findOne({ date });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Holiday already exists on this date' });
    }

    const year = new Date(date).getFullYear();

    const newHoliday = await Holiday.create({ name, date, type, year });
    res.status(201).json({ success: true, data: newHoliday });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Holiday deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};