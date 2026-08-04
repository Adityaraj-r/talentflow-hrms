import PDFDocument from 'pdfkit';

const formatMoney = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

export const generateOfferLetterPdfBuffer = (offer: any, hrUser: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // 1. Header
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#0f766e').text('HRMS System', { align: 'left' });
      doc.fontSize(10).font('Helvetica').fillColor('#64748B').text('Official Employment Offer', { align: 'left' });
      doc.moveDown();
      
      // Draw horizontal separator line
      doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);

      // 2. Body Details
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E293B').text(`Dear ${offer.candidateName},`);
      doc.moveDown(0.5);

      const isExecutive = offer.templateId === 'executive';
      doc.fontSize(10).font('Helvetica').fillColor('#334155').lineGap(4);

      if (isExecutive) {
        doc.text(`We are pleased to extend an offer for the executive role of ${offer.position} in the ${offer.department} department.`);
      } else {
        doc.text(`We are pleased to extend an offer for the role of ${offer.position} in the ${offer.department} department.`);
      }
      doc.moveDown(0.5);

      doc.text(`Your proposed joining date is ${offer.joiningDate}, with a salary package of ${formatMoney(offer.salary)}.`);
      doc.moveDown(1.5);

      // Compensation Box
      const compY = doc.y;
      doc.fillColor('#F8FAFC').rect(50, compY, 500, 110).fill();
      doc.fillColor('#0f766e').fontSize(11).font('Helvetica-Bold').text('Compensation Summary', 65, compY + 12);
      
      doc.fontSize(10).font('Helvetica').fillColor('#334155');
      const comp = offer.compensation || {};
      const baseVal = comp.fixedSalary || offer.salary;
      const bonusVal = comp.bonus || 0;
      const allowancesVal = comp.allowances || 0;
      const totalCtcVal = comp.totalCtc || (baseVal + bonusVal + allowancesVal);

      doc.text(`Base Salary: ${formatMoney(baseVal)}`, 65, compY + 32);
      doc.text(`Bonus: ${formatMoney(bonusVal)}`, 65, compY + 48);
      doc.text(`Allowances: ${formatMoney(allowancesVal)}`, 65, compY + 64);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f766e').text(`Total CTC: ${formatMoney(totalCtcVal)}`, 65, compY + 85);
      
      // Reset layout below box
      doc.y = compY + 110;
      doc.moveDown(2);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text(isExecutive ? 'Executive Benefits & Compensation' : 'Employment Conditions');
      doc.fontSize(9).font('Helvetica').fillColor('#475569').lineGap(3);
      if (isExecutive) {
        doc.text('As an executive leader, you will be eligible for executive health screening, premium corporate wellness programs, relocation assistance (where applicable), and executive performance bonus pools. You will also participate in the company Equity Stock Option Plan (ESOP) vesting over a standard four-year schedule.');
      } else {
        doc.text('This offer is subject to company policies, documentation verification, and standard employment terms. Your performance and salary will be reviewed annually in accordance with standard performance cycle policies.');
      }
      doc.moveDown(2.5);

      // Signatures
      const sigY = doc.y;
      doc.strokeColor('#CBD5E1').lineWidth(1).dash(4, { space: 4 });
      doc.rect(50, sigY, 230, 80).stroke();
      doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text('Company Signature', 60, sigY + 10);

      doc.rect(320, sigY, 230, 80).stroke();
      doc.fontSize(8).fillColor('#94A3B8').text('Candidate Digital Signature', 330, sigY + 10);
      doc.undash();

      // Page Break / Next Steps
      doc.addPage();
      
      // Header Next Steps
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f766e').text('Next Steps', { align: 'left' });
      doc.moveDown();
      doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);

      const companyName = 'InternsLand';
      const expiryDate = offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : 'N/A';

      doc.fontSize(10).font('Helvetica').fillColor('#334155').lineGap(4);
      doc.text(`Congratulations once again on receiving your offer from ${companyName}.`);
      doc.moveDown(0.5);
      doc.text('Please review the enclosed Offer Letter carefully. If you have any questions regarding your compensation, joining date, employment terms, benefits, or any other aspect of the offer, our HR team will be happy to assist you.');
      doc.moveDown(1.5);

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f766e').text('Responding to Your Offer');
      doc.fontSize(10).font('Helvetica').fillColor('#334155').lineGap(4);
      
      doc.font('Helvetica-Bold').text('•  Accept the Offer');
      doc.font('Helvetica').text('   Reply to the offer email or contact your HR representative to confirm your acceptance.');
      doc.moveDown(0.5);
      
      doc.font('Helvetica-Bold').text('•  Discuss or Clarify the Offer');
      doc.font('Helvetica').text('   If you would like to discuss any terms or require additional information, please contact your HR representative before the offer expires.');
      doc.moveDown(0.5);
      
      doc.font('Helvetica-Bold').text('•  Decline the Offer');
      doc.font('Helvetica').text('   If you decide not to proceed, kindly inform the HR team by replying directly to the email.');
      doc.moveDown(1.5);

      // Contact Grid Box
      const contactY = doc.y;
      doc.fillColor('#F8FAFC').rect(50, contactY, 500, 75).fill();
      doc.fillColor('#0f766e').fontSize(11).font('Helvetica-Bold').text('HR Contact Information', 65, contactY + 12);
      doc.fontSize(10).font('Helvetica').fillColor('#334155');
      doc.text(`HR Representative: ${hrUser.firstName} ${hrUser.lastName || ''}`, 65, contactY + 30);
      doc.text(`Email: ${hrUser.email}`, 65, contactY + 44);
      if (hrUser.phoneNumber) {
        doc.text(`Phone: ${hrUser.phoneNumber}`, 65, contactY + 58);
      }
      
      doc.y = contactY + 75;
      doc.moveDown(2);

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#b91c1c').text('Offer Expiry');
      doc.fontSize(10).font('Helvetica').fillColor('#334155');
      doc.text(`Offer Valid Until: ${expiryDate}`);
      doc.moveDown(0.5);
      doc.text("If we do not receive your response by the expiry date, this offer may be considered withdrawn in accordance with the company's recruitment policy.");
      doc.moveDown(2);

      doc.text(`Thank you for considering this opportunity. We look forward to your response and hope to welcome you to ${companyName}.`);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
