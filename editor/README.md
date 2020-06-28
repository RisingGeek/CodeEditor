## Video Calling
Video calling is achieved by WebRTC. WebRTC stands for web real-time communication.
Following procedure is used to achieve successful connection between 2 peers:
1. Make a peer connection object by using `RTCPeerConnection()`.
2. Take user permission for using camera and microphone using 
`navigator.mediaDevices.getUserMedia()`. It returns a promise containing media stream.
3. Create offer and then, set local description. After this process, icecandidates will be 
   generated. Keep pushing them in array.
4. Send offer containing the Session Description Protocol(SDP) to the signaling server. Signaling server
   will send the offer to other peer.
5. Receive offer on other side and set remote description.
6. Create an answer, set local description and send SDP to other peer via signaling server.
7. Receive offer on the other side and set remote description.
8. As soon as icecandidates end, send all the candidates to other peer via signaling server. On
   receiving the candidates on other side, add all the candidates to the peer connection. 