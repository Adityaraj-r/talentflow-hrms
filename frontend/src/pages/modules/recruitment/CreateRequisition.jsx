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




const CreateRequisition = () => {
  return (
    <div className="p-8">

<Card className="w-full">
        
        <CardHeader>
          <CardTitle className="text-2xl">Create Staff Requisition</CardTitle>
          <CardDescription>
            Fill in the details to request a new employee
          </CardDescription>
        </CardHeader>

<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Position */}
          <div className="space-y-2">
            <Label>Position Title</Label>
<Select>
<SelectTrigger className="w-full">
    <SelectValue placeholder="Select Position" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="frontend">Frontend Developer</SelectItem>
    <SelectItem value="backend">Backend Developer</SelectItem>
    <SelectItem value="fullstack">Full Stack Developer</SelectItem>
    <SelectItem value="hr">HR Executive</SelectItem>
    <SelectItem value="designer">UI/UX Designer</SelectItem>
  </SelectContent>
</Select>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label>Department</Label>
<Select>
<SelectTrigger className="w-full">
    <SelectValue placeholder="Select Department" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="engineering">Engineering</SelectItem>
    <SelectItem value="hr">Human Resources</SelectItem>
    <SelectItem value="finance">Finance</SelectItem>
    <SelectItem value="marketing">Marketing</SelectItem>
    <SelectItem value="sales">Sales</SelectItem>
  </SelectContent>
</Select>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label>Experience Required</Label>
<Select>
<SelectTrigger className="w-full">
    <SelectValue placeholder="Select Experience" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="0-1">0-1 Years</SelectItem>
    <SelectItem value="1-3">1-3 Years</SelectItem>
    <SelectItem value="3-5">3-5 Years</SelectItem>
    <SelectItem value="5-8">5-8 Years</SelectItem>
    <SelectItem value="8+">8+ Years</SelectItem>
  </SelectContent>
</Select>
          </div>

          {/* Salary */}
          <div className="space-y-2">
            <Label>Salary Range</Label>
<Select>
<SelectTrigger className="w-full">
    <SelectValue placeholder="Select Salary Range" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="3-5">3 LPA - 5 LPA</SelectItem>
    <SelectItem value="5-8">5 LPA - 8 LPA</SelectItem>
    <SelectItem value="8-12">8 LPA - 12 LPA</SelectItem>
    <SelectItem value="12-18">12 LPA - 18 LPA</SelectItem>
    <SelectItem value="18+">18+ LPA</SelectItem>
  </SelectContent>
</Select>
          </div>

          {/* Reason */}
          
<div className="md:col-span-2">


            <Input placeholder="Project expansion / Replacement / New role" />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
          <Button className="w-full md:w-auto px-8">
  Create Requisition
</Button>

            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>

        </CardContent>
      </Card>

    </div>
  )
}

export default CreateRequisition
