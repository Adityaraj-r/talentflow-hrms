import apiClient from "./apiClient";

const taskService = {
  getMyTasks: async () => {
    return await apiClient.get("/tasks/my-tasks");
  },

  getAllTasks: async (filters = {}) => {
    return await apiClient.get("/tasks", { params: filters });
  },

  createTask: async (taskData) => {
    return await apiClient.post("/tasks", taskData);
  },

  updateTaskStatus: async (taskId, status) => {
    return await apiClient.patch(`/tasks/${taskId}/status`, { status });
  },

  updateTask: async (taskId, taskData) => {
    return await apiClient.patch(`/tasks/${taskId}`, taskData);
  },

  deleteTask: async (taskId) => {
    return await apiClient.delete(`/tasks/${taskId}`);
  },

  getTaskAnalytics: async () => {
    return await apiClient.get("/tasks/analytics");
  },

  getAssignableUsers: async () => {
    return await apiClient.get("/tasks/assignable-users");
  },
};

export default taskService;