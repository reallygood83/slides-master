# Changelog

All notable changes to the Slides Master Obsidian Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2024-12-10

### Fixed
- **Critical UI Fix**: Fixed Progress Modal displaying as completely blank/invisible across all Obsidian themes
- Enhanced modal visibility with explicit inline styles and aggressive CSS overrides
- Progress Modal now displays with white background, black text, and explicit styling on all elements
- All CSS rules now use `!important` declarations to override conflicting theme styles

### Technical Details
- Added explicit inline styles to modal container: white background, black text, border, high z-index
- Added explicit styling to all text elements (title, percentage, message) with hard-coded colors
- Replaced CSS variable fallbacks with hard-coded colors in all CSS rules
- Added explicit `display` and `visibility` properties to prevent theme conflicts
- Increased modal size and padding for better visibility (400px min-height, 30px padding)

### Changed
- Progress Modal styling now completely independent of Obsidian theme CSS variables
- Modal is guaranteed to be visible in both light and dark themes

## [1.0.4] - 2024-12-10

### Fixed
- **Critical Bug Fix**: Fixed 401 authentication errors with Grok API
- Services now properly re-initialize when AI provider settings (API keys, base URLs, models) are changed
- All AI providers (Gemini, Grok, OpenAI) now correctly update their authentication credentials without requiring plugin reload

### Technical Details
- Added `initializeServices()` call after each AI provider setting change
- This ensures service instances are recreated with updated API credentials
- Previously, services were only initialized once during plugin load, causing them to retain old/empty API keys even after user configuration

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
