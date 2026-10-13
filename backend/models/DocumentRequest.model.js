"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const RemarkSchema = new mongoose_1.Schema({
    remark: { type: String, required: true },
    addedBy: { type: String, required: true },
    role: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });
const UploadedDocumentSchema = new mongoose_1.Schema({
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true, default: 0 },
    mimeType: { type: String, required: true, default: 'application/octet-stream' },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });
const DocumentRequestSchema = new mongoose_1.Schema({
    requestId: { type: String, unique: true },
    employeeId: { type: String, required: true },
    documentType: { type: String, required: true },
    purpose: { type: String, required: true },
    additionalNotes: { type: String },
    remarks: { type: [RemarkSchema], default: [] },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    documentPath: { type: String },
    documentPaths: { type: [String], default: [] },
    uploadedDocuments: { type: [UploadedDocumentSchema], default: [] }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            if ((!ret.uploadedDocuments || ret.uploadedDocuments.length === 0) && (ret.documentPaths && ret.documentPaths.length > 0)) {
                ret.uploadedDocuments = ret.documentPaths.map((pathStr) => {
                    const extension = pathStr.split('.').pop()?.toLowerCase();
                    let mimeType = 'application/octet-stream';
                    if (extension === 'pdf')
                        mimeType = 'application/pdf';
                    else if (extension === 'doc')
                        mimeType = 'application/msword';
                    else if (extension === 'docx')
                        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    else if (extension === 'png')
                        mimeType = 'image/png';
                    else if (extension === 'jpg' || extension === 'jpeg')
                        mimeType = 'image/jpeg';
                    return {
                        originalName: pathStr.split('/').pop() || 'document',
                        fileName: pathStr.split('/').pop() || 'document',
                        filePath: pathStr,
                        fileSize: 0,
                        mimeType: mimeType,
                        uploadedAt: doc.updatedAt || doc.createdAt || new Date()
                    };
                });
            }
            else if ((!ret.uploadedDocuments || ret.uploadedDocuments.length === 0) && ret.documentPath) {
                const pathStr = ret.documentPath;
                const extension = pathStr.split('.').pop()?.toLowerCase();
                let mimeType = 'application/octet-stream';
                if (extension === 'pdf')
                    mimeType = 'application/pdf';
                else if (extension === 'doc')
                    mimeType = 'application/msword';
                else if (extension === 'docx')
                    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                else if (extension === 'png')
                    mimeType = 'image/png';
                else if (extension === 'jpg' || extension === 'jpeg')
                    mimeType = 'image/jpeg';
                ret.uploadedDocuments = [{
                        originalName: pathStr.split('/').pop() || 'document',
                        fileName: pathStr.split('/').pop() || 'document',
                        filePath: pathStr,
                        fileSize: 0,
                        mimeType: mimeType,
                        uploadedAt: doc.updatedAt || doc.createdAt || new Date()
                    }];
            }
            return ret;
        }
    },
    toObject: {
        transform: function (doc, ret) {
            if ((!ret.uploadedDocuments || ret.uploadedDocuments.length === 0) && (ret.documentPaths && ret.documentPaths.length > 0)) {
                ret.uploadedDocuments = ret.documentPaths.map((pathStr) => {
                    const extension = pathStr.split('.').pop()?.toLowerCase();
                    let mimeType = 'application/octet-stream';
                    if (extension === 'pdf')
                        mimeType = 'application/pdf';
                    else if (extension === 'doc')
                        mimeType = 'application/msword';
                    else if (extension === 'docx')
                        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    else if (extension === 'png')
                        mimeType = 'image/png';
                    else if (extension === 'jpg' || extension === 'jpeg')
                        mimeType = 'image/jpeg';
                    return {
                        originalName: pathStr.split('/').pop() || 'document',
                        fileName: pathStr.split('/').pop() || 'document',
                        filePath: pathStr,
                        fileSize: 0,
                        mimeType: mimeType,
                        uploadedAt: doc.updatedAt || doc.createdAt || new Date()
                    };
                });
            }
            else if ((!ret.uploadedDocuments || ret.uploadedDocuments.length === 0) && ret.documentPath) {
                const pathStr = ret.documentPath;
                const extension = pathStr.split('.').pop()?.toLowerCase();
                let mimeType = 'application/octet-stream';
                if (extension === 'pdf')
                    mimeType = 'application/pdf';
                else if (extension === 'doc')
                    mimeType = 'application/msword';
                else if (extension === 'docx')
                    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                else if (extension === 'png')
                    mimeType = 'image/png';
                else if (extension === 'jpg' || extension === 'jpeg')
                    mimeType = 'image/jpeg';
                ret.uploadedDocuments = [{
                        originalName: pathStr.split('/').pop() || 'document',
                        fileName: pathStr.split('/').pop() || 'document',
                        filePath: pathStr,
                        fileSize: 0,
                        mimeType: mimeType,
                        uploadedAt: doc.updatedAt || doc.createdAt || new Date()
                    }];
            }
            return ret;
        }
    }
});
DocumentRequestSchema.pre('save', function () {
    if (!this.requestId) {
        const uniqueSuffix = Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
        this.requestId = `REQ-${uniqueSuffix}`;
    }
});
exports.default = mongoose_1.default.model('DocumentRequest', DocumentRequestSchema);
