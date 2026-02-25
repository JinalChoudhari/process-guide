import { useState } from "react";
import { Search, FolderOpen, ArrowRight, List } from "lucide-react";
import { useProcessContext } from "../../context/ProcessContext";
import { ProcessViewer } from "./ProcessViewer";
import { FullProcessView } from "../admin/FullProcessView";

export function ProcessList() {
  const { processes, loading } = useProcessContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"interactive" | "full">("interactive");

  if (loading) {
    return <div className="p-8 text-center">Loading processes...</div>;
  }

  const safeProcesses = processes || [];

  const categories = [
    "All",
    ...Array.from(
      new Set(
        safeProcesses.map((p: any) => p.category || "Uncategorized")
      )
    ),
  ];

  const filteredProcesses = safeProcesses.filter((process: any) => {
    const title = process.title?.toLowerCase() || "";
    const description = process.description?.toLowerCase() || "";
    const category = process.category || "Uncategorized";

    const matchesSearch =
      title.includes(searchTerm.toLowerCase()) ||
      description.includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (selectedProcessId) {
    return (
      <div>
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedProcessId(null);
                  setViewMode("interactive");
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to All Processes
              </button>

              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("interactive")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    viewMode === "interactive"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  Interactive Guide
                </button>

                <button
                  onClick={() => setViewMode("full")}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                    viewMode === "full"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  <List className="w-4 h-4" />
                  Full View
                </button>
              </div>
            </div>
          </div>
        </div>

        {viewMode === "interactive" ? (
          <ProcessViewer processId={selectedProcessId} />
        ) : (
          <FullProcessView
            processId={selectedProcessId}
            onBack={() => {
              setSelectedProcessId(null);
              setViewMode("interactive");
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900">
          Process Guide Library
        </h2>
        <p className="text-gray-600 mt-2">
          Browse step-by-step workflows and procedures
        </p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Search processes..."
            />
          </div>

          <div className="md:w-64">
            <label htmlFor="category" className="sr-only">
              Select Category
            </label>
            <select
              id="category"
              aria-label="Select Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredProcesses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No processes found matching your criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProcesses.map((process: any) => (
            <div
              key={process.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() =>
                setSelectedProcessId(process.id)
              }
            >
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                  {process.title}
                </h3>

                <p className="text-sm text-gray-600 mb-3">
                  {process.description}
                </p>

                <div className="flex justify-between items-center border-t pt-4">
                  <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {process.category || "Uncategorized"}
                  </span>

                  <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                    View Process
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Created:{" "}
                  {process.createdAt
                    ? new Date(process.createdAt).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
