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

  const truncateText = (value: string | null | undefined, maxLength: number): string => {
    const text = (value ?? '').trim();
    if (!text) return 'N/A';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Tree layout constants
  const LEVEL_HEIGHT = 200;  // Vertical spacing between levels
  const MIN_HORIZONTAL_SPACING = 220;  // Minimum horizontal spacing between siblings
  const MAX_CANVAS_WIDTH = 10000;
  const STEP_WIDTH = 280;
  const STEP_HEIGHT = 100;
  const DECISION_SIZE = 160;
  const START_Y = 80;

  type RawEdge = { fromId: string; toId: string; type: 'yes' | 'no' | 'normal' };

  const buildGraph = (): { allNodes: TreeNode[]; connections: Connection[]; canvasWidth: number; canvasHeight: number } => {
    const stepById = new Map<string, ProcessStep>(steps.map((s) => [s.id, s]));
    const branchesByStepId = new Map<string, StepBranch[]>();
    allBranches.forEach((b) => {
      if (!stepById.has(b.stepId)) return;
      const list = branchesByStepId.get(b.stepId) || [];
      list.push(b);
      branchesByStepId.set(b.stepId, list);
    });

    const nodesById = new Map<string, TreeNode>();
    const rawEdges: RawEdge[] = [];
    const edgeKeys = new Set<string>();
    const expandedNodes = new Set<string>();

    const startNode: TreeNode = { id: 'start', type: 'start', x: 0, y: 0 };
    const endNode: TreeNode = { id: 'end', type: 'end', x: 0, y: 0 };
    nodesById.set(startNode.id, startNode);
    nodesById.set(endNode.id, endNode);

    const addEdge = (fromId: string, toId: string, type: 'yes' | 'no' | 'normal') => {
      const key = `${fromId}->${toId}:${type}`;
      if (edgeKeys.has(key)) return;
      edgeKeys.add(key);
      rawEdges.push({ fromId, toId, type });
    };

    const resolveNodeForStep = (step: ProcessStep): TreeNode => {
      const nodeId = `step-${step.stepNumber}`;
      const existing = nodesById.get(nodeId);
      const stepBranches = branchesByStepId.get(step.id) || [];
      const isDecision = step.isDecision && stepBranches.length > 0;

      if (existing) {
        if (isDecision && existing.type !== 'decision') {
          existing.type = 'decision';
        }
        if (!existing.step) {
          existing.step = step;
        }
        return existing;
      }

      const node: TreeNode = {
        id: nodeId,
        type: isDecision ? 'decision' : 'step',
        step,
        x: 0,
        y: 0,
      };
      nodesById.set(nodeId, node);
      return node;
    };

    const getNextRegularStep = (step: ProcessStep): ProcessStep | null => {
      if (step.nextStepId === '__END__') return null;
      if (step.nextStepId) return stepById.get(step.nextStepId) || null;
      // Fallback for older records where explicit next-step links may be missing.
      return steps.find((s) => s.stepNumber === step.stepNumber + 1) || null;
    };

    const traverseFromStep = (
      step: ProcessStep,
      fromNode: TreeNode,
      edgeType: 'yes' | 'no' | 'normal',
      path: Set<string>
    ) => {
      const stepNode = resolveNodeForStep(step);
      addEdge(fromNode.id, stepNode.id, edgeType);

      if (path.has(stepNode.id)) {
        // Loop-back: connect to existing step and stop expanding this branch.
        return;
      }

      if (expandedNodes.has(stepNode.id)) {
        return;
      }

      expandedNodes.add(stepNode.id);
      const nextPath = new Set(path);
      nextPath.add(stepNode.id);

      const stepBranches = branchesByStepId.get(step.id) || [];
      const isDecision = step.isDecision && stepBranches.length > 0;

      if (isDecision) {
        const yesBranch = stepBranches.find((b) => b.condition === 'yes');
        const noBranch = stepBranches.find((b) => b.condition === 'no');

        const followDecisionBranch = (branch: StepBranch | undefined, branchType: 'yes' | 'no') => {
          if (!branch || !branch.nextStepId || branch.nextStepId === '__END__') {
            addEdge(stepNode.id, endNode.id, branchType);
            return;
          }
          const next = stepById.get(branch.nextStepId);
          if (!next) {
            addEdge(stepNode.id, endNode.id, branchType);
            return;
          }
          traverseFromStep(next, stepNode, branchType, nextPath);
        };

        followDecisionBranch(yesBranch, 'yes');
        followDecisionBranch(noBranch, 'no');
        return;
      }

      const nextStep = getNextRegularStep(step);
      if (!nextStep) {
        addEdge(stepNode.id, endNode.id, 'normal');
        return;
      }

      traverseFromStep(nextStep, stepNode, 'normal', nextPath);
    };

    const firstStep = steps[0];
    if (firstStep) {
      traverseFromStep(firstStep, startNode, 'normal', new Set<string>());
    } else {
      addEdge(startNode.id, endNode.id, 'normal');
    }

    // Compute compact levels using minimum distance from START.
    const outgoing = new Map<string, RawEdge[]>();
    nodesById.forEach((_, id) => outgoing.set(id, []));
    rawEdges.forEach((edge) => {
      const list = outgoing.get(edge.fromId) || [];
      list.push(edge);
      outgoing.set(edge.fromId, list);
    });

    const levels = new Map<string, number>();
    levels.set(startNode.id, 0);
    const queue: string[] = [startNode.id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentLevel = levels.get(currentId) ?? 0;
      (outgoing.get(currentId) || []).forEach((edge) => {
        const proposedLevel = currentLevel + 1;
        const existingLevel = levels.get(edge.toId);
        if (existingLevel === undefined || proposedLevel < existingLevel) {
          levels.set(edge.toId, proposedLevel);
          queue.push(edge.toId);
        }
      });
    }

    nodesById.forEach((_, id) => {
      if (!levels.has(id)) levels.set(id, 1);
    });

    // Keep END node fixed at the bottom base level.
    const maxNonEndLevel = Math.max(
      ...Array.from(levels.entries())
        .filter(([id]) => id !== endNode.id)
        .map(([, level]) => level),
      1
    );
    levels.set(endNode.id, maxNonEndLevel + 1);

    const nodesByLevel = new Map<number, TreeNode[]>();
    nodesById.forEach((node, id) => {
      const level = levels.get(id) ?? 1;
      const list = nodesByLevel.get(level) || [];
      list.push(node);
      nodesByLevel.set(level, list);
    });

    const HORIZONTAL_GAP = 320;
    const maxNodesAtLevel = Math.max(...Array.from(nodesByLevel.values()).map((list) => list.length), 1);
    const canvasWidth = Math.min(Math.max(1400, maxNodesAtLevel * HORIZONTAL_GAP + 500), MAX_CANVAS_WIDTH);

    Array.from(nodesByLevel.entries()).forEach(([level, nodes]) => {
      nodes.sort((a, b) => {
        if (a.type === 'start') return -1;
        if (b.type === 'start') return 1;
        if (a.type === 'end') return 1;
        if (b.type === 'end') return -1;
        const aNum = a.step?.stepNumber ?? Number.MAX_SAFE_INTEGER;
        const bNum = b.step?.stepNumber ?? Number.MAX_SAFE_INTEGER;
        return aNum - bNum;
      });

      const usedWidth = (nodes.length - 1) * HORIZONTAL_GAP;
      const levelStartX = canvasWidth / 2 - usedWidth / 2;
      const y = START_Y + level * LEVEL_HEIGHT;

      nodes.forEach((node, idx) => {
        node.x = node.type === 'end' ? canvasWidth / 2 : levelStartX + idx * HORIZONTAL_GAP;
        node.y = y;
      });
    });

    const allNodes = Array.from(nodesById.values());
    const connections: Connection[] = rawEdges
      .map((edge) => {
        const from = nodesById.get(edge.fromId);
        const to = nodesById.get(edge.toId);
        if (!from || !to) return null;
        return { from, to, type: edge.type };
      })
      .filter((c): c is Connection => Boolean(c));

    const maxLevel = Math.max(...Array.from(levels.values()));
    const canvasHeight = START_Y + (maxLevel + 1) * LEVEL_HEIGHT + 200;

    return { allNodes, connections, canvasWidth, canvasHeight };
  };

  const { allNodes, connections, canvasWidth, canvasHeight } = buildGraph();

  const NODE_CLEARANCE = 24;
  const LANE_STEP = 70;

  const getNodeBounds = (node: TreeNode) => {
    if (node.type === 'start' || node.type === 'end') {
      return {
        left: node.x - 100 - NODE_CLEARANCE,
        right: node.x + 100 + NODE_CLEARANCE,
        top: node.y - 35 - NODE_CLEARANCE,
        bottom: node.y + 35 + NODE_CLEARANCE,
      };
    }

    if (node.type === 'decision') {
      return {
        left: node.x - DECISION_SIZE / 2 - NODE_CLEARANCE,
        right: node.x + DECISION_SIZE / 2 + NODE_CLEARANCE,
        top: node.y - DECISION_SIZE / 2 - NODE_CLEARANCE,
        bottom: node.y + DECISION_SIZE / 2 + NODE_CLEARANCE,
      };
    }

    return {
      left: node.x - STEP_WIDTH / 2 - NODE_CLEARANCE,
      right: node.x + STEP_WIDTH / 2 + NODE_CLEARANCE,
      top: node.y - STEP_HEIGHT / 2 - NODE_CLEARANCE,
      bottom: node.y + STEP_HEIGHT / 2 + NODE_CLEARANCE,
    };
  };

  const nodeBounds = new Map<string, ReturnType<typeof getNodeBounds>>();
  allNodes.forEach((node) => nodeBounds.set(node.id, getNodeBounds(node)));

  const segmentIntersectsAnyNode = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    excludeNodeIds: Set<string>
  ): boolean => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    for (const node of allNodes) {
      if (excludeNodeIds.has(node.id)) continue;
      const box = nodeBounds.get(node.id);
      if (!box) continue;

      const intersects =
        maxX >= box.left &&
        minX <= box.right &&
        maxY >= box.top &&
        minY <= box.bottom;

      if (intersects) return true;
    }
    return false;
  };

  const orthogonalPathClear = (
    points: Array<{ x: number; y: number }>,
    excludeNodeIds: Set<string>
  ): boolean => {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (segmentIntersectsAnyNode(a.x, a.y, b.x, b.y, excludeNodeIds)) {
        return false;
      }
    }
    return true;
  };

  const findSafeLaneX = (
    preferredX: number,
    fromX: number,
    toX: number,
    upperY: number,
    lowerY: number,
    excludeNodeIds: Set<string>
  ): number => {
    const candidates = [
      preferredX,
      preferredX + LANE_STEP,
      preferredX - LANE_STEP,
      preferredX + LANE_STEP * 2,
      preferredX - LANE_STEP * 2,
      (fromX + toX) / 2,
      fromX + (toX > fromX ? LANE_STEP : -LANE_STEP),
      toX + (fromX > toX ? LANE_STEP : -LANE_STEP),
    ];

    for (const laneX of candidates) {
      const clearVertical = !segmentIntersectsAnyNode(laneX, upperY, laneX, lowerY, excludeNodeIds);
      if (!clearVertical) continue;
      return laneX;
    }

    return preferredX;
  };

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
      if (conn.type === 'yes' || conn.type === 'no') {
        const decisionOffset = DECISION_SIZE * 0.24;
        startX += conn.type === 'yes' ? -decisionOffset : decisionOffset;
      }
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

    const OUT = 28;
    const excludeNodeIds = new Set<string>([from.id, to.id]);

    if (from.type === 'decision' && conn.type === 'yes') {
      startX = from.x - DECISION_SIZE / 2;
      startY = from.y;
    } else if (from.type === 'decision' && conn.type === 'no') {
      startX = from.x + DECISION_SIZE / 2;
      startY = from.y;
    }

    if (to.type === 'decision') {
      endY = to.y - DECISION_SIZE / 2;
    } else if (to.type === 'step') {
      endY = to.y - STEP_HEIGHT / 2;
    } else if (to.type === 'end') {
      endY = to.y - 35;
    }

    const downLaneY = startY + OUT;
    const targetLaneY = endY - OUT;

    if (Math.abs(startX - endX) < 8 && !segmentIntersectsAnyNode(startX, startY, endX, endY, excludeNodeIds)) {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    if (endY > startY) {
      const preferredLaneX =
        from.type === 'decision' && conn.type === 'yes'
          ? startX - 52
          : from.type === 'decision' && conn.type === 'no'
          ? startX + 52
          : startX;
      const laneX = findSafeLaneX(
        preferredLaneX,
        startX,
        endX,
        Math.min(downLaneY, targetLaneY),
        Math.max(downLaneY, targetLaneY),
        excludeNodeIds
      );

      const points = [
        { x: startX, y: startY },
        { x: startX, y: downLaneY },
        { x: laneX, y: downLaneY },
        { x: laneX, y: targetLaneY },
        { x: endX, y: targetLaneY },
        { x: endX, y: endY },
      ];

      if (!orthogonalPathClear(points, excludeNodeIds)) {
        const altLaneX = findSafeLaneX(
          endX > startX ? endX + LANE_STEP : endX - LANE_STEP,
          startX,
          endX,
          Math.min(downLaneY, targetLaneY),
          Math.max(downLaneY, targetLaneY),
          excludeNodeIds
        );
        return `M ${startX} ${startY} L ${startX} ${downLaneY} L ${altLaneX} ${downLaneY} L ${altLaneX} ${targetLaneY} L ${endX} ${targetLaneY} L ${endX} ${endY}`;
      }

      return `M ${startX} ${startY} L ${startX} ${downLaneY} L ${laneX} ${downLaneY} L ${laneX} ${targetLaneY} L ${endX} ${targetLaneY} L ${endX} ${endY}`;
    }

    // Loop-back/up-link
    const upLaneY = endY - OUT;
    const preferredLaneX = endX > startX ? startX + LANE_STEP * 2 : startX - LANE_STEP * 2;
    const laneX = findSafeLaneX(
      preferredLaneX,
      startX,
      endX,
      Math.min(downLaneY, upLaneY),
      Math.max(downLaneY, upLaneY),
      excludeNodeIds
    );

    return `M ${startX} ${startY} L ${startX} ${downLaneY} L ${laneX} ${downLaneY} L ${laneX} ${upLaneY} L ${endX} ${upLaneY} L ${endX} ${endY}`;
  };

  // Download flowchart as SVG
  const downloadFlowchart = () => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current.cloneNode(true) as SVGSVGElement;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `${process.title.toLowerCase().replace(/\\s+/g, '-')}_flowchart.svg`;
    link.href = URL.createObjectURL(svgBlob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-lg flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{process.title} - Flowchart</h2>
            <p className="text-sm text-gray-600">{process.description}</p>
            <p className="text-xs text-gray-500 mt-1">Preview the full flowchart below, then download when ready.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadFlowchart}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Download SVG
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

                // Calculated positions for branch labels are based on decision nodes only.
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
                    {conn.type === 'yes' && conn.from.type === 'decision' && (
                      <text
                        x={conn.from.type === 'decision' ? conn.from.x - DECISION_SIZE * 0.34 : conn.from.x - 22}
                        y={conn.from.type === 'decision' ? conn.from.y + DECISION_SIZE / 2 + 22 : midY}
                        fill="#10B981"
                        fontSize="14"
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        YES
                      </text>
                    )}
                    {conn.type === 'no' && conn.from.type === 'decision' && (
                      <text
                        x={conn.from.type === 'decision' ? conn.from.x + DECISION_SIZE * 0.34 : conn.from.x + 22}
                        y={conn.from.type === 'decision' ? conn.from.y + DECISION_SIZE / 2 + 22 : midY}
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
                          {truncateText(node.step.title, 18)}
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
                        {truncateText(node.step.title, 28)}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 15}
                        fill="#60A5FA"
                        fontSize="11"
                        textAnchor="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {truncateText(node.step.description, 40)}
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
