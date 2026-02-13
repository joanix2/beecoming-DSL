import { useUMLStore } from '@/stores/umlStore';
import { Button } from '@/components/ui/button';
import {
  Plus, Undo2, Redo2, Download, Upload, Package, Save, Loader2,
} from 'lucide-react';
import { downloadZip } from '@/lib/codeGenerator';
import { apiClient } from '@/lib/api';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export default function Toolbar() {
  const {
    addClass, undo, redo, canUndo, canRedo,
    exportDiagram, importDiagram, saveToLocal, classes,
  } = useUMLStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = () => {
    const diagram = exportDiagram();
    const blob = new Blob([JSON.stringify(diagram, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uml-diagram.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Diagramme exporté');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.classes || !Array.isArray(data.classes)) {
          toast.error('Format JSON invalide');
          return;
        }
        importDiagram(data);
        toast.success(`Importé: ${data.classes.length} classes`);
      } catch {
        toast.error('Erreur de parsing JSON');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    const diagram = exportDiagram();
    if (diagram.classes.length === 0) {
      toast.error('Ajoutez au moins une classe');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Try to use the backend API first
      try {
        const response = await apiClient.generateScaffolding({
          umlData: diagram,
          language: 'python',
          framework: 'fastapi',
          useLlm: false,
        });
        
        toast.success(`Scaffolding généré: ${response.files.length} fichiers`);
        
        // Show additional info if available
        if (response.llmInsights) {
          toast.info(response.llmInsights, { duration: 5000 });
        }
      } catch (apiError) {
        // Fallback to local generation if API is not available
        console.warn('API not available, using local generation:', apiError);
        toast.warning('Backend API non disponible, utilisation de la génération locale');
        await downloadZip(diagram);
        toast.success('ZIP généré avec succès (local)');
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-1 p-2 bg-panel border-b border-border">
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary" onClick={() => addClass()}>
        <Plus className="h-3.5 w-3.5" /> Classe
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)">
        <Undo2 className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={!canRedo()} title="Redo (Ctrl+Y)">
        <Redo2 className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={handleExport} title="Export JSON">
        <Download className="h-3.5 w-3.5" /> Export
      </Button>

      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => fileInputRef.current?.click()} title="Import JSON">
        <Upload className="h-3.5 w-3.5" /> Import
      </Button>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { saveToLocal(); toast.success('Sauvegardé'); }} title="Sauvegarder">
        <Save className="h-3.5 w-3.5" />
      </Button>

      <div className="flex-1" />

      <span className="text-[10px] text-muted-foreground font-mono mr-2">{classes.length} classes</span>

      <Button 
        size="sm" 
        className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" 
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Génération...
          </>
        ) : (
          <>
            <Package className="h-3.5 w-3.5" /> Générer ZIP
          </>
        )}
      </Button>
    </div>
  );
}
