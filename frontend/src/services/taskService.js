import apiClient from "./apiClient";

const taskService = {
  // Fetch tasks assigned to the logged-in user
  getMyTasks: async () => {
    return await apiClient.get("/tasks/my-tasks");
  },

  // Create a task (Admin only)
  createTask: async (taskData) => {
    return await apiClient.post("/tasks/create", taskData);
  },
  
  // Placeholder for future update status logic
  updateTaskStatus: async (taskId, status) => {
    return await apiClient.patch(`/tasks/${taskId}/status`, { status });
  }
};

export default taskService;