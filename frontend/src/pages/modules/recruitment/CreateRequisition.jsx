import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react";
import axios from "axios";

const CreateRequisition = () => {
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [experience, setExperience] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [reason, setReason] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("SUBMIT CLICKED ");

  try {
    await axios.post("http://localhost:5001/api/requisitions", {
      position,
      department,
      experience,
      salaryRange,
      reason,
    });

    alert("Requisition Created Successfully ");
  } catch (error) {
    console.error(error);
    alert("Failed to create requisition ");
  }
};

  return (
    <div className="p-8">
      <form onSubmit={handleSubmit}>
        <Card className="w-full">        
          <CardHeader>
            <CardTitle className="text-2xl">Create Staff Requisition</CardTitle>
            <CardDescription>
              Fill in the details to request a new employee
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Position Title</Label>
              <Select onValueChange={setPosition}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend" className="cursor-pointer"> Frontend Developer</SelectItem>                  
                  <SelectItem value="Backend Developer"   className="cursor-pointer">Backend Developer</SelectItem>
                  <SelectItem value="Full Stack Developer"  className="cursor-pointer">Full Stack Developer</SelectItem>
                  <SelectItem value="HR Executive"  className="cursor-pointer"> HR Executive</SelectItem>                    
                  <SelectItem value="UI/UX Designer"  className="cursor-pointer">UI/UX Designer</SelectItem>
               </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select onValueChange={setDepartment}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering" className="cursor-pointer">Engineering</SelectItem>
                  <SelectItem value="Human Resources" className="cursor-pointer">Human Resources</SelectItem>
                  <SelectItem value="Finance"  className="cursor-pointer">Finance</SelectItem>
                  <SelectItem value="Marketing"  className="cursor-pointer">Marketing</SelectItem>
                  <SelectItem value="Sales"  className="cursor-pointer">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Experience Required</Label>
                <Select onValueChange={setExperience}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Select Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1 Years"  className="cursor-pointer">0-1 Years</SelectItem>
                    <SelectItem value="1-3 Years"  className="cursor-pointer">1-3 Years</SelectItem>
                    <SelectItem value="3-5 Years"  className="cursor-pointer">3-5 Years</SelectItem>
                    <SelectItem value="5-8 Years"  className="cursor-pointer">5-8 Years</SelectItem>
                    <SelectItem value="8+ Years"  className="cursor-pointer">8+ Years</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label>Salary Range</Label>
                <Select onValueChange={setSalaryRange}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Select Salary Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3-5 LPA"  className="cursor-pointer">3 LPA - 5 LPA</SelectItem>
                    <SelectItem value="5-8 LPA"  className="cursor-pointer">5 LPA - 8 LPA</SelectItem>
                    <SelectItem value="8-12 LPA"  className="cursor-pointer">8 LPA - 12 LPA</SelectItem>
                    <SelectItem value="12-18 LPA"  className="cursor-pointer">12 LPA - 18 LPA</SelectItem>
                    <SelectItem value="18+ LPA"  className="cursor-pointer">18+ LPA</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          
            <div className="md:col-span-2">
              <Input value={reason} onChange={(e) => setReason(e.target.value)}        
                 placeholder="Project expansion / Replacement / New role"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit"  className="cursor-pointer"> Create Requisition </Button>               
              <Button     className="cursor-pointer"> Cancel </Button>             
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

export default CreateRequisition
