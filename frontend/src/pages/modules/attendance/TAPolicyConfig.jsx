import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Save, Clock, AlertCircle, RefreshCcw, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const TAPolicyConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policies, setPolicies] = useState({
    lateGracePeriodMins: 15,
    standardWorkHours: 9,
    maxMissedPunches: 3,
    halfDayLateThresholdMins: 120,
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/ta-policies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        setPolicies(data.data);
      }
    } catch (error) {
      toast.error('Failed to load Attendance Policies');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPolicies(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/ta-policies`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(policies)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Time & Attendance Policies updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update policies');
      }
    } catch (error) {
      toast.error('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Section matching your other pages */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Time & Attendance Policies
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure organization-wide rules for grace periods, overtime thresholds, and attendance corrections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border px-6 py-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Global Parameters</h3>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-8">
                
                {/* Section 1: Daily Timing */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Daily Timing Rules</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="lateGracePeriodMins" className="flex justify-between">
                        <span>Late-In Grace Period</span>
                        <span className="text-xs text-muted-foreground">Minutes</span>
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="lateGracePeriodMins"
                          name="lateGracePeriodMins"
                          type="number" 
                          min="0"
                          className="pl-9 bg-background"
                          value={policies.lateGracePeriodMins}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <p className="text-[0.8rem] text-muted-foreground mt-1">
                        Buffer time after shift start before marking 'Late'.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="halfDayLateThresholdMins" className="flex justify-between">
                        <span>Half-Day Deduction Threshold</span>
                        <span className="text-xs text-muted-foreground">Minutes</span>
                      </Label>
                      <div className="relative">
                        <AlertCircle className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="halfDayLateThresholdMins"
                          name="halfDayLateThresholdMins"
                          type="number" 
                          min="0"
                          className="pl-9 bg-background"
                          value={policies.halfDayLateThresholdMins}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <p className="text-[0.8rem] text-muted-foreground mt-1">
                        Minutes late before triggering an automatic half-day leave.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Overtime & Corrections */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Calculations & Corrections</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="standardWorkHours" className="flex justify-between">
                        <span>Overtime Threshold</span>
                        <span className="text-xs text-muted-foreground">Hours</span>
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="standardWorkHours"
                          name="standardWorkHours"
                          type="number" 
                          min="1"
                          step="0.5"
                          className="pl-9 bg-background"
                          value={policies.standardWorkHours}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <p className="text-[0.8rem] text-muted-foreground mt-1">
                        Required standard hours before OT begins.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxMissedPunches" className="flex justify-between">
                        <span>Max Manual Corrections</span>
                        <span className="text-xs text-muted-foreground">Per Month</span>
                      </Label>
                      <div className="relative">
                        <RefreshCcw className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="maxMissedPunches"
                          name="maxMissedPunches"
                          type="number" 
                          min="0"
                          className="pl-9 bg-background"
                          value={policies.maxMissedPunches}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <p className="text-[0.8rem] text-muted-foreground mt-1">
                        Limit for employee-requested attendance corrections.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Footer */}
              <div className="bg-muted/50 px-6 py-4 border-t border-border flex justify-end rounded-b-lg">
                <Button type="submit" disabled={saving} className="min-w-[140px]">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Policies
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Info Sidebar Panel */}
        <div className="space-y-6">
          <Card className="p-6 border-border bg-card shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Impact Warning
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Modifying these policies will instantly affect all future attendance calculations across the organization.
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li>Overtime rules are tied directly to payroll processing.</li>
                <li>Lowering the grace period may trigger retroactive alerts for staff currently in transit.</li>
              </ul>
              <div className="p-3 mt-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20">
                Ensure you communicate policy changes to Department Managers before saving.
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default TAPolicyConfig;