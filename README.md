# MedMate 💊 - Frontend (Mobile Application)

MedMate is a React Native mobile health application designed for individuals on long-term or routine medications. It aims to improve medication adherence by automating reminders, tracking stock and expiry, and keeping caregivers informed, all through a highly accessible and intuitive user interface.

## 🌟 Key Features

* **Smart Prescription Scanning:** Add medications instantly by snapping a photo of your prescription. Data is extracted via OCR and intelligently mapped to your schedule.
* **Intelligent Reminders:** Automated, daily, weekly, or custom-interval reminders that continue until medication stock is depleted.
* **Cascading Alert System:** Escalating notifications if a dose is missed, ensuring critical medications are not forgotten.
* **Stock & Expiry Tracking:** Visual indicators and alerts for low stock and approaching expiration dates.
* **AI Health Assistant:** Integrated chatbot (powered by Google Gemini) to answer general health and medication-related queries directly within the app.
* **Caregiver Integration:** Easily manage caregiver contacts who will receive alerts and weekly digests if doses are repeatedly missed.
* **Accessible UI/UX:** Clean, high-contrast interface featuring Dark Mode and offline support, specifically optimized for older adults.

## 🛠️ Tech Stack

* **Framework:** React Native (Expo)
* **State Management:** Redux Toolkit
* **Networking:** Axios
* **Image Processing:** Expo Image Picker
* **Styling:** React Native StyleSheet (with Dark Mode support)
