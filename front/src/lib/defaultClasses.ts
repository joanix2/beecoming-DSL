import type { UMLClass, UMLAttribute, UMLMethod } from '@/types/uml';
import { v4 as uuidv4 } from 'uuid';

// IDs for default classes (fixed to detect them)
export const DEFAULT_CLASS_IDS = {
  USER: 'default-user-class',
  ROLE: 'default-role-class',
  NOTIFICATION: 'default-notification-class',
};

/**
 * Default classes that exist by default and cannot be deleted or modified
 */
export const DEFAULT_CLASSES: UMLClass[] = [
  {
    id: DEFAULT_CLASS_IDS.USER,
    name: 'User',
    isAbstract: false,
    attributes: [
      {
        id: uuidv4(),
        visibility: '-',
        name: 'id',
        type: 'String',
        isStatic: false,
      },
      {
        id: uuidv4(),
        visibility: '-',
        name: 'username',
        type: 'String',
        isStatic: false,
      },
      {
        id: uuidv4(),
        visibility: '-',
        name: 'email',
        type: 'String',
        isStatic: false,
      },
      {
        id: uuidv4(),
        visibility: '-',
        name: 'password',
        type: 'String',
        isStatic: false,
      },
    ],
    methods: [
      {
        id: uuidv4(),
        visibility: '+',
        name: 'login',
        returnType: 'boolean',
        parameters: '',
        isStatic: false,
        isAbstract: false,
      },
      {
        id: uuidv4(),
        visibility: '+',
        name: 'logout',
        returnType: 'void',
        parameters: '',
        isStatic: false,
        isAbstract: false,
      },
    ],
    x: 100,
    y: 100,
  },
  {
    id: DEFAULT_CLASS_IDS.ROLE,
    name: 'Role',
    isAbstract: false,
    attributes: [
      {
        id: uuidv4(),
        visibility: '-',
        name: 'id',
        type: 'String',
        isStatic: false,
      },
      {
        id: uuidv4(),
        visibility: '-',
        name: 'name',
        type: 'String',
        isStatic: false,
      },
      {
        id: uuidv4(),
        visibility: '-',
        name: 'permissions',
        type: 'String[]',
        isStatic: false,
      },
    ],
    methods: [
      {
        id: uuidv4(),
        visibility: '+',
        name: 'hasPermission',
        returnType: 'boolean',
        parameters: 'permission: String',
        isStatic: false,
        isAbstract: false,
      },
    ],
    x: 450,
    y: 100,
  },
  {
    id: DEFAULT_CLASS_IDS.NOTIFICATION,
    name: 'Notification',
    isAbstract: false,
    attributes: [
      {
        id: uuidv4(),
        visibility: '-',
        name: 'id',
        type: 'String',
        isStatic: false,
      },
      {
        id: uuidv4(),
        visibility: '-',
        name: 'title',
        type: 'String',
        isStatic: false,
      },
      {
        id: uuidv4(),
        visibility: '-',
        name: 'message',
        type: 'String',
        isStatic: false,
      },
      {
        id: uuidv4(),
        visibility: '-',
        name: 'read',
        type: 'boolean',
        isStatic: false,
      },
      {
        id: uuidv4(),
        visibility: '-',
        name: 'createdAt',
        type: 'Date',
        isStatic: false,
      },
    ],
    methods: [
      {
        id: uuidv4(),
        visibility: '+',
        name: 'markAsRead',
        returnType: 'void',
        parameters: '',
        isStatic: false,
        isAbstract: false,
      },
    ],
    x: 100,
    y: 400,
  },
];

/**
 * Check if a class is a default class (cannot be deleted or modified)
 */
export function isDefaultClass(classId: string): boolean {
  return Object.values(DEFAULT_CLASS_IDS).includes(classId);
}

/**
 * Get default class by ID
 */
export function getDefaultClass(classId: string): UMLClass | undefined {
  return DEFAULT_CLASSES.find(cls => cls.id === classId);
}
