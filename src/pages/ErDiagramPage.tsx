import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Image as ImageIcon,
  Layers,
  Key,
  Link,
  Info,
  RefreshCw,
} from 'lucide-react';
import { TableMeta, TableColumn } from '../types/rems';

interface TablePosition {
  x: number;
  y: number;
}

export const ErDiagramPage: React.FC = () => {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'interactive' | 'static'>('interactive');
  const [selectedTable, setSelectedTable] = useState<TableMeta | null>(null);

  // Pan and zoom state
  const [scale, setScale] = useState(0.85);
  const [offset, setOffset] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Draggable table node coordinates (initial default layout)
  const [positions, setPositions] = useState<Record<string, TablePosition>>({
    plant: { x: 380, y: 40 },
    equipment: { x: 40, y: 320 },
    battery: { x: 300, y: 320 },
    generation_record: { x: 560, y: 320 },
    tariff: { x: 860, y: 40 },
    consumer: { x: 860, y: 260 },
    meter: { x: 860, y: 480 },
    meter_reading: { x: 860, y: 680 },
    bill: { x: 1140, y: 500 },
    carbon_credit: { x: 560, y: 540 },
    alert: { x: 1140, y: 40 },
    config: { x: 1380, y: 40 },
    audit_log: { x: 1380, y: 280 },
  });

  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch('/api/db/schema')
      .then((res) => res.json())
      .then((data) => {
        if (data.tables) {
          setTables(data.tables);
          if (data.tables.length > 0) {
            setSelectedTable(data.tables[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'diagram-canvas') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (draggingTable) {
      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;
      setPositions((prev) => ({
        ...prev,
        [draggingTable]: {
          x: Math.max(10, (prev[draggingTable]?.x || 0) + dx),
          y: Math.max(10, (prev[draggingTable]?.y || 0) + dy),
        },
      }));
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingTable(null);
  };

  const handleTableMouseDown = (tableName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingTable(tableName);
    dragStart.current = { x: e.clientX, y: e.clientY };
    const t = tables.find((x) => x.tableName === tableName);
    if (t) setSelectedTable(t);
  };

  // Export diagram as PNG
  const exportAsPng = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 1400;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#05070B';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'rems_live_er_diagram.png';
        downloadLink.href = png;
        downloadLink.click();
      }
    };
    image.src = blobURL;
  };

  // Find all foreign key relationships
  const relationships: { from: string; to: string; fromCol: string; toCol: string }[] = [];
  tables.forEach((t) => {
    t.columns.forEach((c) => {
      if (c.foreignKey) {
        relationships.push({
          from: t.tableName,
          to: c.foreignKey.foreignTable,
          fromCol: c.columnName,
          toCol: c.foreignKey.foreignColumn,
        });
      }
    });
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#05070B]">
      {/* Top Diagram Toolbar */}
      <div className="h-11 bg-[#0B1018] border-b border-[#16202E] px-4 flex items-center justify-between shrink-0 text-xs">
        {/* Toggle Live vs Static */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-[#05070B] border border-[#16202E] rounded-[2px]">
            <button
              onClick={() => setViewMode('interactive')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] font-mono transition-colors cursor-pointer ${
                viewMode === 'interactive'
                  ? 'bg-[#2F6BFF] text-white font-medium'
                  : 'text-[#7C8BA1] hover:text-[#E6EDF7]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Live Schema View</span>
            </button>
            <button
              onClick={() => setViewMode('static')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] font-mono transition-colors cursor-pointer ${
                viewMode === 'static'
                  ? 'bg-[#2F6BFF] text-white font-medium'
                  : 'text-[#7C8BA1] hover:text-[#E6EDF7]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Static ER Spec</span>
            </button>
          </div>

          <span className="font-mono text-[11px] text-[#7C8BA1] pl-2 border-l border-[#16202E]">
            {tables.length} tables • {relationships.length} foreign key links
          </span>
        </div>

        {/* Zoom & Export Actions */}
        {viewMode === 'interactive' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#05070B] border border-[#16202E] rounded-[2px] p-0.5 font-mono">
              <button
                onClick={() => setScale((s) => Math.max(0.4, s - 0.1))}
                title="Zoom Out"
                className="p-1 text-[#7C8BA1] hover:text-[#E6EDF7] rounded-[2px]"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[11px] text-[#7C8BA1]">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(2.0, s + 0.1))}
                title="Zoom In"
                className="p-1 text-[#7C8BA1] hover:text-[#E6EDF7] rounded-[2px]"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setScale(0.85);
                  setOffset({ x: 50, y: 50 });
                }}
                title="Reset View"
                className="p-1 text-[#7C8BA1] hover:text-[#5B9BFF] rounded-[2px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={exportAsPng}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-xs font-mono text-[#E6EDF7] rounded-[2px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#5B9BFF]" />
              <span>Export PNG</span>
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {viewMode === 'static' ? (
          <div className="flex-1 bg-[#05070B] overflow-auto p-6 flex flex-col items-center">
            <div className="max-w-6xl w-full flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#16202E]">
                <span className="font-mono text-xs text-[#5B9BFF] font-semibold uppercase">
                  Static Reference ER Diagram (rems_project.sql Specification)
                </span>
                <span className="font-mono text-[11px] text-[#7C8BA1]">
                  Asset: public/assets/aistudio/er_diagram_f1a967dd.png
                </span>
              </div>
              <div className="border border-[#16202E] rounded-[2px] bg-[#0B1018] p-4 flex items-center justify-center">
                <img
                  src="/assets/aistudio/er_diagram_f1a967dd.png"
                  alt="REMS Static ER Diagram"
                  className="max-w-full h-auto object-contain rounded-[2px]"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Interactive Canvas */}
            <div
              id="diagram-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="flex-1 bg-[#05070B] overflow-hidden cursor-grab active:cursor-grabbing select-none relative"
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[#5B9BFF]">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Generating live ER diagram from information_schema...
                </div>
              )}

              <svg
                ref={svgRef}
                className="w-full h-full"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: '0 0',
                }}
              >
                <defs>
                  <marker
                    id="fk-arrow"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#2F6BFF" />
                  </marker>
                </defs>

                {/* Relationship Lines */}
                {relationships.map((rel, i) => {
                  const fromPos = positions[rel.from] || { x: 100, y: 100 };
                  const toPos = positions[rel.to] || { x: 300, y: 300 };

                  const x1 = fromPos.x + 110;
                  const y1 = fromPos.y + 40;
                  const x2 = toPos.x + 110;
                  const y2 = toPos.y + 40;

                  // Curved orthogonal path
                  const midX = (x1 + x2) / 2;
                  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                  return (
                    <g key={i}>
                      <path
                        d={path}
                        fill="none"
                        stroke="#1E2C42"
                        strokeWidth="1.5"
                        markerEnd="url(#fk-arrow)"
                      />
                    </g>
                  );
                })}

                {/* Table Nodes */}
                {tables.map((table) => {
                  const pos = positions[table.tableName] || { x: 100, y: 100 };
                  const isSelected = selectedTable?.tableName === table.tableName;
                  const pkColumn = table.columns.find((c) => c.isPrimaryKey);

                  return (
                    <g
                      key={table.tableName}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onMouseDown={(e) => handleTableMouseDown(table.tableName, e)}
                      className="cursor-move"
                    >
                      {/* Table Box */}
                      <rect
                        width="220"
                        height={Math.min(260, 42 + table.columns.length * 20)}
                        fill="#0B1018"
                        stroke={isSelected ? '#5B9BFF' : '#16202E'}
                        strokeWidth={isSelected ? '2' : '1'}
                        rx="3"
                        filter="drop-shadow(0 4px 10px rgba(0,0,0,0.6))"
                      />

                      {/* Table Header */}
                      <rect
                        width="220"
                        height="32"
                        fill={isSelected ? '#13233E' : '#0E141F'}
                        rx="3"
                      />
                      <line x1="0" y1="32" x2="220" y2="32" stroke="#16202E" strokeWidth="1" />

                      <text
                        x="10"
                        y="20"
                        fill="#E6EDF7"
                        fontSize="11"
                        fontFamily="IBM Plex Mono"
                        fontWeight="600"
                      >
                        rems.{table.tableName}
                      </text>

                      <text
                        x="210"
                        y="20"
                        textAnchor="end"
                        fill="#7C8BA1"
                        fontSize="10"
                        fontFamily="IBM Plex Mono"
                      >
                        {table.rowCount} rows
                      </text>

                      {/* Columns List */}
                      {table.columns.slice(0, 10).map((col, idx) => {
                        const y = 50 + idx * 20;
                        return (
                          <g key={col.columnName}>
                            {col.isPrimaryKey ? (
                              <text
                                x="10"
                                y={y}
                                fill="#5B9BFF"
                                fontSize="9"
                                fontFamily="IBM Plex Mono"
                                fontWeight="bold"
                              >
                                PK
                              </text>
                            ) : col.foreignKey ? (
                              <text
                                x="10"
                                y={y}
                                fill="#F59E0B"
                                fontSize="9"
                                fontFamily="IBM Plex Mono"
                              >
                                FK
                              </text>
                            ) : (
                              <text
                                x="10"
                                y={y}
                                fill="#7C8BA1"
                                fontSize="9"
                                fontFamily="IBM Plex Mono"
                              >
                                •
                              </text>
                            )}

                            <text
                              x="32"
                              y={y}
                              fill={col.isPrimaryKey ? '#5B9BFF' : '#E6EDF7'}
                              fontSize="10"
                              fontFamily="IBM Plex Mono"
                            >
                              {col.columnName}
                            </text>

                            <text
                              x="210"
                              y={y}
                              textAnchor="end"
                              fill="#7C8BA1"
                              fontSize="9"
                              fontFamily="IBM Plex Mono"
                            >
                              {col.dataType.split('(')[0]}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Sidebar Table Inspector Panel */}
            {selectedTable && (
              <div className="w-80 bg-[#0B1018] border-l border-[#16202E] flex flex-col shrink-0 text-xs select-none">
                <div className="p-3 bg-[#0E141F] border-b border-[#16202E] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#2F6BFF]" />
                    <span className="font-mono font-semibold text-[#E6EDF7]">
                      rems.{selectedTable.tableName}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.2 rounded-[2px]">
                    {selectedTable.rowCount} records
                  </span>
                </div>

                <div className="p-3 flex flex-col gap-3 overflow-y-auto">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono uppercase text-[#7C8BA1]">
                      Columns &amp; Types ({selectedTable.columns.length})
                    </span>
                    <div className="flex flex-col gap-1 border border-[#16202E] rounded-[2px] p-2 bg-[#05070B]">
                      {selectedTable.columns.map((c) => (
                        <div
                          key={c.columnName}
                          className="flex items-center justify-between font-mono text-[11px] py-0.5 border-b border-[#121822] last:border-0"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {c.isPrimaryKey && <Key className="w-3 h-3 text-[#5B9BFF] shrink-0" />}
                            {c.foreignKey && <Link className="w-3 h-3 text-[#F59E0B] shrink-0" />}
                            <span
                              className={
                                c.isPrimaryKey ? 'text-[#5B9BFF] font-semibold' : 'text-[#E6EDF7]'
                              }
                            >
                              {c.columnName}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#7C8BA1] shrink-0">{c.dataType}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Foreign Key Outbounds */}
                  {selectedTable.columns.some((c) => c.foreignKey) && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase text-[#F59E0B]">
                        Foreign Key References
                      </span>
                      <div className="flex flex-col gap-1">
                        {selectedTable.columns
                          .filter((c) => c.foreignKey)
                          .map((c) => (
                            <div
                              key={c.columnName}
                              className="p-2 bg-[#0E141F] border border-[#16202E] rounded-[2px] font-mono text-[11px]"
                            >
                              <div className="text-[#E6EDF7] font-medium">{c.columnName}</div>
                              <div className="text-[10px] text-[#7C8BA1] mt-0.5">
                                → rems.{c.foreignKey?.foreignTable}({c.foreignKey?.foreignColumn})
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 bg-[#070A0F] border border-[#16202E] rounded-[2px] text-[11px] text-[#7C8BA1] leading-relaxed">
                    <span className="text-[#5B9BFF] font-semibold font-mono">Real-Time Sync:</span>{' '}
                    This diagram is rendered dynamically from PostgreSQL{' '}
                    <code className="text-[#E6EDF7] font-mono">information_schema</code>. Any DDL
                    executed in SQL Console reflects here instantly.
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
