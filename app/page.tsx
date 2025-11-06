// "use client"
//
// import { useCallback } from "react"
// import {
//   ReactFlow,
//   Background,
//   Controls,
//   MiniMap,
//   addEdge,
//   useNodesState,
//   useEdgesState,
//   type OnConnect,
//   type Node,
//   type Edge,
// } from "@xyflow/react"
// import "@xyflow/react/dist/style.css"
//
// const GRID_ROWS = 4 // 4x4 stabilizer grid
// const GRID_COLS = 4
// const CELL_SIZE = 100 // Reduced from 120 to make squares more compact
// const QUBIT_SIZE = 24 // Reduced from 30 for better proportions
// const STABILIZER_SIZE = 32 // Reduced from 40 for better proportions
//
// type NodeType =
//   | "data-qubit"
//   | "x-stabilizer"
//   | "z-stabilizer"
//   | "boundary-qubit"
//   | "stabilizer-bg"
//   | "boundary-triangle"
//
// const getNodeStyle = (type: NodeType) => {
//   switch (type) {
//     case "x-stabilizer":
//       return {
//         background: "#64748b", // dark gray circle for X stabilizer measurement
//         border: "none",
//         borderRadius: "50%",
//         width: STABILIZER_SIZE,
//         height: STABILIZER_SIZE,
//         zIndex: 10,
//       }
//     case "z-stabilizer":
//       return {
//         background: "#64748b", // dark gray circle for Z stabilizer measurement
//         border: "none",
//         borderRadius: "50%",
//         width: STABILIZER_SIZE,
//         height: STABILIZER_SIZE,
//         zIndex: 10,
//       }
//     case "data-qubit":
//       return {
//         background: "#ffffff", // white circles for data qubits
//         border: "3px solid #1e293b",
//         borderRadius: "50%",
//         width: QUBIT_SIZE,
//         height: QUBIT_SIZE,
//         zIndex: 20,
//       }
//     case "boundary-qubit":
//       return {
//         background: "#64748b", // dark gray circles for boundary
//         border: "none",
//         borderRadius: "50%",
//         width: STABILIZER_SIZE,
//         height: STABILIZER_SIZE,
//         zIndex: 5,
//       }
//     case "stabilizer-bg":
//       return {
//         borderRadius: "0px", // Reduced border radius for sharper squares
//         width: CELL_SIZE,
//         height: CELL_SIZE,
//         zIndex: 1,
//         border: "none",
//       }
//     case "boundary-triangle":
//       return {
//         width: 0,
//         height: 0,
//         border: "none",
//         zIndex: 1,
//       }
//   }
// }
//
// const initialNodes: Node[] = []
// const initialEdges: Edge[] = []
//
// for (let row = 0; row < GRID_ROWS; row++) {
//   for (let col = 0; col < GRID_COLS; col++) {
//     const x = col * CELL_SIZE
//     const y = row * CELL_SIZE
//
//     // Determine if this is X or Z stabilizer based on checkerboard
//     const isXStabilizer = (row + col) % 2 === 0
//     const bgColor = isXStabilizer ? "#fca5a5" : "#86efac" // pink for X, green for Z
//
//     // Add background square
//     initialNodes.push({
//       id: `bg-${row}-${col}`,
//       type: "default",
//       position: { x, y },
//       data: { label: "" },
//       style: {
//         ...getNodeStyle("stabilizer-bg"),
//         background: bgColor,
//       },
//       draggable: false,
//       selectable: false,
//     })
//
//     // Add stabilizer measurement node (dark circle in center)
//     initialNodes.push({
//       id: `stab-${row}-${col}`,
//       type: "default",
//       position: { x: x + CELL_SIZE / 2 - STABILIZER_SIZE / 2, y: y + CELL_SIZE / 2 - STABILIZER_SIZE / 2 },
//       data: { label: "" },
//       style: getNodeStyle(isXStabilizer ? "x-stabilizer" : "z-stabilizer"),
//       draggable: false,
//     })
//   }
// }
//
// for (let row = 0; row <= GRID_ROWS; row++) {
//   for (let col = 0; col <= GRID_COLS; col++) {
//     const x = col * CELL_SIZE - QUBIT_SIZE / 2
//     const y = row * CELL_SIZE - QUBIT_SIZE / 2
//
//     initialNodes.push({
//       id: `data-${row}-${col}`,
//       type: "default",
//       position: { x, y },
//       data: { label: "" },
//       style: getNodeStyle("data-qubit"),
//       draggable: false,
//     })
//   }
// }
//
// // Top boundary - positioned above the grid
// for (let col = 0; col < GRID_COLS; col++) {
//   const x = col * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2
//   const y = -CELL_SIZE / 2 - STABILIZER_SIZE / 2
//   initialNodes.push({
//     id: `boundary-top-${col}`,
//     type: "default",
//     position: { x, y },
//     data: { label: "" },
//     style: getNodeStyle("boundary-qubit"),
//     draggable: false,
//   })
// }
//
// // Bottom boundary - positioned below the grid
// for (let col = 0; col < GRID_COLS; col++) {
//   const x = col * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2
//   const y = GRID_ROWS * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2
//   initialNodes.push({
//     id: `boundary-bottom-${col}`,
//     type: "default",
//     position: { x, y },
//     data: { label: "" },
//     style: getNodeStyle("boundary-qubit"),
//     draggable: false,
//   })
// }
//
// // Left boundary - positioned to the left of the grid
// for (let row = 0; row < GRID_ROWS; row++) {
//   const x = -CELL_SIZE / 2 - STABILIZER_SIZE / 2
//   const y = row * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2
//   initialNodes.push({
//     id: `boundary-left-${row}`,
//     type: "default",
//     position: { x, y },
//     data: { label: "" },
//     style: getNodeStyle("boundary-qubit"),
//     draggable: false,
//   })
// }
//
// // Right boundary - positioned to the right of the grid
// for (let row = 0; row < GRID_ROWS; row++) {
//   const x = GRID_COLS * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2
//   const y = row * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2
//   initialNodes.push({
//     id: `boundary-right-${row}`,
//     type: "default",
//     position: { x, y },
//     data: { label: "" },
//     style: getNodeStyle("boundary-qubit"),
//     draggable: false,
//   })
// }
//
// const topBoundaryColumns = [1, 3] // 0-indexed, so columns 1 and 3 (2nd and 4th)
// for (const col of topBoundaryColumns) {
//   const x = col * CELL_SIZE
//   const y = -CELL_SIZE / 2
//
//   // Create triangle using CSS borders
//   initialNodes.push({
//     id: `boundary-triangle-top-${col}`,
//     type: "default",
//     position: { x: x, y: y },
//     data: { label: "" },
//     style: {
//       width: CELL_SIZE,
//       height: CELL_SIZE / 2,
//       background: "#fca5a5", // pink for X-stabilizer
//       clipPath: "polygon(0% 100%, 50% 0%, 100% 100%)",
//       zIndex: 1,
//       border: "none",
//     },
//     draggable: false,
//     selectable: false,
//   })
//
//   // Add boundary qubit at the top of the triangle
//   initialNodes.push({
//     id: `boundary-top-${col}`,
//     type: "default",
//     position: { x: x + CELL_SIZE / 2 - STABILIZER_SIZE / 2, y: y - STABILIZER_SIZE / 2 },
//     data: { label: "" },
//     style: getNodeStyle("boundary-qubit"),
//     draggable: false,
//   })
// }
//
// const bottomBoundaryColumns = [0, 2]
// for (const col of bottomBoundaryColumns) {
//   const x = col * CELL_SIZE
//   const y = GRID_ROWS * CELL_SIZE
//
//   initialNodes.push({
//     id: `boundary-triangle-bottom-${col}`,
//     type: "default",
//     position: { x: x, y: y },
//     data: { label: "" },
//     style: {
//       width: CELL_SIZE,
//       height: CELL_SIZE / 2,
//       background: "#fca5a5", // pink for X-stabilizer
//       clipPath: "polygon(0% 0%, 50% 100%, 100% 0%)",
//       zIndex: 1,
//       border: "none",
//     },
//     draggable: false,
//     selectable: false,
//   })
//
//   // Add boundary qubit at the bottom of the triangle
//   initialNodes.push({
//     id: `boundary-bottom-${col}`,
//     type: "default",
//     position: { x: x + CELL_SIZE / 2 - STABILIZER_SIZE / 2, y: y + CELL_SIZE / 2 },
//     data: { label: "" },
//     style: getNodeStyle("boundary-qubit"),
//     draggable: false,
//   })
// }
//
// const leftBoundaryRows = [0, 2]
// for (const row of leftBoundaryRows) {
//   const x = -CELL_SIZE / 2
//   const y = row * CELL_SIZE
//
//   initialNodes.push({
//     id: `boundary-triangle-left-${row}`,
//     type: "default",
//     position: { x: x, y: y },
//     data: { label: "" },
//     style: {
//       width: CELL_SIZE / 2,
//       height: CELL_SIZE,
//       background: "#86efac", // green for Z-stabilizer
//       clipPath: "polygon(100% 0%, 0% 50%, 100% 100%)",
//       zIndex: 1,
//       border: "none",
//     },
//     draggable: false,
//     selectable: false,
//   })
//
//   // Add boundary qubit at the left of the triangle
//   initialNodes.push({
//     id: `boundary-left-${row}`,
//     type: "default",
//     position: { x: x - STABILIZER_SIZE / 2, y: y + CELL_SIZE / 2 - STABILIZER_SIZE / 2 },
//     data: { label: "" },
//     style: getNodeStyle("boundary-qubit"),
//     draggable: false,
//   })
// }
//
// const rightBoundaryRows = [1,3]
// for (const row of rightBoundaryRows) {
//   const x = GRID_COLS * CELL_SIZE
//   const y = row * CELL_SIZE
//
//   initialNodes.push({
//     id: `boundary-triangle-right-${row}`,
//     type: "default",
//     position: { x: x, y: y },
//     data: { label: "" },
//     style: {
//       width: CELL_SIZE / 2,
//       height: CELL_SIZE,
//       background: "#86efac", // green for Z-stabilizer
//       clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)",
//       zIndex: 1,
//       border: "none",
//     },
//     draggable: false,
//     selectable: false,
//   })
//
//   // Add boundary qubit at the right of the triangle
//   initialNodes.push({
//     id: `boundary-right-${row}`,
//     type: "default",
//     position: { x: x + CELL_SIZE / 2, y: y + CELL_SIZE / 2 - STABILIZER_SIZE / 2 },
//     data: { label: "" },
//     style: getNodeStyle("boundary-qubit"),
//     draggable: false,
//   })
// }
//
// export default function SurfaceCode() {
//   const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
//   const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
//
//   const onConnect: OnConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges])
//
//   return (
//     <div className="w-full h-screen bg-gray-100">
//       <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg">
//         <h2 className="text-lg font-bold mb-2">Quantum Surface Code</h2>
//         <div className="space-y-2 text-sm">
//           <div className="flex items-center gap-2">
//             <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-400" />
//             <span>Data Qubits</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-6 h-6 rounded bg-red-300" />
//             <span>X Stabilizers</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-6 h-6 rounded bg-green-300" />
//             <span>Z Stabilizers</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-6 h-6 rounded-full bg-gray-500" />
//             <span>Measurements</span>
//           </div>
//         </div>
//       </div>
//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         onNodesChange={onNodesChange}
//         onEdgesChange={onEdgesChange}
//         onConnect={onConnect}
//         fitView
//         attributionPosition="bottom-left"
//         nodesDraggable={false}
//         nodesConnectable={false}
//         elementsSelectable={false}
//       >
//         <Background />
//         {/*<Controls />*/}
//         {/*<MiniMap*/}
//         {/*  nodeColor={(node) => {*/}
//         {/*    return node.style?.background as string*/}
//         {/*  }}*/}
//         {/*/>*/}
//       </ReactFlow>
//
//     </div>
//   )
// }
"use client"

