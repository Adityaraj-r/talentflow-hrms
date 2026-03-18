"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { reviewApi } from "@/services/reviewApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

const Appraisal = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Appraisal</h1>
        <p className="text-muted-foreground">View your performance appraisal history and self-assessments</p>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="history">Appraisal History</TabsTrigger>
          <TabsTrigger value="self">Self Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <AppraisalHistory />
        </TabsContent>

        <TabsContent value="self">
          <Card>
            <CardHeader>
              <CardTitle>Self Assessment</CardTitle>
              <CardDescription>Reflect on your performance for the current period</CardDescription>
            </CardHeader>
            <CardContent className="h-40 flex items-center justify-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground font-medium">Self-assessment coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const AppraisalHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchMyReviews = async () => {
      try {
        setLoading(true)
        const res = await reviewApi.getEmployeeReviews(user.id)
        setReviews(res.data || [])
      } catch (error) {
        console.error("Error fetching reviews:", error)
        toast.error("Failed to load your review history")
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchMyReviews()
    }
  }, [user.id])

  const filteredReviews = reviews.filter((r) =>
    r.appraisalPeriod?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.performanceRating?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.status?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Reviews</CardTitle>
          <CardDescription>Historical record of your performance evaluations</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Filter by period..." 
              className="pl-8 w-[200px]" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-5 bg-muted/50 p-3 text-sm font-medium">
            <div>Period</div>
            <div>Rating</div>
            <div>Reviewer</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          
          <div className="divide-y">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-5 p-3 items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-8 ml-auto" />
                </div>
              ))
            ) : filteredReviews.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your reviews...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No reviews yet
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review._id} className="grid grid-cols-5 p-3 text-sm items-center">
                  <div className="font-medium">{review.appraisalPeriod}</div>
                  <div className="capitalize">{review.performanceRating}</div>
                  <div>{review.reviewerName || "Manager"}</div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        review.status === "Approved"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
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
                      onClick={() => navigate(`/role/EMPLOYEE/review/${review._id}`)}
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
    </Card>
  )
}

export default Appraisal