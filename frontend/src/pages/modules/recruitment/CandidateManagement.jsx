import { useState, useEffect } from "react";

const getToken = () => localStorage.getItem("token");

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
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

  const safeCandidates = Array.isArray(candidates) ? candidates : [];

  const stageCounts = {
    Applied:   safeCandidates.filter(c => c.stage === "Applied").length,
    Screening: safeCandidates.filter(c => c.stage === "Screening").length,
    Interview: safeCandidates.filter(c => c.stage === "Interview").length,
    Offer:     safeCandidates.filter(c => c.stage === "Offer").length,
    Hired:     safeCandidates.filter(c => c.stage === "Hired").length,
    Rejected:  safeCandidates.filter(c => c.stage === "Rejected").length,
  };

  const stageColors = {
    Applied:   "bg-blue-500/15 text-blue-500 border-blue-500/30",
    Screening: "bg-purple-500/15 text-purple-500 border-purple-500/30",
    Interview: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
    Offer:     "bg-orange-500/15 text-orange-500 border-orange-500/30",
    Hired:     "bg-green-500/15 text-green-500 border-green-500/30",
    Rejected:  "bg-red-500/15 text-red-500 border-red-500/30",
  };

  const getFullName = (c) => `${c.firstName || ""} ${c.lastName || ""}`.trim() || "—";

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5001/api/candidates", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setCandidates(
        Array.isArray(data.data) ? data.data
        : Array.isArray(data) ? data
        : []
      );
    } catch (error) {
      console.error("Error fetching candidates:", error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleStageChange = async (id, newStage) => {
    try {
      await fetch(`http://localhost:5001/api/candidates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ stage: newStage })
      });
      setCandidates(prev =>
        prev.map(c => c._id === id ? { ...c, stage: newStage } : c)
      );
    } catch (error) {
      console.error("Stage update error:", error);
    }
  };

  const confirmReject = async () => {
    if (!rejectReason) { alert("Please select a reason"); return; }
    try {
      await fetch(`http://localhost:5001/api/candidates/${selectedCandidateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ stage: "Rejected", rejectReason })
      });
      setCandidates(prev =>
        prev.map(c => c._id === selectedCandidateId ? { ...c, stage: "Rejected", rejectReason } : c)
      );
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

  const filtered = safeCandidates.filter((c) => {
    const name = getFullName(c).toLowerCase();
    const position = (c.position || "").toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || position.includes(search.toLowerCase());
    const matchesStage = stageFilter === "All" || c.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold">Candidate Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Track and manage all recruitment candidates</p>
        </div>

        {/* Stage Stats */}
        <div className="grid grid-cols-6 gap-3">
          {Object.entries(stageCounts).map(([stage, count]) => (
            <div
              key={stage}
              onClick={() => setStageFilter(stageFilter === stage ? "All" : stage)}
              className={`rounded-xl border p-4 text-center cursor-pointer transition-all hover:scale-105 ${stageColors[stage]}`}
            >
              <p className="text-xs font-medium opacity-80">{stage}</p>
              <p className="text-2xl font-bold mt-1">{count}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search candidate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background border rounded-lg px-4 py-2 w-72 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-background border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="All">All Stages</option>
            {Object.keys(stageCounts).map(s => (
              <option key={s} value={s}>{s}</option>
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
                <th className="px-6 py-3">Experience</th>
                <th className="px-6 py-3">Stage</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    {search || stageFilter !== "All"
                      ? "No candidates match your filters."
                      : "No candidates yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((candidate) => (
                  <tr key={candidate._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{getFullName(candidate)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{candidate.position || "—"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{candidate.experience || "—"}</td>
                    <td className="px-6 py-4">
                      <select
                        value={candidate.stage || "Applied"}
                        onChange={(e) => handleStageChange(candidate._id, e.target.value)}
                        className={`text-xs rounded-full px-3 py-1 border font-medium bg-transparent cursor-pointer ${stageColors[candidate.stage] || ""}`}
                      >
                        {Object.keys(stageCounts).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedCandidate(candidate); setIsViewModalOpen(true); }}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                        >
                          View
                        </button>
                        {candidate.stage !== "Rejected" && (
                          <button
                            onClick={() => { setSelectedCandidateId(candidate._id); setIsRejectModalOpen(true); }}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                          >
                            Reject
                          </button>
                        )}
                        {candidate.stage === "Hired" && (
                          <button
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setEmployeeData({
                                employeeId: "EMP" + Math.floor(1000 + Math.random() * 9000),
                                department: "", reportingManager: "",
                                salary: "", joiningDate: "",
                                location: "", employmentType: "Full-Time"
                              });
                              setIsConvertModalOpen(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                          >
                            Convert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Candidate Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["First Name",  selectedCandidate.firstName || "—"],
                ["Last Name",   selectedCandidate.lastName  || "—"],
                ["Email",       selectedCandidate.email     || "—"],
                ["Phone",       selectedCandidate.phone     || "—"],
                ["Position",    selectedCandidate.position  || "—"],
                ["Experience",  selectedCandidate.experience|| "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Stage</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${stageColors[selectedCandidate.stage] || ""}`}>
                  {selectedCandidate.stage}
                </span>
              </div>
              {selectedCandidate.rejectReason && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reject Reason</span>
                  <span className="font-medium text-red-500">{selectedCandidate.rejectReason}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-2xl p-6 w-96 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold">Reject Candidate</h3>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="px-4 py-2 rounded-lg border text-sm hover:bg-muted transition-colors"
              >Cancel</button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {isConvertModalOpen && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-2xl p-6 w-[500px] shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold">Convert to Employee</h3>
            <p className="text-sm text-muted-foreground">
              Candidate: <span className="font-medium text-foreground">{getFullName(selectedCandidate)}</span>
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <input type="text" value={employeeData.employeeId} disabled
                className="bg-muted border rounded-lg px-3 py-2 text-muted-foreground" />
              <input type="text" placeholder="Department" value={employeeData.department}
                onChange={(e) => setEmployeeData({ ...employeeData, department: e.target.value })}
                className="bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="text" placeholder="Reporting Manager" value={employeeData.reportingManager}
                onChange={(e) => setEmployeeData({ ...employeeData, reportingManager: e.target.value })}
                className="bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="number" placeholder="Salary" value={employeeData.salary}
                onChange={(e) => setEmployeeData({ ...employeeData, salary: e.target.value })}
                className="bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="date" value={employeeData.joiningDate}
                onChange={(e) => setEmployeeData({ ...employeeData, joiningDate: e.target.value })}
                className="bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="text" placeholder="Work Location" value={employeeData.location}
                onChange={(e) => setEmployeeData({ ...employeeData, location: e.target.value })}
                className="bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              <select value={employeeData.employmentType}
                onChange={(e) => setEmployeeData({ ...employeeData, employmentType: e.target.value })}
                className="bg-background border rounded-lg px-3 py-2 col-span-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Full-Time</option>
                <option>Contract</option>
                <option>Intern</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsConvertModalOpen(false)}
                className="px-4 py-2 rounded-lg border text-sm hover:bg-muted transition-colors">Cancel</button>
              <button onClick={confirmConvert}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
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
