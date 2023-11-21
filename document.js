document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    let drawing = false;

    // Function to start drawing
    function startDrawing(x, y) {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    // Function to draw
    function draw(x, y) {
        if (!drawing) return;
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    // Function to stop drawing
    function stopDrawing() {
        drawing = false;
    }

    // Function to get touch position relative to the canvas
    function getTouchPos(canvasDom, touchEvent) {
        var rect = canvasDom.getBoundingClientRect();
        return {
            x: touchEvent.touches[0].clientX - rect.left,
            y: touchEvent.touches[0].clientY - rect.top
        };
    }

    // Touch event handlers
    function handleTouchStart(e) {
        const touchPos = getTouchPos(canvas, e);
        startDrawing(touchPos.x, touchPos.y);
        e.preventDefault(); // Prevent scrolling when touching the canvas
    }
    
    function handleTouchMove(e) {
        if (!drawing) return;
        const touchPos = getTouchPos(canvas, e);
        draw(touchPos.x, touchPos.y);
        e.preventDefault(); // Prevent scrolling when touching the canvas
    }
    
    function handleTouchEnd(e) {
        stopDrawing();
    }
    
    // Add touch event listeners
    canvas.addEventListener("touchstart", handleTouchStart, false);
    canvas.addEventListener("touchmove", handleTouchMove, false);
    canvas.addEventListener("touchend", handleTouchEnd, false);

    // Optional: Add mouse event listeners
    canvas.addEventListener('mousedown', function(e) {
        startDrawing(e.offsetX, e.offsetY);
    });

    canvas.addEventListener('mousemove', function(e) {
        draw(e.offsetX, e.offsetY);
    });

    canvas.addEventListener('mouseup', stopDrawing);
});
