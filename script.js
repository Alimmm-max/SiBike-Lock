
/* =====================================
   1. PENGATURAN SISTEM
===================================== */

const STORAGE_KEY = "siBikeSlots";
const BOOKING_DURATION = 15 * 60 * 1000;

// Jumlah slot parkir simulasi
const TOTAL_SLOTS = 3;


/* =====================================
   2. DATA SLOT AWAL
===================================== */

function initializeSlots() {

    if (!localStorage.getItem(STORAGE_KEY)) {

        let slots = [];

        for (let i = 1; i <= TOTAL_SLOTS; i++) {

            slots.push({
                id: i,
                status: "kosong"
            });

        }

        saveSlots(slots);
    }
}


/* =====================================
   3. MENYIMPAN DATA
===================================== */

function saveSlots(slots) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(slots)
    );

}


/* =====================================
   4. MENGAMBIL DATA SLOT
===================================== */

function getSlots() {

    initializeSlots();

    let slots = JSON.parse(
        localStorage.getItem(STORAGE_KEY)
    );

    return releaseExpiredBookings(slots);
}


/* =====================================
   5. BOOKING KEDALUWARSA
===================================== */

function releaseExpiredBookings(slots) {

    let now = Date.now();
    let changed = false;

    slots.forEach(function(slot) {

        if (
            slot.status === "booked" &&
            slot.expiresAt &&
            now >= slot.expiresAt
        ) {

            // Mengembalikan slot menjadi kosong
            slot.status = "kosong";

            delete slot.userID;
            delete slot.pin;
            delete slot.bookingTime;
            delete slot.expiresAt;

            changed = true;
        }

    });

    if (changed) {
        saveSlots(slots);
    }

    return slots;
}


/* =====================================
   6. GENERATE PIN OTOMATIS
===================================== */

function generatePIN(slots) {

    let pin;

    do {

        pin = String(
            Math.floor(1000 + Math.random() * 9000)
        );

    } while (
        slots.some(function(slot) {

            return slot.pin === pin &&
                   slot.status === "booked";

        })
    );

    return pin;
}


/* =====================================
   7. CEK ID PENGGUNA
===================================== */

function checkID() {

    let input = document.getElementById("userID");

    let error = document.getElementById("errorMessage");

    let id = input.value.trim();

    if (id === "") {

        error.textContent = "Masukkan ID terlebih dahulu!";

        return false;
    }

    // Menyimpan ID pengguna
    sessionStorage.setItem("userID", id);

    // Menuju halaman status
    window.location.href = "status.html";

    return false;
}


/* =====================================
   8. STATUS PARKIR PENGGUNA
===================================== */

function updateStatus() {

    let element = document.getElementById("slotStatus");

    if (!element) return;

    let userID = sessionStorage.getItem("userID");

    let slots = getSlots();

    let userSlot = slots.find(function(slot) {

        return slot.userID === userID &&
               (
                   slot.status === "booked" ||
                   slot.status === "terisi"
               );

    });

    let lockStatus = document.getElementById("lockStatus");
    let entryTime = document.getElementById("entryTime");
    let securityStatus = document.getElementById("securityStatus");
    let message = document.getElementById("statusMessage");

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

    // Waktu masuk akan memakai waktu parkir
    // jika sudah tersedia.
    let time = userSlot.parkedAt || userSlot.bookingTime;

    entryTime.textContent = time
        ? new Date(time).toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }
        )
        : "--:--";

    securityStatus.textContent =
        userSlot.status === "terisi"
            ? "Aman"
            : "Menunggu";

    message.textContent =
        "ID Pengguna: " + userID;
}


/* =====================================
   9. KETERSEDIAAN SLOT
===================================== */

function displaySlots() {

    let container = document.getElementById("slotList");

    if (!container) return;

    let slots = getSlots();

    container.innerHTML = "";

    slots.forEach(function(slot) {

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

        let item = document.createElement("div");

        item.className = "slot-item";

        let number = document.createElement("div");
        number.className = "slot-number";
        number.textContent = "Slot " + slot.id;

        let status = document.createElement("div");
        status.className = "slot-status " + statusClass;
        status.textContent = statusText;

        item.appendChild(number);
        item.appendChild(status);

        container.appendChild(item);

    });

}


/* =====================================
   10. MENAMPILKAN SLOT KOSONG
===================================== */

function displayAvailableSlots() {

    let container = document.getElementById("availableSlots");

    if (!container) return;

    let slots = getSlots();

    container.innerHTML = "";

    // Hanya mengambil slot kosong
    let availableSlots = slots.filter(function(slot) {

        return slot.status === "kosong";

    });

    if (availableSlots.length === 0) {

        container.innerHTML = `
            <p class="no-available-slot">
                Maaf, semua slot sudah terisi atau booked.
            </p>
        `;

        return;
    }

    availableSlots.forEach(function(slot) {

        let button = document.createElement("button");

        button.className = "available-slot-button";

        button.textContent = "Slot " + slot.id;

        button.onclick = function() {

            bookSelectedSlot(slot.id);

        };

        container.appendChild(button);

    });

}


/* =====================================
   11. PROSES BOOKING SLOT
===================================== */

