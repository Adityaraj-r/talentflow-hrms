import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Moon, Sun, Briefcase } from "lucide-react"

const Careers = () => {

  const [jobs,setJobs] = useState([])
  const [dark,setDark] = useState(false)

  const navigate = useNavigate()

  const getHiringRoles = (job) => {
    if (Array.isArray(job.hiringRoles) && job.hiringRoles.length > 0) {
      return job.hiringRoles
    }
    return [{
      _id: "default",
      roleName: job.jobTitle,
      openings: job.positions || 1,
      filled: 0,
      skills: job.description || "",
      status: job.status === "Closed" ? "Closed" : "Open",
    }]
  }

  const formatDeadline = (dateVal) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    const d = new Date(deadline);
    d.setHours(23, 59, 59, 999);
    const today = new Date();
    return today > d;
  };

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

        <div className="flex justify-between items-start mb-12">

          <div>

            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Careers
            </h1>

            <p className="text-gray-500 dark:text-slate-400 mt-2 text-base">
              Join our team and help build the future.
            </p>
             <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">

              <Briefcase
                size={18}
                className="text-blue-500"
              />

             <span className="text-sm text-slate-600 dark:text-slate-300">
                {jobs.length} Open Job Opening{jobs.length !== 1 && "s"}
              </span>
              </div>

          </div>

          {/* Dark Mode Toggle */}

          <button
            onClick={()=>setDark(!dark)}
            className="p-3
            rounded-xl
            bg-white
            dark:bg-slate-900
            border
            border-slate-200
            dark:border-slate-800
            hover:scale-105
            transition"
          >
            {dark ? <Sun size={20}/> : <Moon size={20}/>}
          </button>

        </div>
         
         {/* Jobs */}

        <div className="space-y-7">

          {jobs.map((job) => {
            const roles = getHiringRoles(job);
            const isSingleRole = roles.length <= 1;
            const firstRole = roles[0];
            const isClosed = firstRole?.status === "Closed" || (Number(firstRole?.openings) - Number(firstRole?.filled) <= 0);
            const deadlinePassed = isDeadlinePassed(job.deadline);
            return (
              <div
                key={job._id}
                className="
                bg-white
                dark:bg-slate-900
                border
                border-gray-200
                dark:border-slate-800
                rounded-3xl
                p-7
                hover:-translate-y-1
                hover:shadow-xl
                transition-all
                duration-300
                "
              >

              <div className="flex justify-between items-start gap-6">

                {/* Left */}

                <div className="flex gap-5">

                  <div
                    className="
                    w-16
                    h-16
                    rounded-2xl
                    bg-blue-500/10
                    flex
                    items-center
                    justify-center
                    shrink-0
                    "
                  >
                    <Briefcase
                      size={30}
                      className="text-blue-500"
                    />
                  </div>

                  <div>

                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {job.jobTitle}
                    </h2>

                    <div className="flex gap-3 mt-4 flex-wrap">

                      <span
                        className="
                        px-3
                        py-1
                        rounded-full
                        bg-slate-100
                        dark:bg-slate-800
                        text-sm
                        text-slate-700
                        dark:text-slate-300
                        "
                      >
                        {job.department}
                      </span>

                      <span
                        className="
                        px-3
                        py-1
                        rounded-full
                        bg-slate-100
                        dark:bg-slate-800
                        text-sm
                        text-slate-700
                        dark:text-slate-300
                        "
                      >
                        {job.employmentType}
                      </span>

                    </div>

                    <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                      Application Deadline
                    </p>

                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDeadline(job.deadline)}
                    </p>

                  </div>

                </div>

                {/* Apply */}

                {isSingleRole && (
                  <button
                    onClick={() => {
                      navigate(`/apply/${job._id}?roleId=${firstRole?._id || ""}`)
                    }}
                    disabled={deadlinePassed || isClosed}
                    className={`
                    bg-blue-600
                    transition-all
                    text-white
                    font-medium
                    px-7
                    py-3
                    rounded-xl
                    whitespace-nowrap
                    ${(deadlinePassed || isClosed) ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 hover:scale-105"}
                    `}
                  >
                    {deadlinePassed ? "Applications Closed" : (isClosed ? "Positions Filled" : "Apply Now →")}
                  </button>
                )}

              </div>

              {!isSingleRole && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {roles.map((role) => {
                    const filled = Number(role.filled) || 0
                    const openings = Number(role.openings) || 0
                    const remaining = Math.max(0, openings - filled)
                    const isClosed = role.status === "Closed" || remaining === 0
                    return (
                      <div
                        key={role._id || role.roleName}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.roleName}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {remaining} Opening{remaining !== 1 && "s"} Available
                            </p>
                            {(role.minSalary || role.maxSalary) ? (
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                <strong className="text-gray-900 dark:text-white">Salary:</strong> {role.minSalary || 0} - {role.maxSalary || 0}
                              </p>
                            ) : (
                              job.salaryRange && (
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  <strong className="text-gray-900 dark:text-white">Salary:</strong> {job.salaryRange}
                                </p>
                              )
                            )}
                            {role.experience && (
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                <strong className="text-gray-900 dark:text-white">Experience:</strong> {role.experience}
                              </p>
                            )}
                            {role.skills && (
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                <strong className="text-gray-900 dark:text-white">Skills:</strong> {role.skills}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => navigate(`/apply/${job._id}?roleId=${role._id}`)}
                            disabled={isClosed || deadlinePassed}
                            className="
                            rounded-xl
                            bg-blue-600
                            px-5
                            py-2.5
                            text-sm
                            font-medium
                            text-white
                            transition-all
                            hover:scale-105
                            hover:bg-blue-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                            "
                          >
                            {deadlinePassed ? "Applications Closed" : (isClosed ? "Positions Filled" : "Apply")}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        </div>

      </div>

    </div>
  );
};

export default Careers;
