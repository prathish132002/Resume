import React, { useEffect, useState } from 'react';
import { Resume, ResumeVersion } from '../types';
import { storageService } from '../services/storageService';
import { Clock, RotateCcw, X, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';

interface HistoryModalProps {
  resumeId: string;
  onRestore: (resume: Resume) => void;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ resumeId, onRestore, onClose }) => {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);

  useEffect(() => {
    const history = storageService.getVersions(resumeId);
    setVersions(history);
  }, [resumeId]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="text-slate-600" size={20} />
            <h3 className="font-bold text-slate-800">Version History</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-white">
          {versions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Clock size={40} className="mx-auto mb-3 opacity-20" />
              <p>No history found for this resume yet.</p>
              <p className="text-xs mt-2">Versions are saved automatically when you save your resume.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v, index) => (
                <div key={v.id} className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">
                      {index === 0 ? 'Current Version' : `Version from ${new Date(v.timestamp).toLocaleDateString()}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(v.timestamp).toLocaleTimeString()} • {v.resume.experience.length} Exp • {v.resume.skills.length} Skills
                    </p>
                  </div>
                  {index !== 0 && (
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => {
                        if(confirm('Are you sure? This will replace your current content.')) {
                          onRestore(v.resume);
                          onClose();
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <RotateCcw size={14} className="mr-1" /> Restore
                    </Button>
                  )}
                  {index === 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
