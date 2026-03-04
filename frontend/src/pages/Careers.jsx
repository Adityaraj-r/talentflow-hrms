import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"

const Careers = () => {

  const [jobs,setJobs] = useState([])
  const navigate = useNavigate()

  const fetchJobs = async () => {

    try{

      const res = await axios.get(
        "http://localhost:5001/api/job-openings/published"
      )

      setJobs(res.data)

    }catch(error){
      console.log(error)
    }

  }

  useEffect(()=>{
    fetchJobs()
  },[])

  return(

    <div className="p-10 max-w-3xl mx-auto">

      <h1 className="text-4xl font-bold mb-3">
        Careers
      </h1>

      <h2 className="text-xl mb-2">
         Join Our Team
      </h2>

      <p className="text-gray-400 mb-8">
        We currently have {jobs.length} open positions.
      </p>



      {jobs.map(job =>(

        <div
          key={job._id}
          className="border rounded-lg p-6 mb-6"
        >

          <h3 className="text-xl font-semibold mb-2">
            {job.jobTitle}
          </h3>

          <p className="text-gray-400">
            Department: {job.department}
          </p>

          <p className="text-gray-400">
            Type: {job.employmentType}
          </p>

          <p className="text-gray-400 mb-4">
            Deadline: {new Date(job.deadline).toLocaleDateString()}
          </p>

          <button
            onClick={()=>navigate(`/apply/${job._id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Apply
          </button>

        </div>

      ))}

    </div>

  )

}

export default Careers