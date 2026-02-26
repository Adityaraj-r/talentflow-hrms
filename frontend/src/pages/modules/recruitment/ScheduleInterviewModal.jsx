import { useState } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Video, Loader2, Copy, Check } from "lucide-react"
import { toast } from "sonner"
// Path: goes up 3 levels (recruitment -> modules -> pages -> src)
import googleMeetService from "@/services/googleMeetService"

const ScheduleInterviewModal = ({ isOpen, onClose, candidateEmail, jobTitle }) => {
  const [loading, setLoading] = useState(false)
  const [meetLink, setMeetLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    summary: `Interview: ${jobTitle} - Candidate`,
    description: "Technical interview round via Google Meet.",
    date: "",
    startTime: "",
    endTime: ""
  })

  const handleGenerate = async () => {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error("Please select a valid date and time")
      return
    }

    setLoading(true)
    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`).toISOString()
      const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`).toISOString()

      const response = await googleMeetService.createMeeting({
        summary: formData.summary,
        description: formData.description,
        startDateTime,
        endDateTime,
        attendees: [candidateEmail]
      })

      if (response.success || response.meetLink) {
        setMeetLink(response.meetLink)
        toast.success("Meeting created successfully!")
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate link")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Link copied")
  }

  const handleClose = () => {
    setMeetLink("")
    setFormData({ 
      summary: `Interview: ${jobTitle} - Candidate`, 
      description: "Technical interview round via Google Meet.", 
      date: "", 
      startTime: "", 
      endTime: "" 
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            Schedule Interview
          </DialogTitle>
        </DialogHeader>

        {!meetLink ? (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Summary</Label>
              <Input 
                value={formData.summary}
                onChange={(e) => setFormData({...formData, summary: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    className="pl-9" 
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Time</Label>
                <div className="flex gap-2">
                  <Input 
                    type="time" 
                    value={formData.startTime} 
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})} 
                  />
                  <Input 
                    type="time" 
                    value={formData.endTime} 
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})} 
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="h-20"
              />
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">Interview Scheduled</h3>
            <div className="flex items-center gap-2 w-full max-w-sm">
              <Input value={meetLink} readOnly className="bg-muted" />
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!meetLink && (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ScheduleInterviewModal