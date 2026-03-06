import { useState, useEffect } from "react"
import axios from "axios"

const RecruitmentPipeline = () => {

  const [applications,setApplications] = useState([])
  const [loading,setLoading] = useState(true)
  const [search,setSearch] = useState("")
  const [stageFilter,setStageFilter] = useState("All")

  const stageCounts = {
    Applied: applications.filter(a => a.status === "Applied").length,
    Shortlisted: applications.filter(a => a.status === "Shortlisted").length,
    Interview: applications.filter(a => a.status === "Interview").length,
    Selected: applications.filter(a => a.status === "Selected").length,
    Rejected: applications.filter(a => a.status === "Rejected").length
  }

  const stageColors = {
    Applied:"bg-blue-500/15 text-blue-500 border-blue-500/30",
    Shortlisted:"bg-purple-500/15 text-purple-500 border-purple-500/30",
    Interview:"bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
    Selected:"bg-green-500/15 text-green-500 border-green-500/30",
    Rejected:"bg-red-500/15 text-red-500 border-red-500/30"
  }

  const fetchApplications = async () => {

    try{

      const res = await axios.get(
        "http://localhost:5001/api/applications"
      )

      setApplications(res.data)

    }catch(error){
      console.log(error)
    }

    setLoading(false)

  }

  useEffect(()=>{
    fetchApplications()
  },[])

  const handleStageChange = async(id,newStatus)=>{

    try{

      await axios.put(
        `http://localhost:5001/api/applications/${id}/status`,
        { status:newStatus }
      )

      setApplications(prev =>
        prev.map(app =>
          app._id === id
            ? { ...app, status:newStatus }
            : app
        )
      )

    }catch(error){
      console.log(error)
    }

  }

  const filtered = applications.filter(app => {

    const name = (app.name || "").toLowerCase()
    const job = (app.jobId?.jobTitle || "").toLowerCase()

    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      job.includes(search.toLowerCase())

    const matchesStage =
      stageFilter === "All" || app.status === stageFilter

    return matchesSearch && matchesStage

  })

  if(loading){
    return(
      <div className="flex items-center justify-center h-64">
        Loading...
      </div>
    )
  }

  return(

    <div className="p-6 space-y-6">

      {/* Header */}

      <div>
        <h2 className="text-2xl font-semibold">
          Recruitment Pipeline
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          Track and manage all job applications
        </p>
      </div>

      {/* Stats */}

      <div className="grid grid-cols-5 gap-3">

        {Object.entries(stageCounts).map(([stage,count]) =>(

          <div
            key={stage}
            onClick={()=>setStageFilter(stageFilter===stage?"All":stage)}
            className={`rounded-xl border p-4 text-center cursor-pointer transition-all hover:scale-105 ${stageColors[stage]}`}
          >

            <p className="text-xs font-medium opacity-80">
              {stage}
            </p>

            <p className="text-2xl font-bold mt-1">
              {count}
            </p>

          </div>

        ))}

      </div>

      {/* Filters */}

      <div className="flex items-center gap-4">

        <input
          type="text"
          placeholder="Search candidate..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          className="bg-background border rounded-lg px-4 py-2 w-72 text-sm"
        />

        <select
          value={stageFilter}
          onChange={(e)=>setStageFilter(e.target.value)}
          className="bg-background border rounded-lg px-4 py-2 text-sm cursor-pointer"
        >

          <option value="All">All Stages</option>

          {Object.keys(stageCounts).map(s=>(
            <option key={s} value={s}>
              {s}
            </option>
          ))}

        </select>

      </div>

      {/* Table */}

      <div className="rounded-xl border overflow-hidden">

        <table className="w-full text-sm">

          <thead>

            <tr className="border-b bg-muted/50 text-left uppercase tracking-wider text-muted-foreground text-xs">

              <th className="px-6 py-3">Name</th>

              <th className="px-6 py-3">Position</th>

              <th className="px-6 py-3">Email</th>

              <th className="px-6 py-3">Stage</th>

              <th className="px-6 py-3 text-right">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {filtered.length===0 ?(

              <tr>

                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  No candidates found
                </td>

              </tr>

            ):filtered.map(app=>(

              <tr key={app._id} className="border-b hover:bg-muted/30">

                <td className="px-6 py-4 font-medium">
                  {app.name}
                </td>

                <td className="px-6 py-4 text-muted-foreground">
                  {app.jobId?.jobTitle}
                </td>

                <td className="px-6 py-4 text-muted-foreground">
                  {app.email}
                </td>

                <td className="px-6 py-4">

                  <select
                    value={app.status}
                    onChange={(e)=>handleStageChange(app._id,e.target.value)}
                    className={`text-xs rounded-full px-3 py-1 border font-medium bg-transparent cursor-pointer ${stageColors[app.status]}`}
                  >

                    {Object.keys(stageCounts).map(s=>(
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}

                  </select>

                </td>

                <td className="px-6 py-4">

                  <div className="flex justify-end gap-2">

                    <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs">
                      View
                    </button>

                    {app.status !== "Rejected" && (

                      <button
                        onClick={()=>handleStageChange(app._id,"Rejected")}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs"
                      >
                        Reject
                      </button>

                    )}

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}

export default RecruitmentPipeline