import { useState, useRef, useEffect } from 'react';
import { useUMLStore } from '@/stores/umlStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User } from 'lucide-react';
import type { RelationType } from '@/types/uml';

function processChatCommand(input: string, store: ReturnType<typeof useUMLStore.getState>): string {
  const lower = input.toLowerCase().trim();

  // Add class
  const addClassMatch = lower.match(/(?:ajouter?|créer?|add|create)\s+(?:une?\s+)?(?:classe?\s+)?(\w+)/i);
  if (addClassMatch) {
    const name = addClassMatch[1].charAt(0).toUpperCase() + addClassMatch[1].slice(1);
    store.addClass(name);
    return `✅ Classe **${name}** créée avec succès.`;
  }

  // Remove class
  const removeClassMatch = lower.match(/(?:supprimer?|retirer?|remove|delete)\s+(?:la\s+)?(?:classe?\s+)?(\w+)/i);
  if (removeClassMatch) {
    const name = removeClassMatch[1];
    const cls = store.classes.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (cls) {
      store.removeClass(cls.id);
      return `✅ Classe **${cls.name}** supprimée.`;
    }
    return `❌ Classe "${name}" introuvable.`;
  }

  // Rename class
  const renameMatch = lower.match(/(?:renommer?|rename)\s+(\w+)\s+(?:en|to|->)\s+(\w+)/i);
  if (renameMatch) {
    const oldName = renameMatch[1];
    const newName = renameMatch[2].charAt(0).toUpperCase() + renameMatch[2].slice(1);
    const cls = store.classes.find((c) => c.name.toLowerCase() === oldName.toLowerCase());
    if (cls) {
      store.updateClass(cls.id, { name: newName });
      return `✅ Classe renommée: **${oldName}** → **${newName}**`;
    }
    return `❌ Classe "${oldName}" introuvable.`;
  }

  // Add relation
  const relMatch = lower.match(/(?:relier?|connect|link|associer?)\s+(\w+)\s+(?:et|and|to|avec|->)\s+(\w+)(?:\s+(?:en|as|type)\s+(association|héritage|inheritance|agrégation|aggregation|composition))?/i);
  if (relMatch) {
    const src = store.classes.find((c) => c.name.toLowerCase() === relMatch[1].toLowerCase());
    const tgt = store.classes.find((c) => c.name.toLowerCase() === relMatch[2].toLowerCase());
    if (!src) return `❌ Classe "${relMatch[1]}" introuvable.`;
    if (!tgt) return `❌ Classe "${relMatch[2]}" introuvable.`;
    const typeMap: Record<string, RelationType> = {
      'héritage': 'inheritance', 'inheritance': 'inheritance',
      'agrégation': 'aggregation', 'aggregation': 'aggregation',
      'composition': 'composition',
    };
    const type = relMatch[3] ? (typeMap[relMatch[3].toLowerCase()] || 'association') : 'association';
    store.addRelation(src.id, tgt.id, type);
    return `✅ Relation **${type}** créée: ${src.name} → ${tgt.name}`;
  }

  // Add attribute
  const attrMatch = lower.match(/(?:ajouter?|add)\s+(?:un\s+)?(?:attribut?|champ|field)\s+(\w+)\s*(?::\s*(\w+))?\s+(?:à|to|dans|in)\s+(\w+)/i);
  if (attrMatch) {
    const cls = store.classes.find((c) => c.name.toLowerCase() === attrMatch[3].toLowerCase());
    if (!cls) return `❌ Classe "${attrMatch[3]}" introuvable.`;
    store.addAttribute(cls.id);
    const attrs = store.classes.find((c) => c.id === cls.id)!.attributes;
    const lastAttr = attrs[attrs.length - 1];
    store.updateAttribute(cls.id, lastAttr.id, { name: attrMatch[1], type: attrMatch[2] || 'String' });
    return `✅ Attribut **${attrMatch[1]}: ${attrMatch[2] || 'String'}** ajouté à ${cls.name}`;
  }

  // Add method
  const methodMatch = lower.match(/(?:ajouter?|add)\s+(?:une?\s+)?(?:méthode|method)\s+(\w+)\s+(?:à|to|dans|in)\s+(\w+)/i);
  if (methodMatch) {
    const cls = store.classes.find((c) => c.name.toLowerCase() === methodMatch[2].toLowerCase());
    if (!cls) return `❌ Classe "${methodMatch[2]}" introuvable.`;
    store.addMethod(cls.id);
    const methods = store.classes.find((c) => c.id === cls.id)!.methods;
    const lastMethod = methods[methods.length - 1];
    store.updateMethod(cls.id, lastMethod.id, { name: methodMatch[1] });
    return `✅ Méthode **${methodMatch[1]}()** ajoutée à ${cls.name}`;
  }

  // List classes
  if (lower.match(/(?:lister?|list|montrer?|show|afficher?)\s+(?:les\s+)?classes?/)) {
    if (store.classes.length === 0) return '📋 Aucune classe dans le diagramme.';
    return '📋 Classes:\n' + store.classes.map((c) => `• **${c.name}** (${c.attributes.length} attr, ${c.methods.length} méth)`).join('\n');
  }

  // Help
  if (lower.match(/(?:aide|help|\?)/)) {
    return `🤖 **Commandes disponibles:**
• \`ajouter classe NomClasse\`
• \`supprimer classe NomClasse\`
• \`renommer OldName en NewName\`
• \`relier ClasseA et ClasseB en héritage\`
• \`ajouter attribut nom: Type à Classe\`
• \`ajouter méthode nom à Classe\`
• \`lister classes\``;
  }

  return `🤔 Commande non reconnue. Tapez **aide** pour voir les commandes disponibles.`;
}

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);
  const { chatMessages, addChatMessage } = useUMLStore();

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim()) return;
    addChatMessage({ role: 'user', content: input.trim() });

    const store = useUMLStore.getState();
    const response = processChatCommand(input.trim(), store);
    
    setTimeout(() => {
      addChatMessage({ role: 'assistant', content: response });
    }, 300);

    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs space-y-2 mt-4">
            <Bot className="h-8 w-8 mx-auto text-primary opacity-50" />
            <p className="font-mono">UML Bot</p>
            <p>Tapez <span className="font-mono text-primary">aide</span> pour voir les commandes</p>
          </div>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={`rounded-lg px-3 py-2 text-xs max-w-[85%] font-mono whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-accent" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: ajouter classe User"
            className="h-8 text-xs font-mono bg-secondary border-border flex-1"
          />
          <Button type="submit" size="icon" className="h-8 w-8 shrink-0">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
