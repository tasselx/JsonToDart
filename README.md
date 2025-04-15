# JSON to Dart Converter

A web-based tool to convert JSON to Dart classes with null safety and JsonSerializable support. Try it out at [https://tasselx.github.io/JsonToDart](https://tasselx.github.io/JsonToDart)

## Features

- 🚀 Convert JSON to Dart classes with null safety
- ✨ Support for JsonSerializable annotations
- 🔄 Automatic type inference
- 📝 Customizable class names
- 🎯 Generates nullable fields by default
- 🔍 JSON formatting support
- 📋 One-click copy to clipboard
- 🎨 Clean and intuitive user interface

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

## Generated Dart Code Features

The generated Dart code includes:

- Null safety support
- JsonSerializable annotations
- fromJson/toJson methods
- List type support
- Nested object support
- Proper type inference

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

  User({
    this.id,
    this.name,
    this.email,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  Map<String, dynamic> toJson() => _$UserToJson(this);
}
```

## Usage Instructions

1. Enter your desired class name in the "Class Name" field
2. Paste your JSON in the left input area
3. The Dart code will be automatically generated in the right panel
4. Use the format button to prettify the JSON input
5. Click the copy button to copy the generated Dart code
6. Clear both panels using the clear button when needed

## Deployment

The project is automatically deployed to GitHub Pages when changes are pushed to the main branch. The live version can be accessed at [https://tasselx.github.io/JsonToDart](https://tasselx.github.io/JsonToDart)

## Future Enhancements

- [ ] Support for custom annotations
- [ ] Multiple class generation from nested JSON
- [ ] Export to file
- [ ] Import from file
- [ ] Theme switching (light/dark mode)
- [ ] Custom type mapping
- [ ] Batch conversion support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this in your own projects!