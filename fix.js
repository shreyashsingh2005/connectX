const fs = require('fs');
let hook = fs.readFileSync('src/hooks/useWebRTC.ts', 'utf8');

hook = hook.replace(/pc\.onicecandidate = async \(event\) => \{[\s\S]*?\};\s*pc\.ontrack/m, `pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await supabase.rpc('append_call_ice_candidate', {
            p_call_id: callId,
            p_side: isCaller ? 'caller' : 'receiver',
            p_candidate: event.candidate.toJSON()
          });
        } catch (e) {
          console.error('ICE RPC error', e);
        }
      }
    };

    pc.ontrack`);

hook = hook.replace(/if \(call\.offer\) await pc\.setRemoteDescription\(new RTCSessionDescription\(call\.offer\)\);/, `if (call.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
        if (call.caller_candidates && call.caller_candidates.length > 0) {
          for (const c of call.caller_candidates) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
          }
        }
      }`);

hook = hook.replace(/if \(newCall\.status === 'accepted' && isCaller && status === 'outgoing_ringing' && newCall\.answer\) \{[\s\S]*?\}\s*\/\/ Process ICE candidates\s*const remoteCandidates = isCaller \? newCall\.receiver_candidates : newCall\.caller_candidates;\s*if \(remoteCandidates && remoteCandidates\.length > 0 && pc\.remoteDescription\) \{[\s\S]*?\}\);\s*\}/m, `if (newCall.status === 'accepted' && isCaller && !pc.currentRemoteDescription && newCall.answer) {
            setCallStatus('connecting');
            try { await pc.setRemoteDescription(new RTCSessionDescription(newCall.answer)); } catch(e) {}
          }

          // Process ICE candidates
          const remoteCandidates = isCaller ? newCall.receiver_candidates : newCall.caller_candidates;
          if (remoteCandidates && remoteCandidates.length > 0 && pc.remoteDescription) {
            for (const c of remoteCandidates) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch(e) {}
            }
          }`);

fs.writeFileSync('src/hooks/useWebRTC.ts', hook);
