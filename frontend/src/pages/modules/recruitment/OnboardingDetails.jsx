import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const OnboardingDetails = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:5001/api/employees/${id}`)
      .then(res => setEmployee(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!employee) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {employee.firstName} {employee.lastName}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <p><b>Designation:</b> {employee.designation}</p>
          <p><b>Department:</b> {employee.department}</p>
          <p><b>Joining Date:</b> {employee.joiningDate?.slice(0,10)}</p>
          <p><b>Onboarding Stage:</b> {employee.onboardingStatus}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingDetails;
