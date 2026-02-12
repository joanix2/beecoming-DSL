import { useEffect, useState } from 'react';
import { useUMLStore } from '@/stores/umlStore';
import UMLCanvas from '@/components/uml/UMLCanvas';
import PropertiesPanel from '@/components/uml/PropertiesPanel';
import ChatPanel from '@/components/uml/ChatPanel';
import Toolbar from '@/components/uml/Toolbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, MessageSquare, Settings2, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const loadFromLocal = useUMLStore((s) => s.loadFromLocal);
  const [rightPanel, setRightPanel] = useState(true);

  useEffect(() => {
    loadFromLocal();
  }, [loadFromLocal]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useUMLStore.getState().undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useUMLStore.getState().redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-4 py-2 border-b border-border bg-panel shrink-0">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <h1 className="font-bold text-sm font-mono text-foreground">
            UML<span className="text-primary">Studio</span>
          </h1>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setRightPanel(!rightPanel)}
        >
          {rightPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
      </header>

      {/* Toolbar */}
      <Toolbar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <UMLCanvas />
        </div>

        {/* Right panel */}
        {rightPanel && (
          <div className="w-80 border-l border-border bg-panel flex flex-col shrink-0">
            <Tabs defaultValue="properties" className="flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-2 bg-panel-header rounded-none h-9">
                <TabsTrigger value="properties" className="text-xs gap-1 font-mono data-[state=active]:bg-secondary">
                  <Settings2 className="h-3 w-3" />
                  Propriétés
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-xs gap-1 font-mono data-[state=active]:bg-secondary">
                  <MessageSquare className="h-3 w-3" />
                  Chat
                </TabsTrigger>
              </TabsList>
              <TabsContent value="properties" className="flex-1 overflow-y-auto mt-0">
                <PropertiesPanel />
              </TabsContent>
              <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
                <ChatPanel />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
