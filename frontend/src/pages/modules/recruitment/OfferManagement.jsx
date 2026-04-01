import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";

const OfferManagement = () => {
  const { user } = useUser();
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name;
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_");
  const isOperationsManager = role === "OPERATIONS_MANAGER";
  const isCeo = role === "CEO";
  const canWrite = user?.can?.("recruitment", "write") && !isOperationsManager;
  const [search, setSearch] = useState("");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const singleOfferFetchAttemptedFor = useRef(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/offers");
      const list = res?.data ?? res ?? [];
      setOffers(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Could not load offers");
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const location = useLocation();
  const navigate = useNavigate();
  const { offerId } = useParams();

  const isGeneratePage = location.pathname === "/dashboard/generate-offer";
  const isDetailsPage = location.pathname.startsWith("/dashboard/offer/");

  const filteredOffers = offers.filter((offer) =>
    (offer.candidateName || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalOffers = offers.length;
  const offeredCount = offers.filter((o) => o.status === "Offered").length;
  const pendingCeoCount = offers.filter((o) => o.status === "Pending CEO Approval").length;
  const acceptedCount = offers.filter((o) => o.status === "Accepted").length;
  const declinedCount = offers.filter((o) => o.status === "Declined").length;
  const acceptanceRate =
    totalOffers > 0 ? ((acceptedCount / totalOffers) * 100).toFixed(1) : 0;

  const handleStatusUpdate = async (mongoId, newStatus) => {
    try {
      await apiClient.patch(`/offers/${mongoId}/status`, { status: newStatus });
      toast.success("Offer updated");
      await loadOffers();
      navigate("/dashboard/offer-management");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Update failed");
    }
  };

  const handleCeoApprove = async (mongoId) => {
    try {
      await apiClient.put(`/offers/${mongoId}/ceo-approve`);
      toast.success("Offer released");
      await loadOffers();
      navigate("/dashboard/offer-management");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Approval failed");
    }
  };

  const findOffer = (id) =>
    offers.find((o) => o._id === id || o.offerId === id);

  useEffect(() => {
    singleOfferFetchAttemptedFor.current = null;
  }, [offerId]);

  useEffect(() => {
    if (!isDetailsPage || !offerId || loading) return;
    if (findOffer(offerId)) return;
    if (singleOfferFetchAttemptedFor.current === offerId) return;
    singleOfferFetchAttemptedFor.current = offerId;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/offers/${offerId}`);
        const o = res?.data;
        if (cancelled || !o || Array.isArray(o)) return;
        setOffers((prev) => (prev.some((p) => p._id === o._id) ? prev : [...prev, o]));
      } catch {
        toast.error("Could not load this offer");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDetailsPage, offerId, loading, offers]);

  return (
    <div className="space-y-6">
      {isGeneratePage && !canWrite && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Offer</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            View only — generating and updating offers is restricted to authorized HR roles.
          </CardContent>
        </Card>
      )}

      {isGeneratePage && canWrite && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                try {
                  await apiClient.post("/offers", {
                    candidateName: form.candidateName.value,
                    salary: Number(form.salary.value),
                    joiningDate: form.joiningDate.value,
                  });
                  toast.success("Offer created");
                  await loadOffers();
                  navigate("/dashboard/offer-management");
                } catch (err) {
                  toast.error("Failed to create offer");
                }
              }}
              className="space-y-4"
            >
              <Input name="candidateName" placeholder="Candidate Name" required />
              <Input name="salary" type="number" placeholder="Final Salary" required />
              <Input name="joiningDate" type="date" required />
              <p className="text-xs text-muted-foreground">
                Offers at or above the CEO salary threshold require CEO approval before they are released.
              </p>
              <Button type="submit" className="w-full">
                Generate Offer
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isDetailsPage &&
        (() => {
          const offer = findOffer(offerId);
          if (!offer) {
            return loading ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : (
              <div className="text-muted-foreground">Offer not found</div>
            );
          }
          return (
            <Card>
              <CardHeader>
                <CardTitle>Offer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Candidate:</strong> {offer.candidateName}
                </div>
                <div>
                  <strong>Salary:</strong> ₹{offer.salary}
                </div>
                <div>
                  <strong>Joining Date:</strong> {offer.joiningDate}
                </div>
                <div>
                  <strong>Status:</strong> {offer.status}
                </div>
                {isCeo && offer.status === "Pending CEO Approval" && (
                  <Button onClick={() => handleCeoApprove(offer._id)}>CEO approve & release</Button>
                )}
                {canWrite && offer.status === "Offered" && (
                  <div className="flex gap-4">
                    <Button onClick={() => handleStatusUpdate(offer._id, "Accepted")}>Accept</Button>
                    <Button variant="destructive" onClick={() => handleStatusUpdate(offer._id, "Declined")}>
                      Decline
                    </Button>
                  </div>
                )}
                {offer.status === "Pending CEO Approval" && !isCeo && (
                  <p className="text-sm text-muted-foreground">Awaiting CEO approval.</p>
                )}
                <Button variant="outline" onClick={() => window.print()}>
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          );
        })()}

      {!isGeneratePage && !isDetailsPage && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Total Offers</p>
                <h3 className="text-2xl font-bold">{loading ? "—" : totalOffers}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Pending CEO</p>
                <h3 className="text-2xl font-bold text-amber-600">{pendingCeoCount}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Released</p>
                <h3 className="text-2xl font-bold text-blue-500">{offeredCount}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Accepted</p>
                <h3 className="text-2xl font-bold text-green-500">{acceptedCount}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Declined</p>
                <h3 className="text-2xl font-bold text-red-500">{declinedCount}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                <h3 className="text-2xl font-bold text-purple-500">{acceptanceRate}%</h3>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex justify-between items-center py-6">
              <div>
                <h3 className="text-lg font-semibold">Offer Management</h3>
                <p className="text-sm text-muted-foreground">Track and manage all offers</p>
              </div>
              {canWrite && (
                <Link to="/dashboard/generate-offer">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Generate Offer</Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Input
                  placeholder="Search candidate..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64"
                />
                <span className="text-sm text-muted-foreground">Total: {offers.length}</span>
              </div>

              {filteredOffers.length === 0 ? (
                <p className="text-muted-foreground text-sm">{loading ? "Loading…" : "No offers available"}</p>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <div className="grid grid-cols-6 px-6 py-3 text-xs uppercase text-muted-foreground border-b bg-muted/50">
                    <div>Offer ID</div>
                    <div>Candidate</div>
                    <div>Salary</div>
                    <div>Joining Date</div>
                    <div>Status</div>
                    <div className="text-right">Actions</div>
                  </div>
                  {filteredOffers.map((offer) => (
                    <div
                      key={offer._id || offer.offerId}
                      className="grid grid-cols-6 px-6 py-4 items-center border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <div className="text-sm font-mono">{offer.offerId}</div>
                      <div className="text-sm font-medium">{offer.candidateName}</div>
                      <div className="text-sm">₹{offer.salary}</div>
                      <div className="text-sm">{offer.joiningDate}</div>
                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            offer.status === "Pending CEO Approval"
                              ? "bg-amber-500/10 text-amber-600"
                              : offer.status === "Offered"
                              ? "bg-blue-500/10 text-blue-500"
                              : offer.status === "Accepted"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {offer.status}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <Link to={`/dashboard/offer/${offer._id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default OfferManagement;
