import { useState, useEffect } from "react"
import axios from "axios"
import { Mail, Search, Moon, Sun, Briefcase } from "lucide-react"

const ApplicationStatus = () => {

  const [email,setEmail] = useState("")
  const [applications,setApplications] = useState([])
  const [loading,setLoading] = useState(false)
  const [dark,setDark] = useState(false)

  useEffect(()=>{
    if(dark){
      document.documentElement.classList.add("dark")
    }else{
      document.documentElement.classList.remove("dark")
    }
  },[dark])

  const checkStatus = async () => {

    if(!email) return

    try{

      setLoading(true)

      const res = await axios.get(
        `http://localhost:5001/api/applications/status/${email}`
      )

      setApplications(res.data)

    }catch(err){
      console.log(err)
    }

    setLoading(false)
  }


  const statusColor = (status)=>{

    switch(status){

      case "Applied":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"

      case "Shortlisted":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"

      case "Interview":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"

      case "Rejected":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"

      case "Selected":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"

      default:
        return "bg-gray-100 text-gray-600"
    }

  }

  const timelineSteps = [
    "Applied",
    "Shortlisted",
    "Interview",
    "Selected"
  ]


  return(

    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-6 py-16">

      <div className="max-w-4xl mx-auto">


        {/* HEADER */}

        <div className="flex justify-between items-center mb-12">

          <div>

            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Track Your Application Status
            </h1>

            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Enter your email to check the latest update on your job application
            </p>

          </div>

          <button
            onClick={()=>setDark(!dark)}
            className="p-3 rounded-xl bg-gray-200 dark:bg-slate-800"
          >
            {dark ? <Sun size={20}/> : <Moon size={20}/>}
          </button>

        </div>



        {/* SEARCH CARD */}

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 mb-12">

          <div className="flex flex-col md:flex-row gap-4">

            <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-xl px-4 flex-1">

              <Mail className="text-gray-400 mr-2" size={18}/>

              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                className="w-full py-3 bg-transparent outline-none text-gray-800 dark:text-white"
              />

            </div>

            <button
              onClick={checkStatus}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              <Search size={18}/>
              {loading ? "Checking..." : "Check Status"}
            </button>

          </div>

        </div>



        {/* RESULTS */}

        <div className="space-y-8">

          {applications.map(app =>(

            <div
              key={app._id}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition"
            >

              {/* Job Info */}

              <div className="flex justify-between items-start mb-4">

                <div className="flex items-center gap-3">

                  <Briefcase className="text-blue-500"/>

                  <div>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {app.jobId.jobTitle}
                    </h3>

                    <p className="text-sm text-gray-400">
                      Applied on {new Date(app.createdAt).toLocaleDateString()}
                    </p>

                  </div>

                </div>

                <span className={`px-4 py-1 rounded-full text-sm font-medium ${statusColor(app.status)}`}>
                  {app.status}
                </span>

              </div>


              {/* STATUS TIMELINE */}

              <div className="flex items-center justify-between mt-6">

                {timelineSteps.map((step,index)=>{

                  const active = timelineSteps.indexOf(app.status) >= index

                  return(

                    <div key={step} className="flex-1 flex flex-col items-center">

                      <div className={`w-4 h-4 rounded-full ${
                        active
                        ? "bg-blue-600"
                        : "bg-gray-300 dark:bg-slate-700"
                      }`} />

                      <span className="text-xs mt-2 text-gray-500 dark:text-slate-400">
                        {step}
                      </span>

                    </div>

                  )

                })}

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  )

}

export default ApplicationStatus