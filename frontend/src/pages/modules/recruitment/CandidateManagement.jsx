  import React, { useState ,useEffect } from "react";

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const appliedCount = candidates.filter(c => c.stage === "Applied").length;
  const screeningCount = candidates.filter(c => c.stage === "Screening").length;
  const interviewCount = candidates.filter(c => c.stage === "Interview").length;
  const offerCount = candidates.filter(c => c.stage === "Offer").length;
  const hiredCount = candidates.filter(c => c.stage === "Hired").length;
  const rejectedCount = candidates.filter(c => c.stage === "Rejected").length;
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [employeeData, setEmployeeData] = useState({
    employeeId: "",
    department: "",
    reportingManager: "",
    salary: "",
    joiningDate: "",
    location: "",
    employmentType: "Full-Time"
  });
  const fetchCandidates = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/candidates");
      const data = await response.json();

        if (data.success) {
          setCandidates(data.data);
        } else {
          setCandidates(data);
        }

    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleStageChange = async (id, newStage) => {
    try {
      await fetch(`http://localhost:5001/api/candidates/${id}/stage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ stage: newStage })
      });
     fetchCandidates(); 
    } catch (error) {
      console.error("Stage update error:", error);
    }
  };

  const confirmReject = async () => {
    if (!rejectReason) {
      alert("Please select a reason");
      return;
    }
    try {
      await fetch(`http://localhost:5001/api/candidates/${selectedCandidateId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      fetchCandidates(); 
      setIsRejectModalOpen(false);
      setRejectReason("");
      setSelectedCandidateId(null);
      } catch (error) {
      console.error("Reject error:", error);
    }
  };

  const confirmConvert = () => {
    alert("Employee Created Successfully");
    setIsConvertModalOpen(false);
    setSelectedCandidate(null);
  };
  return (
    <>
      <div className="bg-[#0f172a] p-8 rounded-2xl mt-8 shadow-lg border border-gray-700">
        <h2 className="text-white text-2xl font-semibold mb-6">
          Candidate Management
        </h2>
        <div className="grid grid-cols-6 gap-4 mb-8">
          <div className="bg-blue-600/20 text-blue-400 p-4 rounded-lg text-center">
            <p className="text-sm">Applied</p>
            <p className="text-xl font-bold">{appliedCount}</p>
          </div>
          <div className="bg-purple-600/20 text-purple-400 p-4 rounded-lg text-center">
            <p className="text-sm">Screening</p>
            <p className="text-xl font-bold">{screeningCount}</p>
          </div>
          <div className="bg-yellow-600/20 text-yellow-400 p-4 rounded-lg text-center">
            <p className="text-sm">Interview</p>
            <p className="text-xl font-bold">{interviewCount}</p>
          </div>
          <div className="bg-orange-600/20 text-orange-400 p-4 rounded-lg text-center">
            <p className="text-sm">Offer</p>
            <p className="text-xl font-bold">{offerCount}</p>
          </div>
          <div className="bg-green-600/20 text-green-400 p-4 rounded-lg text-center">
            <p className="text-sm">Hired</p>
            <p className="text-xl font-bold">{hiredCount}</p>
          </div>
          <div className="bg-red-600/20 text-red-400 p-4 rounded-lg text-center">
            <p className="text-sm">Rejected</p>
            <p className="text-xl font-bold">{rejectedCount}</p>
          </div>
        </div>

       <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search candidate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#1e293b] text-white px-4 py-2 rounded-lg w-72 border border-gray-600 focus:outline-none"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="bg-[#1e293b] text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none cursor-pointer"
        >
          <option value="All">All Stages</option>
          <option value="Applied">Applied</option>
          <option value="Screening">Screening</option>
          <option value="Interview">Interview</option>
          <option value="Offer">Offer</option>
          <option value="Hired">Hired</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-gray-600 text-left uppercase tracking-wider text-gray-400">
              <th className="py-3">Name</th>
              <th>Position</th>
              <th>Experience</th>
              <th>Stage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates
              .filter((candidate) => {
                const matchesSearch = candidate.name
                .toLowerCase()
                .includes(search.toLowerCase());
                const matchesStage = stageFilter === "All" || candidate.stage === stageFilter;
                return matchesSearch && matchesStage;
              })
               .map((candidate) => (
                  <tr
                    key={candidate._id}
                    className="border-b border-gray-700 hover:bg-[#1e293b] transition duration-200"
                  >
                    <td className="py-4 font-medium">
                      {candidate.name}
                    </td>
                    <td>{candidate.position}</td>
                    <td>{candidate.experience}</td>
                    <td>
                      <select
                        value={candidate.stage}
                        onChange={(e) =>
                          handleStageChange(candidate._id, e.target.value)
                        }
                        className="bg-[#1e293b] text-white px-3 py-1 rounded-md border border-gray-600 focus:outline-none cursor-pointer"
                      >
                        <option>Applied</option>
                        <option>Screening</option>
                        <option>Interview</option>
                        <option>Offer</option>
                        <option>Hired</option>
                        <option>Rejected</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-xs transition cursor-pointer">
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCandidateId(candidate._id);
                            setIsRejectModalOpen(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-xs transition cursor-pointer"
                        >
                          Reject
                        </button>
                          {candidate.stage === "Hired" && (
                            <button
                               onClick={() => {
                                setSelectedCandidate(candidate);
                                setEmployeeData({
                                 employeeId: "EMP" + Math.floor(1000 + Math.random() * 9000),
                                 department: "",
                                 reportingManager: "",
                                 salary: "",
                                 joiningDate: "",
                                 location: "",
                                 employmentType: "Full-Time"
                                });
                                setIsConvertModalOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-xs transition"
                            >
                              Convert
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

    {isRejectModalOpen && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-[#0f172a] p-6 rounded-xl w-96 border border-gray-700">
          <h3 className="text-white text-lg font-semibold mb-4">
            Reject Candidate
          </h3>

          <select
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full bg-[#1e293b] text-white px-3 py-2 rounded border border-gray-600 mb-4"
          >
            <option value="">Select Reason</option>
            <option value="Skill Mismatch">Skill Mismatch</option>
            <option value="Budget Issue">Budget Issue</option>
            <option value="Position Closed">Position Closed</option>
            <option value="Overqualified">Overqualified</option>
            <option value="No Show">No Show</option>
          </select>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              className="bg-gray-600 px-3 py-1 rounded"
            >
              Cancel
            </button>

            <button
              onClick={confirmReject}
              className="bg-red-600 px-3 py-1 rounded"
            >
              Confirm Reject
            </button>
          </div>
        </div>
      </div>
    )}

    {isConvertModalOpen && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-[#0f172a] p-6 rounded-xl w-[500px] border border-gray-700">
          <h3 className="text-white text-lg font-semibold mb-4">
            Convert to Employee
          </h3>
          <p className="text-gray-400 mb-4 text-sm">
            Candidate: <span className="text-white font-medium">
              {selectedCandidate?.name}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <input
              type="text"
              value={employeeData.employeeId}
              disabled
              className="bg-[#1e293b] text-white px-3 py-2 rounded border border-gray-600"
            />

            <input
              type="text"
              placeholder="Department"
              value={employeeData.department}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, department: e.target.value })
              }
              className="bg-[#1e293b] text-white px-3 py-2 rounded border border-gray-600"
            />

            <input
              type="text"
              placeholder="Reporting Manager"
              value={employeeData.reportingManager}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, reportingManager: e.target.value })
              }
              className="bg-[#1e293b] text-white px-3 py-2 rounded border border-gray-600"
            />

            <input
              type="number"
              placeholder="Salary"
              value={employeeData.salary}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, salary: e.target.value })
              }
              className="bg-[#1e293b] text-white px-3 py-2 rounded border border-gray-600"
            />

            <input
              type="date"
              value={employeeData.joiningDate}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, joiningDate: e.target.value })
              }
              className="bg-[#1e293b] text-white px-3 py-2 rounded border border-gray-600"
            />

            <input
              type="text"
              placeholder="Work Location"
              value={employeeData.location}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, location: e.target.value })
              }
              className="bg-[#1e293b] text-white px-3 py-2 rounded border border-gray-600"
            />

            <select
              value={employeeData.employmentType}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, employmentType: e.target.value })
              }
              className="bg-[#1e293b] text-white px-3 py-2 rounded border border-gray-600 col-span-2"
            >
              <option>Full-Time</option>
              <option>Contract</option>
              <option>Intern</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsConvertModalOpen(false)}
              className="bg-gray-600 px-3 py-1 rounded"
            >
              Cancel
            </button>
            <button
              onClick={confirmConvert}
              className="bg-green-600 px-3 py-1 rounded"
            >
              Confirm Convert
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};

export default CandidateManagement;