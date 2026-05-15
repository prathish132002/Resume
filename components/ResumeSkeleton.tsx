import React from 'react';

const ResumeSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full bg-white rounded-xl shadow-lg p-8 animate-pulse overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-8 w-48 bg-slate-200 rounded-lg mb-3"></div>
        <div className="h-4 w-64 bg-slate-100 rounded-md mb-2"></div>
        <div className="h-3 w-32 bg-slate-100 rounded-md"></div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column (Main content) */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Summary Block */}
          <div>
            <div className="h-5 w-24 bg-slate-200 rounded-md mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-100 rounded"></div>
              <div className="h-3 w-full bg-slate-100 rounded"></div>
              <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
            </div>
          </div>

          {/* Experience Block */}
          <div>
            <div className="h-5 w-32 bg-slate-200 rounded-md mb-4"></div>
            
            {[1, 2].map((i) => (
              <div key={i} className="mb-6">
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-40 bg-slate-200 rounded"></div>
                  <div className="h-4 w-20 bg-slate-100 rounded"></div>
                </div>
                <div className="h-3 w-32 bg-slate-100 rounded mb-3"></div>
                <div className="space-y-2 pl-4">
                  <div className="h-2.5 w-full bg-slate-100 rounded"></div>
                  <div className="h-2.5 w-full bg-slate-100 rounded"></div>
                  <div className="h-2.5 w-5/6 bg-slate-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-8">
          {/* Skills Block */}
          <div>
            <div className="h-5 w-20 bg-slate-200 rounded-md mb-4"></div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-6 w-16 bg-slate-100 rounded-full"></div>
              ))}
            </div>
          </div>

          {/* Education Block */}
          <div>
            <div className="h-5 w-28 bg-slate-200 rounded-md mb-4"></div>
            <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
            <div className="h-3 w-24 bg-slate-100 rounded mb-4"></div>
            <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
            <div className="h-3 w-24 bg-slate-100 rounded"></div>
          </div>

          {/* Languages/Others */}
          <div>
            <div className="h-5 w-24 bg-slate-200 rounded-md mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-100 rounded"></div>
              <div className="h-3 w-full bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>

      </div>

      {/* Shimmering Effect CSS handled by tailwind 'animate-pulse' */}
    </div>
  );
};

export default ResumeSkeleton;
