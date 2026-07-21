import { useAuth } from "@/contexts/AuthContext";
import DocumentRequestsHROfficer from "../../role/HR_OFFICER/DocumentRequests";
import DocumentRequestsHRManager from "../../role/HR_MANAGER/DocumentRequests";

const HRDocumentRequests = () => {
  const { user } = useAuth();
  const role = (user?.role || "").toUpperCase().replace(/\s+/g, "_");

  if (role === "HR_MANAGER") {
    return <DocumentRequestsHRManager />;
  }
  return <DocumentRequestsHROfficer />;
};

export default HRDocumentRequests;