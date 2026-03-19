"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/contexts/RoleContext"
import { useNavigate } from "react-router-dom"
import { reviewApi } from "@/services/reviewApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { FileText, Search, Plus } from "lucide-react"
import { toast } from "sonner"
import SubmitReviewModal from "@/components/performance/SubmitReviewModal";

const Appraisal = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Appraisal</h1>
        <p className="text-muted-foreground">Manage and conduct performance reviews for your team</p>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Appraisal History</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <AppraisalHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const AppraisalHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch reviews on mount
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true)
        const res = await reviewApi.getAllReviews({ reviewerId: user.id })
        setReviews(res.data || [])
      } catch (error) {
        toast.error("Failed to load appraisal history")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id) fetchReviews()
  }, [user.id])

  // Filter logic for search bar
  const filteredReviews = reviews.filter((review) =>
    review.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleViewDetails = (reviewId) => {
    navigate(`/role/hr_manager/review/${reviewId}`)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Appraisal History</CardTitle>
          <CardDescription>View and manage performance appraisals</CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or ID..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Submit Review
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
            <div>Employee</div>
            <div>Employee ID</div>
            <div>Department</div>
            <div>Period</div>
            <div>Rating</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading reviews...</div>
            ) : filteredReviews.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No appraisals found.</div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review._id} className="grid grid-cols-7 p-3 text-sm items-center">
                  <div className="font-medium">{review.employeeName}</div>
                  <div>{review.employeeId}</div>
                  <div>{review.department}</div>
                  <div>{review.appraisalPeriod}</div>
                  <div className="capitalize">{review.performanceRating}</div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        review.status === "Approved"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : review.status === "Rejected"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {review.status || "Pending"}
                    </span>
                  </div>
                  <div className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleViewDetails(review._id)}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>

      <SubmitReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
            // Refresh logic here if needed
            setIsModalOpen(false)
        }}
      />
    </Card>
  )
}

export default Appraisal