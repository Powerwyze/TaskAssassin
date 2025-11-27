import confetti from 'canvas-confetti';

/**
 * Trigger confetti celebration
 */
export const triggerConfetti = (stars: number = 3) => {
  const count = stars * 50; // More stars = more confetti
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  // Different effects based on stars
  if (stars >= 3) {
    // Epic celebration for perfect score
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#a855f7', '#ec4899', '#06b6d4', '#10b981']
    });
    fire(0.2, {
      spread: 60,
      colors: ['#FFD700', '#FFA500', '#FF6347']
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#a855f7', '#ec4899', '#06b6d4']
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#10b981', '#3b82f6']
    });
  } else if (stars >= 2) {
    // Good celebration for 2 stars
    fire(0.25, {
      spread: 26,
      startVelocity: 45,
      colors: ['#a855f7', '#ec4899', '#06b6d4']
    });
    fire(0.2, {
      spread: 60,
      colors: ['#10b981', '#3b82f6']
    });
  } else {
    // Simple celebration for 1 star
    fire(0.3, {
      spread: 40,
      startVelocity: 35,
      colors: ['#a855f7', '#06b6d4', '#10b981']
    });
  }
};

/**
 * Play celebration sound
 */
export const playSound = (soundType: 'complete' | 'achievement' | 'levelup', enabled: boolean = true) => {
  if (!enabled) return;

  // Create audio context for sound effects
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  const playTone = (frequency: number, duration: number, delay: number = 0) => {
    setTimeout(() => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    }, delay);
  };

  switch (soundType) {
    case 'complete':
      // Success sound - ascending tones
      playTone(523.25, 0.1, 0); // C
      playTone(659.25, 0.1, 100); // E
      playTone(783.99, 0.2, 200); // G
      break;

    case 'achievement':
      // Achievement unlocked - fanfare
      playTone(523.25, 0.15, 0);
      playTone(659.25, 0.15, 150);
      playTone(783.99, 0.15, 300);
      playTone(1046.50, 0.3, 450); // High C
      break;

    case 'levelup':
      // Level up - triumphant
      playTone(392.00, 0.1, 0); // G
      playTone(523.25, 0.1, 100); // C
      playTone(659.25, 0.1, 200); // E
      playTone(783.99, 0.1, 300); // G
      playTone(1046.50, 0.4, 400); // C (high)
      break;
  }
};

/**
 * Full celebration with confetti and sound
 */
export const celebrate = (stars: number, soundEnabled: boolean = true, newAchievements: string[] = [], leveledUp: boolean = false) => {
  triggerConfetti(stars);

  if (soundEnabled) {
    if (leveledUp) {
      playSound('levelup', soundEnabled);
    } else if (newAchievements.length > 0) {
      playSound('achievement', soundEnabled);
    } else {
      playSound('complete', soundEnabled);
    }
  }
};
