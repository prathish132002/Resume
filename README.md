# 🚀 ResumeForge: AI-Powered ATS-Friendly Resume Builder

ResumeForge is a modern, high-performance resume builder designed specifically for students and early-career professionals. It leverages the power of **Google Gemini AI** to generate content, optimize for ATS (Applicant Tracking Systems), and tailor resumes for specific job descriptions.

![ResumeForge Preview](./preview.png)

## ✨ Key Features

-   **🤖 AI-Powered Content**: Generate professional summaries, experience bullet points, and skills using Google Gemini.
-   **📄 ATS-Friendly Templates**: Clean, standard layouts that pass through automated screening systems with ease.
-   **🎯 Job Tailoring**: Upload a job description and let the AI highlight your most relevant skills and experiences.
-   **📥 Export to PDF**: Download your resume in high-quality PDF format ready for applications.
-   **📊 Interview Preparation**: Integrated tools to help you prepare for interviews based on your resume.
-   **🔐 Secure Storage**: Save and manage multiple versions of your resume with Firebase integration.

## 🛠️ Tech Stack

-   **Frontend**: React 19, Vite 6, TypeScript
-   **Styling**: Tailwind CSS 4, Framer Motion
-   **AI Engine**: Google Gemini API (@google/genai)
-   **Backend/Auth**: Firebase
-   **PDF Generation**: pdfmake, jspdf, html2canvas
-   **Charts**: Recharts

---

## 💻 Local Setup Instructions

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

Ensure you have the following installed:
-   **Node.js** (v18 or higher recommended)
-   **npm** or **yarn**

### 2. Clone the Repository

```bash
git clone <your-repo-url>
cd Resume
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Configuration

Copy the example environment file to create your own `.env` file:

```bash
cp .env.example .env
```

Now, open `.env` and fill in the following credentials:

#### **A. Google Gemini API Key**
1.  Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Generate a new API Key.
3.  Paste it into `VITE_GEMINI_API_KEY`.

#### **B. Firebase Configuration**
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project (or use an existing one).
3.  Add a "Web App" to your project.
4.  Copy the `firebaseConfig` object values and paste them into the corresponding `VITE_FIREBASE_*` variables in your `.env` file.

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🏗️ Available Scripts

-   `npm run dev`: Starts the development server with Hot Module Replacement (HMR).
-   `npm run build`: Compiles the application into highly optimized static assets for production.
-   `npm run preview`: Locally previews the production build.
-   `npm run lint`: Runs Type checking.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Built with ❤️ for the Developer Community
</div>
