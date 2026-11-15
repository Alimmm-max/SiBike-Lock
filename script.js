
/* =====================================
   1. PENGATURAN FIREBASE
===================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    runTransaction,
    onValue
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-database.js";


const firebaseConfig = {
    apiKey: "AIzaSyChyxcfr9pSuPTxEYLALFVNss2Ojm35tsM",
    authDomain: "sibike-lock.firebaseapp.com",
    databaseURL: "https://sibike-lock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sibike-lock",
    storageBucket: "sibike-lock.firebasestorage.app",
    messagingSenderId: "934456681964",
    appId: "1:934456681964:web:ece74a134e322da3520cc9"
};

const BOOKING_DURATION = 15 * 60 * 1000;
const TOTAL_SLOTS = 3;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const slotsRef = ref(db, "slots");

let slotsCache = [];
let firebaseReady = false;
let expiryInProgress = false;
let bookingInProgress = false;


/* =====================================
   2. DATA SLOT AWAL
===================================== */

function createInitialSlots() {

    const slots = [];

    for (let i = 1; i <= TOTAL_SLOTS; i++) {

        slots.push({
            id: i,
            status: "kosong"
        });

    }

    return slots;
}


function normalizeSlots(data) {

    if (!data) {
        return createInitialSlots();
    }

    let slots;

    if (Array.isArray(data)) {
        slots = data;
    } else {
        slots = Object.values(data);
    }

    slots = slots
        .filter(slot => slot !== null && slot !== undefined)
        .sort((a, b) => Number(a.id) - Number(b.id));

    for (let i = 1; i <= TOTAL_SLOTS; i++) {

        const exists = slots.some(
            slot => Number(slot.id) === i
        );

        if (!exists) {

            slots.push({
                id: i,
                status: "kosong"
            });

        }

    }

    return slots.sort(
        (a, b) => Number(a.id) - Number(b.id)
    );
}


function getSlots() {

    return slotsCache.map(slot => ({ ...slot }));

}


/* =====================================
   3. GENERATE PIN OTOMATIS
===================================== */

function generatePIN(slots) {

    let pin;

    do {

        pin = String(
            Math.floor(1000 + Math.random() * 9000)
        );

    } while (

        slots.some(slot =>
            slot.pin === pin &&
            slot.status === "booked"
        )

    );

    return pin;
}


/* =====================================
   4. CEK ID PENGGUNA
===================================== */

function checkID() {

    const input = document.getElementById("userID");
    const error = document.getElementById("errorMessage");

    if (!input || !error) {
        return false;
    }

    const id = input.value.trim();

    if (id === "") {

        error.textContent =
            "Masukkan ID terlebih dahulu!";

        return false;
    }

    sessionStorage.setItem("userID", id);

    window.location.href = "status.html";

    return false;
}

window.checkID = checkID;


/* =====================================
   5. STATUS PARKIR PENGGUNA
===================================== */

function updateStatus() {

    const element = document.getElementById("slotStatus");

    if (!element || !firebaseReady) return;

    const userID = sessionStorage.getItem("userID");
    const slots = getSlots();

    const lockStatus = document.getElementById("lockStatus");
    const entryTime = document.getElementById("entryTime");
    const securityStatus = document.getElementById("securityStatus");
    const message = document.getElementById("statusMessage");

    const userSlot = slots.find(slot =>
        slot.userID === userID &&
        (
            slot.status === "booked" ||
            slot.status === "terisi"
        )
    );

    if (!userID) {

        message.textContent =
            "Silakan masukkan ID terlebih dahulu.";

        return;
    }

    if (!userSlot) {

        element.textContent = "-";
        lockStatus.textContent = "Tidak ada";
        entryTime.textContent = "--:--";
        securityStatus.textContent = "-";

        message.textContent =
            "Anda belum memiliki booking aktif.";

        return;
    }

    element.textContent = userSlot.id;

    lockStatus.textContent =
        userSlot.status === "booked"
            ? "Dipesan"
            : "Terisi";

    const time = userSlot.parkedAt || userSlot.bookingTime;

    entryTime.textContent = time
        ? new Date(time).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        })
        : "--:--";

    securityStatus.textContent =
        userSlot.status === "terisi"
            ? "Aman"
            : "Menunggu";

    message.textContent = "ID Pengguna: " + userID;

}


/* =====================================
   6. KETERSEDIAAN SLOT
===================================== */

