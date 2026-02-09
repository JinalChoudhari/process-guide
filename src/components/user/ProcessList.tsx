import { useState } from 'react';
import { Search, FolderOpen, ArrowRight } from 'lucide-react';
import { useProcessContext } from '../../context/ProcessContext';
import { ProcessViewer } from './ProcessViewer';

export function ProcessList() {
  const { processes } = useProcessContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(processes.map(p => p.category)))];

  const filteredProcesses = processes.filter(process => {
    const matchesSearch = 
      process.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || process.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedProcessId) {
    return (
      <div>
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => setSelectedProcessId(null)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to All Processes
            </button>
          </div>
        </div>
        <ProcessViewer processId={selectedProcessId} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900">Process Guide Library</h2>
        <p className="text-gray-600 mt-2">Browse step-by-step workflows and procedures</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search processes..."
              />
            </div>
          </div>

          <div className="md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Process Grid */}
      {filteredProcesses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No processes found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProcesses.map((process) => (
            <div
              key={process.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setSelectedProcessId(process.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                      {process.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {process.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {process.category}
                  </span>
                  
                  <div className="flex items-center gap-1 text-blue-600 font-medium text-sm">
                    View Process
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Last updated: {new Date(process.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}