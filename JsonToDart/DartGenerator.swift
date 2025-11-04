import Foundation

struct DartGeneratorOptions {
    let className: String
    let useJsonKey: Bool
    let useCamelCase: Bool
    let useJsonSerializable: Bool
}

class DartGenerator {
    private let parser = JsonParser()
    
    func generate(from jsonString: String, options: DartGeneratorOptions) -> String {
        // 检测是否为顶层数组
        let isTopLevelArray = detectTopLevelArray(jsonString)
        
        let result = parser.parse(jsonString, className: options.className)
        
        switch result {
        case .success(let fields):
            var output = ""
            
            // 导入语句
            if options.useJsonSerializable {
                output += "import 'package:json_annotation/json_annotation.dart';\n\n"
                let partFileName = options.className.toSnakeCase()
                output += "part '\(partFileName).g.dart';\n\n"
            }
            
            // 如果是顶层数组，先生成 getModelList 方法
            if isTopLevelArray {
                output += generateGetModelListMethod(className: options.className, options: options)
                output += "\n"
            }
            
            // 生成主类
            if options.useJsonSerializable {
                output += generateSerializableClass(
                    className: options.className,
                    fields: fields,
                    options: options
                )
            } else {
                output += generateSimpleClass(
                    className: options.className,
                    fields: fields,
                    options: options
                )
            }
            
            // Generate nested classes
            let nestedClasses = parser.getNestedClasses()
            for (nestedClassName, nestedFields) in nestedClasses.sorted(by: { $0.key < $1.key }) {
                output += "\n"
                if options.useJsonSerializable {
                    output += generateSerializableClass(
                        className: nestedClassName,
                        fields: nestedFields,
                        options: options
                    )
                } else {
                    output += generateSimpleClass(
                        className: nestedClassName,
                        fields: nestedFields,
                        options: options
                    )
                }
            }
            
            return output
            
        case .failure(let error):
            return "// 错误: \(error.localizedDescription)\n// 请确保输入的是有效的 JSON"
        }
    }
    
    private func detectTopLevelArray(_ jsonString: String) -> Bool {
        guard let data = jsonString.data(using: .utf8),
              let jsonObject = try? JSONSerialization.jsonObject(with: data) else {
            return false
        }
        return jsonObject is [Any]
    }
    
    private func generateGetModelListMethod(className: String, options: DartGeneratorOptions) -> String {
        var output = ""
        
        output += "List<\(className)> get\(className)List(List<dynamic> list){\n"
        output += "  List<\(className)> result = [];\n"
        output += "  list.forEach((item){\n"
        output += "    result.add(\(className).fromJson(item));\n"
        output += "  });\n"
        output += "  return result;\n"
        output += "}\n"
        
        return output
    }
    
    private func generateSimpleClass(className: String, fields: [JsonField], options: DartGeneratorOptions) -> String {
        var output = ""
        
        output += "class \(className) {\n"
        
        // Fields
        for field in fields {
            let dartFieldName = field.dartFieldName(useCamelCase: options.useCamelCase)
            let nullableMark = field.isNullable ? "?" : ""
            output += "  final \(field.type.dartType)\(nullableMark) \(dartFieldName);\n"
        }
        
        output += "\n"
        
        // Constructor
        output += "  \(className)({\n"
        for field in fields {
            let dartFieldName = field.dartFieldName(useCamelCase: options.useCamelCase)
            let required = field.isNullable ? "" : "required "
            output += "    \(required)this.\(dartFieldName),\n"
        }
        output += "  });\n\n"
        
        // fromJson
        output += "  factory \(className).fromJson(Map<String, dynamic> json) {\n"
        output += "    return \(className)(\n"
        for field in fields {
            let dartFieldName = field.dartFieldName(useCamelCase: options.useCamelCase)
            output += "      \(dartFieldName): \(parseJsonValue(field: field, options: options)),\n"
        }
        output += "    );\n"
        output += "  }\n\n"
        
        // toJson
        output += "  Map<String, dynamic> toJson() {\n"
        output += "    return {\n"
        for field in fields {
            let jsonKey = field.name
            output += "      '\(jsonKey)': \(toJsonValue(field: field, options: options)),\n"
        }
        output += "    };\n"
        output += "  }\n"
        
        output += "}"
        
        return output
    }
    
