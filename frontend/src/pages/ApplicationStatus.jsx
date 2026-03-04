import { useState } from "react"
import axios from "axios"

const ApplicationStatus = () => {

  const [email,setEmail] = useState("")
  const [applications,setApplications] = useState([])
  const [loading,setLoading] = useState(false)

  const checkStatus = async () => {

    if(!email) return

    try{

      setLoading(true)

      const res = await axios.get(
        `http://localhost:5001/api/applications/status/${email}`
      )

      setApplications(res.data)

    }catch(error){
      console.log(error)
    }

    setLoading(false)

  }

  const statusColor = (status)=>{

    switch(status){

      case "Applied":
        return "bg-blue-100 text-blue-600"

      case "Shortlisted":
        return "bg-purple-100 text-purple-600"

      case "Interview":
        return "bg-yellow-100 text-yellow-600"

      case "Selected":
        return "bg-green-100 text-green-600"

      case "Rejected":
        return "bg-red-100 text-red-600"

      default:
        return "bg-gray-100 text-gray-600"
    }

  }

  return(

    <div className="min-h-screen bg-gray-50 flex justify-center">

      <div className="max-w-3xl w-full p-10">


        <h1 className="text-4xl font-bold mb-2">
          Check Application Status
        </h1>

        <p className="text-gray-500 mb-8">
          Enter your email to track your job application
        </p>


        <div className="flex gap-3 mb-10">

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={checkStatus}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            {loading ? "Checking..." : "Check Status"}
          </button>

        </div>



        {applications.length === 0 && !loading && (

          <div className="text-center text-gray-400 mt-20">
            No applications found
          </div>

        )}

        {applications.map(app =>(

          <div
            key={app._id}
            className="bg-white border rounded-xl p-6 mb-6 shadow-sm"
          >

            <div className="flex justify-between items-center">

              <div>

                <h3 className="text-xl font-semibold">
                  {app.jobId.jobTitle}
                </h3>

                <p className="text-gray-400 text-sm">
                  Applied on {new Date(app.createdAt).toLocaleDateString()}
                </p>

              </div>

              <span
                className={`px-4 py-1 rounded-full text-sm font-medium ${statusColor(app.status)}`}
              >
                {app.status}
              </span>

            </div>

          </div>

        ))}

      </div>

    </div>

  )

}

export default ApplicationStatus