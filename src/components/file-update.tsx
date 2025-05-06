import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  maxFileSizeMB?: number;
  acceptedFileTypes?: string;
  multiple?: boolean;
  files: File[];
  setFiles: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  maxFileSizeMB = 5,
  acceptedFileTypes = "*",
  multiple = false,
  files = [], // Default value
  setFiles = () => { } // Default noop function
}) => {
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Use internal state if files/setFiles not provided
  const activeFiles = files || internalFiles;
  const updateFiles = setFiles || setInternalFiles;

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const validateFile = useCallback((file: File): boolean => {
    setError('');

    // Check file size
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setError(`Arquivo muito grande. Tamanho máximo: ${maxFileSizeMB}MB`);
      return false;
    }

    // Check file type if needed
    if (acceptedFileTypes !== "*") {
      const fileTypes = acceptedFileTypes.split(',').map(type => type.trim());
      const fileType = file.type;

      if (!fileTypes.some(type => {
        // Handle wildcards like "image/*"
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return fileType.startsWith(`${category}/`);
        }
        return type === fileType;
      })) {
        setError(`Tipo de arquivo inválido. Tipos aceitos: ${acceptedFileTypes}`);
        return false;
      }
    }

    return true;
  }, [acceptedFileTypes, maxFileSizeMB]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = multiple
        ? Array.from(e.dataTransfer.files)
        : [e.dataTransfer.files[0]];

      const validFiles = droppedFiles.filter(validateFile);

      if (validFiles.length > 0) {
        const newFiles = multiple ? [...activeFiles, ...validFiles] : validFiles;
        updateFiles(newFiles);
      }
    }
  }, [multiple, validateFile, activeFiles, updateFiles]);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = multiple
        ? Array.from(e.target.files)
        : [e.target.files[0]];

      const validFiles = selectedFiles.filter(validateFile);

      if (validFiles.length > 0) {
        const newFiles = multiple ? [...activeFiles, ...validFiles] : validFiles;
        updateFiles(newFiles);
      }
    }
  };

  const removeFile = (index: number): void => {
    const newFiles = [...activeFiles];
    newFiles.splice(index, 1);
    updateFiles(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />;
    } else if (file.type.includes('pdf') || file.type.includes('document')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn("border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors shadow/xs",
          isDragging && 'border-primary/20 hover:border-primary/20 bg-primary/10',
          !isDragging && 'border-secondary hover:border-primary/20'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center text-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-primary">Arraste e solte arquivos aqui</p>
          <p className="text-xs text-gray-500 mt-1">ou</p>
          <label className="mt-2 flex items-center justify-center px-4 py-2 text-sm font-medium text-white dark:bg-secondary bg-primary rounded-md hover:bg-secondary/60 cursor-pointer">
            Selecionar arquivos
            <input
              type="file"
              className="hidden"
              onChange={handleFileInputChange}
              accept={acceptedFileTypes}
              multiple={multiple}
            />
          </label>
          {acceptedFileTypes !== "*" && (
            <p className="text-xs text-gray-500 mt-2">
              Tipos aceitos: {acceptedFileTypes}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Tamanho máximo: {maxFileSizeMB}MB
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {activeFiles.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Arquivos ({activeFiles.length})</p>
          <div className="space-y-2">
            {activeFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                <div className="flex items-center space-x-2">
                  {getFileIcon(file)}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-xs">
                      {file.name}
                    </span>
                    <span className="text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;