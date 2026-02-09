import React, { useState } from 'react';
import { LabProvider } from './context/LabContext';
import RegisterForm from './modules/Registration/RegisterForm';
import PlanningView from './modules/Planning/PlanningView';
import DashboardView from './modules/Dashboard/DashboardView';
import AbnormalityView from './modules/Dashboard/AbnormalityView';
import TroubleshootingView from './modules/Dashboard/TroubleshootingView';
import DatabaseView from './modules/DatabaseManagement/DatabaseView';
import Sidebar from './components/Sidebar';
import { Settings } from 'lucide-react';

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'register': return <RegisterForm />;
      case 'assign': return <PlanningView />;
      case 'dashboard': return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
      case 'abnormality': return <AbnormalityView />;
      case 'troubleshooting': return <TroubleshootingView />;
      case 'database': return <DatabaseView />;
      default: return <DashboardView />;
    }
  };

  return (
    <LabProvider>
      <div className="flex h-screen bg-slate-100">
        <Sidebar active={activeModule} onNavigate={setActiveModule} />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-full mx-auto">
            {renderModule()}
          </div>
        </main>
      </div>
    </LabProvider>
  );
}

export default App;
