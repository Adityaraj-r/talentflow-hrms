import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Moon, Sun, Briefcase } from "lucide-react"

const Careers = () => {

  const [jobs,setJobs] = useState([])
  const [dark,setDark] = useState(false)

  const navigate = useNavigate()

  useEffect(()=>{

    if(dark){
      document.documentElement.classList.add("dark")
    }else{
      document.documentElement.classList.remove("dark")
    }

  },[dark])

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
    
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-6 py-16">

      <div className="max-w-5xl mx-auto">

        {/* Header */}

        <div className="flex justify-between items-start mb-10">

          <div>

            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Careers
            </h1>

            <h2 className="text-gray-500 dark:text-slate-400 mt-2 text-base">
              Join our team and help build the future.
            </h2>

            <h4 className="text-sm text-gray-400 mt-1">
              {jobs.length} open positions available
            </h4>

          </div>

          {/* Dark Mode Toggle */}

          <button
            onClick={()=>setDark(!dark)}
            className="p-3 rounded-xl bg-gray-200 dark:bg-slate-800"
          >
            {dark ? <Sun size={20}/> : <Moon size={20}/>}
          </button>

        </div>

        {/* LARGE JOB BOARD CARD */}

        <div
          className="
          bg-white dark:bg-slate-900
          border border-gray-200 dark:border-slate-800
          rounded-3xl
          p-8
          shadow-lg
          space-y-6
          "
        >

          {jobs.map(job =>(

            <div
              key={job._id}
              className="
              flex justify-between items-center
              border border-gray-200 dark:border-slate-800
              rounded-2xl
              p-6
              hover:shadow-md
              transition
              "
            >

              {/* Left */}

              <div className="flex items-start gap-4">

                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                  <Briefcase className="text-blue-600"/>
                </div>

                <div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {job.jobTitle}
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    Department: {job.department}
                  </p>

                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Type: {job.employmentType}
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </p>

                </div>

              </div>

              {/* Apply Button */}

              <button
                onClick={()=>navigate(`/apply/${job._id}`)}
                className="
                bg-blue-600 hover:bg-blue-700
                text-white
                px-5 py-2
                rounded-lg
                text-sm
                transition
                "
              >
                Apply
              </button>

            </div>

          ))}

        </div>

      </div>

    </div>

  )

}

export default Careers