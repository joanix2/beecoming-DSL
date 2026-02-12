import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { UMLClass } from '@/types/uml';
import { useUMLStore } from '@/stores/umlStore';

const visibilitySymbol = (v: string) => {
  switch (v) {
    case '+': return '+';
    case '-': return '−';
    case '#': return '#';
    case '~': return '~';
    default: return '+';
  }
};

const ClassNode = memo(({ data, id, selected }: NodeProps) => {
  const setSelectedClass = useUMLStore((s) => s.setSelectedClass);

  const cls = data as unknown as UMLClass;

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 overflow-hidden shadow-lg transition-shadow ${
        selected ? 'border-primary shadow-primary/20' : 'border-node-border shadow-black/20'
      }`}
      style={{ background: 'hsl(var(--node-bg))' }}
      onClick={() => setSelectedClass(id)}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-primary !border-2 !border-primary-foreground" />

      {/* Header */}
      <div className="px-3 py-2 text-center border-b border-node-border" style={{ background: 'hsl(var(--node-header) / 0.15)' }}>
        {cls.isAbstract && (
          <div className="text-[10px] text-muted-foreground italic font-mono">{'<<abstract>>'}</div>
        )}
        <div className={`font-bold text-sm font-mono ${cls.isAbstract ? 'italic' : ''}`} style={{ color: 'hsl(var(--node-header))' }}>
          {cls.name}
        </div>
      </div>

      {/* Attributes */}
      <div className="px-3 py-1.5 border-b border-node-border min-h-[24px]">
        {cls.attributes.length === 0 && (
          <div className="text-[10px] text-muted-foreground italic">no attributes</div>
        )}
        {cls.attributes.map((attr) => (
          <div key={attr.id} className="text-xs font-mono py-0.5 flex items-center gap-1">
            <span className="text-node-attribute">{visibilitySymbol(attr.visibility)}</span>
            <span className={`${attr.isStatic ? 'underline' : ''}`}>
              {attr.name}
            </span>
            <span className="text-muted-foreground">: {attr.type}</span>
          </div>
        ))}
      </div>

      {/* Methods */}
      <div className="px-3 py-1.5 min-h-[24px]">
        {cls.methods.length === 0 && (
          <div className="text-[10px] text-muted-foreground italic">no methods</div>
        )}
        {cls.methods.map((method) => (
          <div key={method.id} className="text-xs font-mono py-0.5 flex items-center gap-1">
            <span className="text-node-method">{visibilitySymbol(method.visibility)}</span>
            <span className={`${method.isStatic ? 'underline' : ''} ${method.isAbstract ? 'italic' : ''}`}>
              {method.name}({method.parameters})
            </span>
            <span className="text-muted-foreground">: {method.returnType}</span>
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-primary !border-2 !border-primary-foreground" />
    </div>
  );
});

ClassNode.displayName = 'ClassNode';
export default ClassNode;
