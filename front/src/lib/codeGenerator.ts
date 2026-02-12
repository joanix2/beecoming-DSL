import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { UMLDiagram } from '@/types/uml';

export function generateCodeSkeleton(diagram: UMLDiagram): JSZip {
  const zip = new JSZip();

  // Generate TypeScript interfaces/classes
  const modelsFolder = zip.folder('src/models')!;
  const apiFolder = zip.folder('src/api')!;

  for (const cls of diagram.classes) {
    // Model file
    let code = '';

    // Find parent (inheritance)
    const parent = diagram.relations.find(
      (r) => r.sourceId === cls.id && r.type === 'inheritance'
    );
    const parentClass = parent
      ? diagram.classes.find((c) => c.id === parent.targetId)
      : null;

    if (cls.isAbstract) {
      code += `export abstract class ${cls.name}`;
    } else {
      code += `export class ${cls.name}`;
    }

    if (parentClass) {
      code += ` extends ${parentClass.name}`;
    }

    code += ' {\n';

    // Attributes
    for (const attr of cls.attributes) {
      const vis = attr.visibility === '+' ? 'public' : attr.visibility === '-' ? 'private' : 'protected';
      code += `  ${attr.isStatic ? 'static ' : ''}${vis} ${attr.name}: ${mapType(attr.type)};\n`;
    }

    if (cls.attributes.length > 0 && cls.methods.length > 0) {
      code += '\n';
    }

    // Constructor
    if (cls.attributes.length > 0) {
      const params = cls.attributes
        .filter((a) => !a.isStatic)
        .map((a) => `${a.name}: ${mapType(a.type)}`)
        .join(', ');
      code += `  constructor(${params}) {\n`;
      if (parentClass) code += '    super();\n';
      for (const attr of cls.attributes.filter((a) => !a.isStatic)) {
        code += `    this.${attr.name} = ${attr.name};\n`;
      }
      code += '  }\n\n';
    }

    // Methods
    for (const method of cls.methods) {
      const vis = method.visibility === '+' ? 'public' : method.visibility === '-' ? 'private' : 'protected';
      const prefix = method.isStatic ? 'static ' : method.isAbstract ? 'abstract ' : '';
      code += `  ${vis} ${prefix}${method.name}(${method.parameters}): ${mapType(method.returnType)} {\n`;
      if (!method.isAbstract) {
        code += `    // TODO: implement\n`;
        if (method.returnType !== 'void') {
          code += `    throw new Error('Not implemented');\n`;
        }
      }
      code += '  }\n';
    }

    code += '}\n';
    modelsFolder.file(`${cls.name}.ts`, code);

    // Simple API route
    if (!cls.isAbstract) {
      const apiCode = `import { ${cls.name} } from '../models/${cls.name}';\n\n` +
        `// API endpoints for ${cls.name}\n\n` +
        `export async function getAll${cls.name}s(): Promise<${cls.name}[]> {\n` +
        `  // TODO: implement\n  return [];\n}\n\n` +
        `export async function get${cls.name}ById(id: string): Promise<${cls.name} | null> {\n` +
        `  // TODO: implement\n  return null;\n}\n\n` +
        `export async function create${cls.name}(data: Partial<${cls.name}>): Promise<${cls.name}> {\n` +
        `  // TODO: implement\n  throw new Error('Not implemented');\n}\n\n` +
        `export async function update${cls.name}(id: string, data: Partial<${cls.name}>): Promise<${cls.name}> {\n` +
        `  // TODO: implement\n  throw new Error('Not implemented');\n}\n\n` +
        `export async function delete${cls.name}(id: string): Promise<void> {\n` +
        `  // TODO: implement\n}\n`;
      apiFolder.file(`${cls.name.toLowerCase()}Api.ts`, apiCode);
    }
  }

  // Index file
  const indexImports = diagram.classes
    .map((c) => `export { ${c.name} } from './models/${c.name}';`)
    .join('\n');
  zip.file('src/index.ts', indexImports + '\n');

  // Schema JSON
  zip.file('schema.json', JSON.stringify(diagram, null, 2));

  // README
  zip.file('README.md', `# Generated UML Project\n\nClasses: ${diagram.classes.length}\nRelations: ${diagram.relations.length}\n\nGenerated from UML Class Diagram Editor.\n`);

  return zip;
}

function mapType(umlType: string): string {
  const map: Record<string, string> = {
    'String': 'string',
    'string': 'string',
    'int': 'number',
    'Integer': 'number',
    'float': 'number',
    'double': 'number',
    'boolean': 'boolean',
    'Boolean': 'boolean',
    'void': 'void',
    'Date': 'Date',
  };
  return map[umlType] || umlType;
}

export async function downloadZip(diagram: UMLDiagram) {
  const zip = generateCodeSkeleton(diagram);
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'uml-project.zip');
}
