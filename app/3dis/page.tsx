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
const GAP = 180

// Distance 3
const DISTANCE = 3
const DATA_QUBITS_PER_LOGICAL = DISTANCE * DISTANCE // 9
const ANCILLA_PER_LOGICAL = 2 * (DISTANCE - 1) * (DISTANCE - 1) // 8
const PHYSICAL_PER_LOGICAL = DATA_QUBITS_PER_LOGICAL + ANCILLA_PER_LOGICAL // 17
const LOGICAL_QUBITS = 2
const TOTAL_PHYSICAL = PHYSICAL_PER_LOGICAL * LOGICAL_QUBITS // 136

// Unused circuits (16 per logical → 128 total)
const UNUSED_PER_LOGICAL = 16
const TOTAL_UNUSED = UNUSED_PER_LOGICAL * LOGICAL_QUBITS // 128

// Layout: 2 rows × 4 logical qubits
const ROWS = 2
const COLS_PER_ROW = 4

interface Patch {
    offsetX: number
    offsetY: number
    distance: number
}
const patches: Patch[] = (() => {
    const list: Patch[] = []
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS_PER_ROW; col++) {
            const offsetX = col * ((DISTANCE - 1) * CELL_SIZE + GAP)
            const offsetY = row * ((DISTANCE - 1) * CELL_SIZE + GAP)
            list.push({ offsetX, offsetY, distance: DISTANCE })
        }
    }
    return list
})()

type NodeType =
    | "data-qubit"
    | "x-stabilizer"
    | "z-stabilizer"
    | "boundary-qubit"
    | "stabilizer-bg"
    | "boundary-triangle"
    | "unused-circuit-bg"

const getNodeStyle = (type: NodeType) => {
    switch (type) {
        case "x-stabilizer":
        case "z-stabilizer":
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
        case "unused-circuit-bg":
            return {
                background: "transparent",
                border: "1.5px dashed #e2e8f0",
                borderRadius: "50%",
                width: STABILIZER_SIZE,
                height: STABILIZER_SIZE,
                zIndex: -10,
                opacity: 0.35,
            }
        default:
            return {}
    }
}

function buildPatch(patch: Patch, index: number): Node[] {
    const d = patch.distance
    const rows = d - 1
    const cols = d - 1
    const ox = patch.offsetX
    const oy = patch.offsetY
    const nodes: Node[] = []

    const id = (base: string, r: number, c: number) => `${base}-${index}-${r}-${c}`

    // Background
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

    // Data qubits (9)
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

    ;[1].forEach(c => {
        const x = ox + c * CELL_SIZE
        const y = oy - CELL_SIZE / 2
        triangle(`tri-top-${index}-${c}`, x, y, CELL_SIZE, CELL_SIZE / 2, "polygon(0% 100%, 50% 0%, 100% 100%)", "#fca5a5")
        addBoundary("boundary-top", x + CELL_SIZE / 2 - STABILIZER_SIZE / 2, y - STABILIZER_SIZE / 2)
    })

    ;[0].forEach(c => {
        const x = ox + c * CELL_SIZE
        const y = oy + rows * CELL_SIZE
        triangle(`tri-bot-${index}-${c}`, x, y, CELL_SIZE, CELL_SIZE / 2, "polygon(0% 0%, 50% 100%, 100% 0%)", "#fca5a5")
        addBoundary("boundary-bottom", x + CELL_SIZE / 2 - STABILIZER_SIZE / 2, y + CELL_SIZE / 2)
    })

    ;[0].forEach(r => {
        const x = ox - CELL_SIZE / 2
        const y = oy + r * CELL_SIZE
        triangle(`tri-left-${index}-${r}`, x, y, CELL_SIZE / 2, CELL_SIZE, "polygon(100% 0%, 0% 50%, 100% 100%)", "#86efac")
        addBoundary("boundary-left", x - STABILIZER_SIZE / 2, y + CELL_SIZE / 2 - STABILIZER_SIZE / 2)
    })

    ;[1].forEach(r => {
        const x = ox + cols * CELL_SIZE
        const y = oy + r * CELL_SIZE
        triangle(`tri-right-${index}-${r}`, x, y, CELL_SIZE / 2, CELL_SIZE, "polygon(0% 0%, 100% 50%, 0% 100%)", "#86efac")
        addBoundary("boundary-right", x + CELL_SIZE / 2, y + CELL_SIZE / 2 - STABILIZER_SIZE / 2)
    })

    return nodes
}

// 128 white dashed unused circuits as background
function addUnusedBackground(totalWidth: number, totalHeight: number): Node[] {
    const nodes: Node[] = []
    const cols = 40
    const rows = Math.ceil(TOTAL_UNUSED / cols)
    const spacingX = totalWidth / cols
    const spacingY = totalHeight / rows

    for (let i = 0; i < TOTAL_UNUSED; i++) {
        const row = Math.floor(i / cols)
        const col = i % cols
        const x = col * spacingX
        const y = row * spacingY

        nodes.push({
            id: `unused-bg-${i}`,
            type: "default",
            position: { x, y },
            data: { label: "" },
            style: getNodeStyle("unused-circuit-bg"),
            draggable: false,
            selectable: false,
        })
    }
    return nodes
}