function bookSelectedSlot(id) {

    let userID = sessionStorage.getItem("userID");

    // Meminta ID jika belum tersedia
    if (!userID) {

        userID = prompt("Masukkan ID pengguna Anda:");

        if (!userID || userID.trim() === "") {
            return;
        }

        userID = userID.trim();

        sessionStorage.setItem("userID", userID);
    }

    let slots = getSlots();

    // Memeriksa booking aktif pengguna
    let existingBooking = slots.find(function(slot) {

        return slot.userID === userID &&
               (
                   slot.status === "booked" ||
                   slot.status === "terisi"
               );

    });

    if (existingBooking) {

        alert(
            "Anda sudah memiliki slot aktif: Slot " +
            existingBooking.id
        );

        return;
    }

    // Memeriksa slot yang dipilih
    let selected = slots.find(function(slot) {

        return slot.id === id;

    });

    if (!selected || selected.status !== "kosong") {

        alert("Maaf, slot sudah tidak tersedia!");

        displayAvailableSlots();

        return;
    }

    // Konfirmasi booking
    let confirmation = confirm(
        "Apakah Anda yakin ingin booking Slot " +
        id + " selama 15 menit?"
    );

    if (!confirmation) return;

    let now = Date.now();

    // Mengubah status slot
    selected.status = "booked";

    // Menyimpan ID pengguna
    selected.userID = userID;

    // Membuat PIN otomatis
    selected.pin = generatePIN(slots);

    // Menyimpan waktu booking
    selected.bookingTime = now;

    // Mengatur batas waktu 15 menit
    selected.expiresAt = now + BOOKING_DURATION;

    // Menyimpan data slot
    saveSlots(slots);

    // Menyimpan slot yang dipilih
    sessionStorage.setItem(
        "lastBookingSlot",
        String(id)
    );

    // Berpindah ke halaman berhasil
    window.location.href = "booking-berhasil.html";

}


/* =====================================
   12. HALAMAN BOOKING BERHASIL
===================================== */

function displayBookingSuccess() {

    let countdown = document.getElementById("countdown");

    if (!countdown) return;

    let userID = sessionStorage.getItem("userID");

    let slotID = Number(
        sessionStorage.getItem("lastBookingSlot")
    );

    let message = document.getElementById("successMessage");

    let slots = getSlots();

    let booking = slots.find(function(slot) {

        return slot.id === slotID &&
               slot.userID === userID;

    });

    // Jika booking tidak ditemukan
    if (!booking || booking.status !== "booked") {

        document.getElementById("successSlot").textContent = "-";
        document.getElementById("successPIN").textContent = "-";
        document.getElementById("successStatus").textContent =
            "Kedaluwarsa";

        countdown.textContent = "00 : 00 : 00";

        message.textContent =
            "Booking tidak ditemukan atau sudah berakhir.";

        return;
    }

    // Menampilkan informasi booking
    document.getElementById("successSlot").textContent =
        booking.id;

    document.getElementById("successPIN").textContent =
        booking.pin;

    document.getElementById("successStatus").textContent =
        "Dipesan";


    // Countdown
    function updateCountdown() {

        let currentSlots = getSlots();

        let currentBooking = currentSlots.find(function(slot) {

            return slot.id === slotID &&
                   slot.userID === userID &&
                   slot.status === "booked";

        });

        // Jika booking sudah berakhir
        if (!currentBooking) {

            countdown.textContent = "00 : 00 : 00";

            document.getElementById("successStatus").textContent =
                "Kedaluwarsa";

            message.textContent =
                "Waktu habis. Slot kembali tersedia.";

            clearInterval(timer);

            return;
        }

        let remaining =
            currentBooking.expiresAt - Date.now();

        if (remaining <= 0) {

            getSlots();

            countdown.textContent = "00 : 00 : 00";

            document.getElementById("successStatus").textContent =
                "Kedaluwarsa";

            message.textContent =
                "Waktu habis. Slot kembali tersedia.";

            clearInterval(timer);

            return;
        }

        let hours = Math.floor(remaining / 3600000);

        let minutes = Math.floor(
            (remaining % 3600000) / 60000
        );

        let seconds = Math.floor(
            (remaining % 60000) / 1000
        );

        countdown.textContent =
            String(hours).padStart(2, "0") + " : " +
            String(minutes).padStart(2, "0") + " : " +
            String(seconds).padStart(2, "0");

    }

    updateCountdown();

    let timer = setInterval(updateCountdown, 1000);

}


/* =====================================
   13. INISIALISASI WEBSITE
===================================== */

initializeSlots();

// Memperbarui halaman berdasarkan elemen yang tersedia
updateStatus();

displaySlots();

displayAvailableSlots();

displayBookingSuccess();


/* =====================================
   14. UPDATE OTOMATIS
===================================== */

// Memperbarui data setiap detik
setInterval(function() {

    updateStatus();

    displaySlots();

    displayAvailableSlots();

}, 1000);


// Memperbarui tampilan jika data berubah
// dari tab browser lain.
window.addEventListener("storage", function() {

    updateStatus();

    displaySlots();

    displayAvailableSlots();

});