import { useCallback, useMemo, useState } from "react"
import {
  ReactFlow,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

const CELL_SIZE = 100
const QUBIT_SIZE = 24
const STABILIZER_SIZE = 32
const GAP = 120  // increased gap for more space
const UNUSED_MEASUREMENTS = 16  // total unused

// Layout: 2 rows × 4 logical qubits
const ROWS = 2
const COLS_PER_ROW = 4
const LOGICAL_QUBITS = ROWS * COLS_PER_ROW
const BASE_DISTANCE = 5

/* -------------------------------------------------
   1. Patch layout
   ------------------------------------------------- */
interface Patch {
  offsetX: number
  offsetY: number
  distance: number
}
const patches: Patch[] = (() => {
  const list: Patch[] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS_PER_ROW; col++) {
      const offsetX = col * ((BASE_DISTANCE - 1) * CELL_SIZE + GAP)
      const offsetY = row * ((BASE_DISTANCE - 1) * CELL_SIZE + GAP)
      list.push({ offsetX, offsetY, distance: BASE_DISTANCE })
    }
  }
  return list
})()

/* -------------------------------------------------
   2. Node styles
   ------------------------------------------------- */
type NodeType =
    | "data-qubit"
    | "x-stabilizer"
    | "z-stabilizer"
    | "boundary-qubit"
    | "stabilizer-bg"
    | "boundary-triangle"
    | "unused-measurement"

