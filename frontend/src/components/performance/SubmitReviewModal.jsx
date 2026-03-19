"use client"

import React, { useState, useEffect } from "react";
import { X, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { reviewApi } from "@/services/reviewApi";

const SubmitReviewModal = ({ isOpen, onClose, review, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [competencies, setCompetencies] = useState([]);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');

  useEffect(() => {
    if (review?.competencies?.length > 0) {
      setCompetencies(review.competencies.map(c => ({ 
        ...c, 
        rating: c.rating || 1, 
        comments: c.comments || '' 
      })));
      // Task 6.1: Reset strengths and improvements when the review changes
      setStrengths(review.strengths || '');
      setImprovements(review.areasForImprovement || '');
    }
  }, [review]);

  // Task 6.2: Fix 0/5 flash by checking competencies length
  const overallRating = competencies.length > 0
    ? parseFloat((competencies.reduce((sum, c) => sum + c.rating, 0) / competencies.length).toFixed(2))
    : 0;

  const handleRatingChange = (index, rating) => {
    setCompetencies(prev => prev.map((c, i) => i === index ? { ...c, rating } : c));
  };

  const handleCommentChange = (index, comments) => {
    setCompetencies(prev => prev.map((c, i) => i === index ? { ...c, comments } : c));
  };

  const handleSubmit = async () => {
    if (!strengths.trim()) return toast.error('Please enter strengths');
    if (!improvements.trim()) return toast.error('Please enter areas for improvement');

    try {
      setSubmitting(true);
      await reviewApi.submitReview(review._id, {
        competencies,
        overallRating,
        strengths,
        improvements
      });
      toast.success('Review submitted successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submit Review</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Employee: <span className="font-medium text-gray-700 dark:text-gray-300">
                {review.employeeId?.firstName} {review.employeeId?.lastName}
              </span>
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={submitting}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Overall Rating Preview */}
          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Rating (auto-calculated)</span>
            {/* Task 6.2: Conditional render to avoid 0/5 flash */}
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {competencies.length > 0 ? `${overallRating}/5` : '—'}
            </span>
          </div>

          {/* Competency Ratings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Competency Ratings <span className="text-red-500">*</span>
            </h3>
            <div className="space-y-4">
              {competencies.map((comp, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{comp.name}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          type="button" // Task 6.3: Added explicit type
                          onClick={() => handleRatingChange(index, star)}
                          className={`transition-colors ${star <= comp.rating ? 'text-orange-400' : 'text-gray-300 dark:text-gray-600'}`}
                        >
                          <Star className="h-5 w-5 fill-current" />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{comp.rating}/5</span>
                    </div>
                  </div>
                  <input
                    placeholder="Optional comments for this competency..."
                    value={comp.comments}
                    onChange={(e) => handleCommentChange(index, e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Strengths <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="What did this employee do well?"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Areas for Improvement */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Areas for Improvement <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="What can this employee improve on?"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-800">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={submitting}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={submitting}
            className="px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitReviewModal;