import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Folder,
  FileText,
  FileCode,
  FileArchive,
  Database,
  ArrowLeft,
  Upload,
  FolderPlus,
  FilePlus,
  RefreshCw,
  Download,
  Trash2,
  Edit3,
  Search,
  Check,
  ChevronRight,
  HardDrive,
  Save,
  X,
  Sparkles,
  Info,
  HelpCircle,
  FileSpreadsheet,
  Settings
} from 'lucide-react';
import { DirectoryResponse, FileItem } from '../types';

interface FileManagerViewProps {
  onBack: () => void;
  initialPath?: string;
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({ onBack, initialPath = '' }) => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [savingFile, setSavingFile] = useState(false);

  // Modals for Folder, File, Rename, Delete
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renamingItem, setRenamingItem] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [deleteConfirmItem, setDeleteConfirmItem] = useState<FileItem | null>(null);

  // Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoExtract, setAutoExtract] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Offline Guide Modal
  const [showOfflineGuide, setShowOfflineGuide] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDirectory = useCallback(async (pathQuery: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(pathQuery)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to list directory');
      }
      const json: DirectoryResponse = await res.json();
      setData(json);
      setCurrentPath(json.currentPath);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectory(currentPath);
  }, [fetchDirectory, currentPath]);

  // Open File in Editor
  const handleOpenFile = async (file: FileItem) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
      return;
    }

    try {
      const res = await fetch(`/api/files/content?path=${encodeURIComponent(file.path)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to open file');
      }
      const json = await res.json();
      setEditingFile({
        path: json.path,
        name: json.name,
        content: json.content
      });
      setEditorOpen(true);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Save File in Editor
  const handleSaveFile = async () => {
    if (!editingFile) return;
    setSavingFile(true);
    try {
      const res = await fetch('/api/files/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: editingFile.path,
          content: editingFile.content
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save file');
      }
      showToast(`Saved "${editingFile.name}" successfully!`, 'success');
      setEditorOpen(false);
      fetchDirectory(currentPath);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingFile(false);
    }
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch('/api/files/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          folderName: newFolderName.trim()
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create folder');
      showToast(json.message, 'success');
      setNewFolderName('');
      setNewFolderModalOpen(false);
      fetchDirectory(currentPath);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Create File
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    try {
      const res = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          fileName: newFileName.trim(),
          content: ''
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create file');
      showToast(json.message, 'success');
      setNewFileName('');
      setNewFileModalOpen(false);
      fetchDirectory(currentPath);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Rename
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingItem || !renameValue.trim()) return;
    try {
      const res = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: renamingItem.path,
          newName: renameValue.trim()
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to rename item');
      showToast(json.message, 'success');
      setRenameModalOpen(false);
      setRenamingItem(null);
      fetchDirectory(currentPath);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: deleteConfirmItem.path })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete item');
      showToast(json.message, 'success');
      setDeleteConfirmItem(null);
      fetchDirectory(currentPath);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Upload File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetPath: currentPath,
            fileName: file.name,
            base64Data: base64,
            extractZip: autoExtract
          })
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed');
        showToast(json.message, 'success');
        setUploadModalOpen(false);
        fetchDirectory(currentPath);
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Download
  const handleDownload = (item: FileItem) => {
    window.location.href = `/api/files/download?path=${encodeURIComponent(item.path)}`;
  };

  // Filter Items
  const filteredItems = (data?.items || []).filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getItemIcon = (item: FileItem) => {
    if (item.isDirectory) {
      if (item.name === 'worlds') return <Folder className="w-5 h-5 text-emerald-500 fill-emerald-100" />;
      if (item.name === 'backups') return <Database className="w-5 h-5 text-teal-500 fill-teal-100" />;
      if (item.name === 'db') return <Database className="w-5 h-5 text-amber-500 fill-amber-100" />;
      return <Folder className="w-5 h-5 text-blue-500 fill-blue-100" />;
    }
    const ext = item.extension;
    if (ext === 'zip' || ext === 'mcworld') return <FileArchive className="w-5 h-5 text-rose-500" />;
    if (ext === 'json') return <FileCode className="w-5 h-5 text-amber-600" />;
    if (ext === 'properties' || ext === 'conf') return <Settings className="w-5 h-5 text-indigo-600" />;
    if (ext === 'txt' || ext === 'log') return <FileText className="w-5 h-5 text-slate-600" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. TOP HEADER & QUICK SHORTCUTS */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              📁
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                Server File Manager
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                Manage worlds, offline game folders, configs & files
              </p>
            </div>
          </div>

          {/* Quick Offline Guide Button */}
          <button
            type="button"
            onClick={() => setShowOfflineGuide(true)}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Offline Game Restore Guide</span>
          </button>
        </div>

        {/* Quick Folder Shortcuts */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Quick Jump:
          </span>
          <button
            type="button"
            onClick={() => fetchDirectory('')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 border transition-all ${
              currentPath === ''
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Root (/)
          </button>
          <button
            type="button"
            onClick={() => fetchDirectory('worlds')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 border transition-all flex items-center gap-1 ${
              currentPath.startsWith('worlds')
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
          >
            <span>🌍 Worlds</span>
          </button>
          <button
            type="button"
            onClick={() => fetchDirectory('backups')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 border transition-all flex items-center gap-1 ${
              currentPath.startsWith('backups')
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
            }`}
          >
            <span>💾 Backups</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenFile({
              name: 'server.properties',
              path: 'server.properties',
              isDirectory: false,
              size: 0,
              sizeFormatted: '',
              modifiedAt: ''
            })}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-all flex items-center gap-1"
          >
            <span>⚙️ server.properties</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenFile({
              name: 'permissions.json',
              path: 'permissions.json',
              isDirectory: false,
              size: 0,
              sizeFormatted: '',
              modifiedAt: ''
            })}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-all flex items-center gap-1"
          >
            <span>👑 permissions.json</span>
          </button>
        </div>

        {/* 2. BREADCRUMBS BAR */}
        <div className="flex items-center gap-1 text-xs bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 overflow-x-auto no-scrollbar font-mono text-slate-700">
          <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {data?.breadcrumbs.map((b, idx) => (
            <React.Fragment key={b.path || 'root'}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
              <button
                type="button"
                onClick={() => fetchDirectory(b.path)}
                className={`hover:text-amber-600 hover:underline shrink-0 ${
                  idx === data.breadcrumbs.length - 1 ? 'font-bold text-slate-900' : 'text-slate-500'
                }`}
              >
                {b.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* 3. TOOLBAR: SEARCH & ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search current directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => fetchDirectory(currentPath)}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center transition-all active:scale-95"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setNewFolderModalOpen(true)}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shrink-0"
            >
              <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>New Folder</span>
            </button>

            <button
              type="button"
              onClick={() => setNewFileModalOpen(true)}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shrink-0"
            >
              <FilePlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>New File</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. FILE LIST CONTAINER */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-3 py-2.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex-1">Name</span>
          <span className="w-24 text-right hidden sm:block">Size</span>
          <span className="w-32 text-right hidden md:block">Modified</span>
          <span className="w-28 text-right">Actions</span>
        </div>

        {/* Parent Directory Link */}
        {data?.parentPath !== null && data?.parentPath !== undefined && (
          <div
            onClick={() => fetchDirectory(data.parentPath || '')}
            className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 cursor-pointer text-xs font-semibold text-slate-600 transition-colors"
          >
            <Folder className="w-4 h-4 text-slate-400" />
            <span>.. (Up to parent folder)</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs space-y-1">
            <Folder className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">This directory is empty</p>
            <p className="text-[11px]">Upload a file or create a new folder above</p>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
            <p>Loading files & folders...</p>
          </div>
        )}

        {/* Items */}
        {!loading && (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <div
                key={item.path}
                className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50/90 transition-colors group text-xs"
              >
                {/* File/Folder Name & Click Handler */}
                <div
                  onClick={() => handleOpenFile(item)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer pr-2"
                >
                  <div className="shrink-0">{getItemIcon(item)}</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
                      <span className="truncate">{item.name}</span>
                      {item.isEditable && (
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono shrink-0">
                          edit
                        </span>
                      )}
                      {item.extension === 'mcworld' && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold shrink-0">
                          1-click
                        </span>
                      )}
                    </div>
                    {/* Mobile info */}
                    <div className="text-[10px] text-slate-400 sm:hidden">
                      {item.sizeFormatted} · {item.modifiedAt ? new Date(item.modifiedAt).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>

                {/* Size (Desktop) */}
                <div className="w-24 text-right text-slate-500 font-mono text-[11px] hidden sm:block shrink-0">
                  {item.sizeFormatted}
                </div>

                {/* Modified Date (Desktop) */}
                <div className="w-32 text-right text-slate-400 text-[11px] hidden md:block shrink-0">
                  {item.modifiedAt ? new Date(item.modifiedAt).toLocaleDateString() : '-'}
                </div>

                {/* Action Buttons */}
                <div className="w-28 flex items-center justify-end gap-1 shrink-0">
                  {/* Edit button if text file */}
                  {item.isEditable && (
                    <button
                      type="button"
                      onClick={() => handleOpenFile(item)}
                      title="Edit file"
                      className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Download button */}
                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    title={item.isDirectory ? 'Download folder as ZIP' : 'Download file'}
                    className="p-1.5 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Rename button */}
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingItem(item);
                      setRenameValue(item.name);
                      setRenameModalOpen(true);
                    }}
                    title="Rename"
                    className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmItem(item)}
                    title="Delete"
                    className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        <div className="bg-slate-50/90 border-t border-slate-200/80 px-3 py-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>{filteredItems.length} items in this folder</span>
          <span>Total Size: {data?.totalSizeFormatted || '0 B'}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: IN-APP CODE / TEXT EDITOR */}
      {/* ------------------------------------------------------------- */}
      {editorOpen && editingFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Editor Header */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-2">
                <div className="text-xs sm:text-sm font-bold truncate flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{editingFile.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  Path: {editingFile.path}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveFile}
                  disabled={savingFile}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingFile ? 'Saving...' : 'Save File'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editor Textarea */}
            <div className="p-2 sm:p-3 flex-1 overflow-hidden bg-slate-950 flex flex-col">
              <textarea
                value={editingFile.content}
                onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    handleSaveFile();
                  }
                }}
                spellCheck={false}
                className="w-full flex-1 bg-transparent text-emerald-400 font-mono text-xs sm:text-sm p-2 focus:outline-none resize-none overflow-y-auto leading-relaxed"
                placeholder="File is empty..."
              />
            </div>

            {/* Editor Footer */}
            <div className="bg-slate-900/90 text-slate-400 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[10px]">
              <span>Press Ctrl+S to save</span>
              <span>UTF-8 · Bedrock Dedicated Server</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: UPLOAD FILE & RESTORE ZIP / MCWORLD */}
      {/* ------------------------------------------------------------- */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-500" />
                <span>Upload to Current Folder</span>
              </h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Current Directory: <span className="font-mono font-bold text-slate-800">/{currentPath || 'root'}</span>
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoExtract}
                  onChange={(e) => setAutoExtract(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Auto-extract if ZIP or .mcworld world archive</span>
              </label>
              <p className="text-[11px] text-slate-400">
                If checked, uploading a world zip or .mcworld will automatically unzip its chunks & level.dat directly into this directory!
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-6 text-center transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="file-manager-upload-input"
              />
              <label htmlFor="file-manager-upload-input" className="cursor-pointer space-y-2 block">
                <Upload className="w-8 h-8 text-amber-500 mx-auto" />
                <div className="text-xs font-bold text-slate-800">
                  {uploading ? 'Uploading & Processing...' : 'Click to Select File from Device'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Supports .zip, .mcworld, .json, .properties, .txt and behavior packs
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: NEW FOLDER */}
      {/* ------------------------------------------------------------- */}
      {newFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <form onSubmit={handleCreateFolder} className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-blue-600" />
              <span>Create New Folder</span>
            </h3>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. MyCustomPacks"
                autoFocus
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setNewFolderModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: NEW FILE */}
      {/* ------------------------------------------------------------- */}
      {newFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <form onSubmit={handleCreateFile} className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FilePlus className="w-4 h-4 text-emerald-600" />
              <span>Create New File</span>
            </h3>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                File Name (with extension)
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. custom_config.json"
                autoFocus
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setNewFileModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFileName.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Create File
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 5: RENAME */}
      {/* ------------------------------------------------------------- */}
      {renameModalOpen && renamingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <form onSubmit={handleRename} className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Rename "{renamingItem.name}"
            </h3>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                New Name
              </label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRenameModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!renameValue.trim()}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 6: DELETE CONFIRM */}
      {/* ------------------------------------------------------------- */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span>Delete {deleteConfirmItem.isDirectory ? 'Folder' : 'File'}?</span>
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-slate-900">"{deleteConfirmItem.name}"</span>?
              {deleteConfirmItem.isDirectory && ' All files inside this folder will be deleted.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 7: OFFLINE GAME RESTORE GUIDE */}
      {/* ------------------------------------------------------------- */}
      {showOfflineGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Offline Minecraft Game Me Restore Kaise Kare (Guide)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOfflineGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              {/* Method 1: 1-Click .mcworld */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Method 1: 1-Click .mcworld (Sabse Asaan)</span>
                </div>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  World Manager ya Backups me <b>"Download .mcworld"</b> par click kare. Download hone ke baad us file par apne mobile me bas ek baar click/tap kare. Minecraft Bedrock game apne aap open ho jayega aur world successfully import ho jayega!
                </p>
              </div>

              {/* Method 2: Android Data Folder Me Daalna */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Method 2: Android "data" Folder Me Direct Daalna (ZIP Extraction)</span>
                </div>
                <p className="text-amber-800 text-[11px]">
                  Agar aap manual folder me daalna chahte hai, to offline backup ZIP ko download kare aur ZArchiver ya apne File Manager se is exact path par unzip/paste kare:
                </p>
                <div className="bg-white border border-amber-300 rounded-lg p-2 font-mono text-[11px] text-amber-950 select-all break-all">
                  Android/data/com.mojang.minecraftpe/files/games/com.mojang/minecraftWorlds/
                </div>
                <p className="text-[11px] text-amber-800">
                  World folder ke andar <code>levelname.txt</code>, <code>level.dat</code> aur <code>db/</code> folder hona zaroori hai (jo hamare backup structure me automatically 100% configured rehta hai).
                </p>
              </div>

              {/* Method 3: Windows 10/11 PC */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Method 3: Windows Bedrock PC Path</span>
                </div>
                <div className="bg-white border border-blue-300 rounded-lg p-2 font-mono text-[10px] text-blue-950 select-all break-all">
                  %localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\minecraftWorlds
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowOfflineGuide(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Samajh Gaya (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
