import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import { 
  GripVertical, ChevronDown, ChevronUp, Trash2, Plus, 
  Settings, Zap, FileText, CheckCircle, Video, Star, FileSearch, ArrowRight
} from "lucide-react";

export default function WorkflowBuilder({
  stages = [],
  scoringFormula = 'weighted_average',
  autoProgressionEnabled = false,
  onChange,
  readOnly = false
}) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [expandedStageId, setExpandedStageId] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await apiClient.get('/job-openings/workflow-templates');
        if (res.data?.success) {
          setTemplates(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch workflow templates', err);
      }
    };
    fetchTemplates();
  }, []);

  const handleTemplateSelect = (e) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    if (!id) return;
    const template = templates.find(t => t.id === id || t._id === id);
    if (template) {
      onChange({
        stages: template.stages,
        scoringFormula: template.scoringFormula || 'weighted_average',
        autoProgressionEnabled: template.autoProgressionEnabled || false
      });
    }
  };

  const notifyChange = (newStages, newFormula = scoringFormula, newAuto = autoProgressionEnabled) => {
    onChange({ stages: newStages, scoringFormula: newFormula, autoProgressionEnabled: newAuto });
  };

  const updateStage = (index, field, value) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    if (field === 'name') {
      newStages[index].key = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    notifyChange(newStages);
  };

  const addStage = () => {
    const newStage = {
      key: 'custom_stage',
      name: 'Custom Stage',
      type: 'Custom',
      enabled: true,
      weightage: 10,
      config: {}
    };
    notifyChange([...stages, newStage]);
  };

  const removeStage = (index) => {
    const newStages = stages.filter((_, i) => i !== index);
    notifyChange(newStages);
  };

  const moveStage = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newStages = [...stages];
      const temp = newStages[index];
      newStages[index] = newStages[index - 1];
      newStages[index - 1] = temp;
      notifyChange(newStages);
    } else if (direction === 'down' && index < stages.length - 1) {
      const newStages = [...stages];
      const temp = newStages[index];
      newStages[index] = newStages[index + 1];
      newStages[index + 1] = temp;
      notifyChange(newStages);
    }
  };

  const updateConfig = (index, configField, value) => {
    const newStages = [...stages];
    newStages[index] = {
      ...newStages[index],
      config: {
        ...(newStages[index].config || {}),
        [configField]: value
      }
    };
    notifyChange(newStages);
  };

  const totalWeightage = stages.filter(s => s.enabled).reduce((sum, s) => sum + Number(s.weightage || 0), 0);

  const getStageIcon = (type) => {
    switch (type) {
      case 'Screening': return <FileSearch className="w-4 h-4" />;
      case 'Assignment': return <FileText className="w-4 h-4" />;
      case 'Interview': return <Video className="w-4 h-4" />;
      case 'Review': return <Star className="w-4 h-4" />;
      case 'Offer': return <CheckCircle className="w-4 h-4" />;
      case 'BGV': return <FileSearch className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      {!readOnly && (
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <Label className="text-sm font-semibold min-w-[120px]">Load Template:</Label>
          <select 
            value={selectedTemplateId} 
            onChange={handleTemplateSelect}
            className="flex-1 h-10 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm cursor-pointer"
          >
            <option value="">-- Select a Preset Workflow --</option>
            {templates.map(t => (
              <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Visual Pipeline Preview */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-x-auto border border-slate-200 dark:border-slate-800">
        {stages.map((stage, idx) => (
          <React.Fragment key={idx}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
              stage.enabled 
                ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}>
              {getStageIcon(stage.type)}
              {stage.name}
            </div>
            {idx < stages.length - 1 && (
              <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            )}
          </React.Fragment>
        ))}
        {stages.length === 0 && <span className="text-sm text-slate-400">No stages defined</span>}
      </div>

      {/* Stage List */}
      <div className="space-y-3">
        {stages.map((stage, idx) => (
          <Card key={idx} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 gap-3 bg-white dark:bg-slate-950">
              {/* Reorder */}
              {!readOnly && (
                <div className="flex flex-col items-center justify-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer" disabled={idx === 0} onClick={() => moveStage(idx, 'up')}>
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer" disabled={idx === stages.length - 1} onClick={() => moveStage(idx, 'down')}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Basic Info */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 w-full">
                <div className="sm:col-span-4">
                  <Input 
                    value={stage.name} 
                    onChange={e => updateStage(idx, 'name', e.target.value)} 
                    placeholder="Stage Name"
                    disabled={readOnly}
                    className="h-9 cursor-text"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select 
                    value={stage.type} 
                    onChange={e => updateStage(idx, 'type', e.target.value)}
                    disabled={readOnly}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-sm cursor-pointer"
                  >
                    {['Screening', 'Assignment', 'Interview', 'Review', 'Offer', 'BGV', 'Custom'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-center justify-center gap-2">
                  <Label className="text-xs">Enabled</Label>
                  <Switch 
                    checked={stage.enabled} 
                    onCheckedChange={v => updateStage(idx, 'enabled', v)} 
                    disabled={readOnly}
                    className="cursor-pointer"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center gap-2">
                  <Label className="text-xs">Wt (%)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={stage.weightage} 
                    onChange={e => updateStage(idx, 'weightage', Number(e.target.value))}
                    disabled={readOnly}
                    className="h-9 cursor-text"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-2 sm:mt-0 self-end sm:self-auto">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 cursor-pointer text-slate-500 hover:text-blue-500" 
                  onClick={() => setExpandedStageId(expandedStageId === idx ? null : idx)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                {!readOnly && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 cursor-pointer text-slate-500 hover:text-red-500" 
                    onClick={() => removeStage(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Config Section */}
            {expandedStageId === idx && (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                {stage.type === 'Interview' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Interview Type</Label>
                      <select 
                        value={stage.config?.interviewType || ''} 
                        onChange={e => updateConfig(idx, 'interviewType', e.target.value)}
                        disabled={readOnly}
                        className="w-full h-8 px-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-sm cursor-pointer"
                      >
                        <option value="">Select...</option>
                        <option value="Technical">Technical</option>
                        <option value="HR">HR</option>
                        <option value="Managerial">Managerial</option>
                        <option value="Behavioral">Behavioral</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Passing Score (1-5)</Label>
                      <Input 
                        type="number" min="1" max="5" 
                        value={stage.config?.passingScore || ''} 
                        onChange={e => updateConfig(idx, 'passingScore', Number(e.target.value))}
                        disabled={readOnly}
                        className="h-8 cursor-text"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Required Skills (comma-separated)</Label>
                      <Input 
                        value={stage.config?.requiredSkills || ''} 
                        onChange={e => updateConfig(idx, 'requiredSkills', e.target.value)}
                        disabled={readOnly}
                        className="h-8 cursor-text"
                        placeholder="React, Node.js, Problem Solving"
                      />
                    </div>
                  </>
                )}
                {stage.type === 'Assignment' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Assignment Template Name</Label>
                      <Input 
                        value={stage.config?.templateName || ''} 
                        onChange={e => updateConfig(idx, 'templateName', e.target.value)}
                        disabled={readOnly}
                        className="h-8 cursor-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Deadline Days</Label>
                      <Input 
                        type="number" min="1" 
                        value={stage.config?.deadlineDays || ''} 
                        onChange={e => updateConfig(idx, 'deadlineDays', Number(e.target.value))}
                        disabled={readOnly}
                        className="h-8 cursor-text"
                      />
                    </div>
                  </>
                )}
                {stage.type === 'BGV' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs mb-2 block">Background Checks Required</Label>
                    <div className="flex flex-wrap gap-4">
                      {['identity', 'education', 'employment', 'criminal'].map(check => (
                        <label key={check} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={stage.config?.[check] || false}
                            onChange={e => updateConfig(idx, check, e.target.checked)}
                            disabled={readOnly}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                          />
                          <span className="capitalize">{check}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-2 md:col-span-2">
                  <Switch 
                    checked={stage.config?.autoProgress || false} 
                    onCheckedChange={v => updateConfig(idx, 'autoProgress', v)}
                    disabled={readOnly}
                    className="cursor-pointer"
                  />
                  <Label className="text-xs">Auto-progress to next stage if passed</Label>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {!readOnly && (
        <Button 
          variant="outline" 
          onClick={addStage}
          className="w-full border-dashed border-2 border-slate-300 dark:border-slate-700 text-slate-500 hover:text-cyan-600 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 cursor-pointer h-12"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Stage
        </Button>
      )}

      {/* Scoring Config */}
      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Scoring Formula</Label>
            <select 
              value={scoringFormula} 
              onChange={e => notifyChange(stages, e.target.value, autoProgressionEnabled)}
              disabled={readOnly}
              className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm cursor-pointer"
            >
              <option value="weighted_average">Weighted Average</option>
              <option value="pass_fail">Pass/Fail</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch 
              checked={autoProgressionEnabled} 
              onCheckedChange={v => notifyChange(stages, scoringFormula, v)}
              disabled={readOnly}
              className="cursor-pointer"
            />
            <Label className="text-sm font-semibold">Master Auto-Progression</Label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Total Weightage</span>
            <span className={`font-bold ${totalWeightage === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {totalWeightage}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            {stages.filter(s => s.enabled).map((s, i) => (
              <div 
                key={i} 
                className="h-full border-r border-white/20 last:border-0"
                style={{ 
                  width: `${(s.weightage / Math.max(totalWeightage, 100)) * 100}%`,
                  backgroundColor: `hsl(${(i * 45) % 360}, 70%, 50%)`
                }}
                title={`${s.name}: ${s.weightage}%`}
              />
            ))}
          </div>
          {totalWeightage !== 100 && !readOnly && (
            <p className="text-xs text-amber-500 font-medium">
              Note: Total weightage is {totalWeightage}%. It is recommended to equal exactly 100%.
            </p>
          )}
          {stages.filter(s => s.enabled).length === 0 && !readOnly && (
            <p className="text-xs text-red-500 font-medium">
              Warning: At least one stage must be enabled.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
