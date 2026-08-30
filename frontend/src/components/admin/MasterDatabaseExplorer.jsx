import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Download, RefreshCw, Layers, Table, 
  ArrowUpDown, ChevronLeft, ChevronRight, Eye, Code, 
  CheckCircle2, XCircle, FileSpreadsheet, ShieldAlert, Sparkles, Filter, Copy, Check
} from 'lucide-react';

const API_BASE = '/api/admin';

export default function MasterDatabaseExplorer() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState({ rows: [], columns: [], total: 0, totalPages: 1, page: 1, limit: 25 });
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTabSubView, setActiveTabSubView] = useState('data'); // 'data' | 'schema'
  const [jsonModalData, setJsonModalData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Fetch Tables list on mount
  useEffect(() => {
    fetchTables();
  }, []);

  // Fetch Table rows when selectedTable, page, pageSize, sort, or search changes
  useEffect(() => {
    if (selectedTable) {
      fetchTableRows(selectedTable, currentPage, pageSize, search, sortColumn, sortDirection);
    }
  }, [selectedTable, currentPage, pageSize, sortColumn, sortDirection]);

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const res = await fetch(`${API_BASE}/database/tables`);
      const data = await res.json();
      if (data.success && data.tables) {
        setTables(data.tables);
        if (data.tables.length > 0 && !selectedTable) {
          // Default to users or user_login_history or first table
          const defaultTable = data.tables.find(t => t.name === 'users') || data.tables[0];
          setSelectedTable(defaultTable.name);
        }
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchTableRows = async (tableName, page = 1, limit = 25, searchTerm = '', sortCol = '', sortDir = 'DESC') => {
    if (!tableName) return;
    setLoadingData(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchTerm,
        sortColumn: sortCol,
        sortDirection: sortDir
      });
      const res = await fetch(`${API_BASE}/database/table/${encodeURIComponent(tableName)}?${params}`);
      const data = await res.json();
      if (data.success) {
        setTableData(data);
      }
    } catch (err) {
      console.error('Error fetching table rows:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTableRows(selectedTable, 1, pageSize, search, sortColumn, sortDirection);
  };

  const handleSort = (colName) => {
    if (sortColumn === colName) {
      setSortDirection(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortColumn(colName);
      setSortDirection('ASC');
    }
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    if (!selectedTable) return;
    const url = `${API_BASE}/database/table/${encodeURIComponent(selectedTable)}/export-csv?search=${encodeURIComponent(search)}`;
    window.open(url, '_blank');
  };

  const handleExportJson = () => {
    if (!tableData.rows || tableData.rows.length === 0) return;
    const blob = new Blob([JSON.stringify(tableData.rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_page${currentPage}_export.json`;
    a.click();
  };

  const currentTableObj = tables.find(t => t.name === selectedTable);

  const formatCellValue = (val, colName) => {
    if (val === null || val === undefined) return <span className="text-slate-400 italic">null</span>;
    if (typeof val === 'boolean') {
      return val ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">TRUE</span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700">FALSE</span>
      );
    }
    
    // Check if it's a JSON string
    if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('[')) && (val.endsWith('}') || val.endsWith(']'))) {
      try {
        const parsed = JSON.parse(val);
        return (
          <button
            onClick={() => setJsonModalData({ column: colName, data: parsed, raw: val })}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all cursor-pointer"
          >
            <Code className="w-3 h-3 text-blue-600" />
            <span>View JSON ({Array.isArray(parsed) ? `${parsed.length} items` : 'Object'})</span>
          </button>
        );
      } catch (e) {}
    }

    if (typeof val === 'string' && val.startsWith('🔒')) {
      return <span className="text-amber-800 font-mono text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{val}</span>;
    }

    // Role tags
    if (colName === 'role') {
      const colors = {
        student: 'bg-blue-100 text-blue-800 border-blue-200',
        company: 'bg-amber-100 text-amber-900 border-amber-200',
        faculty: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        admin: 'bg-purple-100 text-purple-900 border-purple-200',
        alumni: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        security: 'bg-rose-100 text-rose-900 border-rose-200'
      };
      return (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase border ${colors[val] || 'bg-slate-100 text-slate-800'}`}>
          {val}
        </span>
      );
    }

    // Status tags
    if (colName === 'status' || colName === 'session_status' || colName === 'access_status') {
      const isPositive = ['active', 'approved', 'placed', 'sent', 'shortlisted'].includes(String(val).toLowerCase());
      const isNegative = ['blocked', 'rejected', 'failed', 'inactive'].includes(String(val).toLowerCase());
      return (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
          isPositive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
          isNegative ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-800'
        }`}>
          {String(val)}
        </span>
      );
    }

    return <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate block max-w-xs">{String(val)}</span>;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xl bg-white/95 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-800 text-amber-300 flex items-center justify-center shadow-lg font-black shrink-0">
              <Database className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Master System Database Explorer
                </h1>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 rounded-full text-[10px] font-black uppercase">
                  {tables.length} Total Tables ({tables.reduce((a, b) => a + (b.rowCount || 0), 0)} Records)
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Live SQLite WAL Mode
                </span>
              </div>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                Direct read access and query engine for all SQLite tables, schema architectures, and relational entities.
              </p>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={fetchTables}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-slate-300"
              title="Refresh Tables"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTables ? 'animate-spin' : ''}`} />
              <span>Refresh Tables</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={!selectedTable || tableData.total === 0}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md hover:scale-105 cursor-pointer"
              title="Download entire selected table as CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>📥 Export CSV</span>
            </button>

            <button
              onClick={handleExportJson}
              disabled={!selectedTable || tableData.rows.length === 0}
              className="px-3.5 py-2 bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md hover:scale-105 cursor-pointer"
              title="Download current page records as JSON"
            >
              <Code className="w-4 h-4 text-amber-300" />
              <span>📄 Export JSON</span>
            </button>
          </div>
        </div>

        {/* Table Selector Grid / Chips */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-900" /> Select Database Table to Inspect:
            </label>
            <span className="text-[10px] font-bold text-slate-500">
              Click any table below to load live records
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50/80 rounded-2xl border border-slate-200 custom-scrollbar">
            {tables.map(table => {
              const isSelected = selectedTable === table.name;
              return (
                <button
                  key={table.name}
                  onClick={() => {
                    setSelectedTable(table.name);
                    setCurrentPage(1);
                    setSearch('');
                    setSortColumn('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-900 text-white shadow-md ring-2 ring-blue-500/30'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-950'
                  }`}
                >
                  <Table className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span className="font-mono text-xs">{table.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-blue-950 text-amber-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {table.rowCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table Control Bar */}
      {selectedTable && (
        <div className="glass-panel p-4 rounded-3xl border border-slate-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-3 bg-white/95">
          {/* Active Table Title & Sub-View Switcher */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 font-mono flex items-center gap-1.5">
                <Table className="w-4 h-4 text-blue-900" />
                <span>{selectedTable}</span>
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md text-[10px] font-black border border-blue-200">
                {tableData.total} Total Rows
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-black">
                {currentTableObj?.columnsCount || tableData.columns?.length || 0} Columns
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 ml-auto md:ml-2">
              <button
                onClick={() => setActiveTabSubView('data')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTabSubView === 'data' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Data Records
              </button>
              <button
                onClick={() => setActiveTabSubView('schema')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTabSubView === 'schema' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Table Schema
              </button>
            </div>
          </div>

          {/* Search Bar & Page Size Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${selectedTable}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    fetchTableRows(selectedTable, 1, pageSize, '', sortColumn, sortDirection);
                  }}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </form>

            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value, 10);
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Table Viewer Area */}
      {selectedTable && activeTabSubView === 'data' && (
        <div className="glass-panel rounded-3xl border border-slate-200 shadow-xl overflow-hidden bg-white/95">
          {loadingData ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto" />
              <p className="text-xs font-black text-slate-600">Querying live records from SQLite ({selectedTable})...</p>
            </div>
          ) : tableData.rows.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Database className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-black text-slate-800">No records found in {selectedTable}</h3>
              <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto">
                {search ? `No rows matched your search term "${search}". Try clearing the search query.` : 'This table is currently empty.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider shadow-xs">
                  <tr>
                    <th className="py-2.5 px-3 bg-slate-100/95 w-12 text-center text-slate-400">#</th>
                    {tableData.columns.map(col => (
                      <th
                        key={col.name}
                        onClick={() => handleSort(col.name)}
                        className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/80 transition-all select-none whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono">{col.name}</span>
                          {col.pk && <span className="text-[9px] px-1 py-0.2 bg-amber-200 text-amber-900 rounded font-black">PK</span>}
                          <ArrowUpDown className={`w-3 h-3 ${sortColumn === col.name ? 'text-blue-900 font-bold' : 'text-slate-400'}`} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-blue-50/40 transition-all">
                      <td className="py-2.5 px-3 text-center text-[10px] text-slate-400 font-mono">
                        {(currentPage - 1) * pageSize + rIdx + 1}
                      </td>
                      {tableData.columns.map(col => (
                        <td key={col.name} className="py-2.5 px-3 whitespace-nowrap">
                          {formatCellValue(row[col.name], col.name)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 font-bold">
              Showing <span className="font-black text-slate-900">{Math.min(tableData.total, (currentPage - 1) * pageSize + 1)}</span> to{' '}
              <span className="font-black text-slate-900">{Math.min(tableData.total, currentPage * pageSize)}</span> of{' '}
              <span className="font-black text-slate-900">{tableData.total}</span> entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="px-3 py-1.5 bg-blue-900 text-white rounded-xl font-black text-xs">
                Page {currentPage} of {tableData.totalPages || 1}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(tableData.totalPages || 1, prev + 1))}
                disabled={currentPage >= (tableData.totalPages || 1)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Schema Inspector Sub-View */}
      {selectedTable && activeTabSubView === 'schema' && (
        <div className="glass-panel rounded-3xl border border-slate-200 shadow-xl overflow-hidden bg-white/95 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-900" />
                <span>Table Architecture & Column Schema: {selectedTable}</span>
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                PRAGMA definitions, primary keys, not-null constraints, and data types.
              </p>
            </div>
            <span className="text-xs font-black text-blue-900 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
              {tableData.columns.length} Defined Columns
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Column Name</th>
                  <th className="py-2.5 px-4">SQLite Data Type</th>
                  <th className="py-2.5 px-4">Primary Key (PK)</th>
                  <th className="py-2.5 px-4">NOT NULL Constraint</th>
                  <th className="py-2.5 px-4">Security Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tableData.columns.map(col => (
                  <tr key={col.name} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{col.name}</td>
                    <td className="py-2.5 px-4 font-mono text-blue-700 font-bold uppercase">{col.type || 'TEXT'}</td>
                    <td className="py-2.5 px-4">
                      {col.pk ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                          PRIMARY KEY
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {col.notnull ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-200 text-slate-800">
                          NOT NULL
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">NULLABLE</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {col.name.toLowerCase().includes('password') || col.name.toLowerCase().includes('secret') ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1 w-max">
                          <ShieldAlert className="w-3 h-3 text-rose-700" /> SENSITIVE (ENCRYPTED)
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px]">Standard Entity</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON Viewer Modal */}
      {jsonModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scaleIn">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-black font-mono">
                  JSON Column Inspector: {jsonModalData.column}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(jsonModalData.data)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setJsonModalData(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-emerald-400 custom-scrollbar">
              <pre className="whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(jsonModalData.data, null, 2)}
              </pre>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 text-right">
              <button
                onClick={() => setJsonModalData(null)}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
