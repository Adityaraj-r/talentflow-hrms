import { createLog } from "../../controllers/audit.controller";
import Employee from "../../models/Employee.model";
import SalaryStructure from "../../models/salaryStructure.model";
import User from "../../models/User.model";

type SalaryPackage = {
  basic?: number;
  hra?: number;
  transport?: number;
  medical?: number;
  otherAllowance?: number;
  pf?: number;
  tax?: number;
  insurance?: number;
};

export const autoCreateEmployeeFromOffer = async (params: {
  offer: any;
  candidate: any;
  job: any;
  salaryPackage?: SalaryPackage;
  salary: number;
}) => {
  const { offer, candidate, job, salaryPackage, salary } = params;
  if (!candidate || !candidate.email) return;

  const email = String(candidate.email).toLowerCase().trim();

  // Best-effort defaults: the current careers UI does not collect phone/salary-breakdown.
  const phoneNumber = candidate.phoneNumber || candidate.phone || "0000000000";

  const derivedSalary: SalaryPackage = {
    basic: salaryPackage?.basic ?? salary,
    hra: salaryPackage?.hra ?? 0,
    transport: salaryPackage?.transport ?? 0,
    medical: salaryPackage?.medical ?? 0,
    otherAllowance: salaryPackage?.otherAllowance ?? 0,
    pf: salaryPackage?.pf ?? 0,
    tax: salaryPackage?.tax ?? 0,
    insurance: salaryPackage?.insurance ?? 0,
  };

  const joiningDate = offer?.joiningDate ? new Date(offer.joiningDate) : undefined;

  let employee = await Employee.findOne({ email });

  if (!employee) {
    // Generate sequential employeeCode (EMP-0001...).
    const lastEmployee = await Employee.findOne({
      employeeCode: { $regex: /^EMP-\d+/ },
    }).sort({ createdAt: -1 });

    let newEmployeeCode = "EMP-0001";
    if (lastEmployee?.employeeCode) {
      const parts = String(lastEmployee.employeeCode).split("-");
      if (parts.length === 2) {
        const lastNumber = parseInt(parts[1], 10);
        if (!isNaN(lastNumber)) {
          newEmployeeCode = `EMP-${String(lastNumber + 1).padStart(4, "0")}`;
        }
      }
    }

    employee = await Employee.create({
      employeeCode: newEmployeeCode,
      firstName: candidate.firstName || "Candidate",
      lastName: candidate.lastName || "",
      email,
      phoneNumber,
      department: job?.department || null,
      designation: job?.jobTitle || null,
      employmentType: job?.employmentType || undefined,
      joiningDate,
      onboardingStatus: "Completed",
      status: "Active",
      salary: {
        basic: derivedSalary.basic || 0,
        currency: "INR",
        allowances: {
          hra: derivedSalary.hra || 0,
          transport: derivedSalary.transport || 0,
          medical: derivedSalary.medical || 0,
          other: derivedSalary.otherAllowance || 0,
        },
        deductions: {
          pf: derivedSalary.pf || 0,
          tax: derivedSalary.tax || 0,
          insurance: derivedSalary.insurance || 0,
          other: 0,
        },
      },
    });
  } else {
    employee.firstName = candidate.firstName || employee.firstName;
    employee.lastName = candidate.lastName || employee.lastName;
    employee.phoneNumber = phoneNumber;
    employee.department = job?.department || employee.department;
    employee.designation = job?.jobTitle || employee.designation;
    employee.employmentType = job?.employmentType || employee.employmentType;
    employee.joiningDate = joiningDate || employee.joiningDate;
    employee.onboardingStatus = "Completed";
    employee.status = "Active";
    employee.salary = {
      basic: derivedSalary.basic || 0,
      currency: "INR",
      allowances: {
        hra: derivedSalary.hra || 0,
        transport: derivedSalary.transport || 0,
        medical: derivedSalary.medical || 0,
        other: derivedSalary.otherAllowance || 0,
      },
      deductions: {
        pf: derivedSalary.pf || 0,
        tax: derivedSalary.tax || 0,
        insurance: derivedSalary.insurance || 0,
        other: 0,
      },
    };
    await employee.save({ validateBeforeSave: false });
  }

  // Payroll sync: initialize SalaryStructure for traceability.
  const employeeIdKey = employee.employeeCode || employee._id.toString();
  await SalaryStructure.updateOne(
    { employeeId: employeeIdKey },
    {
      $set: {
        employeeId: employeeIdKey,
        basic: derivedSalary.basic || 0,
        hra: derivedSalary.hra || 0,
        transport: derivedSalary.transport || 0,
        medical: derivedSalary.medical || 0,
        otherAllowance: derivedSalary.otherAllowance || 0,
        pf: derivedSalary.pf || 0,
        tax: derivedSalary.tax || 0,
        insurance: derivedSalary.insurance || 0,
        effectiveFrom: new Date(),
      },
    },
    { upsert: true }
  );

  // Best-effort link: if a User already exists for this email, set User.employeeId.
  await User.findOneAndUpdate(
    { email },
    { employeeId: employee._id },
    { new: false }
  );

  await createLog(
    offer?.createdBy?.toString?.() || "system",
    "Recruitment System",
    "ONBOARDING_AUTO_FROM_OFFER",
    "recruitment",
    `employeeId=${employee._id} employeeCode=${employee.employeeCode}`,
    "unknown",
    "Success"
  );
};

