# 🎵 MusicSync - Real-Time YouTube Sync App

A beautiful, real-time music synchronization app built with React.js and Firebase. Create rooms, share YouTube videos, and watch together in perfect sync!

## ✨ Features

- 🎬 **YouTube Integration** - Paste any YouTube link and watch together
- 🏠 **Room System** - Create unique room codes and invite friends
- 👑 **Host Controls** - Host controls playback for everyone
- 💬 **Live Chat** - Real-time messaging in each room
- 🔄 **Perfect Sync** - Videos play in sync across all devices
- 🎨 **Beautiful UI** - Dark mode with glassmorphism design
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- 🗑️ **Auto Cleanup** - Empty rooms are automatically deleted

## 🚀 Live Demo

[Visit MusicSync](https://your-app-url.vercel.app)

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Firebase Realtime Database
- **Deployment**: Vercel
- **APIs**: YouTube Player API

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/musicsync.git
cd musicsync
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project
   - Enable Realtime Database
   - Update `src/config/firebase.js` with your config

4. Run the development server:
```bash
npm start
```

## 🎯 How to Use

1. **Create a Room**: Enter your name and click "Create Room"
2. **Share the Code**: Copy the 6-digit room code and share with friends
3. **Add Music**: Paste any YouTube URL to start playing
4. **Enjoy Together**: Everyone watches in perfect sync!

## 🔧 Environment Setup

Create a `.env` file in the root directory:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_DATABASE_URL=your_database_url
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

## 📁 Project Structure

```
musicsync/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── JoinRoom.jsx
│   │   ├── Room.jsx
│   │   ├── MusicPlayer.jsx
│   │   └── Chat.jsx
│   ├── config/
│   │   └── firebase.js
│   ├── App.jsx
│   └── index.js
├── database.rules.json
└── package.json
```

## 🚀 Deployment

### Deploy to Vercel:
1. Push to GitHub
2. Connect your GitHub repo to Vercel
3. Deploy automatically

### Deploy Firebase Rules:
```bash
firebase deploy --only database
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for real-time database
- YouTube for the player API
- React team for the amazing framework
- Tailwind CSS for beautiful styling

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

Made with ❤️ by [Niranjan Epili](https://github.com/NiranjanEpili)