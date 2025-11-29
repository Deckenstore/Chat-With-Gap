// ===================== WEBRTC.JS =====================

let localStream = null;
let peerConnection = null;
let currentUser = null;
let callPartnerId = localStorage.getItem("chatPartnerId");

// STUN servers
const iceServers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ]
};

// Get current user
firebase.auth().onAuthStateChanged((user) => {
    if (user) currentUser = user;
});

// Start local audio
async function startLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
        alert("Microphone access denied!");
        console.error(err);
    }
}

// Create Peer Connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(iceServers);

    // Add local tracks
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Remote stream
    peerConnection.ontrack = (event) => {
        const audio = document.createElement("audio");
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        audio.volume = 1;
        document.body.appendChild(audio);
    };

    // ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            db.ref(`calls/${callPartnerId}/candidates`).push(event.candidate.toJSON());
        }
    };

    // Listen for remote ICE candidates
    db.ref(`calls/${currentUser.uid}/candidates`).on("child_added", (snap) => {
        const candidate = new RTCIceCandidate(snap.val());
        peerConnection.addIceCandidate(candidate);
    });
}