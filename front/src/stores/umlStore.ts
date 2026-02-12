import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { UMLClass, UMLRelation, UMLDiagram, UMLAttribute, UMLMethod, ChatMessage, Visibility } from '@/types/uml';

interface HistoryEntry {
  classes: UMLClass[];
  relations: UMLRelation[];
}

interface UMLStore {
  classes: UMLClass[];
  relations: UMLRelation[];
  selectedClassId: string | null;
  selectedRelationId: string | null;
  chatMessages: ChatMessage[];
  history: HistoryEntry[];
  historyIndex: number;

  // Class actions
  addClass: (name?: string, x?: number, y?: number) => string;
  updateClass: (id: string, updates: Partial<UMLClass>) => void;
  removeClass: (id: string) => void;
  moveClass: (id: string, x: number, y: number) => void;

  // Attribute actions
  addAttribute: (classId: string) => void;
  updateAttribute: (classId: string, attrId: string, updates: Partial<UMLAttribute>) => void;
  removeAttribute: (classId: string, attrId: string) => void;

  // Method actions
  addMethod: (classId: string) => void;
  updateMethod: (classId: string, methodId: string, updates: Partial<UMLMethod>) => void;
  removeMethod: (classId: string, methodId: string) => void;

  // Relation actions
  addRelation: (sourceId: string, targetId: string, type: UMLRelation['type']) => void;
  updateRelation: (id: string, updates: Partial<UMLRelation>) => void;
  removeRelation: (id: string) => void;

  // Selection
  setSelectedClass: (id: string | null) => void;
  setSelectedRelation: (id: string | null) => void;

  // Chat
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Import/Export
  exportDiagram: () => UMLDiagram;
  importDiagram: (diagram: UMLDiagram) => void;

  // Persistence
  saveToLocal: () => void;
  loadFromLocal: () => boolean;
}

const STORAGE_KEY = 'uml-diagram-save';

const pushHistory = (state: { classes: UMLClass[]; relations: UMLRelation[]; history: HistoryEntry[]; historyIndex: number }) => {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push({
    classes: JSON.parse(JSON.stringify(state.classes)),
    relations: JSON.parse(JSON.stringify(state.relations)),
  });
  return { history: newHistory, historyIndex: newHistory.length - 1 };
};

