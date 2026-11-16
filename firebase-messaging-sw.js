importScripts("https://www.gstatic.com/firebasejs/13.3.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.3.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyChyxcfr9pSuPTxEYLALFVNss2Ojm35tsM",
    authDomain: "sibike-lock.firebaseapp.com",
    databaseURL: "https://sibike-lock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sibike-lock",
    storageBucket: "sibike-lock.firebasestorage.app",
    messagingSenderId: "934456681964",
    appId: "1:934456681964:web:ece74a134e322da3520cc9"
});

const messaging = firebase.messaging();

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
