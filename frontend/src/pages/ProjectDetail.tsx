import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import type { 
  Project, 
  Task, 
  TaskStatus, 
  Priority, 
  MemberRole 
} from '../types';
import { 
  Plus, 
  Users, 
  ChevronLeft,
  CheckCircle2,
  Clock,
  UserPlus,
  Trash2
} from 'lucide-react';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // New task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('MEDIUM');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // New member form
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<MemberRole>('MEMBER');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [projData, tasksData] = await Promise.all([
        projectService.getProjectById(id),
        taskService.getAllTasks({ projectId: id })
      ]);
      setProject(projData);
      setTasks(tasksData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !taskTitle.trim()) return;

    try {
      const newTask = await taskService.createTask({
        title: taskTitle,
        description: taskDesc,
        projectId: id,
        assignedToId: taskAssignee || undefined,
        priority: taskPriority,
        dueDate: taskDueDate || undefined
      });
      setTasks([newTask, ...tasks]);
      setShowTaskModal(false);
      resetTaskForm();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskAssignee('');
    setTaskDueDate('');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !memberEmail.trim()) return;

    try {
      await projectService.addProjectMember(id, memberEmail, memberRole);
      // Refresh project to get updated member list
      const updatedProj = await projectService.getProjectById(id);
      setProject(updatedProj);
      setShowMemberModal(false);
      setMemberEmail('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  const handleDeleteProject = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

    try {
      await projectService.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-sm text-red-700">{error || 'Project not found'}</p>
        <button onClick={() => navigate('/projects')} className="mt-2 text-indigo-600 font-medium underline">
          Back to Projects
        </button>
      </div>
    );
  }

  const isAdmin = project.projectMembers?.find(m => m.userId === user?.id)?.role === 'ADMIN';
  const isOwner = project.ownerId === user?.id;

  const tasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-white rounded-lg text-gray-500 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {project.status}
              </span>
              <span className="text-sm text-gray-500 flex items-center">
                <Users size={14} className="mr-1" />
                {project.projectMembers?.length || 0} members
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <UserPlus size={18} className="mr-2" />
              Team
            </button>
          )}
          <button
            onClick={() => setShowTaskModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus size={18} className="mr-2" />
            Add Task
          </button>
          {isOwner && (
            <button
              onClick={handleDeleteProject}
              className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Delete Project"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total Tasks</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Clock size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{tasks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Completed</span>
            <div className="p-1.5 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{tasksByStatus('DONE').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">In Progress</span>
            <div className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg"><Clock size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{tasksByStatus('IN_PROGRESS').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Completion</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><CheckCircle2 size={16} /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {tasks.length > 0 ? Math.round((tasksByStatus('DONE').length / tasks.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Task Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
        {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as TaskStatus[]).map((status) => (
          <div key={status} className="flex flex-col min-w-[280px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-bold text-gray-700 flex items-center">
                {status.replace('_', ' ')}
                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {tasksByStatus(status).length}
                </span>
              </h3>
            </div>
            <div className="space-y-3 bg-gray-100 p-3 rounded-xl min-h-[400px]">
              {tasksByStatus(status).map((task) => (
                <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      task.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                      task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.priority}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <select 
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className="text-[10px] border-gray-200 rounded p-0 px-1 focus:ring-indigo-500"
                      >
                        {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">{task.title}</h4>
                  {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold">
                        {task.assignedTo?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="ml-1.5 text-[10px] text-gray-500">{task.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center text-[10px] text-gray-400">
                        <Clock size={10} className="mr-1" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {tasksByStatus(status).length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center">
                  <span className="text-xs text-gray-400">Empty</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowTaskModal(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-bold mb-4">Create New Task</h3>
              <form onSubmit={handleCreateTask} className="space-y-4 text-gray-900">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as Priority)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assign To</label>
                    <select
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {project.projectMembers?.map(m => (
                        <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">Create Task</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowMemberModal(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Manage Team</h3>
              
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Current Members</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {project.projectMembers?.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                          {m.user?.name?.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-900">{m.user?.name}</p>
                          <p className="text-[10px] text-gray-500">{m.role}</p>
                        </div>
                      </div>
                      {isAdmin && m.userId !== project.ownerId && (
                        <button className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Add New Member</h4>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900"
                    placeholder="teammate@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as MemberRole)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowMemberModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300">Close</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">Add Member</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
