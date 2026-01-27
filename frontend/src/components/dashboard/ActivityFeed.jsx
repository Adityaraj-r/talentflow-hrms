import React from 'react';
import { 
  UserPlus, 
  LogIn, 
  LogOut, 
  Edit, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const ActivityFeed = ({ activities = [], loading = false }) => {
  const getActivityIcon = (type) => {
    const icons = {
      login: LogIn,
      logout: LogOut,
      create: UserPlus,
      update: Edit,
      delete: Trash2,
      approval: CheckCircle,
      rejection: XCircle,
      system: AlertCircle,
      security: AlertCircle,
    };
    return icons[type] || AlertCircle;
  };

  const getActivityColor = (type) => {
    const colors = {
      login: 'text-blue-600 bg-blue-100',
      logout: 'text-gray-600 bg-gray-100',
      create: 'text-green-600 bg-green-100',
      update: 'text-yellow-600 bg-yellow-100',
      delete: 'text-red-600 bg-red-100',
      approval: 'text-green-600 bg-green-100',
      rejection: 'text-red-600 bg-red-100',
      system: 'text-purple-600 bg-purple-100',
      security: 'text-orange-600 bg-orange-100',
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No recent activities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const colorClass = getActivityColor(activity.type);
          
          return (
            <div key={activity.id} className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {activity.user && (
                    <span className="text-xs text-gray-500">
                      {activity.user.name}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    {activity.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
