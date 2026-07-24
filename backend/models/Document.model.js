"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const DocumentSchema = new mongoose_1.Schema({
    employeeId: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: String, required: true },
    filePath: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ['Personal', 'Education', 'Employment', 'Payroll', 'Onboarding', 'Uncategorized'],
        default: 'Uncategorized'
    },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    uploadDate: { type: Date, default: Date.now }
});
exports.default = mongoose_1.default.model('Document', DocumentSchema);
