// ===================== CHAT.JS =====================

let currentUser = null;
let chatPartnerId = localStorage.getItem("chatPartnerId");
let chatPartnerName = localStorage.getItem("chatPartnerName");

const messagesDiv = document.getElementById("messages");
const userNameDiv = document.getElementById("userName");
const userStatusDiv = document.getElementById("userStatus");

// Set chat header
userNameDiv.innerText = chatPartnerName;

// Check auth state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        listenMessages();
        listenPartnerStatus();
    } else {
        window.location.href = "index.html";
    }
});

// Go back to home
function goBack() {
    window.location.href = "home.html";
}

// Send message
function sendMessage() {
    const msgInput = document.getElementById("msgInput");
    const text = msgInput.value.trim();
    if (!text) return;

    const chatId = generateChatId(currentUser.uid, chatPartnerId);

    const messageData = {
        from: currentUser.uid,
        to: chatPartnerId,
        text: text,
        timestamp: Date.now(),
        seen: false,
    };

    db.ref(`chats/${chatId}`).push(messageData);

    msgInput.value = "";
}

// Generate unique chat ID for 2 users
function generateChatId(uid1, uid2) {
    return uid1 < uid2 ? uid1 + "_" + uid2 : uid2 + "_" + uid1;
}

// Listen for messages
function listenMessages() {
    const chatId = generateChatId(currentUser.uid, chatPartnerId);
    db.ref(`chats/${chatId}`).on("value", (snapshot) => {
        messagesDiv.innerHTML = "";
        snapshot.forEach((childSnap) => {
            const msg = childSnap.val();
            const msgDiv = document.createElement("div");
            msgDiv.className = msg.from === currentUser.uid ? "message me" : "message them";
            msgDiv.innerHTML = `${msg.text}<div class="time">${new Date(msg.timestamp).toLocaleTimeString()}</div>`;
            messagesDiv.appendChild(msgDiv);

            // Mark messages as seen
            if (msg.to === currentUser.uid && !msg.seen) {
                childSnap.ref.update({ seen: true });
            }
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Listen chat partner online status
function listenPartnerStatus() {
    db.ref(`users/${chatPartnerId}/online`).on("value", (snap) => {
        const online = snap.val();
        userStatusDiv.innerText = online ? "Online" : "Offline";
    });
}