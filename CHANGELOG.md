# Changelog

All notable changes to the Slides Master Obsidian Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2024-12-10

### Changed
- **Plugin renamed** from "Paper2Slides" to "Slides Master"
- Updated plugin ID from `paper2slides` to `slides-master`
- Updated package name from `paper2slides-obsidian` to `slides-master-obsidian`
- Updated repository references to reflect new name

## [1.0.2] - 2024-12-10

### Fixed
- Fixed Gemini image generation 404 errors by updating API endpoint from `:generateImages` to `:generateContent` with correct request structure
- Fixed Progress Modal displaying as blank screen by adding explicit CSS fallback colors and debugging styles
- Fixed browser opening instead of embedding by ensuring embed option is properly threaded through the pipeline configuration

### Added
- Added "Embed in Note" toggle option to Quick Options Modal, allowing users to choose whether to embed generated slides in the current note
- Added explicit color fallbacks to all CSS variables in Progress Modal to ensure visibility across all themes

### Changed
- Updated PipelineConfig interface to include optional `embedInNote` field
- Updated QuickOptionsResult interface to include optional `embedInNote` field
- Improved error handling in Gemini image generation with better error messages

## [1.0.1] - 2024-XX-XX

### Initial Release
- First stable release of Paper2Slides plugin
- AI-powered slide generation from markdown notes
- Support for multiple themes and resolutions
- Multiple export formats (HTML/PDF/PPTX)
- Quick Options Modal for easy configuration
- Progress tracking during generation
- Image generation using Google Gemini API

## [1.0.0] - 2024-XX-XX

### Initial Development
- Project inception and core architecture
- Basic slide generation functionality