    private func generateSerializableClass(className: String, fields: [JsonField], options: DartGeneratorOptions) -> String {
        var output = ""
        
        output += "@JsonSerializable()\n"
        output += "class \(className) extends Object {\n\n"
        
        // Fields - 空安全支持（所有字段都加 ?）
        for field in fields {
            let dartFieldName = field.dartFieldName(useCamelCase: options.useCamelCase)
            
            output += "  @JsonKey(name: '\(field.name)')\n"
            output += "  \(field.type.dartType)? \(dartFieldName);\n"
            
            if field != fields.last {
                output += "\n"
            }
        }
        
        output += "\n"
        
        // Constructor - 位置参数
        output += "  \(className)("
        let fieldParams = fields.map { field -> String in
            let dartFieldName = field.dartFieldName(useCamelCase: options.useCamelCase)
            return "this.\(dartFieldName)"
        }
        output += fieldParams.joined(separator: ",")
        output += ",);\n\n"
        
        // fromJson
        output += "  factory \(className).fromJson(Map<String, dynamic> srcJson) => _$\(className)FromJson(srcJson);\n\n"
        
        // toJson
        output += "  Map<String, dynamic> toJson() => _$\(className)ToJson(this);\n\n"
        
        output += "}\n"
        
        return output
    }
    
    private func parseJsonValue(field: JsonField, options: DartGeneratorOptions) -> String {
        let jsonKey = field.name
        
        switch field.type {
        case .string, .int, .double, .bool:
            if field.isNullable {
                return "json['\(jsonKey)']"
            }
            return "json['\(jsonKey)']"
            
        case .dynamic:
            return "json['\(jsonKey)']"
            
        case .object(let className):
            if field.isNullable {
                return "json['\(jsonKey)'] != null ? \(className).fromJson(json['\(jsonKey)'] as Map<String, dynamic>) : null"
            }
            return "\(className).fromJson(json['\(jsonKey)'] as Map<String, dynamic>)"
            
        case .array(let innerType):
            switch innerType {
            case .object(let className):
                if field.isNullable {
                    // 数组本身可为 null
                    return "(json['\(jsonKey)'] as List<dynamic>?)?.map((e) => \(className).fromJson(e as Map<String, dynamic>)).toList()"
                }
                // 数组不为 null，但处理数组中的 null 元素
                return "(json['\(jsonKey)'] as List<dynamic>).map((e) => \(className).fromJson(e as Map<String, dynamic>)).toList()"
                
            case .dynamic:
                if field.isNullable {
                    return "json['\(jsonKey)'] as List<dynamic>?"
                }
                return "json['\(jsonKey)'] as List<dynamic>"
                
            default:
                if field.isNullable {
                    // 数组本身可为 null
                    return "(json['\(jsonKey)'] as List<dynamic>?)?.map((e) => e as \(innerType.dartType)).toList()"
                }
                // 数组不为 null
                return "(json['\(jsonKey)'] as List<dynamic>).map((e) => e as \(innerType.dartType)).toList()"
            }
        }
    }
    
    private func toJsonValue(field: JsonField, options: DartGeneratorOptions) -> String {
        let dartFieldName = field.dartFieldName(useCamelCase: options.useCamelCase)
        
        switch field.type {
        case .string, .int, .double, .bool, .dynamic:
            return dartFieldName
            
        case .object:
            if field.isNullable {
                return "\(dartFieldName)?.toJson()"
            }
            return "\(dartFieldName).toJson()"
            
        case .array(let innerType):
            switch innerType {
            case .object:
                if field.isNullable {
                    // 数组可为 null
                    return "\(dartFieldName)?.map((e) => e.toJson()).toList()"
                }
                // 数组不为 null
                return "\(dartFieldName).map((e) => e.toJson()).toList()"
            default:
                return dartFieldName
            }
        }
    }
}
