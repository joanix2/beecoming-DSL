export type Visibility = '+' | '-' | '#' | '~';

export interface UMLAttribute {
  id: string;
  visibility: Visibility;
  name: string;
  type: string;
  isStatic: boolean;
}

export interface UMLMethod {
  id: string;
  visibility: Visibility;
  name: string;
  returnType: string;
  parameters: string;
  isStatic: boolean;
  isAbstract: boolean;
}

export interface UMLClass {
  id: string;
  name: string;
  isAbstract: boolean;
  attributes: UMLAttribute[];
  methods: UMLMethod[];
  x: number;
  y: number;
}

export type RelationType = 'association' | 'inheritance' | 'aggregation' | 'composition' | 'dependency' | 'realization';

export interface UMLRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
  label?: string;
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
}

export interface UMLDiagram {
  classes: UMLClass[];
  relations: UMLRelation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
