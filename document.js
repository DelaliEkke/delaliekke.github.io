// Example using key presses to toggle modes
document.addEventListener('keydown', function(e) {
    if (e.key === 'r') { // 'r' key for rotate mode
        mode = 'rotate';
        rotatingMode = true;
        resizingMode = false;
    } else if (e.key === 's') { // 's' key for resize mode
        mode = 'resize';
        resizingMode = true;
        rotatingMode = false;
    } else {
        // Other modes or default mode
        resizingMode = false;
        rotatingMode = false;
    }
});
