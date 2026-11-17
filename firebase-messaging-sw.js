
importScripts("https://www.gstatic.com/firebasejs/13.3.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.3.0/firebase-messaging-compat.js");

// Konfigurasi Firebase
firebase.initializeApp({
    apiKey: "SALIN_DARI_SCRIPT_JS",
    authDomain: "SALIN_DARI_SCRIPT_JS",
    databaseURL: "SALIN_DARI_SCRIPT_JS",
    projectId: "SALIN_DARI_SCRIPT_JS",
    storageBucket: "SALIN_DARI_SCRIPT_JS",
    messagingSenderId: "SALIN_DARI_SCRIPT_JS",
    appId: "SALIN_DARI_SCRIPT_JS"
});

const messaging = firebase.messaging();

// Menangani notifikasi ketika website tidak dibuka
messaging.onBackgroundMessage((payload) => {
    const notificationTitle =
        payload.notification?.title || "SiBike Lock";

    const notificationOptions = {
        body: payload.notification?.body ||
            "Terdeteksi getaran mencurigakan pada sepeda Anda."
    };

    self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});
