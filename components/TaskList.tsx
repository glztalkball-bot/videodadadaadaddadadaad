
import React from 'react';
import { StitchTask } from '../types';

interface TaskListProps {
  tasks: StitchTask[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
      {tasks.map((task) => (
        <div key={task.id} className="p-4 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 md:w-1/3">
            <div className="flex -space-x-4">
              <div className="w-14 h-14 rounded-xl border-2 border-white bg-blue-100 overflow-hidden shadow-sm relative z-20">
                <video src={task.opener.previewUrl} className="w-full h-full object-cover" />
              </div>
              <div className="w-14 h-14 rounded-xl border-2 border-white bg-purple-100 overflow-hidden shadow-sm relative z-10">
                <video src={task.content.previewUrl} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">任务: {task.id.split('-')[1]}</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">2-SEGMENT STITCH</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-[10px] font-bold uppercase ${task.status === 'completed' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                {task.status === 'completed' ? 'Success' : task.status === 'processing' ? 'Processing' : 'Pending'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{task.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${task.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>

          <div className="md:w-48 flex justify-end">
            {task.status === 'completed' && task.resultUrl ? (
              <a 
                href={task.resultUrl} 
                download={`Video_${task.id.split('-')[1]}.mp4`}
                className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-all"
              >
                DOWNLOAD MP4
              </a>
            ) : (
              <div className="px-3 py-1.5 text-[10px] text-slate-300 border border-slate-100 rounded-lg">
                {task.status === 'processing' ? 'RENDERING' : 'WAITING'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
