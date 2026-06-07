import React from 'react';
import { ClientProfile } from '../../contexts/UserRoleContext';
import { User, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ClientRosterProps {
  clients: ClientProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const ClientRoster: React.FC<ClientRosterProps> = ({ clients, selectedId, onSelect }) => {
  return (
    <div className="divide-y divide-gray-100">
      {clients.map((client) => {
        const isSelected = selectedId === client.id;
        const name = client.application_data?.firstName 
          ? `${client.application_data.firstName} ${client.application_data.lastName}`
          : 'New Candidate';
        
        return (
          <button
            key={client.id}
            onClick={() => onSelect(client.id)}
            className={cn(
              "w-full text-left p-5 transition-all group flex items-center gap-4 border-l-4",
              isSelected 
                ? "bg-blue-50 border-blue-600 shadow-sm" 
                : "border-transparent hover:bg-gray-50 bg-white"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
              isSelected 
                ? "bg-blue-600 border-blue-700 text-white" 
                : "bg-gray-50 border-gray-100 text-gray-400 group-hover:border-gray-200"
            )}>
              <User className="w-5 h-5" />
            </div>
            
            <div className="min-w-0 flex-1 py-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn(
                  "text-sm font-bold truncate",
                  isSelected ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
                )}>
                  {name}
                </p>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-all",
                  isSelected ? "text-blue-600 translate-x-1" : "text-gray-200 opacity-0 group-hover:opacity-100"
                )} />
              </div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">
                ID: {client.id.slice(0, 8)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
