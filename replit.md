# RIKA WhatsApp Multi Device Bot

## Overview

RIKA is a feature-rich WhatsApp Multi Device bot built with Node.js and the Baileys library. The bot provides comprehensive WhatsApp automation capabilities including multi-device support, session management, command handling, group management, media processing, and various automated features like auto-read, typing indicators, and anti-call protection. The system is designed for easy deployment and management with both terminal and web-based QR code authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Framework
- **Runtime**: Node.js with Express.js for web interface
- **WhatsApp Integration**: Baileys library (@whiskeysockets/baileys) for multi-device WhatsApp connectivity
- **Session Management**: File-based authentication state using useMultiFileAuthState
- **Process Management**: Custom spawn-based process manager with auto-restart capabilities

### Bot Architecture
- **Entry Point**: `index.js` handles process spawning and lifecycle management
- **Main Bot Logic**: `RIKASHIKI.js` contains core WhatsApp connection and event handling
- **Configuration**: Environment-based config system with fallback defaults in `config.js`
- **Message Handling**: Dedicated handler system in `src/handler.js` for processing incoming messages
- **Command System**: Prefix-based command parsing with role-based access control

### Authentication & Session
- **Multi-Device Support**: Native WhatsApp multi-device protocol support
- **QR Code Authentication**: Dual display (terminal via qrcode-terminal and web interface)
- **Session Persistence**: File-based session storage for maintaining login state
- **Web Interface**: Express server on port 8082 for QR code display

### Security & Access Control
- **Owner System**: Multi-owner support with environment variable configuration
- **Role-Based Access**: Owner, moderator, and premium user hierarchies
- **Group Permissions**: Admin-only commands and bot admin requirement checks
- **Anti-Call Protection**: Configurable call blocking functionality

### Media Processing
- **File Handling**: Support for images, videos, audio, and documents
- **WebP Conversion**: Sticker creation with custom EXIF data
- **FFmpeg Integration**: Media format conversion and processing
- **File Type Detection**: Automatic MIME type detection and validation

### Internationalization
- **Multi-Language Support**: Modular language system (English and Indonesian)
- **Configurable Language**: Environment-based language selection
- **Message Localization**: Consistent error and response messages per language

### Bot Features
- **Auto-Response**: Configurable auto-read, typing, and recording indicators
- **Group Management**: Admin tools and group-specific functionality
- **Public/Private Mode**: Configurable bot accessibility
- **Custom Prefix**: Flexible command prefix system
- **Error Handling**: Comprehensive error catching and recovery

## External Dependencies

### Core Libraries
- **@whiskeysockets/baileys**: WhatsApp Web API implementation for multi-device support
- **@hapi/boom**: HTTP error handling and status codes
- **express**: Web server for QR code interface and potential API endpoints
- **pino**: High-performance logging framework

### Utility Libraries
- **axios**: HTTP client for external API requests
- **moment-timezone**: Date/time manipulation with timezone support
- **chalk**: Terminal color formatting for enhanced console output
- **yargs**: Command-line argument parsing
- **qrcode-terminal**: QR code generation for terminal display

### Media Processing
- **fluent-ffmpeg**: Video/audio processing and format conversion
- **node-webpmux**: WebP image format manipulation for stickers
- **file-type**: File type detection from buffer content
- **libphonenumber-js**: Phone number parsing and validation

### Development & Deployment
- **PM2**: Process manager for production deployment (mentioned in installation)
- **Git**: Version control for installation and updates
- **FFmpeg**: External binary dependency for media processing

### Environment Configuration
- **dotenv**: Environment variable loading (implied by environment variable usage)
- **File System**: Native Node.js fs module for session and media storage

### Optional Integrations
- **API Services**: Support for external APIs (Zenz, LOL) via configurable API keys
- **Social Media Links**: Configuration for YouTube, Instagram, and group links
- **Email Integration**: Contact information setup for support