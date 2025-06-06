# MusicSync 🎵

Real-time music synchronization app that allows friends to listen to YouTube videos together across all devices.

## Features ✨

- 🎶 **Real-time sync** - Everyone listens together
- 📱 **Cross-platform** - Works on iOS, Android, and Desktop
- 🎨 **Beautiful UI** - Modern glass-morphism design
- 💬 **Live chat** - Chat while listening
- 📱 **PWA support** - Install as mobile app
- 🔧 **Manual sync** - Force sync if needed
- 🌐 **Background play** - Music continues when switching apps (mobile)

## How to Use 🚀

### Creating a Room
1. Enter your name
2. Click "Create Room"
3. Share the generated room code with friends

### Joining a Room
1. Enter your name
2. Get the room code from your friend
3. Click "Join Room"

### Playing Music (Host Only)
1. Go to YouTube and copy any video URL
2. Paste it in the music player
3. Everyone will see and hear the same thing!

## Tech Stack 💻

- **Frontend**: React 18, Tailwind CSS
- **Backend**: Firebase Realtime Database
- **Icons**: Lucide React
- **Video Player**: react-youtube
- **Deployment**: Vercel

## Installation 📲

### Web App
Just visit the URL - works instantly in any browser!

### Mobile App (PWA)
1. Open in mobile browser
2. Look for "Install" prompt
3. Add to home screen for app-like experience

## Development 👨‍💻

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Environment Setup 🔧

1. Create Firebase project
2. Enable Realtime Database
3. Update `src/config/firebase.js` with your config
4. Set database rules for public access

## Database Rules 📋

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

## Features in Detail 🔍

### Real-time Sync
- Host controls playback
- Everyone else follows automatically
- Smart buffering handling
- 2-second sync tolerance

### Mobile Optimizations
- Touch-friendly interface
- Background audio support
- PWA installation
- Safe area handling for iOS

### Cross-platform Support
- iOS Safari ✅
- Android Chrome ✅
- Desktop browsers ✅
- All modern browsers ✅

## Contributing 🤝

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test on multiple devices
5. Submit pull request

## License 📄

MIT License - feel free to use for your own projects!

## Support 💬

Having issues? Check these common solutions:

- **Video won't play**: Try a different YouTube URL
- **Out of sync**: Use the manual "Sync" button
- **Mobile audio stops**: Enable notifications/background app refresh
- **Connection issues**: Check your internet connection

Made with ❤️ for music lovers everywhere!