function displaySlots() {

    const container = document.getElementById("slotList");

    if (!container || !firebaseReady) return;

    const slots = getSlots();

    container.innerHTML = "";

    slots.forEach(slot => {

        let statusText = "";
        let statusClass = "";

        if (slot.status === "kosong") {

            statusText = "Kosong";
            statusClass = "empty";

        } else if (slot.status === "booked") {

            statusText = "Booked";
            statusClass = "booked";

        } else if (slot.status === "terisi") {

            statusText = "Terisi";
            statusClass = "occupied";

        }

        const item = document.createElement("div");
        item.className = "slot-item";

        const number = document.createElement("div");
        number.className = "slot-number";
        number.textContent = "Slot " + slot.id;

        const status = document.createElement("div");
        status.className = "slot-status " + statusClass;
        status.textContent = statusText;

        item.appendChild(number);
        item.appendChild(status);

        container.appendChild(item);

    });

}


/* =====================================
   7. MENAMPILKAN SLOT KOSONG
===================================== */

function displayAvailableSlots() {

    const container = document.getElementById("availableSlots");

    if (!container || !firebaseReady) return;

    const slots = getSlots();

    container.innerHTML = "";

    const availableSlots = slots.filter(
        slot => slot.status === "kosong"
    );

    if (availableSlots.length === 0) {

        container.innerHTML = `
            <p class="no-available-slot">
                Maaf, semua slot sudah terisi atau booked.
            </p>
        `;

        return;
    }

    availableSlots.forEach(slot => {

        const button = document.createElement("button");

        button.className = "available-slot-button";
        button.textContent = "Slot " + slot.id;

        button.onclick = function() {

            bookSelectedSlot(slot.id);

        };

        container.appendChild(button);

    });

}


/* =====================================
   8. PROSES BOOKING SLOT
===================================== */

async function bookSelectedSlot(id) {

    if (!firebaseReady || bookingInProgress) return;

    let userID = sessionStorage.getItem("userID");

    if (!userID) {

        userID = prompt("Masukkan ID pengguna Anda:");

        if (!userID || userID.trim() === "") {
            return;
        }

        userID = userID.trim();

        sessionStorage.setItem("userID", userID);

    }

    const confirmation = confirm(
        "Apakah Anda yakin ingin booking Slot " +
        id + " selama 15 menit?"
    );

    if (!confirmation) return;

    bookingInProgress = true;

    let failureReason = "";

    try {

        const result = await runTransaction(
            slotsRef,
            currentData => {

                const slots = normalizeSlots(currentData);
                const now = Date.now();

                // Menghapus booking yang sudah kedaluwarsa.
                slots.forEach(slot => {

                    if (
                        slot.status === "booked" &&
                        slot.expiresAt &&
                        now >= Number(slot.expiresAt)
                    ) {

                        slot.status = "kosong";

                        delete slot.userID;
                        delete slot.pin;
                        delete slot.bookingTime;
                        delete slot.expiresAt;

                    }

                });

                // Memeriksa booking aktif pengguna.
                const existingBooking = slots.find(slot =>
                    slot.userID === userID &&
                    (
                        slot.status === "booked" ||
                        slot.status === "terisi"
                    )
                );

                if (existingBooking) {

                    failureReason =
                        "Anda sudah memiliki slot aktif: Slot " +
                        existingBooking.id;

                    return;

                }

                // Memeriksa slot pilihan.
                const selected = slots.find(
                    slot => Number(slot.id) === Number(id)
                );

                if (!selected || selected.status !== "kosong") {

                    failureReason =
                        "Maaf, slot sudah tidak tersedia!";

                    return;

                }

                // Membuat PIN.
                const pin = generatePIN(slots);

                selected.status = "booked";
                selected.userID = userID;
                selected.pin = pin;
                selected.bookingTime = now;
                selected.expiresAt = now + BOOKING_DURATION;

                return slots;

            }
        );

        if (!result.committed) {

            alert(
                failureReason ||
                "Booking gagal. Silakan coba lagi."
            );

            return;

        }

        const committedSlots = normalizeSlots(
            result.snapshot.val()
        );

        const committedBooking = committedSlots.find(slot =>
            Number(slot.id) === Number(id) &&
            slot.userID === userID &&
            slot.status === "booked"
        );

        if (!committedBooking) {

            alert(
                "Booking belum berhasil. Silakan periksa kembali slot."
            );

            return;

        }

        sessionStorage.setItem(
            "lastBookingSlot",
            String(id)
        );

        window.location.href = "booking-berhasil.html";

    } catch (error) {

        console.error("Kesalahan booking:", error);

        alert(
            "Terjadi kesalahan saat booking. Periksa koneksi internet Anda."
        );

    } finally {

        bookingInProgress = false;

    }

}


