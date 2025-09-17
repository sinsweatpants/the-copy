import React from 'react';

interface ProcessedFile {
  name: string;
  content: string;
  type: string;
  size: number;
}

interface FileUploadProps {
  uploadedFiles: ProcessedFile[];
  onFilesUploaded: (files: ProcessedFile[]) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  uploadedFiles,
  onFilesUploaded,
  disabled = false
}) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const processedFiles: ProcessedFile[] = [];
    for (const file of files) {
      const content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(file);
      });
      
      processedFiles.push({
        name: file.name,
        content,
        type: file.type,
        size: file.size
      });
    }
    
    onFilesUploaded([...uploadedFiles, ...processedFiles]);
  };

  return (
    <div className="w-full p-6 bg-gray-800/50 rounded-xl border border-gray-600 mb-6">
      <h2 className="text-xl font-bold text-white mb-4">رفع الملفات</h2>
      
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
        <input
          type="file"
          multiple
          accept=".txt,.md,.pdf"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <p className="text-lg text-gray-300 mb-2">اختر الملفات للرفع</p>
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="text-white mb-2">الملفات المرفوعة: {uploadedFiles.length}</h3>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="text-gray-300 text-sm">
              {file.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};