const getNodeStyle = (type: NodeType) => {
  switch (type) {
    case "x-stabilizer":
    case "z-stabilizer":
    case "unused-measurement":
      return {
        background: "#64748b",
        border: "none",
        borderRadius: "50%",
        width: STABILIZER_SIZE,
        height: STABILIZER_SIZE,
        zIndex: 10,
      }
    case "data-qubit":
      return {
        background: "#ffffff",
        border: "3px solid #1e293b",
        borderRadius: "50%",
        width: QUBIT_SIZE,
        height: QUBIT_SIZE,
        zIndex: 20,
      }
    case "boundary-qubit":
      return {
        background: "#64748b",
        border: "none",
        borderRadius: "50%",
        width: STABILIZER_SIZE,
        height: STABILIZER_SIZE,
        zIndex: 5,
      }
    case "stabilizer-bg":
      return {
        width: CELL_SIZE,
        height: CELL_SIZE,
        zIndex: 1,
        border: "none",
      }
    case "boundary-triangle":
      return { width: 0, height: 0, border: "none", zIndex: 1 }
    default:
      return {}
  }
}

/* -------------------------------------------------
   3. Build one patch
   ------------------------------------------------- */
function buildPatch(patch: Patch, index: number): Node[] {
  const d = patch.distance
  const rows = d - 1
  const cols = d - 1
  const ox = patch.offsetX
  const oy = patch.offsetY
  const nodes: Node[] = []

  const id = (base: string, r: number, c: number) => `${base}-${index}-${r}-${c}`

  // Background squares
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * CELL_SIZE
      const y = oy + r * CELL_SIZE
      const isX = (r + c) % 2 === 0
      const bg = isX ? "#fca5a5" : "#86efac"

      nodes.push({
        id: id("bg", r, c),
        type: "default",
        position: { x, y },
        data: { label: "" },
        style: { ...getNodeStyle("stabilizer-bg"), background: bg },
        draggable: false,
        selectable: false,
      })

      nodes.push({
        id: id("stab", r, c),
        type: "default",
        position: {
          x: x + CELL_SIZE / 2 - STABILIZER_SIZE / 2,
          y: y + CELL_SIZE / 2 - STABILIZER_SIZE / 2,
        },
        data: { label: "" },
        style: getNodeStyle(isX ? "x-stabilizer" : "z-stabilizer"),
        draggable: false,
      })
    }
  }

  // Data qubits
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const x = ox + c * CELL_SIZE - QUBIT_SIZE / 2
      const y = oy + r * CELL_SIZE - QUBIT_SIZE / 2
      nodes.push({
        id: id("data", r, c),
        type: "default",
        position: { x, y },
        data: { label: "" },
        style: getNodeStyle("data-qubit"),
        draggable: false,
      })
    }
  }

  // Boundary circles
  const addBoundary = (prefix: string, x: number, y: number) => {
    nodes.push({
      id: `${prefix}-${index}`,
      type: "default",
      position: { x, y },
      data: { label: "" },
      style: getNodeStyle("boundary-qubit"),
      draggable: false,
    })
  }

  for (let c = 0; c < cols; c++) {
    addBoundary("boundary-top", ox + c * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2, oy - CELL_SIZE / 2 - STABILIZER_SIZE / 2)
    addBoundary("boundary-bottom", ox + c * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2, oy + rows * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2)
  }
  for (let r = 0; r < rows; r++) {
    addBoundary("boundary-left", ox - CELL_SIZE / 2 - STABILIZER_SIZE / 2, oy + r * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2)
    addBoundary("boundary-right", ox + cols * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2, oy + r * CELL_SIZE + CELL_SIZE / 2 - STABILIZER_SIZE / 2)
  }

  // Triangles
  const triangle = (id: string, x: number, y: number, w: number, h: number, clip: string, bg: string) => {
        nodes.push({
          id,
          type: "default",
          position: { x, y },
          data: { label: "" },
          style: { width: w, height: h, background: bg, clipPath: clip, zIndex: 1, border: "none" },
          draggable: false,
          selectable: false,
        })
      }

      // top triangles
  ;[1, 3].forEach(c => {
    const x = ox + c * CELL_SIZE
    const y = oy - CELL_SIZE / 2
    triangle(`tri-top-${index}-${c}`, x, y, CELL_SIZE, CELL_SIZE / 2, "polygon(0% 100%, 50% 0%, 100% 100%)", "#fca5a5")
    addBoundary("boundary-top", x + CELL_SIZE / 2 - STABILIZER_SIZE / 2, y - STABILIZER_SIZE / 2)
  })

  // bottom triangles
  ;[0, 2].forEach(c => {
    const x = ox + c * CELL_SIZE
    const y = oy + rows * CELL_SIZE
    triangle(`tri-bot-${index}-${c}`, x, y, CELL_SIZE, CELL_SIZE / 2, "polygon(0% 0%, 50% 100%, 100% 0%)", "#fca5a5")
    addBoundary("boundary-bottom", x + CELL_SIZE / 2 - STABILIZER_SIZE / 2, y + CELL_SIZE / 2)
  })

  // left triangles
  ;[0, 2].forEach(r => {
    const x = ox - CELL_SIZE / 2
    const y = oy + r * CELL_SIZE
    triangle(`tri-left-${index}-${r}`, x, y, CELL_SIZE / 2, CELL_SIZE, "polygon(100% 0%, 0% 50%, 100% 100%)", "#86efac")
    addBoundary("boundary-left", x - STABILIZER_SIZE / 2, y + CELL_SIZE / 2 - STABILIZER_SIZE / 2)
  })

  // right triangles
  ;[1, 3].forEach(r => {
    const x = ox + cols * CELL_SIZE
    const y = oy + r * CELL_SIZE
    triangle(`tri-right-${index}-${r}`, x, y, CELL_SIZE / 2, CELL_SIZE, "polygon(0% 0%, 100% 50%, 0% 100%)", "#86efac")
    addBoundary("boundary-right", x + CELL_SIZE / 2, y + CELL_SIZE / 2 - STABILIZER_SIZE / 2)
  })

  return nodes
}

