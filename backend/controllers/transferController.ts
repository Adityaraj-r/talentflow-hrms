import { Request, Response } from 'express';
import Transfer from '../models/Transfer.model';

export const createTransferRequest = async (req: Request, res: Response) => {
    try {
        const transferData = new Transfer(req.body);
        const savedTransfer = await transferData.save();
        
        res.status(201).json({
            success: true,
            message: "Transfer request submitted successfully",
            data: savedTransfer
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: "Error submitting transfer request",
            error: error.message
        });
    }
};

export const getAllTransfers = async (req: Request, res: Response) => {
    try {
        const transfers = await Transfer.find().sort({ createdAt: -1 });
        res.status(200).json(transfers);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching transfers", error: error.message });
    }
};

export const updateTransferStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    try {
        const updatedTransfer = await Transfer.findByIdAndUpdate(
            id,
            { status, adminRemarks },
            { new: true }
        );

        if (!updatedTransfer) {
            return res.status(404).json({ message: "Transfer request not found" });
        }

        res.status(200).json({
            success: true,
            message: `Request ${status} successfully`,
            data: updatedTransfer
        });
    } catch (error: any) {
        res.status(400).json({ message: "Error updating status", error: error.message });
    }
};

export const getEmployeeLatestTransfer = async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const latestTransfer = await Transfer.findOne({ 
            employeeName: req.query.name 
        }).sort({ createdAt: -1 });
        
        res.status(200).json(latestTransfer);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching status", error: error.message });
    }
};