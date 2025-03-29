export const drawHand = (hands, ctx) => {
    if (!hands.length) return;

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;

    hands.forEach(hand => {
      const landmarks = hand.keypoints;

      for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i].x;
        const y = landmarks[i].y;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      }
    });
  };
