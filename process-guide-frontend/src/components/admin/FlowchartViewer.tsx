import { useRef } from 'react';
import { X, Download } from 'lucide-react';
import { useProcessContext } from '../../context/ProcessContext';
import { ProcessStep, StepBranch } from '../../types/process';

interface FlowchartViewerProps {
  processId: string;
  onBack: () => void;
}

interface TreeNode {
  id: string;
  type: 'start' | 'end' | 'step' | 'decision';
  step?: ProcessStep;
  x: number;
  y: number;
  leftChild?: TreeNode;
  rightChild?: TreeNode;
  parent?: TreeNode;
  branchType?: 'yes' | 'no' | null;
}

interface Connection {
  from: TreeNode;
  to: TreeNode;
  type: 'yes' | 'no' | 'normal';
}

export function FlowchartViewer({ processId, onBack }: FlowchartViewerProps) {
  const { processes, steps: allSteps, branches: allBranches } = useProcessContext();
  const svgRef = useRef<SVGSVGElement>(null);

  const process = processes.find(p => p.id === processId);
  const steps = allSteps
    .filter(s => s.processId === processId)
    .sort((a, b) => a.stepNumber - b.stepNumber);

  if (!process) {
    return <div>Process not found</div>;
  }

  const getBranchesByStepId = (stepId: string): StepBranch[] => {
    return allBranches.filter(b => b.stepId === stepId);
  };

  // Tree layout constants
  const LEVEL_HEIGHT = 200;  // Vertical spacing between levels
  const MIN_HORIZONTAL_SPACING = 350;  // Minimum horizontal spacing between siblings
  const STEP_WIDTH = 280;
  const STEP_HEIGHT = 100;
  const DECISION_SIZE = 160;
  const START_Y = 80;

  /**
   * Build tree structure recursively from steps and branches
   */
  const buildTree = (): { root: TreeNode; endNodes: TreeNode[] } => {
    const visitedSteps = new Set<string>();
    const endNodes: TreeNode[] = [];
    const firstStep = steps[0];

    // Create START node
    const root: TreeNode = {
      id: 'start',
      type: 'start',
      x: 0,
      y: 0,
    };

    if (!firstStep) {
      return { root, endNodes };
    }

    // Build tree recursively starting from first step
    function buildNode(step: ProcessStep | null, branchType: 'yes' | 'no' | null = null, parent?: TreeNode): TreeNode | null {
      if (!step) {
        // Create END node
        const endNode: TreeNode = {
          id: `end-${Math.random()}`,
          type: 'end',
          x: 0,
          y: 0,
          branchType,
          parent,
        };
        endNodes.push(endNode);
        return endNode;
      }

      // Prevent infinite loops
      if (visitedSteps.has(step.id)) {
        const endNode: TreeNode = {
          id: `end-loop-${step.id}`,
          type: 'end',
          x: 0,
          y: 0,
          branchType,
          parent,
        };
        endNodes.push(endNode);
        return endNode;
      }

      visitedSteps.add(step.id);

      const branches = getBranchesByStepId(step.id);
      const isDecision = step.isDecision && branches.length > 0;

      const node: TreeNode = {
        id: step.id,
        type: isDecision ? 'decision' : 'step',
        step,
        x: 0,
        y: 0,
        branchType,
        parent,
      };

      if (isDecision) {
        // Decision node - create YES (left) and NO (right) children
        const yesBranch = branches.find(b => b.condition === 'yes');
        const noBranch = branches.find(b => b.condition === 'no');

        const yesNextStep = yesBranch?.nextStepId ? steps.find(s => s.id === yesBranch.nextStepId) : null;
        const noNextStep = noBranch?.nextStepId ? steps.find(s => s.id === noBranch.nextStepId) : null;

        node.leftChild = buildNode(yesNextStep || null, 'yes', node);
        node.rightChild = buildNode(noNextStep || null, 'no', node);
      } else {
        // Regular step - check for next step
        let nextStep: ProcessStep | null = null;

        if (step.nextStepId !== undefined) {
          if (step.nextStepId === null) {
            // Explicitly ends
            nextStep = null;
          } else {
            nextStep = steps.find(s => s.id === step.nextStepId) || null;
          }
        } else {
          // Default: go to next numeric step
          nextStep = steps.find(s => s.stepNumber === step.stepNumber + 1) || null;
        }

        // Continue the current branch (if YES, continue left; if NO, continue right)
        const childNode = buildNode(nextStep, branchType, node);
        
        if (branchType === 'yes' || branchType === null) {
          node.leftChild = childNode;
        } else {
          node.rightChild = childNode;
        }
      }

      return node;
    }

    // Build from first step
    root.leftChild = buildNode(firstStep, null, root);

    return { root, endNodes };
  };

  /**
   * Calculate node widths (how much horizontal space each subtree needs)
   */
  const calculateWidths = (node: TreeNode | null | undefined): number => {
    if (!node) return 0;

    if (!node.leftChild && !node.rightChild) {
      // Leaf node
      return MIN_HORIZONTAL_SPACING;
    }

    const leftWidth = calculateWidths(node.leftChild);
    const rightWidth = calculateWidths(node.rightChild);

    return leftWidth + rightWidth + MIN_HORIZONTAL_SPACING;
  };

  /**
   * Position nodes in tree layout (post-order traversal)
   */
  const positionNodes = (node: TreeNode | null | undefined, x: number, y: number, availableWidth: number): void => {
    if (!node) return;

    node.y = y;

    if (!node.leftChild && !node.rightChild) {
      // Leaf node - center in available space
      node.x = x + availableWidth / 2;
      return;
    }

    if (node.leftChild && node.rightChild) {
      // Both children exist - split space
      const leftWidth = calculateWidths(node.leftChild);
      const rightWidth = calculateWidths(node.rightChild);
      const totalWidth = leftWidth + rightWidth;

      const leftSpace = (availableWidth * leftWidth) / totalWidth;
      const rightSpace = availableWidth - leftSpace;

      positionNodes(node.leftChild, x, y + LEVEL_HEIGHT, leftSpace);
      positionNodes(node.rightChild, x + leftSpace, y + LEVEL_HEIGHT, rightSpace);

      // Parent positioned in the middle of children
      node.x = (node.leftChild.x + node.rightChild.x) / 2;
    } else if (node.leftChild) {
      // Only left child
      positionNodes(node.leftChild, x, y + LEVEL_HEIGHT, availableWidth);
      node.x = node.leftChild.x;
    } else if (node.rightChild) {
      // Only right child
      positionNodes(node.rightChild, x, y + LEVEL_HEIGHT, availableWidth);
      node.x = node.rightChild.x;
    }
  };

  /**
   * Collect all connections from tree
   */
  const collectConnections = (node: TreeNode | null | undefined, connections: Connection[] = []): Connection[] => {
    if (!node) return connections;

    if (node.leftChild) {
      connections.push({
        from: node,
        to: node.leftChild,
        type: node.type === 'decision' ? 'yes' : 'normal',
      });
      collectConnections(node.leftChild, connections);
    }

    if (node.rightChild) {
      connections.push({
        from: node,
        to: node.rightChild,
        type: node.type === 'decision' ? 'no' : 'normal',
      });
      collectConnections(node.rightChild, connections);
    }

    return connections;
  };

  /**
   * Flatten tree to array of nodes
   */
  const flattenTree = (node: TreeNode | null | undefined, result: TreeNode[] = []): TreeNode[] => {
    if (!node) return result;
    result.push(node);
    flattenTree(node.leftChild, result);
    flattenTree(node.rightChild, result);
    return result;
  };

  // Build and layout the tree
  const { root, endNodes } = buildTree();
  const treeWidth = calculateWidths(root);
  const canvasWidth = Math.max(treeWidth, 1400);
  const startX = canvasWidth / 2 - (root.leftChild ? calculateWidths(root.leftChild) / 2 : 0);
  
  positionNodes(root, 0, START_Y, canvasWidth);
  
  const allNodes = flattenTree(root);
  const connections = collectConnections(root);

  // Calculate canvas height
  const maxY = Math.max(...allNodes.map(n => n.y), ...endNodes.map(n => n.y));
  const canvasHeight = maxY + 200;

  /**
   * Get connection path with clean vertical/horizontal segments
   */
  const getConnectionPath = (conn: Connection): string => {
    const from = conn.from;
    const to = conn.to;

    // Calculate start point
    let startX = from.x;
    let startY = from.y;

    if (from.type === 'start') {
      startY += 35;
    } else if (from.type === 'decision') {
      startY += DECISION_SIZE / 2;
    } else if (from.type === 'step') {
      startY += STEP_HEIGHT / 2;
    }

    // Calculate end point
    let endX = to.x;
    let endY = to.y;

    if (to.type === 'end') {
      endY -= 35;
    } else if (to.type === 'decision') {
      endY -= DECISION_SIZE / 2;
    } else if (to.type === 'step') {
      endY -= STEP_HEIGHT / 2;
    }

    // Create path with clean angles
    if (Math.abs(startX - endX) < 10) {
      // Straight vertical line
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    } else {
      // L-shaped connector
      const midY = (startY + endY) / 2;
      return `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
    }
  };

  // Download flowchart as PNG
  const downloadFlowchart = () => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current.cloneNode(true) as SVGSVGElement;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scale = 2;
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement('a');
            link.download = `${process.title.toLowerCase().replace(/\\s+/g, '-')}_flowchart.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
          }
        });
      }
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-lg flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{process.title} - Flowchart</h2>
            <p className="text-sm text-gray-600">{process.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadFlowchart}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Download PNG
            </button>
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Canvas - Scrollable */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="flex justify-center">
            <svg
              ref={svgRef}
              width={canvasWidth}
              height={canvasHeight}
              xmlns="http://www.w3.org/2000/svg"
              className="bg-white rounded-lg shadow-lg"
            >
              <defs>
                {/* Arrow markers */}
                <marker
                  id="arrowBlue"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#3B82F6" />
                </marker>
                <marker
                  id="arrowGreen"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#10B981" />
                </marker>
                <marker
                  id="arrowRed"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#EF4444" />
                </marker>
              </defs>

              {/* Render connections */}
              {connections.map((conn, idx) => {
                const color = conn.type === 'yes' ? '#10B981' : conn.type === 'no' ? '#EF4444' : '#3B82F6';
                const marker = conn.type === 'yes' ? 'url(#arrowGreen)' : conn.type === 'no' ? 'url(#arrowRed)' : 'url(#arrowBlue)';
                const pathData = getConnectionPath(conn);

                // Calculate label position
                const midX = (conn.from.x + conn.to.x) / 2;
                const midY = (conn.from.y + conn.to.y) / 2;

                return (
                  <g key={`conn-${idx}`}>
                    <path
                      d={pathData}
                      stroke={color}
                      strokeWidth="2.5"
                      fill="none"
                      markerEnd={marker}
                    />
                    {conn.type === 'yes' && (
                      <text
                        x={conn.from.x < conn.to.x ? conn.from.x + 30 : conn.from.x - 30}
                        y={midY}
                        fill="#10B981"
                        fontSize="14"
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        YES
                      </text>
                    )}
                    {conn.type === 'no' && (
                      <text
                        x={conn.from.x < conn.to.x ? conn.to.x - 30 : conn.to.x + 30}
                        y={midY}
                        fill="#EF4444"
                        fontSize="14"
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        NO
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Render nodes */}
              {allNodes.map((node) => {
                if (node.type === 'start') {
                  return (
                    <g key={node.id}>
                      <ellipse
                        cx={node.x}
                        cy={node.y}
                        rx={100}
                        ry={35}
                        fill="#DCFCE7"
                        stroke="#16A34A"
                        strokeWidth="3"
                      />
                      <text
                        x={node.x}
                        y={node.y + 6}
                        fill="#166534"
                        fontSize="16"
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        START
                      </text>
                    </g>
                  );
                } else if (node.type === 'end') {
                  return (
                    <g key={node.id}>
                      <ellipse
                        cx={node.x}
                        cy={node.y}
                        rx={100}
                        ry={35}
                        fill="#FEE2E2"
                        stroke="#DC2626"
                        strokeWidth="3"
                      />
                      <text
                        x={node.x}
                        y={node.y + 6}
                        fill="#991B1B"
                        fontSize="16"
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        END
                      </text>
                    </g>
                  );
                } else if (node.type === 'decision' && node.step) {
                  const points = [
                    [node.x, node.y - DECISION_SIZE / 2],
                    [node.x + DECISION_SIZE / 2, node.y],
                    [node.x, node.y + DECISION_SIZE / 2],
                    [node.x - DECISION_SIZE / 2, node.y],
                  ];

                  return (
                    <g key={node.id}>
                      <polygon
                        points={points.map(p => p.join(',')).join(' ')}
                        fill="#FEF3C7"
                        stroke="#F59E0B"
                        strokeWidth="3"
                      />
                      <text
                        x={node.x}
                        y={node.y - 10}
                        fill="#92400E"
                        fontSize="14"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {node.step.title.length > 18 ? node.step.title.substring(0, 18) + '...' : node.step.title}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 10}
                        fill="#92400E"
                        fontSize="12"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        (Decision)
                      </text>
                    </g>
                  );
                } else if (node.type === 'step' && node.step) {
                  return (
                    <g key={node.id}>
                      <rect
                        x={node.x - STEP_WIDTH / 2}
                        y={node.y - STEP_HEIGHT / 2}
                        width={STEP_WIDTH}
                        height={STEP_HEIGHT}
                        fill="#DBEAFE"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        rx="12"
                      />
                      <text
                        x={node.x}
                        y={node.y - 25}
                        fill="#1E40AF"
                        fontSize="16"
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        Step {node.step.stepNumber}
                      </text>
                      <text
                        x={node.x}
                        y={node.y - 5}
                        fill="#1E3A8A"
                        fontSize="14"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {node.step.title.length > 28 ? node.step.title.substring(0, 28) + '...' : node.step.title}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 15}
                        fill="#60A5FA"
                        fontSize="11"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {node.step.description.length > 40 ? node.step.description.substring(0, 40) + '...' : node.step.description}
                      </text>
                    </g>
                  );
                }
                return null;
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}