export default function SurfaceCode() {
    const [showBackground, setShowBackground] = useState(true)
    const [showOnlyUnused, setShowOnlyUnused] = useState(false)

    const { fullNodes, width: totalWidth, height: totalHeight } = useMemo(() => {
        const nodes = patches.flatMap((p, i) => buildPatch(p, i))
        const maxX = Math.max(...nodes.map(n => n.position.x + CELL_SIZE)) + 300
        const maxY = Math.max(...nodes.map(n => n.position.y + CELL_SIZE)) + 300
        return { fullNodes: nodes, width: maxX, height: maxY }
    }, [])

    const initialNodes = useMemo(() => {
        let base: Node[] = []

        if (showOnlyUnused) {
            base = addUnusedBackground(totalWidth, totalHeight)
        } else {
            base = fullNodes
            if (showBackground) {
                base = [...base, ...addUnusedBackground(totalWidth, totalHeight)]
            }
        }

        return base
    }, [fullNodes, totalWidth, totalHeight, showBackground, showOnlyUnused])

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState([])

    const onConnect: OnConnect = useCallback(
        (connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges]
    )

    const stats = useMemo(() => {
        return {
            logical_qubits: LOGICAL_QUBITS,
            distance: DISTANCE,
            physical_per_logical: PHYSICAL_PER_LOGICAL,
            data_qubits_per_logical: DATA_QUBITS_PER_LOGICAL,
            ancilla_per_logical: ANCILLA_PER_LOGICAL,
            unused_circuits_per_logical: UNUSED_PER_LOGICAL,
            total: {
                physical_qubits: TOTAL_PHYSICAL,
                data_qubits: DATA_QUBITS_PER_LOGICAL * LOGICAL_QUBITS,
                ancilla_qubits: ANCILLA_PER_LOGICAL * LOGICAL_QUBITS,
                unused_circuits: TOTAL_UNUSED,
            },
            view: showOnlyUnused
                ? "unused_only"
                : showBackground
                    ? "full_with_white_background"
                    : "full_no_background",
        }
    }, [showBackground, showOnlyUnused])

    return (
        <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-black/70 backdrop-blur-md border-b border-white/10 p-5 z-50">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    Surface Code — 8 Logical Qubits (d=3)
                </h1>
                <p className="text-sm text-gray-300">17 Physical per Logical • 136 Total</p>
            </div>

            {/* Toggle Buttons */}
            <div className="absolute top-28 left-8 z-40 space-y-3">
                <button
                    onClick={() => setShowOnlyUnused(p => !p)}
                    className={`block w-full px-6 py-3 rounded-xl font-semibold transition-all shadow-xl ${
                        showOnlyUnused
                            ? "bg-gradient-to-r from-red-600 to-pink-600"
                            : "bg-gradient-to-r from-cyan-600 to-blue-600"
                    }`}
                >
                    {showOnlyUnused ? "Show Full Layout" : "Show Only Unused Circuits"}
                </button>

                <button
                    onClick={() => setShowBackground(p => !p)}
                    disabled={showOnlyUnused}
                    className={`block w-full px-6 py-3 rounded-xl font-semibold transition-all shadow-xl ${
                        showOnlyUnused
                            ? "bg-gray-700 opacity-50 cursor-not-allowed"
                            : showBackground
                                ? "bg-gradient-to-r from-green-600 to-emerald-600"
                                : "bg-gray-600"
                    }`}
                >
                    {showBackground ? "Hide White Background" : "Show White Background"}
                </button>
            </div>

            {/* Legend */}
            <div className="absolute top-28 right-8 z-40 bg-black/60 backdrop-blur-lg p-6 rounded-xl border border-white/20 shadow-2xl max-w-xs">
                <h3 className="font-bold text-lg mb-3 text-cyan-300">Legend</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-white border-2 border-gray-600" />
                        <span>Data Qubits (9)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded bg-red-400" />
                        <span>X Stabilizers</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded bg-green-400" />
                        <span>Z Stabilizers</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-gray-500" />
                        <span>Measurements</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 opacity-40" />
                        <span>Unused Circuit (Background)</span>
                    </div>
                </div>
            </div>

            {/* JSON Stats */}
            <pre className="absolute bottom-8 left-8 bg-black/70 backdrop-blur p-5 rounded-lg text-xs font-mono text-green-400 max-w-md overflow-auto border border-cyan-500/30 shadow-xl">
{JSON.stringify(stats, null, 2)}
      </pre>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnScroll
                zoomOnScroll
            >
                <Background color="#0f172a" gap={40} />
            </ReactFlow>
        </div>
    )
}