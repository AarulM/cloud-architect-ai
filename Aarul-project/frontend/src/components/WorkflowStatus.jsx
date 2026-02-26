import React from 'react';

/**
 * Multi-agent workflow status component
 */
const WorkflowStatus = ({ currentPhase, agents, onPhaseClick }) => {
  const phases = [
    {
      id: 'requirements',
      name: 'Requirements',
      icon: 'fas fa-clipboard-list',
      description: 'Gathering stakeholder needs'
    },
    {
      id: 'executive-summary',
      name: 'Executive Summary',
      icon: 'fas fa-chart-line',
      description: 'Creating project overview'
    },
    {
      id: 'current-state',
      name: 'Current State Analysis',
      icon: 'fas fa-search',
      description: 'Analyzing existing infrastructure'
    },
    {
      id: 'requirements-analysis',
      name: 'Requirements Analysis',
      icon: 'fas fa-microscope',
      description: 'Deep dive into requirements'
    },
    {
      id: 'proposed-architecture',
      name: 'Proposed Architecture',
      icon: 'fas fa-drafting-compass',
      description: 'Designing optimal solution'
    },
    {
      id: 'implementation-approach',
      name: 'Implementation Approach',
      icon: 'fas fa-code',
      description: 'Planning implementation strategy'
    },
    {
      id: 'recommendations',
      name: 'Recommendations',
      icon: 'fas fa-lightbulb',
      description: 'Strategic recommendations'
    }
  ];

  const mockAgents = agents || [
    { name: 'Requirements Agent', status: 'active', progress: 85 },
    { name: 'Design Agent', status: 'waiting', progress: 0 },
    { name: 'Security Agent', status: 'idle', progress: 0 },
    { name: 'Cost Agent', status: 'idle', progress: 0 },
    { name: 'Performance Agent', status: 'idle', progress: 0 },
    { name: 'Code Generator', status: 'idle', progress: 0 }
  ];

  const getPhaseStatus = (phaseId) => {
    if (phaseId === currentPhase) return 'active';
    const phaseIndex = phases.findIndex(p => p.id === phaseId);
    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    return phaseIndex < currentIndex ? 'completed' : 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'idle': return 'text-gray-400 bg-gray-100';
      default: return 'text-gray-400 bg-gray-100';
    }
  };

  const getAgentIcon = (status) => {
    switch (status) {
      case 'active': return 'fas fa-cog fa-spin text-blue-500';
      case 'waiting': return 'fas fa-clock text-yellow-500';
      case 'completed': return 'fas fa-check-circle text-green-500';
      default: return 'fas fa-robot text-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        <i className="fas fa-tasks mr-2 text-blue-600"></i>
        Workflow Status
      </h2>

      {/* Phase Progress */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-700 mb-4">Current Phase: {phases.find(p => p.id === currentPhase)?.name || 'Requirements'}</h3>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(phase.id);
            const isActive = phase.id === currentPhase;
            
            return (
              <div key={phase.id} className="flex items-center">
                <button
                  onClick={() => onPhaseClick && onPhaseClick(phase.id)}
                  className={`flex flex-col items-center p-3 rounded-lg min-w-[120px] transition-all ${
                    isActive
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : status === 'completed'
                      ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <i className={`${phase.icon} text-2xl mb-2 ${
                    isActive ? 'text-blue-600' : 
                    status === 'completed' ? 'text-green-600' : 'text-gray-400'
                  }`}></i>
                  <span className={`text-xs font-medium text-center ${
                    isActive ? 'text-blue-800' : 
                    status === 'completed' ? 'text-green-800' : 'text-gray-600'
                  }`}>
                    {phase.name}
                  </span>
                  <span className="text-xs text-gray-500 text-center mt-1">
                    {phase.description}
                  </span>
                </button>
                
                {index < phases.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    status === 'completed' ? 'bg-green-400' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Agents */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-4">Agent Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mockAgents.map((agent, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className={getAgentIcon(agent.status)}></i>
                <div>
                  <span className="font-medium text-sm">{agent.name}</span>
                  <div className={`text-xs px-2 py-0.5 rounded-full inline-block ml-2 ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </div>
                </div>
              </div>
              
              {agent.progress > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${agent.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{agent.progress}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
            <i className="fas fa-play mr-1"></i>
            Resume Workflow
          </button>
          <button className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200">
            <i className="fas fa-pause mr-1"></i>
            Pause
          </button>
          <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
            <i className="fas fa-redo mr-1"></i>
            Restart Phase
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStatus;