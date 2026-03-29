# Real-Time Collaborative Interview Platform (MVP)

A full-stack web application designed for conducting real-time technical interviews. Two users — an interviewer and a candidate — join a shared room to collaborate on a live code editor and communicate via peer-to-peer WebRTC video/audio.

## 🚀 Tech Stack

*   **Frontend:** React, Vite, React Router, Tailwind CSS
*   **Editor:** CodeMirror 6 (`@uiw/react-codemirror`)
*   **Backend:** Node.js, Express
*   **Real-time Communication:** Socket.IO (for code sync and signaling), Native WebRTC (for video/audio)
*   **Database:** SQLite (via `better-sqlite3`)

## 🎯 Features

*   **Role-Based Access:** Interviewers can register/login. Candidates join seamlessly as "guests" via a shareable link.
*   **Dashboard:** Interviewers can view past/active rooms and create new rooms with a single click.
*   **Real-Time Code Sync:** Collaborative code editing using CodeMirror 6, powered by Socket.IO.
*   **Multi-Language Execution:** Run JavaScript (Node.js) or Python code directly from the browser. The output (stdout, stderr, exit code) is streamed back to all participants in the room. Safe execution enforced with a 5-second hard timeout.
*   **WebRTC Video/Audio:** Built-in peer-to-peer video conferencing using WebRTC and free Google STUN servers. Features mute/unmute and camera toggle controls.
*   **Question Bank:** Interviewers can select pre-defined interview questions from a dropdown to share with the candidate in real-time.
*   **Session Notes:** Private notepad for the interviewer to take notes during the session.
*   **Session Archiving:** When the session is ended by the interviewer, a snapshot of the code and the interviewer's notes are saved to the database.

---

## 🔄 End-to-End Flow

### 1. Interviewer Registration & Login
1.  The Interviewer visits the application and navigates to the **Register** (`/register`) page to create an account.
2.  Once registered, the interviewer is redirected to the **Dashboard** (`/dashboard`).
3.  If the interviewer already has an account, they can use the **Login** (`/login`) page.

### 2. Room Creation
1.  From the **Dashboard**, the interviewer clicks the **"Create New Room"** button.
2.  A new room is instantly generated with a unique, secure URL slug.
3.  The interviewer can copy the generated "Join Link" to send to the candidate.
4.  The interviewer automatically joins the newly created Room (`/room/:slug`).

### 3. Candidate Join
1.  The Candidate receives the "Join Link" and opens it in their browser.
2.  Because the candidate is not logged in, they are presented with a simple **Guest Join** form asking for their name.
3.  Upon submitting their name, a temporary guest JWT is generated, and they enter the Room.

### 4. The Interview Session
1.  **WebRTC Connection:** Once both the interviewer and the candidate are in the room, the frontend automatically establishes a WebRTC Peer Connection. Video and audio start streaming between the two participants.
2.  **Code Collaboration:** Either user can type in the CodeMirror editor. Changes are broadcasted via Socket.IO in real-time using a "last-write-wins" approach.
3.  **Language Selection:** Participants can toggle the editor language between JavaScript and Python.
4.  **Code Execution:** Clicking **"Run Code"** sends the current editor content to the backend. The backend spawns a child process (`node` or `python3`) to execute the code. The resulting output (stdout/stderr) is broadcasted back and displayed in the **Output Panel**.
5.  **Questions:** The interviewer can browse a dropdown of questions and select one. The selected question's description and difficulty are instantly visible to the candidate.
6.  **Note Taking:** The interviewer has a private text area below the questions panel to take notes that the candidate cannot see.

### 5. Ending the Session
1.  When the interview is complete, the interviewer clicks the **"End Session"** button.
2.  The current state of the code and the interviewer's private notes are saved to the `sessions` database table.
3.  The room's status is updated to `ended`.
4.  Socket.IO broadcasts a `room_ended` event. Both participants are immediately shown a "This session has ended" screen and are disconnected from the room.

---

## 🛠️ Installation & Setup

### Prerequisites
*   Node.js (v16+ recommended)
*   Python 3 (required for running Python code in the executor)

### 1. Clone the repository
\`\`\`bash
git clone <repository_url>
cd <repository_directory>
\`\`\`

### 2. Install dependencies
Install backend dependencies:
\`\`\`bash
cd server
npm install
\`\`\`

Install frontend dependencies:
\`\`\`bash
cd ../client
npm install
\`\`\`

### 3. Build the Frontend
The Express backend is configured to serve the Vite React build as static files.
\`\`\`bash
cd client
npm run build
\`\`\`

### 4. Start the Application
Start the unified Express + Socket.IO server.
\`\`\`bash
cd ../server
npm start
\`\`\`

The application will now be running on \`http://localhost:4000\`.
*(Note: If the SQLite database does not exist, it will be automatically created and initialized on startup).*

---

## 🗄️ Database Schema (SQLite)
The application uses a single database file with 4 tables:
*   `users`: Stores interviewer credentials (hashed passwords).
*   `rooms`: Tracks active/ended rooms and associates them with an interviewer.
*   `sessions`: Archives code snapshots and notes when a room is ended.
*   `questions`: Stores the repository of interview questions.
