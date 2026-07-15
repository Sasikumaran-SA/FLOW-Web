# FLOW-Web 🌊

FLOW Web is a comprehensive, web-based task, finance, and notes management application built with modern web technologies. It is designed to help you stay organized, manage your finances, and keep your notes secure.

## 🚀 Features

- **🔐 Authentication**: Secure login and registration powered by Firebase Authentication.
- **✓ Tasks Management**: Create, edit, and organize tasks with priorities, deadlines, and custom lists. Keep track of what needs to be done.
- **💰 Finance Tracking**: Track your income and expenses, categorize transactions, and keep a close eye on your financial flow.
- **📝 Notes Management**: Create, edit, and manage notes. Keep your thoughts organized and accessible.
- **⚙️ Settings**: Manage your account details and application preferences.
- **📊 Dashboard**: A centralized view for a quick glance at your tasks, notes, and financial status.

## 🛠️ Tech Stack

- **Frontend Framework**: [React 18](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [React Router DOM](https://reactrouter.com/)
- **Backend/BaaS**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage)
- **Styling**: Vanilla CSS

## 📂 Project Structure

```text
src/
├── pages/          # React components for each page (Dashboard, Finance, Notes, etc.)
│   ├── Auth.css
│   ├── Dashboard.tsx
│   ├── ...
├── types.ts        # TypeScript interfaces and types
├── firebase.ts     # Firebase configuration and initialization
├── App.tsx         # Main application component and routing
├── main.tsx        # Entry point
└── index.css       # Global styles
```

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/Sasikumaran-SA/FLOW-Web.git
   cd FLOW-Web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **View the app**:
   Open your browser and navigate to `http://localhost:5173`

### Firebase Configuration

The project uses Firebase for backend services. The current configuration is stored in `src/firebase.ts`. If you wish to use your own Firebase project:
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable Authentication, Firestore, and Storage.
3. Replace the `firebaseConfig` object in `src/firebase.ts` with your project's credentials.

## 📦 Build for Production

To build the app for production, run:
```bash
npm run build
```
This will compile your TypeScript and build the React app into the `dist/` directory, ready to be deployed.

## 🎨 Styling

The application uses plain CSS for styling, focusing on providing a clean, responsive, and dynamic user interface with vibrant colors and smooth transitions. Each page component has its dedicated `.css` file for modular styling.
