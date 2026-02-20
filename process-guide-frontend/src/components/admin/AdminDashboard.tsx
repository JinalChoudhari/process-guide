import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, FolderOpen, Database, ArrowLeft, GitBranch, List } from 'lucide-react';
import { useProcessContext } from '../../context/ProcessContext';
import { ProcessEditor } from './ProcessEditor';
import { ProcessViewer } from '../user/ProcessViewer';
import { DatabaseManager } from './DatabaseManager';
import { FlowchartViewer } from './FlowchartViewer';
import { FullProcessView } from './FullProcessView';

export function AdminDashboard() {
  const { processes, deleteProcess } = useProcessContext();
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'edit' | 'view' | 'database' | 'flowchart' | 'fullview'>('list');
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);

  const handleAddProcess = () => {
    setEditingProcessId(null);
    setViewMode('edit');
  };

  const handleEditProcess = (processId: string) => {
    setEditingProcessId(processId);
    setViewMode('edit');
  };

  const handleViewProcess = (processId: string) => {
    setSelectedProcessId(processId);
    setViewMode('view');
  };

  const handleViewFlowchart = (processId: string) => {
    setSelectedProcessId(processId);
    setViewMode('flowchart');
  };

  const handleViewFullProcess = (processId: string) => {
    setSelectedProcessId(processId);
    setViewMode('fullview');
  };

  const handleDeleteProcess = async (processId: string) => {
    if (confirm('Are you sure you want to delete this process?')) {
      await deleteProcess(processId);
    }
  };

  const handleBackToDashboard = () => {
    setViewMode('list');
    setEditingProcessId(null);
    setSelectedProcessId(null);
  };

  if (viewMode === 'edit') {
    return <ProcessEditor processId={editingProcessId} onBack={handleBackToDashboard} />;
  }

  if (viewMode === 'view' && selectedProcessId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleBackToDashboard}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <ProcessViewer processId={selectedProcessId} />
      </div>
    );
  }

  if (viewMode === 'database') {
    return <DatabaseManager onBack={handleBackToDashboard} />;
  }

  if (viewMode === 'flowchart' && selectedProcessId) {
    return <FlowchartViewer processId={selectedProcessId} onBack={handleBackToDashboard} />;
  }

  if (viewMode === 'fullview' && selectedProcessId) {
    return <FullProcessView processId={selectedProcessId} onBack={handleBackToDashboard} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-600 mt-2">Manage all processes and workflows</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('database')}
              className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              <Database className="w-5 h-5" />
              Database
            </button>
            <button
              onClick={handleAddProcess}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Process
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Processes</p>
              <p className="text-3xl font-semibold text-gray-900 mt-1">{processes.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FolderOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Categories</p>
              <p className="text-3xl font-semibold text-gray-900 mt-1">
                {new Set(processes.map(p => p.category)).size}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FolderOpen className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {processes.length > 0 ? new Date(Math.max(...processes.map(p => new Date(p.updatedAt).getTime()))).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <FolderOpen className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Processes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Processes</h3>
        </div>

        {processes.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No processes found. Create your first process!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Process Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processes.map((process) => (
                  <tr key={process.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{process.title}</div>
                        <div className="text-sm text-gray-500">{process.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {process.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(process.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(process.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewProcess(process.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Process"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditProcess(process.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Process"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProcess(process.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Process"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleViewFlowchart(process.id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="View Flowchart"
                        >
                          <GitBranch className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleViewFullProcess(process.id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="View Full Process"
                        >
                          <List className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}