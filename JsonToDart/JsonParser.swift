import Foundation

indirect enum JsonType: Equatable {
    case string
    case int
    case double
    case bool
    case object(String)
    case array(JsonType)
    case dynamic
    
    var dartType: String {
        switch self {
        case .string: return "String"
        case .int: return "int"
        case .double: return "double"
        case .bool: return "bool"
        case .object(let className): return className
        case .array(let innerType): return "List<\(innerType.dartType)>"
        case .dynamic: return "dynamic"
        }
    }
    
    var isNullable: Bool {
        switch self {
        case .dynamic: return false
        default: return true
        }
    }
}

struct JsonField: Equatable {
    let name: String
    let type: JsonType
    let isNullable: Bool
    
    func dartFieldName(useCamelCase: Bool) -> String {
        if useCamelCase {
            return name.toCamelCase()
        }
        return name
    }
}

class JsonParser {
    private var nestedClasses: [String: [JsonField]] = [:]
    private var classNameCounter: [String: Int] = [:]
    
    func parse(_ jsonString: String, className: String) -> Result<[JsonField], Error> {
        nestedClasses.removeAll()
        classNameCounter.removeAll()
        
        guard let data = jsonString.data(using: .utf8) else {
            return .failure(NSError(domain: "JsonParser", code: -1, userInfo: [NSLocalizedDescriptionKey: "无法将字符串转换为数据"]))
        }
        
        do {
            let jsonObject = try JSONSerialization.jsonObject(with: data)
            
            // 支持顶层是数组的情况
            if let array = jsonObject as? [Any] {
                if array.isEmpty {
                    return .failure(NSError(domain: "JsonParser", code: -2, userInfo: [NSLocalizedDescriptionKey: "数组为空，无法推断类型"]))
                }
                // 使用数组第一个元素作为模板
                if let firstObject = array.first {
                    let fields = parseObject(firstObject, className: className)
                    return .success(fields)
                }
            }
            
            let fields = parseObject(jsonObject, className: className)
            return .success(fields)
        } catch {
            return .failure(error)
        }
    }
    
    private func parseObject(_ object: Any, className: String) -> [JsonField] {
        guard let dict = object as? [String: Any] else {
            return []
        }
        
        var fields: [JsonField] = []
        
        for (key, value) in dict.sorted(by: { $0.key < $1.key }) {
            let (type, isNullable) = inferType(from: value, fieldName: key, parentClassName: className)
            fields.append(JsonField(name: key, type: type, isNullable: isNullable))
        }
        
        return fields
    }
    
    private func inferType(from value: Any, fieldName: String, parentClassName: String) -> (JsonType, Bool) {
        // 处理 null 值
        if value is NSNull {
            return (.dynamic, true)
        }
        
        // 字符串
        if value is String {
            return (.string, false)
        }
        
        // 数字类型
        if let number = value as? NSNumber {
            let numberType = CFNumberGetType(number as CFNumber)
            if numberType == .charType {
                return (.bool, false)
            }
            if numberType == .floatType || numberType == .doubleType || numberType == .cgFloatType {
                return (.double, false)
            }
            if String(describing: number).contains(".") {
                return (.double, false)
            }
            return (.int, false)
        }
        
        // 数组类型 - 支持嵌套数组和数组中的对象
        if let array = value as? [Any] {
            if array.isEmpty {
                return (.array(.dynamic), false)
            }
            
            // 检查数组中所有非 null 元素
            let nonNullElements = array.filter { !($0 is NSNull) }
            
            if nonNullElements.isEmpty {
                return (.array(.dynamic), true)
            }
            
            // 使用第一个非 null 元素推断类型
            let firstElement = nonNullElements.first!
            
            // 为数组中的对象生成单数形式的类名
            let singularFieldName = fieldName.singularized()
            let (elementType, _) = inferType(from: firstElement, fieldName: singularFieldName, parentClassName: parentClassName)
            
            // 检查数组是否包含 null（支持空安全）
            let hasNull = array.contains { $0 is NSNull }
            
            return (.array(elementType), hasNull)
        }
        
        // 对象类型
        if let dict = value as? [String: Any] {
            // 为嵌套对象生成唯一的类名
            let baseClassName = fieldName.capitalized
            let nestedClassName = generateUniqueClassName(baseClassName)
            
            let fields = parseObject(dict, className: nestedClassName)
            nestedClasses[nestedClassName] = fields
            return (.object(nestedClassName), false)
        }
        
        return (.dynamic, false)
    }
    
    private func generateUniqueClassName(_ baseName: String) -> String {
        if nestedClasses[baseName] == nil {
            return baseName
        }
        
        // 如果类名已存在，添加数字后缀
        var counter = 2
        while nestedClasses["\(baseName)\(counter)"] != nil {
            counter += 1
        }
        return "\(baseName)\(counter)"
    }
    
    func getNestedClasses() -> [String: [JsonField]] {
        return nestedClasses
    }
}

extension String {
    func toCamelCase() -> String {
        let components = self.components(separatedBy: CharacterSet.alphanumerics.inverted)
        let filtered = components.filter { !$0.isEmpty }
        
        if filtered.isEmpty {
            return self
        }
        
        let first = filtered[0].lowercased()
        let rest = filtered.dropFirst().map { $0.capitalized }
        
        return ([first] + rest).joined()
    }
    
    func toCapitalized() -> String {
        return prefix(1).uppercased() + dropFirst()
    }
    
    // PascalCase/camelCase 转 snake_case（用于文件名）
    func toSnakeCase() -> String {
        var result = ""
        var previousWasUpperCase = false
        
        for (index, char) in self.enumerated() {
            if char.isUppercase {
                // 如果不是第一个字符，且前一个不是大写，添加下划线
                if index > 0 && !previousWasUpperCase {
                    result += "_"
                }
                result += char.lowercased()
                previousWasUpperCase = true
            } else {
                result += String(char)
                previousWasUpperCase = false
            }
        }
        
        return result
    }
    
    // 将复数转为单数（用于数组元素类名）
    func singularized() -> String {
        let lower = self.lowercased()
        
        // 特殊复数形式
        let irregulars: [String: String] = [
            "people": "person",
            "children": "child",
            "men": "man",
            "women": "woman",
            "teeth": "tooth",
            "feet": "foot",
            "geese": "goose",
            "mice": "mouse"
        ]
        
        if let singular = irregulars[lower] {
            // 保持原始大小写风格
            if self.first?.isUppercase == true {
                return singular.capitalized
            }
            return singular
        }
        
        // 以 ies 结尾
        if lower.hasSuffix("ies") && lower.count > 3 {
            return String(self.dropLast(3)) + "y"
        }
        
        // 以 ves 结尾
        if lower.hasSuffix("ves") && lower.count > 3 {
            return String(self.dropLast(3)) + "f"
        }
        
        // 以 ses, xes, zes, ches, shes 结尾
        if lower.hasSuffix("ses") || lower.hasSuffix("xes") || 
           lower.hasSuffix("zes") || lower.hasSuffix("ches") || 
           lower.hasSuffix("shes") {
            return String(self.dropLast(2))
        }
        
        // 以 s 结尾但不是 ss
        if lower.hasSuffix("s") && !lower.hasSuffix("ss") && lower.count > 1 {
            return String(self.dropLast())
        }
        
        // 默认返回原字符串
        return self
    }
}
