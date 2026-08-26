import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, PhoneOff, Users, MessageSquare, 
  ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, X, Send, Award, 
  Clock, Calendar, Building2, Briefcase, Eye, ChevronRight, UserCheck, 
  RefreshCw, Lock, Sparkles, Volume2, Info
} from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function LiveVideoMeetingRoom({ roomId, currentUser, onLeaveRoom }) {
  // Room State
  const [meetingData, setMeetingData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState('scheduled');

  // Media State
  const [localStream, setLocalStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remotePeers, setRemotePeers] = useState({}); // { socketId: { stream, userInfo } }

  // Drawers & Tabs
  const [activeSideDrawer, setActiveSideDrawer] = useState(null); // 'participants' | 'chat' | 'evaluation'
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Anti-Cheating Proctoring State (Students only)
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [isEjected, setIsEjected] = useState(false);
  const [ejectionReason, setEjectionReason] = useState(null);
  const [liveViolationAlert, setLiveViolationAlert] = useState(null);
  const [violationsList, setViolationsList] = useState([]);

  // Recruiter Evaluation State
  const [candidateOutcomes, setCandidateOutcomes] = useState({}); // { studentId: { status, notes, score } }
  const [isSavingOutcomes, setIsSavingOutcomes] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Refs
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { socketId: RTCPeerConnection }
  const localStreamRef = useRef(null);
  const currentUserRef = useRef(currentUser);
  const meetingDataRef = useRef(null);
  const hasTriggeredViolationRef = useRef(false);

  currentUserRef.current = currentUser;
  meetingDataRef.current = meetingData;

  const isStudent = currentUser?.role === 'student';
  const isInterviewer = currentUser?.role === 'company' || currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'faculty';

  // 1. Fetch Room Metadata & Access Check on mount
  useEffect(() => {
    fetchRoomDetails();
    return () => {
      cleanupMeeting();
    };
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('campushire_token') || `demo_token_${currentUser?.role || 'student'}`;
      let data = null;

      try {
        const res = await fetch(`/api/meetings/room/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const text = await res.text();
          try {
            data = JSON.parse(text);
          } catch(e) {}
        }
      } catch (netErr) {
        console.warn('Meeting API network fallback:', netErr);
      }

      // Fallback robust room metadata for serverless / demo environments
      if (!data || !data.meeting) {
        const readableRoomTitle = roomId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        data = {
          meeting: {
            id: 'meet_' + roomId.replace(/[^a-zA-Z0-9]/g, '_'),
            room_id: roomId,
            title: `GSFC University Live Interview: ${readableRoomTitle}`,
            description: 'Online Campus Placement & Technical Assessment Interview Session with Anti-Cheating & Screen Proctoring.',
            status: 'in_progress',
            company_name: currentUser?.role === 'company' ? (currentUser?.profile?.company_name || 'Corporate Recruiter') : 'Reliance Industries / GSFC Limited',
            drive_title: 'GSFC University Campus Hiring 2026',
            scheduled_at: new Date().toISOString(),
            duration_minutes: 45
          },
          participants: [
            {
              id: 'p_interviewer',
              user_id: 'u_comp_lead',
              role: 'company',
              name: 'Senior Technical Evaluator',
              join_status: 'joined'
            },
            {
              id: 'p_cand',
              user_id: currentUser?.id || 'u_student_demo',
              student_id: currentUser?.profile?.id || 's_demo',
              role: 'student',
              student_name: currentUser?.name || currentUser?.profile?.name || 'Om Thakkar',
              student_roll: currentUser?.profile?.roll_number || '24BT04171',
              student_program: currentUser?.profile?.program || 'B.Tech Computer Science & Engineering',
              student_cgpa: currentUser?.profile?.cgpa || 9.42,
              join_status: 'ready'
            }
          ],
          chatMessages: [],
          violations: []
        };
      }

      setMeetingData(data.meeting);
      setMeetingStatus(data.meeting.status || 'in_progress');
      setParticipants(data.participants || []);
      setChatMessages(data.chatMessages || []);
      setViolationsList(data.violations || []);

      // Check if student was previously ejected from this meeting (Server DB or Local Storage)
      if (isStudent) {
        const localEjected = localStorage.getItem(`gsfc_meeting_ejected_${roomId}`) === 'true';
        let disqualifiedRooms = [];
        try { disqualifiedRooms = JSON.parse(localStorage.getItem('gsfc_disqualified_meeting_rooms') || '[]'); } catch(e) {}
        const isDisqualifiedLocally = localEjected || (Array.isArray(disqualifiedRooms) && disqualifiedRooms.includes(roomId));

        const myPart = (data.participants || []).find(p => p.user_id === currentUser?.id || p.student_id === currentUser?.profile?.id);
        const isServerEjected = myPart && (myPart.join_status === 'ejected' || myPart.join_status === 'disqualified');

        if (isDisqualifiedLocally || isServerEjected) {
          setIsEjected(true);
          setEjectionReason('Anti-Cheating Policy Violation: You have been permanently disqualified from this interview session due to tab-switch or window blur. Re-entry is strictly prohibited by TPC placement regulations.');
          setLoading(false);
          return;
        }
      }

      // Initialize candidate outcomes for recruiter
      const initialOutcomes = {};
      (data.participants || []).filter(p => p.role === 'student').forEach(p => {
        initialOutcomes[p.student_id || p.user_id] = {
          status: p.outcome_status || 'pending',
          notes: p.interviewer_notes || '',
          score: p.evaluation_score || 0
        };
      });
      setCandidateOutcomes(initialOutcomes);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching room details:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // 2. Initialize Camera & Mic Preview (Pre-Join)
  useEffect(() => {
    if (!loading && !error && !isJoined && !isEjected) {
      startLocalMediaPreview();
    }
  }, [loading, error, isJoined, isEjected]);

  const startLocalMediaPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Could not access camera/mic preview:', err);
    }
  };

  // 3. Connect to Socket.IO and Setup WebRTC upon Joining
  const handleJoinMeeting = () => {
    if (isStudent && !policyAccepted) {
      alert('You must acknowledge and accept the Anti-Cheating & Proctoring Regulations before entering.');
      return;
    }

    setIsJoined(true);

    const token = localStorage.getItem('campushire_token') || `demo_token_${currentUser?.role || 'student'}`;
    const socket = io({ credentials: true, query: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔗 Connected to WebRTC Signaling Server:', socket.id);
      socket.emit('join-room', {
        roomId,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email || 'Attendee',
        userRole: currentUser.role,
        studentId: currentUser.profile?.id || currentUser.id
      });
    });

    // Received existing peers in room
    socket.on('room-peers', (peers) => {
      peers.forEach(peer => {
        createPeerConnection(peer.socketId, peer, true);
      });
    });

    // New user joined room
    socket.on('user-joined', (peer) => {
      createPeerConnection(peer.socketId, peer, false);
      if (isInterviewer && peer.userRole === 'student') {
        // Show brief notification
      }
    });

    // WebRTC Signaling Handlers
    socket.on('signal-offer', async ({ callerSocketId, offer, callerInfo }) => {
      let pc = peerConnectionsRef.current[callerSocketId];
      if (!pc) {
        pc = createPeerConnection(callerSocketId, callerInfo, false);
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal-answer', {
          targetSocketId: callerSocketId,
          answer,
          responderInfo: {
            userId: currentUser.id,
            userName: currentUser.name || 'Attendee',
            userRole: currentUser.role
          }
        });
      } catch (e) {
        console.error('Error handling signal offer:', e);
      }
    });

    socket.on('signal-answer', async ({ responderSocketId, answer }) => {
      const pc = peerConnectionsRef.current[responderSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error('Error setting remote answer:', e);
        }
      }
    });

    socket.on('signal-ice-candidate', async ({ senderSocketId, candidate }) => {
      const pc = peerConnectionsRef.current[senderSocketId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    });

    // Chat Handler
    socket.on('new-chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
      if (activeSideDrawer !== 'chat') {
        setUnreadChatCount(prev => prev + 1);
      }
    });

    // Meeting Status Handler
    socket.on('meeting-status-changed', ({ status }) => {
      setMeetingStatus(status);
    });

    // Anti-Cheating Violation Broadcast
    socket.on('student-violation-alert', (alertData) => {
      setViolationsList(prev => [alertData, ...prev]);
      setLiveViolationAlert(alertData);
      // Auto-hide alert banner after 12 seconds
      setTimeout(() => {
        setLiveViolationAlert(null);
      }, 12000);
    });

    // Student Ejection Handler
    socket.on('you-are-ejected', ({ violationType, details }) => {
      triggerStudentEjection(violationType, details);
    });

    // Meeting Ended by Recruiter Handler
    socket.on('meeting-ended', ({ endedByName }) => {
      alert(`The interview session has been concluded by ${endedByName}.`);
      cleanupMeeting();
      if (onLeaveRoom) onLeaveRoom();
    });

    // Peer Left Handler
    socket.on('user-left', ({ socketId, userName }) => {
      closePeerConnection(socketId);
    });
  };

  // 4. WebRTC Peer Connection Helper
  const createPeerConnection = (targetSocketId, peerInfo, isInitiator) => {
    if (peerConnectionsRef.current[targetSocketId]) {
      return peerConnectionsRef.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[targetSocketId] = pc;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal-ice-candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Remote Stream Received
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemotePeers(prev => ({
        ...prev,
        [targetSocketId]: {
          stream: remoteStream,
          userInfo: peerInfo
        }
      }));
    };

    // If initiator, create and send Offer
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit('signal-offer', {
            targetSocketId,
            offer,
            callerInfo: {
              userId: currentUser.id,
              userName: currentUser.name || 'Attendee',
              userRole: currentUser.role
            }
          });
        } catch (e) {
          console.error('Negotiation error:', e);
        }
      };
    }

    return pc;
  };

  const closePeerConnection = (socketId) => {
    if (peerConnectionsRef.current[socketId]) {
      peerConnectionsRef.current[socketId].close();
      delete peerConnectionsRef.current[socketId];
    }
    setRemotePeers(prev => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
  };

  // 5. 🚨 ANTI-CHEATING PROCTORING ENGINE (Strictly Active for Students in Live Meeting)
  useEffect(() => {
    if (!isJoined || !isStudent || isEjected) {
      return;
    }

    // 1. Page Visibility API Listener (Tab-switch / Minimize detection)
    const handleVisibilityChange = () => {
      if (document.hidden && !hasTriggeredViolationRef.current) {
        hasTriggeredViolationRef.current = true;
        const reason = 'Tab switch or window minimization detected via Page Visibility API.';
        handleViolationDetected('tab_switch', reason);
      }
    };

    // 2. Window Blur Listener (Clicking out to other windows, second screens, or background apps)
    const handleWindowBlur = () => {
      if (!hasTriggeredViolationRef.current) {
        hasTriggeredViolationRef.current = true;
        const reason = 'Window unfocused or application switch detected via Window Blur.';
        handleViolationDetected('window_blur', reason);
      }
    };

    // 3. Navigation Guard & Reload Interception
    const handleBeforeUnload = (e) => {
      if (!hasTriggeredViolationRef.current) {
        handleViolationDetected('closed_tab', 'Attempted to close, reload, or navigate away from the live interview tab.');
      }
      e.preventDefault();
      e.returnValue = 'WARNING: Leaving or reloading this interview room will immediately disqualify your session!';
      return e.returnValue;
    };

    // 4. Hash Change & Popstate Interception
    const handleHashNavigation = (e) => {
      if (window.location.hash !== `#meeting/${roomId}`) {
        if (!hasTriggeredViolationRef.current) {
          handleViolationDetected('navigation_attempt', 'Attempted internal portal navigation away from the live meeting.');
        }
        window.location.hash = `#meeting/${roomId}`;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('hashchange', handleHashNavigation);
    window.addEventListener('popstate', handleHashNavigation);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('hashchange', handleHashNavigation);
      window.removeEventListener('popstate', handleHashNavigation);
    };
  }, [isJoined, isStudent, isEjected, roomId]);

  const handleViolationDetected = async (violationType, details) => {
    console.warn('🚨 ANTI-CHEATING VIOLATION TRIGGERED:', violationType, details);

    // 1. Immediately Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }

    // 2. Emit violation to backend via socket
    if (socketRef.current) {
      socketRef.current.emit('student-violation', {
        roomId,
        studentId: currentUser.profile?.id || currentUser.id,
        studentName: currentUser.name || 'Candidate',
        studentEmail: currentUser.email || '',
        violationType,
        details
      });
    }

    // 3. Fallback POST request to guarantee database logging
    try {
      const token = localStorage.getItem('campushire_token') || `demo_token_${currentUser?.role || 'student'}`;
      if (meetingDataRef.current?.id) {
        await fetch(`/api/meetings/${meetingDataRef.current.id}/violation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            studentId: currentUser.profile?.id || currentUser.id,
            violationType,
            details
          })
        });
      }
    } catch (e) {
      console.error('Error reporting violation via REST:', e);
    }

    triggerStudentEjection(violationType, details);
  };

  const triggerStudentEjection = (violationType, details) => {
    setIsEjected(true);
    setEjectionReason(`Anti-Cheating Policy Violation: ${details}`);

    // Persist ejection state permanently
    try {
      localStorage.setItem(`gsfc_meeting_ejected_${roomId}`, 'true');
      localStorage.setItem(`gsfc_meeting_ejection_reason_${roomId}`, details);
      localStorage.setItem(`gsfc_ejected_timestamp_${roomId}`, new Date().toISOString());

      let disqualifiedRooms = [];
      try { disqualifiedRooms = JSON.parse(localStorage.getItem('gsfc_disqualified_meeting_rooms') || '[]'); } catch(e) {}
      if (!disqualifiedRooms.includes(roomId)) {
        disqualifiedRooms.push(roomId);
        localStorage.setItem('gsfc_disqualified_meeting_rooms', JSON.stringify(disqualifiedRooms));
      }

      // Update student meetings roster
      const rawMeetings = localStorage.getItem('gsfc_student_meetings');
      if (rawMeetings) {
        let meetings = JSON.parse(rawMeetings);
        meetings = meetings.map(m => {
          if (m.room_code === roomId || m.room_id === roomId || m.id === roomId) {
            return { ...m, is_disqualified: true, outcome_status: 'disqualified', join_status: 'disqualified' };
          }
          return m;
        });
        localStorage.setItem('gsfc_student_meetings', JSON.stringify(meetings));
      }

      window.dispatchEvent(new CustomEvent('gsfc-meeting-disqualified', { detail: { roomId, details, violationType } }));
    } catch(e) {}

    cleanupMeeting();
  };

  // 6. Cleanup Meeting Resources
  const cleanupMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    Object.keys(peerConnectionsRef.current).forEach(socketId => {
      peerConnectionsRef.current[socketId].close();
    });
    peerConnectionsRef.current = {};

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setRemotePeers({});
  };

  // 7. Media Controls
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track in all peer connections
        Object.values(peerConnectionsRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.warn('Screen share error or cancelled:', err);
    }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      Object.values(peerConnectionsRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  // 8. Chat Sender
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;

    socketRef.current.emit('chat-message', {
      roomId,
      message: chatInput.trim(),
      senderId: currentUser.id,
      senderName: currentUser.name || 'Attendee',
      senderRole: currentUser.role
    });

    setChatInput('');
  };

  // 9. Save Recruiter Outcomes
  const handleSaveOutcomes = async () => {
    try {
      setIsSavingOutcomes(true);
      setSaveSuccessMsg('');
      const token = localStorage.getItem('campushire_token') || `demo_token_${currentUser?.role || 'admin'}`;
      
      const payloadOutcomes = Object.entries(candidateOutcomes).map(([studentId, data]) => ({
        studentId,
        outcomeStatus: data.status,
        notes: data.notes,
        score: parseFloat(data.score) || 0
      }));

      const res = await fetch(`/api/meetings/${meetingData.id}/outcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ outcomes: payloadOutcomes })
      });

      if (res.ok) {
        setSaveSuccessMsg('✅ Candidate results & applications updated!');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
      setIsSavingOutcomes(false);
    } catch (err) {
      console.error('Error saving outcomes:', err);
      setIsSavingOutcomes(false);
    }
  };

  // 10. End Meeting For All
  const handleEndMeetingForAll = async () => {
    if (!window.confirm('Are you sure you want to end this interview meeting for all participants? All candidate evaluations will be finalized.')) {
      return;
    }

    try {
      const token = localStorage.getItem('campushire_token') || `demo_token_${currentUser?.role || 'admin'}`;
      await handleSaveOutcomes();

      await fetch(`/api/meetings/${meetingData.id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (socketRef.current) {
        socketRef.current.emit('end-meeting-all', {
          roomId,
          endedByName: currentUser.name || 'Interviewer'
        });
      }

      cleanupMeeting();
      if (onLeaveRoom) onLeaveRoom();
    } catch (err) {
      console.error('Error ending meeting:', err);
    }
  };

  // RENDER: Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
        <h2 className="text-xl font-black">Connecting to Secure Interview Room...</h2>
        <p className="text-sm text-slate-400 mt-1">Verifying attendance credentials and anti-cheating environment</p>
      </div>
    );
  }

  // RENDER: Error State
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white">Access Restricted</h2>
          <p className="text-sm text-slate-300 mt-2">{error}</p>
          <button
            onClick={onLeaveRoom}
            className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // RENDER: ⛔ Ejected / Disqualified Screen
  if (isEjected) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full bg-gradient-to-b from-red-950/80 to-slate-900 border-2 border-red-500 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-black rounded-full uppercase tracking-wider">
            Disqualified • Session Terminated
          </span>
          <h2 className="text-2xl font-black text-white mt-3">Anti-Cheating Policy Violation</h2>
          <div className="mt-4 p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-xs text-red-200 text-left">
            <p className="font-bold flex items-center gap-1.5 text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              Violation Recorded in TPC Records:
            </p>
            <p className="mt-1 text-slate-300">{ejectionReason}</p>
            <p className="mt-2 text-[11px] text-red-400 font-mono">
              Timestamp: {new Date().toLocaleTimeString()} • Room: {roomId}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Your camera and microphone streams were immediately disconnected. This incident has been permanently archived in the GSFC Placement Integrity audit database for <strong className="text-white">{meetingData?.company_name}</strong> and TPC Admin review.
          </p>
          <button
            onClick={onLeaveRoom}
            className="mt-6 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition cursor-pointer shadow-lg shadow-red-900/30"
          >
            Acknowledge & Exit to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // RENDER: Pre-Join Room Screen (Camera check & Proctoring Acknowledgement)
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-black">
                  In-Portal Live Video Interview
                </span>
                <span className="text-xs text-slate-400 font-mono">Room: {roomId}</span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">{meetingData?.title}</h1>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" /> {meetingData?.company_name}
                <span>•</span>
                <Briefcase className="w-3.5 h-3.5 text-blue-400" /> {meetingData?.drive_title}
                <span>•</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> {meetingData?.duration_minutes} Mins
              </p>
            </div>
            <button
              onClick={onLeaveRoom}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Camera & Mic Preview Box */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${!videoEnabled ? 'hidden' : ''}`}
                />
                {!videoEnabled && (
                  <div className="flex flex-col items-center text-slate-500">
                    <VideoOff className="w-12 h-12 mb-2" />
                    <span className="text-xs font-bold">Camera is Off</span>
                  </div>
                )}

                {/* Overlaid preview badge */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-slate-300 border border-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Device Preview
                </div>
              </div>

              {/* Media preview toggles */}
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full border transition cursor-pointer ${
                    micEnabled ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-red-500/20 border-red-500 text-red-400'
                  }`}
                  title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full border transition cursor-pointer ${
                    videoEnabled ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-red-500/20 border-red-500 text-red-400'
                  }`}
                  title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Rules & Check-In Column */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              {isStudent ? (
                <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>Anti-Cheating Proctoring Notice</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    This interview is monitored by GSFC University's automated anti-cheating proctoring engine.
                  </p>
                  <ul className="mt-3 space-y-2 text-[11px] text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>Do NOT switch browser tabs</strong> or minimize this window at any time.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>Do NOT click outside into other apps</strong> (Window Blur detection is active).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>First Offense Penalty</strong>: Immediate session termination, media feed cutoff, and permanent incident log submitted to {meetingData?.company_name}.</span>
                    </li>
                  </ul>

                  <label className="flex items-start gap-2.5 mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:border-amber-500/50 transition">
                    <input
                      type="checkbox"
                      checked={policyAccepted}
                      onChange={(e) => setPolicyAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-800"
                    />
                    <span className="text-[11px] font-bold text-slate-200">
                      I agree to the Anti-Cheating terms and understand that leaving this window will disqualify my interview.
                    </span>
                  </label>
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 text-indigo-400 font-black text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Interviewer / Host Terminal</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    You have unrestricted interviewer permissions. You can take notes, switch tabs, view candidate resumes, and evaluate students in real time.
                  </p>
                  <div className="mt-3 text-xs text-slate-400">
                    <p>Attendees Invited: <strong>{participants.length}</strong></p>
                    <p className="mt-1">Proctoring Lock: <strong className="text-emerald-400">Enforced for candidates</strong></p>
                  </div>
                </div>
              )}

              <button
                onClick={handleJoinMeeting}
                disabled={isStudent && !policyAccepted}
                className={`w-full py-4 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 shadow-xl cursor-pointer mt-4 ${
                  isStudent && !policyAccepted
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white shadow-emerald-900/30'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Join Live Interview Room Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Live Video Meeting Room Stage
  const peerList = Object.entries(remotePeers);

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col overflow-hidden select-none font-sans">
      {/* 1. TOP HEADER BAR */}
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-black text-white text-xs shadow-md">
            GSFC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-black text-white truncate max-w-xs sm:max-w-md">
                {meetingData?.title}
              </h1>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Room ID: {roomId} • {meetingData?.company_name}
            </p>
          </div>
        </div>

        {/* Header Right Badges & Side Drawer Toggles */}
        <div className="flex items-center gap-2">
          {isStudent && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] font-bold text-amber-300">
              <Lock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Proctoring Active (Do not switch tabs)</span>
            </div>
          )}

          {isInterviewer && (
            <button
              onClick={() => setActiveSideDrawer(activeSideDrawer === 'evaluation' ? null : 'evaluation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                activeSideDrawer === 'evaluation'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-800 text-amber-300 border-amber-500/30 hover:bg-slate-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Candidate Outcomes</span>
            </button>
          )}

          <button
            onClick={() => setActiveSideDrawer(activeSideDrawer === 'participants' ? null : 'participants')}
            className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeSideDrawer === 'participants' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Participant List"
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setActiveSideDrawer(activeSideDrawer === 'chat' ? null : 'chat');
              setUnreadChatCount(0);
            }}
            className={`relative p-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeSideDrawer === 'chat' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="In-Meeting Chat"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. REAL-TIME VIOLATION ALERT BANNER (Recruiter/Admin View) */}
      {liveViolationAlert && isInterviewer && (
        <div className="bg-red-950/90 border-b border-red-500 px-4 py-2 flex items-center justify-between text-xs text-red-200 animate-in slide-in-from-top duration-300 z-20">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
            <span>
              🚨 <strong>Candidate Ejected:</strong> {liveViolationAlert.studentName} was flagged & removed for <strong>{liveViolationAlert.violationType}</strong> ({liveViolationAlert.details})
            </span>
          </div>
          <button
            onClick={() => setLiveViolationAlert(null)}
            className="p-1 text-red-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. MAIN VIDEO STAGE & SIDE DRAWER */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIDEO GRID */}
        <div className="flex-1 p-3 sm:p-4 grid gap-3 sm:gap-4 auto-rows-fr overflow-y-auto" style={{
          gridTemplateColumns: peerList.length === 0 ? '1fr' : (peerList.length === 1 ? '1fr 1fr' : 'repeat(auto-fit, minmax(280px, 1fr))')
        }}>
          {/* LOCAL VIDEO TILE */}
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center group min-h-[200px]">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${!videoEnabled ? 'hidden' : ''}`}
            />
            {!videoEnabled && (
              <div className="flex flex-col items-center justify-center p-4 text-slate-500">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xl text-slate-300 mb-2">
                  {(currentUser.name || 'You').slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-400">{currentUser.name || 'You'} (Camera Off)</span>
              </div>
            )}

            {/* Overlaid details */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-bold text-white border border-slate-800 flex items-center gap-1.5">
              <span>{currentUser.name || 'You'} ({currentUser.role === 'company' ? 'Recruiter' : (currentUser.role === 'admin' ? 'TPC Admin' : 'Candidate')})</span>
              {!micEnabled && <MicOff className="w-3 h-3 text-red-400 shrink-0" />}
            </div>
          </div>

          {/* REMOTE PEERS VIDEO TILES */}
          {peerList.map(([socketId, peer]) => (
            <RemoteVideoTile key={socketId} peer={peer} />
          ))}

          {/* Waiting for attendee placeholder if alone */}
          {peerList.length === 0 && (
            <div className="relative bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <Users className="w-12 h-12 text-slate-600 mb-2 animate-pulse" />
              <h3 className="text-sm font-black text-slate-400">Waiting for other participants to connect...</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">
                {isStudent ? 'Your recruiter has been notified of your arrival.' : 'Shortlisted candidates will appear here as they enter.'}
              </p>
            </div>
          )}
        </div>

        {/* 4. SIDE DRAWERS (Participants, Chat, Recruiter Evaluation) */}
        {activeSideDrawer && (
          <aside className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-10 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                {activeSideDrawer === 'participants' && <><Users className="w-4 h-4 text-indigo-400" /> Meeting Attendees ({participants.length})</>}
                {activeSideDrawer === 'chat' && <><MessageSquare className="w-4 h-4 text-blue-400" /> In-Meeting Chat</>}
                {activeSideDrawer === 'evaluation' && <><Award className="w-4 h-4 text-amber-400" /> Recruiter Evaluation Bar</>}
              </h3>
              <button
                onClick={() => setActiveSideDrawer(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content: Participants */}
            {activeSideDrawer === 'participants' && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                {participants.map(p => (
                  <div key={p.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5">
                        {p.student_name || p.email}
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                          p.role === 'company' ? 'bg-blue-500/20 text-blue-300' : (p.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400')
                        }`}>
                          {p.role}
                        </span>
                      </p>
                      {p.student_program && (
                        <p className="text-[10px] text-slate-400">{p.student_roll} • {p.student_program} • CGPA {p.student_cgpa}</p>
                      )}
                    </div>
                    <div>
                      {p.join_status === 'ejected' ? (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black rounded-full">
                          FLAGGED / EJECTED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-full">
                          {p.join_status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {violationsList.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <p className="text-[11px] font-black text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Logged Violations ({violationsList.length})
                    </p>
                    {violationsList.map((v, idx) => (
                      <div key={idx} className="p-2 bg-red-950/40 border border-red-800/40 rounded-xl text-[10px] text-red-200 mb-1.5">
                        <p className="font-bold">{v.studentName || v.student_name} — {v.violationType || v.violation_type}</p>
                        <p className="text-slate-400 mt-0.5">{v.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Drawer Content: Chat */}
            {activeSideDrawer === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-500 text-xs py-8">
                      No messages yet. Send a note to participants.
                    </div>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} className="text-xs">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold mb-0.5">
                          <span className={msg.sender_role === 'company' ? 'text-blue-400' : 'text-slate-300'}>
                            {msg.sender_name} ({msg.sender_role})
                          </span>
                          <span>•</span>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-200">
                          {msg.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Drawer Content: Recruiter Evaluation Bar */}
            {activeSideDrawer === 'evaluation' && isInterviewer && (
              <div className="flex-1 p-3 overflow-y-auto space-y-4">
                <p className="text-xs text-slate-400">
                  Select outcome marks for each interviewed candidate. Results will synchronize directly into candidate applications.
                </p>

                {participants.filter(p => p.role === 'student').map(p => {
                  const sId = p.student_id || p.user_id;
                  const outcome = candidateOutcomes[sId] || { status: 'pending', notes: '', score: 0 };
                  const isFlagged = p.join_status === 'ejected';

                  return (
                    <div key={p.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-white">{p.student_name || 'Candidate'}</p>
                          <p className="text-[10px] text-slate-400">{p.student_roll} • {p.student_program}</p>
                        </div>
                        {isFlagged && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500 text-[9px] font-black rounded-full">
                            FLAGGED
                          </span>
                        )}
                      </div>

                      {/* 1-Click Status Selector */}
                      <div className="grid grid-cols-4 gap-1 text-[10px] font-black">
                        {['selected', 'rejected', 'hold', 'no_show'].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setCandidateOutcomes(prev => ({
                                ...prev,
                                [sId]: { ...prev[sId], status: st }
                              }));
                            }}
                            className={`py-1.5 rounded-lg uppercase cursor-pointer border transition ${
                              outcome.status === st
                                ? (st === 'selected' ? 'bg-emerald-600 text-white border-emerald-500' : (st === 'rejected' ? 'bg-red-600 text-white border-red-500' : 'bg-amber-600 text-white border-amber-500'))
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                            }`}
                          >
                            {st === 'no_show' ? 'No Show' : st}
                          </button>
                        ))}
                      </div>

                      {/* Evaluation Score & Notes */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">Rating (0-10):</span>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={outcome.score || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCandidateOutcomes(prev => ({
                                ...prev,
                                [sId]: { ...prev[sId], score: val }
                              }));
                            }}
                            className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-right font-mono text-white text-xs"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Interviewer notes / evaluation..."
                          value={outcome.notes || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCandidateOutcomes(prev => ({
                              ...prev,
                              [sId]: { ...prev[sId], notes: val }
                            }));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                        />
                      </div>
                    </div>
                  );
                })}

                {saveSuccessMsg && (
                  <p className="text-xs text-emerald-400 font-bold text-center">{saveSuccessMsg}</p>
                )}

                <button
                  onClick={handleSaveOutcomes}
                  disabled={isSavingOutcomes}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md"
                >
                  {isSavingOutcomes ? 'Saving...' : '💾 Save & Sync Outcome Marks'}
                </button>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 5. BOTTOM CONTROL DOCK */}
      <footer className="h-16 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">
            {meetingData?.title}
          </span>
        </div>

        {/* Center Media Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full border transition cursor-pointer shadow-md ${
              micEnabled ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-red-600 border-red-500 text-white'
            }`}
            title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
          >
            {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full border transition cursor-pointer shadow-md ${
              videoEnabled ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-red-600 border-red-500 text-white'
            }`}
            title={videoEnabled ? 'Turn Off Video' : 'Turn On Video'}
          >
            {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full border transition cursor-pointer shadow-md ${
              isScreenSharing ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <Monitor className="w-4 h-4" />
          </button>

          {/* Leave Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to leave this meeting?')) {
                cleanupMeeting();
                if (onLeaveRoom) onLeaveRoom();
              }
            }}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-full flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-red-900/30"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {isInterviewer && (
            <button
              onClick={handleEndMeetingForAll}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:opacity-90 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md"
            >
              End For All
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

// Subcomponent: Remote Video Tile with Auto-Track Attachment
function RemoteVideoTile({ peer }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  const user = peer.userInfo || {};
  const isCandidate = user.userRole === 'student';

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center min-h-[200px]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-bold text-white border border-slate-800 flex items-center gap-1.5">
        <span>{user.userName || 'Attendee'}</span>
        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
          isCandidate ? 'bg-slate-800 text-slate-400' : 'bg-blue-500/20 text-blue-300'
        }`}>
          {user.userRole || 'participant'}
        </span>
      </div>
    </div>
  );
}
