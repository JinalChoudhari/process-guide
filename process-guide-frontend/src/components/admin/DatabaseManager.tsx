import { useState, useEffect } from 'react';
import { Database, Download, Upload, RefreshCw, Trash2, BarChart3, ArrowLeft, Wrench } from 'lucide-react';
import * as DB from '../../db/apiDatabase';
import { useProcessContext } from '../../context/ProcessContext';

interface DatabaseManagerProps {
  onBack: () => void;
}

export function DatabaseManager({ onBack }: DatabaseManagerProps) {
  const { refreshData } = useProcessContext();
  const [stats, setStats] = useState({ admins: 0, processes: 0, steps: 0, branches: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const dbStats = await DB.getDatabaseStats();
    setStats(dbStats);
  };

  const handleExport = async () => {
    const data = await DB.exportDatabase();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `process-guide-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Database exported successfully!');
  };

  const handleImport = () => {
    alert('Import feature requires backend implementation. Please use the database directly.');
  };

  const handleReset = () => {
    alert('Reset feature requires backend implementation. Please manage data through the database directly.');
  };

  const handleClear = () => {
    alert('Clear feature requires backend implementation. Please manage data through the database directly.');
  };

  const handleMigration = () => {
    alert('Migration feature not available with MySQL backend.');
  };

  const handleTreeDemoMigration = () => {
    alert('Tree Demo migration not available with MySQL backend.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Database Management</h3>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Admins</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.admins}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Processes</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.processes}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Steps</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.steps}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Branches</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.branches}</p>
          </div>
        </div>

        {/* Database Operations */}
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">Database operations for backup, restore, and maintenance</p>
          
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Download className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Export Database</div>
              <div className="text-sm text-gray-600">Download all data as JSON backup file</div>
            </div>
          </button>

          <button
            onClick={handleImport}
            className="w-full flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Upload className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">Import Database</div>
              <div className="text-sm text-gray-600">Restore data from backup JSON file</div>
            </div>
          </button>

          <button
            onClick={handleReset}
            className="w-full flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-orange-50 transition-colors text-left"
          >
            <RefreshCw className="w-5 h-5 text-orange-600" />
            <div>
              <div className="font-medium text-gray-900">Reset to Default</div>
              <div className="text-sm text-gray-600">Reset database with sample data</div>
            </div>
          </button>

          <button
            onClick={handleClear}
            className="w-full flex items-center gap-3 p-4 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
            <div>
              <div className="font-medium text-red-900">Clear All Data</div>
              <div className="text-sm text-red-600">Delete everything (requires page refresh)</div>
            </div>
          </button>

          <button
            onClick={handleMigration}
            className="w-full flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Wrench className="w-5 h-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Apply Migration</div>
              <div className="text-sm text-gray-600">Remove step 5 from all processes</div>
            </div>
          </button>

          <button
            onClick={handleTreeDemoMigration}
            className="w-full flex items-center gap-3 p-4 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <Wrench className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">🌲 Create Tree Demo with Nested Decisions</div>
              <div className="text-sm text-gray-600">Add nested decision steps to showcase tree structure</div>
            </div>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Storage Location:</strong> All data is stored in MySQL database via PHP backend API. 
            Data persists permanently on the server.
          </p>
        </div>
      </div>
    </div>
  );
}