export const useUMLStore = create<UMLStore>((set, get) => ({
  classes: [],
  relations: [],
  selectedClassId: null,
  selectedRelationId: null,
  chatMessages: [],
  history: [{ classes: [], relations: [] }],
  historyIndex: 0,

  addClass: (name?: string, x?: number, y?: number) => {
    const id = uuidv4();
    set((s) => {
      const newClass: UMLClass = {
        id,
        name: name || `Class${s.classes.length + 1}`,
        isAbstract: false,
        attributes: [],
        methods: [],
        x: x ?? 100 + Math.random() * 300,
        y: y ?? 100 + Math.random() * 200,
      };
      const newState = { classes: [...s.classes, newClass], relations: s.relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState), selectedClassId: id };
    });
    get().saveToLocal();
    return id;
  },

  updateClass: (id, updates) => {
    set((s) => {
      const classes = s.classes.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const newState = { classes, relations: s.relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState) };
    });
    get().saveToLocal();
  },

  removeClass: (id) => {
    set((s) => {
      const classes = s.classes.filter((c) => c.id !== id);
      const relations = s.relations.filter((r) => r.sourceId !== id && r.targetId !== id);
      const newState = { classes, relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState), selectedClassId: s.selectedClassId === id ? null : s.selectedClassId };
    });
    get().saveToLocal();
  },

  moveClass: (id, x, y) => {
    set((s) => ({
      classes: s.classes.map((c) => (c.id === id ? { ...c, x, y } : c)),
    }));
    // Don't push history for moves (too frequent), but save
    get().saveToLocal();
  },

  addAttribute: (classId) => {
    set((s) => {
      const classes = s.classes.map((c) => {
        if (c.id !== classId) return c;
        const attr: UMLAttribute = { id: uuidv4(), visibility: '-' as Visibility, name: 'attribute', type: 'String', isStatic: false };
        return { ...c, attributes: [...c.attributes, attr] };
      });
      const newState = { classes, relations: s.relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState) };
    });
    get().saveToLocal();
  },

  updateAttribute: (classId, attrId, updates) => {
    set((s) => {
      const classes = s.classes.map((c) => {
        if (c.id !== classId) return c;
        return { ...c, attributes: c.attributes.map((a) => (a.id === attrId ? { ...a, ...updates } : a)) };
      });
      const newState = { classes, relations: s.relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState) };
    });
    get().saveToLocal();
  },

  removeAttribute: (classId, attrId) => {
    set((s) => {
      const classes = s.classes.map((c) => {
        if (c.id !== classId) return c;
        return { ...c, attributes: c.attributes.filter((a) => a.id !== attrId) };
      });
      const newState = { classes, relations: s.relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState) };
    });
    get().saveToLocal();
  },

  addMethod: (classId) => {
    set((s) => {
      const classes = s.classes.map((c) => {
        if (c.id !== classId) return c;
        const method: UMLMethod = { id: uuidv4(), visibility: '+' as Visibility, name: 'method', returnType: 'void', parameters: '', isStatic: false, isAbstract: false };
        return { ...c, methods: [...c.methods, method] };
      });
      const newState = { classes, relations: s.relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState) };
    });
    get().saveToLocal();
  },

  updateMethod: (classId, methodId, updates) => {
    set((s) => {
      const classes = s.classes.map((c) => {
        if (c.id !== classId) return c;
        return { ...c, methods: c.methods.map((m) => (m.id === methodId ? { ...m, ...updates } : m)) };
      });
      const newState = { classes, relations: s.relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState) };
    });
    get().saveToLocal();
  },

  removeMethod: (classId, methodId) => {
    set((s) => {
      const classes = s.classes.map((c) => {
        if (c.id !== classId) return c;
        return { ...c, methods: c.methods.filter((m) => m.id !== methodId) };
      });
      const newState = { classes, relations: s.relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState) };
    });
    get().saveToLocal();
  },

  addRelation: (sourceId, targetId, type) => {
    set((s) => {
      const rel: UMLRelation = { id: uuidv4(), sourceId, targetId, type };
      const relations = [...s.relations, rel];
      const newState = { classes: s.classes, relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState) };
    });
    get().saveToLocal();
  },

  updateRelation: (id, updates) => {
    set((s) => {
      const relations = s.relations.map((r) => (r.id === id ? { ...r, ...updates } : r));
      const newState = { classes: s.classes, relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState) };
    });
    get().saveToLocal();
  },

  removeRelation: (id) => {
    set((s) => {
      const relations = s.relations.filter((r) => r.id !== id);
      const newState = { classes: s.classes, relations, history: s.history, historyIndex: s.historyIndex };
      return { ...newState, ...pushHistory(newState), selectedRelationId: s.selectedRelationId === id ? null : s.selectedRelationId };
    });
    get().saveToLocal();
  },

  setSelectedClass: (id) => set({ selectedClassId: id, selectedRelationId: null }),
  setSelectedRelation: (id) => set({ selectedRelationId: id, selectedClassId: null }),

  addChatMessage: (msg) => {
    set((s) => ({
      chatMessages: [...s.chatMessages, { ...msg, id: uuidv4(), timestamp: Date.now() }],
    }));
  },

  undo: () => {
    set((s) => {
      if (s.historyIndex <= 0) return s;
      const newIndex = s.historyIndex - 1;
      const entry = s.history[newIndex];
      return {
        historyIndex: newIndex,
        classes: JSON.parse(JSON.stringify(entry.classes)),
        relations: JSON.parse(JSON.stringify(entry.relations)),
      };
    });
    get().saveToLocal();
  },

  redo: () => {
    set((s) => {
      if (s.historyIndex >= s.history.length - 1) return s;
      const newIndex = s.historyIndex + 1;
      const entry = s.history[newIndex];
      return {
        historyIndex: newIndex,
        classes: JSON.parse(JSON.stringify(entry.classes)),
        relations: JSON.parse(JSON.stringify(entry.relations)),
      };
    });
    get().saveToLocal();
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  exportDiagram: () => ({
    classes: get().classes,
    relations: get().relations,
  }),

  importDiagram: (diagram) => {
    set((s) => {
      const newState = {
        classes: diagram.classes || [],
        relations: diagram.relations || [],
        history: s.history,
        historyIndex: s.historyIndex,
      };
      return { ...newState, ...pushHistory(newState), selectedClassId: null, selectedRelationId: null };
    });
    get().saveToLocal();
  },

  saveToLocal: () => {
    try {
      const { classes, relations } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ classes, relations }));
    } catch (e) {
      console.error('Failed to save:', e);
    }
  },

  loadFromLocal: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return false;
      const parsed = JSON.parse(data) as UMLDiagram;
      if (parsed.classes) {
        set({
          classes: parsed.classes,
          relations: parsed.relations || [],
          history: [{ classes: parsed.classes, relations: parsed.relations || [] }],
          historyIndex: 0,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
