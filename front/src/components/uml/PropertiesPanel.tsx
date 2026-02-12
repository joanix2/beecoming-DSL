import { useUMLStore } from '@/stores/umlStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Visibility, RelationType } from '@/types/uml';

export default function PropertiesPanel() {
  const {
    classes, relations, selectedClassId, selectedRelationId,
    updateClass, removeClass, addAttribute, updateAttribute, removeAttribute,
    addMethod, updateMethod, removeMethod,
    updateRelation, removeRelation,
  } = useUMLStore();

  const [showAttrs, setShowAttrs] = useState(true);
  const [showMethods, setShowMethods] = useState(true);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedRelation = relations.find((r) => r.id === selectedRelationId);

  if (!selectedClass && !selectedRelation) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        <p className="font-mono">Sélectionnez un élément</p>
        <p className="text-xs mt-2">Cliquez sur une classe ou une relation pour voir ses propriétés</p>
      </div>
    );
  }

  if (selectedRelation) {
    const source = classes.find((c) => c.id === selectedRelation.sourceId);
    const target = classes.find((c) => c.id === selectedRelation.targetId);
    return (
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-primary font-mono">Relation</h3>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeRelation(selectedRelation.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {source?.name || '?'} → {target?.name || '?'}
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Type</label>
          <Select value={selectedRelation.type} onValueChange={(v) => updateRelation(selectedRelation.id, { type: v as RelationType })}>
            <SelectTrigger className="h-8 text-xs font-mono bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['association', 'inheritance', 'aggregation', 'composition', 'dependency', 'realization'] as RelationType[]).map((t) => (
                <SelectItem key={t} value={t} className="text-xs font-mono capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="text-xs text-muted-foreground">Label</label>
          <Input
            value={selectedRelation.label || ''}
            onChange={(e) => updateRelation(selectedRelation.id, { label: e.target.value })}
            className="h-8 text-xs font-mono bg-secondary border-border"
            placeholder="label"
          />
        </div>
      </div>
    );
  }

  if (!selectedClass) return null;

  return (
    <div className="p-3 space-y-3 overflow-y-auto max-h-full">
      {/* Class header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-primary font-mono">Classe</h3>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeClass(selectedClass.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          value={selectedClass.name}
          onChange={(e) => updateClass(selectedClass.id, { name: e.target.value })}
          className="h-8 text-xs font-mono font-bold bg-secondary border-border"
          placeholder="Nom de la classe"
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={selectedClass.isAbstract}
            onChange={(e) => updateClass(selectedClass.id, { isAbstract: e.target.checked })}
            className="accent-primary"
          />
          Abstract
        </label>
      </div>

      {/* Attributes */}
      <div>
        <button onClick={() => setShowAttrs(!showAttrs)} className="flex items-center gap-1 text-xs font-bold text-node-attribute font-mono w-full">
          {showAttrs ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          Attributs ({selectedClass.attributes.length})
        </button>
        {showAttrs && (
          <div className="mt-1 space-y-1">
            {selectedClass.attributes.map((attr) => (
              <div key={attr.id} className="flex items-center gap-1">
                <Select value={attr.visibility} onValueChange={(v) => updateAttribute(selectedClass.id, attr.id, { visibility: v as Visibility })}>
                  <SelectTrigger className="h-7 w-10 text-[10px] font-mono bg-secondary border-border p-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['+', '-', '#', '~'].map((v) => (
                      <SelectItem key={v} value={v} className="text-xs font-mono">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={attr.name}
                  onChange={(e) => updateAttribute(selectedClass.id, attr.id, { name: e.target.value })}
                  className="h-7 text-[10px] font-mono bg-secondary border-border flex-1"
                />
                <Input
                  value={attr.type}
                  onChange={(e) => updateAttribute(selectedClass.id, attr.id, { type: e.target.value })}
                  className="h-7 w-16 text-[10px] font-mono bg-secondary border-border"
                />
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeAttribute(selectedClass.id, attr.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary" onClick={() => addAttribute(selectedClass.id)}>
              <Plus className="h-3 w-3 mr-1" /> Attribut
            </Button>
          </div>
        )}
      </div>

      {/* Methods */}
      <div>
        <button onClick={() => setShowMethods(!showMethods)} className="flex items-center gap-1 text-xs font-bold text-node-method font-mono w-full">
          {showMethods ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          Méthodes ({selectedClass.methods.length})
        </button>
        {showMethods && (
          <div className="mt-1 space-y-1">
            {selectedClass.methods.map((method) => (
              <div key={method.id} className="space-y-1 p-1.5 rounded bg-secondary/50">
                <div className="flex items-center gap-1">
                  <Select value={method.visibility} onValueChange={(v) => updateMethod(selectedClass.id, method.id, { visibility: v as Visibility })}>
                    <SelectTrigger className="h-7 w-10 text-[10px] font-mono bg-secondary border-border p-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['+', '-', '#', '~'].map((v) => (
                        <SelectItem key={v} value={v} className="text-xs font-mono">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={method.name}
                    onChange={(e) => updateMethod(selectedClass.id, method.id, { name: e.target.value })}
                    className="h-7 text-[10px] font-mono bg-secondary border-border flex-1"
                  />
                  <Input
                    value={method.returnType}
                    onChange={(e) => updateMethod(selectedClass.id, method.id, { returnType: e.target.value })}
                    className="h-7 w-14 text-[10px] font-mono bg-secondary border-border"
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeMethod(selectedClass.id, method.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  value={method.parameters}
                  onChange={(e) => updateMethod(selectedClass.id, method.id, { parameters: e.target.value })}
                  className="h-6 text-[10px] font-mono bg-secondary border-border"
                  placeholder="param: Type, ..."
                />
              </div>
            ))}
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary" onClick={() => addMethod(selectedClass.id)}>
              <Plus className="h-3 w-3 mr-1" /> Méthode
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