/* -------------------------------------------------
   4. Add unused measurement circuits (toggleable)
   ------------------------------------------------- */
function addUnusedMeasurements(nodes: Node[], totalWidth: number, totalHeight: number, show: boolean): Node[] {
  if (!show) return nodes

  const unused: Node[] = []
  const startX = totalWidth + 150
  const startY = 100
  const cols = 8
  const rows = Math.ceil(UNUSED_MEASUREMENTS / cols)

  for (let i = 0; i < UNUSED_MEASUREMENTS; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    const x = startX + col * (STABILIZER_SIZE + 40)
    const y = startY + row * (STABILIZER_SIZE + 40)
    unused.push({
      id: `unused-${i}`,
      type: "default",
      position: { x, y },
      data: { label: "" },
      style: getNodeStyle("unused-measurement"),
      draggable: false,
    })
  }

  return [...nodes, ...unused]
}

/* -------------------------------------------------
   5. Main Component
   ------------------------------------------------- */
export default function SurfaceCode() {
  const [showUnused, setShowUnused] = useState(false)

  const { nodes: patchNodes, width: totalWidth, height: totalHeight } = useMemo(() => {
    const allNodes = patches.flatMap((p, i) => buildPatch(p, i))
    const maxX = Math.max(...allNodes.map(n => n.position.x + CELL_SIZE))
    const maxY = Math.max(...allNodes.map(n => n.position.y + CELL_SIZE))
    return { nodes: allNodes, width: maxX, height: maxY }
  }, [])

  const initialNodes = useMemo(() => {
    return addUnusedMeasurements(patchNodes, totalWidth, totalHeight, showUnused)
  }, [patchNodes, totalWidth, totalHeight, showUnused])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const onConnect: OnConnect = useCallback(
      (connection) => setEdges((eds) => addEdge(connection, eds)),
      [setEdges]
  )

  // Statistics
  const stats = useMemo(() => {
    const perPatch = {
      distance: BASE_DISTANCE,
      dataQubits: BASE_DISTANCE * BASE_DISTANCE,
      xStabilizers: ((BASE_DISTANCE - 1) * BASE_DISTANCE) / 2,
      zStabilizers: ((BASE_DISTANCE - 1) * BASE_DISTANCE) / 2,
    }
    return {
      layout: `${ROWS} rows × ${COLS_PER_ROW} logical qubits`,
      logicalQubits: LOGICAL_QUBITS,
      totalDataQubits: perPatch.dataQubits * LOGICAL_QUBITS,
      totalXStabilizers: perPatch.xStabilizers * LOGICAL_QUBITS,
      totalZStabilizers: perPatch.zStabilizers * LOGICAL_QUBITS,
      totalMeasurements: (perPatch.xStabilizers + perPatch.zStabilizers) * LOGICAL_QUBITS,
      unusedMeasurements: showUnused ? UNUSED_MEASUREMENTS : 0,
      showUnused,
    }
  }, [showUnused])

  return (
      <div
          className="relative w-full h-screen overflow-auto"
          style={{
            background: "linear-gradient(135deg, #fef9f1 0%, #f8f0e6 100%)",
            backgroundAttachment: "fixed",
          }}
      >
        {/* Toggle Button */}
        <button
            onClick={() => setShowUnused(prev => !prev)}
            className={`absolute top-4 left-4 z-20 px-4 py-2 rounded-lg font-medium transition-all ${
                showUnused
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-green-500 text-white hover:bg-green-600"
            } shadow-lg`}
        >
          {showUnused ? "Hide" : "Show"} Unused Measurements ({UNUSED_MEASUREMENTS})
        </button>

        {/* Legend */}
        <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-2 text-gray-800">Quantum Surface Code</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-400" />
              <span>Data Qubits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-300" />
              <span>X Stabilizers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-300" />
              <span>Z Stabilizers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-500" />
              <span>Measurements</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-500 opacity-50" />
              <span>Unused Measurements</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <pre className="absolute bottom-4 left-4 bg-white/80 backdrop-blur p-3 rounded text-xs font-mono text-gray-700 max-w-xs overflow-auto border border-gray-200">
{JSON.stringify(stats, null, 2)}
      </pre>

        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            attributionPosition="bottom-left"
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnScroll
            zoomOnScroll
        >
          <Background color="#e5e7eb" gap={24} />
        </ReactFlow>
      </div>
  )
}
