import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../socket';

export default function VideoPanel({ role, participants }) {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const socket = getSocket();

  useEffect(() => {
    startMedia();
    return () => stopMedia();
  }, []);

  useEffect(() => {
    if (stream && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const startMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
    } catch (error) {
      console.error('Error accessing media devices.', error);
    }
  };

  const stopMedia = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      setIsAudioMuted(!stream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
      setIsVideoMuted(!stream.getVideoTracks()[0].enabled);
    }
  };

  useEffect(() => {
    if (!socket || !stream) return;

    socket.on('sdp_offer', handleReceiveOffer);
    socket.on('sdp_answer', handleReceiveAnswer);
    socket.on('ice_candidate', handleNewICECandidateMsg);

    return () => {
      socket.off('sdp_offer', handleReceiveOffer);
      socket.off('sdp_answer', handleReceiveAnswer);
      socket.off('ice_candidate', handleNewICECandidateMsg);
    };
  }, [socket, stream]);

  useEffect(() => {
    if (role === 'interviewer' && participants.length >= 2 && stream) {
      initiateCall();
    }
  }, [participants, stream, role]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = handleICECandidateEvent;
    pc.ontrack = handleTrackEvent;

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    return pc;
  };

  const initiateCall = async () => {
    if (peerConnection.current) return; // already initiated

    peerConnection.current = createPeerConnection();

    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit('sdp_offer', peerConnection.current.localDescription);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReceiveOffer = async (offer) => {
    if (!peerConnection.current) {
      peerConnection.current = createPeerConnection();
    }

    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('sdp_answer', peerConnection.current.localDescription);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReceiveAnswer = async (answer) => {
    try {
      if (peerConnection.current && peerConnection.current.signalingState !== 'stable') {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleICECandidateEvent = (event) => {
    if (event.candidate) {
      socket.emit('ice_candidate', event.candidate);
    }
  };

  const handleNewICECandidateMsg = async (incoming) => {
    try {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
         await peerConnection.current.addIceCandidate(new RTCIceCandidate(incoming));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrackEvent = (event) => {
    setRemoteStream(event.streams[0]);
  };

  return (
    <div className="flex flex-col h-full bg-black relative p-2">
      <div className="flex-1 flex gap-2 w-full h-full relative">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="bg-gray-800 object-cover w-1/2 h-full rounded border border-gray-600"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="bg-gray-800 object-cover w-1/2 h-full rounded border border-gray-600"
        />
      </div>

      <div className="flex justify-center mt-2 space-x-4">
        <button
          onClick={toggleAudio}
          className={`p-2 rounded font-bold text-white ${isAudioMuted ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          {isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-2 rounded font-bold text-white ${isVideoMuted ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          {isVideoMuted ? 'Start Video' : 'Stop Video'}
        </button>
      </div>

      {role === 'candidate' && participants.length < 2 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white z-10">
          Waiting for interviewer...
        </div>
      )}
    </div>
  );
}
