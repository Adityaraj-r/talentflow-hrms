import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

const OfferManagement = () => {
  const [search, setSearch] = useState("");
  const [offers, setOffers] = useState(() => {
    const stored = localStorage.getItem("offers");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("offers", JSON.stringify(offers));
  }, [offers]);

  const location = useLocation();
  const navigate = useNavigate();
  const { offerId } = useParams();

  const isGeneratePage = location.pathname === "/dashboard/generate-offer";
  const isDetailsPage = location.pathname.startsWith("/dashboard/offer/");

  const filteredOffers = offers.filter((offer) =>
    offer.candidateName.toLowerCase().includes(search.toLowerCase())
  );

  const totalOffers = offers.length;
  const offeredCount = offers.filter(o => o.status === "Offered").length;
  const acceptedCount = offers.filter(o => o.status === "Accepted").length;
  const declinedCount = offers.filter(o => o.status === "Declined").length;
  const acceptanceRate = totalOffers > 0
    ? ((acceptedCount / totalOffers) * 100).toFixed(1)
    : 0;

  const handleStatusUpdate = (id, newStatus) => {
    setOffers(prev =>
      prev.map(o => o.offerId === id ? { ...o, status: newStatus } : o)
    );
    navigate("/dashboard/offer-management");
  };

  return (
    <div className="space-y-6">

      {/* GENERATE OFFER PAGE */}
      {isGeneratePage && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const newOffer = {
                  offerId: "OFF" + Date.now(),
                  candidateName: form.candidateName.value,
                  salary: form.salary.value,
                  joiningDate: form.joiningDate.value,
                  status: "Offered",
                  createdAt: new Date().toISOString(),
                };
                setOffers(prev => [newOffer, ...prev]);
                navigate("/dashboard/offer-management");
              }}
              className="space-y-4"
            >
              <Input name="candidateName" placeholder="Candidate Name" required />
              <Input name="salary" type="number" placeholder="Final Salary" required />
              <Input name="joiningDate" type="date" required />
              <Button type="submit" className="w-full">Generate Offer</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* OFFER DETAILS PAGE */}
      {isDetailsPage && (() => {
        const offer = offers.find(o => o.offerId === offerId);
        if (!offer) return <div className="text-muted-foreground">Offer Not Found</div>;
        return (
          <Card>
            <CardHeader>
              <CardTitle>Offer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><strong>Candidate:</strong> {offer.candidateName}</div>
              <div><strong>Salary:</strong> ₹{offer.salary}</div>
              <div><strong>Joining Date:</strong> {offer.joiningDate}</div>
              <div><strong>Status:</strong> {offer.status}</div>
              {offer.status === "Offered" && (
                <div className="flex gap-4">
                  <Button onClick={() => handleStatusUpdate(offer.offerId, "Accepted")}>
                    Accept
                  </Button>
                  <Button variant="destructive" onClick={() => handleStatusUpdate(offer.offerId, "Declined")}>
                    Decline
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={() => window.print()}>
                Download PDF
              </Button>
            </CardContent>
          </Card>
        );
      })()}

      {/* MAIN OFFER LIST PAGE */}
      {!isGeneratePage && !isDetailsPage && (
        <>
          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Total Offers</p>
                <h3 className="text-2xl font-bold">{totalOffers}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Offered</p>
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
              <Link to="/dashboard/generate-offer">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Generate Offer
                </Button>
              </Link>
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
                <p className="text-muted-foreground text-sm">No offers available</p>
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
                  {filteredOffers.map((offer, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-6 px-6 py-4 items-center border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <div className="text-sm font-mono">{offer.offerId}</div>
                      <div className="text-sm font-medium">{offer.candidateName}</div>
                      <div className="text-sm">₹{offer.salary}</div>
                      <div className="text-sm">{offer.joiningDate}</div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          offer.status === "Offered"
                            ? "bg-blue-500/10 text-blue-500"
                            : offer.status === "Accepted"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {offer.status}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <Link to={`/dashboard/offer/${offer.offerId}`}>
                          <Button size="sm" variant="outline">View</Button>
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
