import React, { useState, useEffect, useRef } from 'react';
import { FileJson2, FileCode2, Copy, Trash2, FileCheck, Sun, Moon, Download, Upload } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface SavedData {
  className: string;
  jsonInput: string;
  dartOutput: string;
}

function App() {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [className, setClassName] = useState<string>('User');
  const [dartOutput, setDartOutput] = useState<string>('');
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const shouldCreateClass = (obj: any): boolean => {
    // Check if all keys are valid Dart identifiers and not numeric
    return Object.keys(obj).every(key => {
      // Check if the key is not a number and is a valid Dart identifier
      return isNaN(Number(key)) && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
    });
  };

  const generateClassForObject = (obj: any, className: string, generatedClasses: Set<string>): string => {
    let output = '';
    const pascalCaseClassName = capitalizeFirstLetter(className);
    
    if (generatedClasses.has(pascalCaseClassName)) {
      return output;
    }
    generatedClasses.add(pascalCaseClassName);

    // Convert className to snake_case for file name
    const fileName = className
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');

    output += '@JsonSerializable()\n';
    output += `class ${pascalCaseClassName} {\n`;

    Object.entries(obj).forEach(([key, value]) => {
      const dartType = getDartType(value, key, generatedClasses);
      const nullableType = dartType.endsWith('?') ? dartType : `${dartType}?`;
      output += `  @JsonKey(name: '${key}')\n`;
      output += `  ${nullableType} ${key};\n\n`;
    });

    // Add constructor without required keyword
    output += `  ${pascalCaseClassName}({\n`;
    Object.entries(obj).forEach(([key]) => {
      output += `    this.${key},\n`;
    });
    output += '  });\n\n';

    // Add factory methods
    output += `  factory ${pascalCaseClassName}.fromJson(Map<String, dynamic> json) => \n`;
    output += `      _$${pascalCaseClassName}FromJson(json);\n\n`;
    output += `  Map<String, dynamic> toJson() => _$${pascalCaseClassName}ToJson(this);\n`;
    output += '}\n\n';

    return output;
  };

  const getDartType = (value: any, fieldName: string, generatedClasses: Set<string>): string => {
    if (value === null) return 'String?';
    
    switch (typeof value) {
      case 'string': return 'String';
      case 'number': return Number.isInteger(value) ? 'int' : 'double';
      case 'boolean': return 'bool';
      case 'object':
        if (Array.isArray(value)) {
          if (value.length === 0) return 'List<dynamic>';
          const itemValue = value[0];
          // Check if it's a Map with string array keys
          if (typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue)) {
            // Check if all values in the array are strings
            const allStrings = value.every(item => typeof item === 'string');
            if (allStrings) {
              return 'Map<String, dynamic>';
            }
          }
          if (typeof itemValue === 'object' && itemValue !== null) {
            // Use singular form of the field name for the class name of array items
            const itemClassName = capitalizeFirstLetter(fieldName.replace(/s$/, ''));
            return `List<${itemClassName}>`;
          }
          const itemType = getDartType(itemValue, fieldName, generatedClasses);
          return `List<${itemType}>`;
        }
        if (Object.keys(value).length === 0) return 'Map<String, dynamic>';
        
        // Check if the object should be a Map or a class
        if (!shouldCreateClass(value)) {
          // If any key is numeric, treat it as a Map
          const valueType = Object.values(value).length > 0 
            ? getDartType(Object.values(value)[0], fieldName, generatedClasses)
            : 'dynamic';
          return `Map<String, ${valueType}>`;
        }
        
        // Use field name as class name for nested objects
        const nestedClassName = capitalizeFirstLetter(fieldName);
        return nestedClassName;
      default:
        return 'dynamic';
    }
  };

  const convertToDart = (json: string, className: string): string => {
    try {
      const data = JSON.parse(json);
      let output = '';
      const generatedClasses = new Set<string>();
      
      // Add imports
      output += 'import \'package:json_annotation/json_annotation.dart\';\n\n';
      
      // Convert className to snake_case for file name
      const fileName = className
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
      
      output += `part '${fileName}.dart';\n\n`;

      // Process the main object
      const objectToProcess = Array.isArray(data) ? data[0] : data;
      
      if (!objectToProcess || typeof objectToProcess !== 'object') {
        throw new Error('Invalid JSON structure. Expected an object or array of objects.');
      }

      // Generate nested classes first
      const processNestedObjects = (obj: any) => {
        Object.entries(obj).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            // Skip if the array contains only strings (Map case)
            const allStrings = value.every(item => typeof item === 'string');
            if (!allStrings) {
              // Generate class for array items
              const itemClassName = capitalizeFirstLetter(key.replace(/s$/, ''));
              output += generateClassForObject(value[0], itemClassName, generatedClasses);
              processNestedObjects(value[0]);
            }
          } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Only generate a class if the object has valid Dart identifiers as keys
            if (shouldCreateClass(value)) {
              output += generateClassForObject(value, capitalizeFirstLetter(key), generatedClasses);
              processNestedObjects(value);
            }
          }
        });
      };

      processNestedObjects(objectToProcess);

      // Generate the main class
      if (shouldCreateClass(objectToProcess)) {
        output += generateClassForObject(objectToProcess, className, generatedClasses);
      } else {
        // If the main object shouldn't be a class, create a wrapper class
        output += generateClassForObject({ data: objectToProcess }, className, generatedClasses);
      }

      return output;
    } catch (e) {
      if (e instanceof Error) {
        return '// Error: ' + e.message;
      }
      return '// Error: Invalid JSON input';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(dartOutput);
  };

  const handleClear = () => {
    setJsonInput('');
    setDartOutput('');
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // Don't modify the input if it's not valid JSON
      console.error('Invalid JSON');
    }
  };

  const handleExport = () => {
    try {
      const fileName = className
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
      
      const blob = new Blob([dartOutput], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.dart`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting file:', error);
    }
  };

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) return;

        if (file.name.endsWith('.json')) {
          // Try to parse as JSON first
          const data = JSON.parse(content);
          if (data.className && data.jsonInput) {
            setClassName(data.className);
            setJsonInput(data.jsonInput);
          } else {
            // If it's a regular JSON file, use it as input
            setJsonInput(content);
          }
        } else if (file.name.endsWith('.dart')) {
          // For Dart files, try to extract the JSON structure
          try {
            const jsonMatch = content.match(/fromJson\((.*?)\)/s);
            if (jsonMatch) {
              setJsonInput(jsonMatch[1].trim());
            } else {
              setJsonInput(content);
            }
          } catch {
            setJsonInput(content);
          }
        }
      } catch (error) {
        console.error('Error reading file:', error);
        // If parsing fails, try to use the content as-is
        const content = e.target?.result as string;
        if (content) {
          setJsonInput(content);
        }
      }
    };
    reader.readAsText(file);
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  useEffect(() => {
    if (jsonInput.trim() === '') {
      setDartOutput('');
    } else {
      try {
        const output = convertToDart(jsonInput, className);
        setDartOutput(output);
      } catch (error) {
        console.error('Error converting to Dart:', error);
        setDartOutput('// Error: Failed to convert to Dart');
      }
    }
  }, [jsonInput, className]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>
              JSON to Dart Converter
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Convert JSON to Dart classes with null safety and JsonSerializable support
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              theme === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-800'
            } hover:opacity-80 transition-opacity`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <div className="flex-1 max-w-xs">
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Class Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter class name"
              />
              <button
                onClick={handleImport}
                className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}
                title="Import from file"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={handleExport}
                className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}
                title="Export to file"
              >
                <Download className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,.dart"
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`rounded-lg shadow-md p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FileJson2 className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  JSON Input
                </h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleFormat}
                  className={`p-2 rounded-md ${
                    theme === 'dark' ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'
                  }`}
                  title="Format JSON"
                >
                  <FileCheck className="w-5 h-5" />
                </button>
                <button
                  onClick={handleClear}
                  className={`p-2 rounded-md ${
                    theme === 'dark' ? 'text-gray-300 hover:text-red-400' : 'text-gray-600 hover:text-red-600'
                  }`}
                  title="Clear"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className={`w-full h-[500px] p-4 font-mono text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-700 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Paste your JSON here"
            />
          </div>

          <div className={`rounded-lg shadow-md p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FileCode2 className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Dart Output
                </h2>
              </div>
              <button
                onClick={handleCopy}
                className={`p-2 rounded-md ${
                  theme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'
                }`}
                title="Copy to clipboard"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <pre
              className={`w-full h-[500px] p-4 font-mono text-sm border rounded-md overflow-auto ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-700 text-gray-100'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            >
              {dartOutput}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;