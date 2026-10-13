import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

export const exportPDF = async () => {
  const input = document.getElementById("report-container");
  const canvas = await html2canvas(input);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("landscape");
  pdf.addImage(imgData, "PNG", 0, 0, 290, 150);
  pdf.save("HRMS-Report.pdf");
};

export const exportExcel = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, "HRMS-Report.xlsx");
};
