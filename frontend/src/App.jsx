import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { ChatProvider, useChat } from './context/ChatContext.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Header } from './components/layout/Header.jsx';
import { ChatContainer } from './components/chat/ChatContainer.jsx';
import { MessageInput } from './components/chat/MessageInput.jsx';
import { AuthModal } from './components/common/AuthModal.jsx';
import { SettingsModal } from './components/common/SettingsModal.jsx';

const QueryMindApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { errorToast } = useChat();

  return (
    <div className="app-layout">
      {/* Accessible Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Interface */}
      <div className="main-content">
        <Header
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ChatContainer />
          <MessageInput />
        </main>
      </div>

      {/* Modals & Dialogs */}
      <AuthModal />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Toast Error Alert */}
      {errorToast && (
        <div className="toast-alert" role="alert">
          {errorToast}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <QueryMindApp />
      </ChatProvider>
    </AuthProvider>
  );
}
