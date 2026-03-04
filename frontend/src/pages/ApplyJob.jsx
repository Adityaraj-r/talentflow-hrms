import { useParams } from "react-router-dom"
import { useState } from "react"
import axios from "axios"

const ApplyJob = () => {

  const { id } = useParams()

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [loading,setLoading] = useState(false)
  const [success,setSuccess] = useState(false)

  const handleSubmit = async (e) => {

    e.preventDefault()

    try{

      setLoading(true)

      const data = {
        jobId:id,
        name:name,
        email:email
      }

      await axios.post(
        "http://localhost:5001/api/applications/apply",
        data
      )

      setSuccess(true)

      setName("")
      setEmail("")

    }catch(error){

      console.log("ERROR:",error.response?.data)

    }

    setLoading(false)

  }

  return (

    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

      <div className="bg-white shadow-xl rounded-2xl w-full max-w-xl p-10">

        {/* Header */}

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Apply for Job
        </h1>

        <p className="text-gray-500 mb-8">
          Submit your application to apply for this position.
        </p>

        {success && (

          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            Application submitted successfully 🎉
          </div>

        )}

        {/* Form */}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>

            <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* Email */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>

            <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* Resume */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Resume
            </label>

            <input
            type="file"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 cursor-pointer"
            />

          </div>

          {/* Button */}

          <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition duration-200"
          >

          {loading ? "Submitting..." : "Submit Application"}

          </button>

        </form>

      </div>

    </div>
  )
}

export default ApplyJob