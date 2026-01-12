import { ProjectFile } from '../types';
import JSZip from 'jszip';

export const parseFilesFromMarkdown = (markdown: string): ProjectFile[] => {
  const files: ProjectFile[] = [];
  // Regex matches: **File: path** followed by ```lang code ```
  const regex = /\*\*File:\s*([^*]+)\*\*\s*\n*```(\w+)\n([\s\S]*?)```/g;
  
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const filePath = match[1].trim();
    const language = match[2].trim();
    const content = match[3]; // content inside code block
    
    // Check if file already exists in list (overwrite logic for same generation pass)
    const existingIndex = files.findIndex(f => f.name === filePath);
    if (existingIndex !== -1) {
      files[existingIndex] = { name: filePath, language, content };
    } else {
      files.push({ name: filePath, language, content });
    }
  }
  return files;
};

export const downloadFile = (file: ProjectFile) => {
  const blob = new Blob([file.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name.split('/').pop() || 'file';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadProjectZip = async (projectName: string, files: ProjectFile[]) => {
  const zip = new JSZip();
  const folder = zip.folder(projectName);
  
  if (folder) {
    files.forEach(file => {
      folder.file(file.name, file.content);
    });
    
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};