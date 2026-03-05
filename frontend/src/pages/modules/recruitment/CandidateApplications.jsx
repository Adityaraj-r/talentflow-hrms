import { useEffect, useState } from "react"
import axios from "axios"

const CandidateApplications = () => {

  const [applications,setApplications] = useState([])

  const fetchApplications = async () => {

    const res = await axios.get(
      "http://localhost:5001/api/applications"
    )

    setApplications(res.data)

  }

  useEffect(()=>{
    fetchApplications()
  },[])

  return (

    <div className="p-8">

      <h1 className="text-2xl font-bold mb-6">
        Candidate Applications
      </h1>

      {applications.map(app => (

        <div
          key={app._id}
          className="border p-5 rounded-lg mb-4"
        >

          <h2 className="text-lg font-semibold">
            {app.name}
          </h2>

          <p>Email: {app.email}</p>

          <p>
            Applied For: {app.jobId?.jobTitle}
          </p>

          <p>Status: {app.status}</p>

        </div>

      ))}

    </div>

  )
}

export default CandidateApplications