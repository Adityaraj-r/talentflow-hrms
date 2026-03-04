import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

const JobOpenings = () => {
  const [jobs, setJobs] = useState([])
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    positions: "",
    employmentType: "",
    deadline: "",
  })

  // =========================
  // FETCH JOBS
  // =========================
  const fetchJobs = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5001/api/job-openings"
      )
      setJobs(res.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  // =========================
  // HANDLE INPUT CHANGE
  // =========================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // =========================
 // =========================
// CREATE JOB (DRAFT)
// =========================
const handleSubmit = async (e) => {
  e.preventDefault()

  if (
    !formData.jobTitle ||
    !formData.department ||
    !formData.positions ||
    !formData.employmentType
  ) {
    alert("Please fill all required fields")
    return
  }

  try {

    const payload = {
      jobTitle: formData.jobTitle,
      department: formData.department,
      positions: Number(formData.positions),   // IMPORTANT
      employmentType: formData.employmentType,
      deadline: formData.deadline,
      status: "Draft"
    }

    await axios.post(
      "http://localhost:5001/api/job-openings",
      payload
    )

    setShowForm(false)

    setFormData({
      jobTitle: "",
      department: "",
      positions: "",
      employmentType: "",
      deadline: "",
    })

    fetchJobs()

  } catch (error) {
    console.log("Error:", error.response?.data)
  }
}
  // =========================
  // PUBLISH JOB
  // =========================
  const publishJob = async (id) => {
    try {
      await axios.put(
        `http://localhost:5001/api/job-openings/${id}/publish`
      )
      fetchJobs()
    } catch (error) {
      console.log(error)
    }
  }

  // =========================
  // CLOSE JOB
  // =========================
  const closeJob = async (id) => {
    try {
      await axios.put(
        `http://localhost:5001/api/job-openings/${id}/close`
      )
      fetchJobs()
    } catch (error) {
      console.log(error)
    }
  }

  // =========================
  // STATS
  // =========================
  const total = jobs.length
  const active = jobs.filter(j => j.status === "Published").length
  const draft = jobs.filter(j => j.status === "Draft").length
  const closed = jobs.filter(j => j.status === "Closed").length

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          Job Openings
        </h1>

        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} className="mr-2" />
          Create Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p>Total Jobs</p>
          <h2 className="text-2xl font-bold">{total}</h2>
        </CardContent></Card>

        <Card><CardContent className="p-4">
          <p>Published</p>
          <h2 className="text-2xl font-bold text-green-600">{active}</h2>
        </CardContent></Card>

        <Card><CardContent className="p-4">
          <p>Draft</p>
          <h2 className="text-2xl font-bold text-yellow-600">{draft}</h2>
        </CardContent></Card>

        <Card><CardContent className="p-4">
          <p>Closed</p>
          <h2 className="text-2xl font-bold text-red-600">{closed}</h2>
        </CardContent></Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">
              Create Job (Draft)
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="jobTitle"
                placeholder="Job Title"
                value={formData.jobTitle}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              />

              <input
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              />

              <input
                type="number"
                name="positions"
                placeholder="Positions"
                value={formData.positions}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              />

              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              >
                <option value="">Select Type</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Intern">Intern</option>
                <option value="Contract">Contract</option>
              </select>

              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              />

              <div className="flex gap-3">
                <Button type="submit">Save Draft</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Job Cards */}
      <div className="space-y-4">
        {jobs.map(job => (
          <Card key={job._id}>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  {job.jobTitle}
                </h3>
                <p>
                  {job.department} • {job.positions} • {job.employmentType}
                </p>
                <p>
                  Deadline: {new Date(job.deadline).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-3 items-center">
                <Badge>{job.status}</Badge>

                {job.status === "Draft" && (
                  <Button size="sm" onClick={() => publishJob(job._id)}>
                    Publish
                  </Button>
                )}

                {job.status === "Published" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => closeJob(job._id)}
                  >
                    Close
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  )
}

export default JobOpenings