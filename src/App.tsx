import React, { useState, useEffect } from 'react';
import { FileJson2, FileCode2, Copy, Trash2, FileCheck } from 'lucide-react';

function App() {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [className, setClassName] = useState<string>('User');
  const [dartOutput, setDartOutput] = useState<string>('');

  const convertToDart = (json: string, className: string): string => {
    try {
      const data = JSON.parse(json);
      let output = '';
      
      // Convert className to snake_case for file name
      const fileName = className
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
      
      // Add imports
      output += 'import \'package:json_annotation/json_annotation.dart\';\n\n';
      output += 'part \'' + fileName + '.g.dart\';\n\n';
      
      // Add list conversion function only if input is an array
      if (Array.isArray(data)) {
        output += '/// Convert a JSON array to a list of ' + className + ' objects\n';
        output += 'List<' + className + '> get' + className + 'List(List<dynamic> jsonList) {\n';
        output += '  return List<' + className + '>.from(\n';
        output += '    jsonList.map((json) => ' + className + '.fromJson(json as Map<String, dynamic>)),\n';
        output += '  );\n';
        output += '}\n\n';
      }
      
      // Add class annotation
      output += '@JsonSerializable()\n';
      // Ensure class name is PascalCase
      const pascalCaseClassName = className.charAt(0).toUpperCase() + className.slice(1);
      output += 'class ' + pascalCaseClassName + ' {\n';
      
      // Get the object to process (first item if array, or the object itself)
      const objectToProcess = Array.isArray(data) ? data[0] : data;
      
      if (!objectToProcess || typeof objectToProcess !== 'object') {
        throw new Error('Invalid JSON structure. Expected an object or array of objects.');
      }
      
      // Add fields - make all fields nullable with JsonKey annotation, remove final modifier
      Object.entries(objectToProcess).forEach(([key, value]) => {
        const dartType = getDartType(value);
        // Add ? to make the type nullable if it doesn't already end with ?
        const nullableType = dartType.endsWith('?') ? dartType : `${dartType}?`;
        output += '  @JsonKey(name: \'' + key + '\')\n';
        output += '  ' + nullableType + ' ' + key + ';\n\n';
      });
      
      // Add constructor with required keyword for non-nullable fields
      output += '  ' + pascalCaseClassName + '({\n';
      Object.entries(objectToProcess).forEach(([key, value]) => {
        const dartType = getDartType(value);
        const isNullable = value === null || dartType.endsWith('?');
        output += '    ' + (isNullable ? '' : 'required ') + 'this.' + key + ',\n';
      });
      output += '  });\n\n';
      
      // Add factory methods
      output += '  factory ' + pascalCaseClassName + '.fromJson(Map<String, dynamic> json) => \n';
      output += '      _$' + pascalCaseClassName + 'FromJson(json);\n\n';
      output += '  Map<String, dynamic> toJson() => _$' + pascalCaseClassName + 'ToJson(this);\n';
      
      output += '}\n';
      
      return output;
    } catch (e) {
      if (e instanceof Error) {
        return '// Error: ' + e.message;
      }
      return '// Error: Invalid JSON input';
    }
  };

  const getDartType = (value: any): string => {
    if (value === null) return 'String?';
    switch (typeof value) {
      case 'string': return 'String';
      case 'number': return Number.isInteger(value) ? 'int' : 'double';
      case 'boolean': return 'bool';
      case 'object':
        if (Array.isArray(value)) {
          if (value.length === 0) return 'List<dynamic>';
          const itemType = getDartType(value[0]);
          return `List<${itemType}>`;
        }
        if (Object.keys(value).length === 0) return 'Map<String, dynamic>';
        return 'Map<String, dynamic>';
      default: return 'dynamic';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(dartOutput);
  };

  const handleClear = () => {
    setJsonInput('');
    setDartOutput(''); // Explicitly clear the output
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // If JSON is invalid, keep the current input
      console.error('Invalid JSON');
    }
  };

  // Generate Dart output when component mounts or when className/jsonInput changes
  useEffect(() => {
    if (jsonInput.trim() === '') {
      setDartOutput(''); // Clear output when input is empty
    } else {
      const output = convertToDart(jsonInput, className);
      setDartOutput(output);
    }
  }, [jsonInput, className]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">JSON to Dart Converter</h1>
          <p className="text-gray-600">Convert JSON to Dart classes with null safety and JsonSerializable support</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class Name
          </label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter class name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FileJson2 className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">JSON Input</h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleFormat}
                  className="p-2 text-gray-600 hover:text-green-600 rounded-md"
                  title="Format JSON"
                >
                  <FileCheck className="w-5 h-5" />
                </button>
                <button
                  onClick={handleClear}
                  className="p-2 text-gray-600 hover:text-red-600 rounded-md"
                  title="Clear"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-[500px] p-4 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste your JSON here"
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FileCode2 className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">Dart Output</h2>
              </div>
              <button
                onClick={handleCopy}
                className="p-2 text-gray-600 hover:text-blue-600 rounded-md"
                title="Copy to clipboard"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <pre className="w-full h-[500px] p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-md overflow-auto">
              {dartOutput}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;