/* =====================================
   9. HALAMAN BOOKING BERHASIL
===================================== */

function displayBookingSuccess() {

    const countdown = document.getElementById("countdown");

    if (!countdown || !firebaseReady) return;

    const userID = sessionStorage.getItem("userID");

    const slotID = Number(
        sessionStorage.getItem("lastBookingSlot")
    );

    const message = document.getElementById("successMessage");

    const successSlot = document.getElementById("successSlot");
    const successPIN = document.getElementById("successPIN");
    const successStatus = document.getElementById("successStatus");

    const booking = getSlots().find(slot =>
        Number(slot.id) === slotID &&
        slot.userID === userID &&
        slot.status === "booked"
    );

    if (!booking) {

        successSlot.textContent = "-";
        successPIN.textContent = "-";
        successStatus.textContent = "Kedaluwarsa";

        countdown.textContent = "00 : 00 : 00";

        message.textContent =
            "Booking tidak ditemukan atau sudah berakhir.";

        return;

    }

    successSlot.textContent = booking.id;
    successPIN.textContent = booking.pin;
    successStatus.textContent = "Dipesan";

    const remaining = Number(booking.expiresAt) - Date.now();

    if (remaining <= 0) {

        countdown.textContent = "00 : 00 : 00";
        successStatus.textContent = "Kedaluwarsa";

        message.textContent =
            "Waktu habis. Slot kembali tersedia.";

        return;

    }

    const hours = Math.floor(remaining / 3600000);

    const minutes = Math.floor(
        (remaining % 3600000) / 60000
    );

    const seconds = Math.floor(
        (remaining % 60000) / 1000
    );

    countdown.textContent =
        String(hours).padStart(2, "0") + " : " +
        String(minutes).padStart(2, "0") + " : " +
        String(seconds).padStart(2, "0");

    message.textContent =
        "Segera gunakan slot sebelum waktu habis.";

}


/* =====================================
   10. BOOKING KEDALUWARSA
===================================== */

async function releaseExpiredBookings() {

    if (!firebaseReady || expiryInProgress) return;

    const now = Date.now();

    const hasExpiredBooking = slotsCache.some(slot =>
        slot.status === "booked" &&
        slot.expiresAt &&
        now >= Number(slot.expiresAt)
    );

    if (!hasExpiredBooking) return;

    expiryInProgress = true;

    try {

        await runTransaction(slotsRef, currentData => {

            const slots = normalizeSlots(currentData);

            let changed = false;

            slots.forEach(slot => {

                if (
                    slot.status === "booked" &&
                    slot.expiresAt &&
                    now >= Number(slot.expiresAt)
                ) {

                    slot.status = "kosong";

                    delete slot.userID;
                    delete slot.pin;
                    delete slot.bookingTime;
                    delete slot.expiresAt;

                    changed = true;

                }

            });

            if (changed) {
                return slots;
            }

            return;

        });

    } catch (error) {

        console.error(
            "Gagal memperbarui booking kedaluwarsa:",
            error
        );

    } finally {

        expiryInProgress = false;

    }

}


/* =====================================
   11. MEMPERBARUI TAMPILAN
===================================== */

function refreshPage() {

    updateStatus();

    displaySlots();

    displayAvailableSlots();

    displayBookingSuccess();

}


/* =====================================
   12. MENGHUBUNGKAN KE FIREBASE
===================================== */

async function startApp() {

    try {

        // Login anonim.
        await signInAnonymously(auth);

        // Membuat data slot awal jika belum tersedia.
        await runTransaction(slotsRef, currentData => {

            if (currentData === null) {

                return createInitialSlots();

            }

            return currentData;

        });

        // Mendengarkan perubahan Firebase secara real-time.
        onValue(
            slotsRef,

            snapshot => {

                slotsCache = normalizeSlots(snapshot.val());

                firebaseReady = true;

                refreshPage();

            },

            error => {

                console.error(
                    "Gagal membaca data Firebase:",
                    error
                );

                alert(
                    "Tidak dapat mengambil data slot dari server."
                );

            }
        );

        // Memeriksa booking yang sudah melewati batas waktu.
        setInterval(() => {

            releaseExpiredBookings();

            refreshPage();

        }, 1000);

    } catch (error) {

        console.error(
            "Gagal menghubungkan Firebase:",
            error
        );

        alert(
            "Koneksi ke Firebase gagal. " +
            "Periksa koneksi internet dan pengaturan Firebase."
        );

    }

}


/* =====================================
   13. MENJALANKAN APLIKASI
===================================== */

startApp();