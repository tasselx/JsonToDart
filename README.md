# JSON to Dart Converter

A web-based tool to convert JSON to Dart classes with null safety and JsonSerializable support. Try it out at [https://tasselx.github.io/JsonToDart](https://tasselx.github.io/JsonToDart)

## Features

- 🚀 Convert JSON to Dart classes with null safety
- ✨ Support for JsonSerializable annotations
- 🔄 Automatic type inference
- 📝 Customizable class names
- 🎯 Smart handling of nested objects and arrays
- 🗺️ Intelligent Map type detection for numeric keys
- 🔍 JSON formatting support
- 📋 One-click copy to clipboard
- 🎨 Clean and intuitive user interface
- 🌓 Light/Dark mode support
- 💾 Export/Import conversion data
- 📤 Save conversions to file
- 📥 Load conversions from file

## Type Conversion Features

- Automatic nullable types for all fields
- Smart type inference for nested objects and arrays
- Proper handling of numeric vs. string keys in objects
- Array type detection with singular class names
- Support for primitive types (String, int, double, bool)
- Proper List<T> type generation for arrays
- Map<String, T> generation for objects with numeric keys
- Nested class generation for complex objects

## Generated Dart Code Features

The generated Dart code includes:

- Null safety support
- JsonSerializable annotations
- fromJson/toJson methods
- Proper type inference for:
  - Nested objects
  - Arrays of objects
  - Arrays of primitives
  - Maps with numeric keys
  - Mixed type objects
- Automatic class generation for nested structures
- Smart naming for array item classes

Example output:
```dart
import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  @JsonKey(name: 'id')
  int? id;

  @JsonKey(name: 'name')
  String? name;

  @JsonKey(name: 'email')
  String? email;

  @JsonKey(name: 'addresses')
  List<Address>? addresses;

  @JsonKey(name: 'metadata')
  Map<String, dynamic>? metadata;

  User({
    this.id,
    this.name,
    this.email,
    this.addresses,
    this.metadata,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class Address {
  @JsonKey(name: 'street')
  String? street;

  @JsonKey(name: 'city')
  String? city;

  Address({
    this.street,
    this.city,
  });

  factory Address.fromJson(Map<String, dynamic> json) => _$AddressFromJson(json);

  Map<String, dynamic> toJson() => _$AddressToJson(this);
}
```

## Development

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/tasselx/JsonToDart.git
cd JsonToDart
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

To build the application for production:

```bash
npm run build
```

The build output will be generated in the `docs` directory, ready for GitHub Pages deployment.

### Project Structure

```
JsonToDart/
├── src/
│   ├── App.tsx           # Main application component
│   ├── main.tsx         # Application entry point
│   ├── ThemeContext.tsx # Theme management context
│   └── index.css        # Global styles (Tailwind CSS)
├── docs/                # Production build output (GitHub Pages)
├── public/             # Static assets
└── package.json        # Project dependencies and scripts
```

## Dependencies

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Lucide React (for icons)

## Usage Instructions

1. Enter your desired class name in the "Class Name" field
2. Paste your JSON in the left input area
3. The Dart code will be automatically generated in the right panel
4. Use the format button to prettify the JSON input
5. Click the copy button to copy the generated Dart code
6. Clear both panels using the clear button when needed
7. Toggle between light and dark mode using the theme switch button
8. Export your work to a file using the Export button
9. Import previous work using the Import button

### Special Cases

The converter handles several special cases intelligently:

1. Objects with numeric keys:
```json
{
  "scores": {
    "1": 100,
    "2": 200
  }
}
```
This will generate `Map<String, int>` instead of creating a new class.

2. Arrays of objects:
```json
{
  "users": [
    {
      "name": "John",
      "age": 30
    }
  ]
}
```
This will generate a `User` class and use `List<User>` for the array.

3. Nested objects:
```json
{
  "user": {
    "address": {
      "street": "123 Main St",
      "city": "Boston"
    }
  }
}
```
This will generate separate classes for `User` and `Address`.

## File Operations

### Export
- Click the Export button to save your current work
- The file will be saved with the format `{className}.dart`
- Contains the generated Dart code with all classes

### Import
- Click the Import button to load a previously saved conversion
- Select a `.json` or `.dart` file
- The tool will process the file and generate the appropriate Dart code

## Deployment

The project is automatically deployed to GitHub Pages when changes are pushed to the main branch. The live version can be accessed at [https://tasselx.github.io/JsonToDart](https://tasselx.github.io/JsonToDart)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this in your own projects!