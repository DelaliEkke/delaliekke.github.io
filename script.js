document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    let drawing = false, moving = false, duplicating = false;
    let currentLine = null, selectedLine = null;
    let lines = [];
    let mode = 'draw'; // Possible values: 'draw', 'move'
    let movingEnd = 'none'; // Possible values: 'start', 'end', 'none'
    let lineWidth = parseInt(document.getElementById('lineWidth').value, 10); // Get initial line width
    let selectedLineIndex = -1; // Index of the selected line for deletion
    let lineColor = document.getElementById('lineColor').value; // Get initial line color
    let lineStyle = document.getElementById('lineStyle').value; // Get initial line style
    let lineOpacity = parseFloat(document.getElementById('lineOpacity').value); // Get initial line opacity

    // Toggle between draw and move mode with 'm' key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'm') {
            mode = mode === 'draw' ? 'move' : (mode === 'move' ? 'duplicate' : 'draw');
            console.log(`Mode switched to: ${mode}`);
            redrawCanvas(); // Redraw the canvas without the deleted lin
        }else if (e.key === 'd' && selectedLineIndex !== -1) {
            // Delete the selected line when 'd' is pressed
            lines.splice(selectedLineIndex, 1);
            selectedLineIndex = -1; // Reset selected line index
            redrawCanvas(); // Redraw the canvas without the deleted lin
        }
    });

   // Function to check if two lines are in contact
   function linesAreInContact(line1, line2) {
    function checkIntersection(lineA, lineB) {
        const s1_x = lineA.x2 - lineA.x1;
        const s1_y = lineA.y2 - lineA.y1;
        const s2_x = lineB.x2 - lineB.x1;
        const s2_y = lineB.y2 - lineB.y1;

        const s = (-s1_y * (lineA.x1 - lineB.x1) + s1_x * (lineA.y1 - lineB.y1)) / (-s2_x * s1_y + s1_x * s2_y);
        const t = (s2_x * (lineA.y1 - lineB.y1) - s2_y * (lineA.x1 - lineB.x1)) / (-s2_x * s1_y + s1_x * s2_y);

        return s >= 0 && s <= 1 && t >= 0 && t <= 1;
    }

    return checkIntersection(line1, line2) || checkIntersection(line2, line1);
}


// Enhanced function to move line forward
function moveLineForward() {
    if (selectedLineIndex >= 0 && selectedLineIndex < lines.length - 1) {
        for (let i = selectedLineIndex + 1; i < lines.length; i++) {
            if (linesAreInContact(lines[selectedLineIndex], lines[i])) {
                // Swap with the first line found in contact
                [lines[selectedLineIndex], lines[i]] = [lines[i], lines[selectedLineIndex]];
                selectedLineIndex = i;
                redrawCanvas();
                break;
            }
        }
    }
}

// Enhanced function to move line backward
function moveLineBackward() {
    if (selectedLineIndex > 0) {
        for (let i = selectedLineIndex - 1; i >= 0; i--) {
            if (linesAreInContact(lines[selectedLineIndex], lines[i])) {
                // Swap with the first line found in contact
                [lines[selectedLineIndex], lines[i]] = [lines[i], lines[selectedLineIndex]];
                selectedLineIndex = i;
                redrawCanvas();
                break;
            }
        }
    }
}

// Add these to your event listeners for the respective buttons/controls
document.getElementById('moveLineForward').addEventListener('click', moveLineForward);
document.getElementById('moveLineBackward').addEventListener('click', moveLineBackward);


    // Event listener for line width adjustment
    document.getElementById('lineWidth').addEventListener('change', function(e) {
        lineWidth = parseInt(e.target.value, 10);
    });

    document.getElementById('lineColor').addEventListener('change', function(e) {
        lineColor = e.target.value;
    });

    // Event listener for line style change
    document.getElementById('lineStyle').addEventListener('change', function(e) {
        lineStyle = e.target.value;
    });

    // Event listener for line opacity change
    document.getElementById('lineOpacity').addEventListener('change', function(e) {
        lineOpacity = parseFloat(e.target.value);
    });

    document.getElementById('lockButton').addEventListener('click', function() {
        if (selectedLineIndex !== -1) {
            toggleLockLine(selectedLineIndex);
        }
    });
    document.getElementById('annotateButton').addEventListener('click', function() {
        const text = document.getElementById('annotationText').value;
        if (selectedLineIndex !== -1 && text) {
            annotateLine(selectedLineIndex, text);
            document.getElementById('annotationText').value = ''; // Clear the input field
        }
    });
     

    function drawEconomicGraph() {
        // Set up styles for the graph
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';
        ctx.lineWidth = 1;
        ctx.setLineDash([]); // Solid lines for the axes

        const margin = 40; // Margin from the borders of the canvas
        const tickLength = 10; // Length of the ticks along the axes
        const tickSpacing = 40; // Space between each tick

        // Draw axes with a margin from the border
        drawLine(margin, margin, margin, canvas.height - margin, "Qc"); // Y-axis
        drawLine(margin, canvas.height - margin, canvas.width - margin, canvas.height - margin, "Qy"); // X-axis

        // Draw ticks on Y-axis
        for (let y = margin; y < canvas.height - margin; y += tickSpacing) {
            drawLine(margin - tickLength / 2, y, margin + tickLength / 2, y); // Ticks on Y-axis
        }

        // Draw ticks on X-axis
        for (let x = margin; x < canvas.width - margin; x += tickSpacing) {
            drawLine(x, canvas.height - margin - tickLength / 2, x, canvas.height - margin + tickLength / 2); // Ticks on X-axis
        }

        // Draw curves
        ctx.strokeStyle = 'green'; // Color for curve
        ctx.lineWidth = 2;
        drawCurve(/* ... */);
    
        // Draw dashed lines
        ctx.strokeStyle = 'black'; // Color for dashed line
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Set dashed line style
        drawDashedLine(/* ... */);
    
        // Draw points and labels
        ctx.fillStyle = 'red'; // Color for points and labels
        drawPoint(/* ... */);
        drawLabel(/* ... */);
    
        // Reset line dash style for other drawings
        ctx.setLineDash([]);
    }
    function drawLine(startX, startY, endX, endY, label) {
        // Draw the line as before
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    
        // If a label is provided, draw it at the end of the line
        if (label) {
            ctx.fillStyle = 'black'; // Set the text color
            ctx.textAlign = 'center'; // Align text centrally relative to the line's ending point
            ctx.textBaseline = 'bottom'; // Align text so that the bottom of the text is at the y position
            ctx.font = '18px Arial'; // Text font
            ctx.fillText(label, endX, startY - 5); // Position the label slightly above the line end
        }
    }
    
    
    function drawCurve(startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.stroke();
    }
    
    function drawDashedLine(startX, startY, endX, endY, dashArray = [5, 5]) {
        ctx.beginPath();
        ctx.setLineDash(dashArray);
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]); // Reset to solid line
    }
    
    function drawPoint(x, y, radius = 3) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    function drawLabel(x, y, text) {
        ctx.fillText(text, x, y);
    }
    
    function annotateLine(lineIndex, text) {
    if (lineIndex >= 0 && lineIndex < lines.length && !lines[lineIndex].locked) {
        lines[lineIndex].annotation = text;
        redrawCanvas();
    }
}

    
    function startDrawing(e) {
        if (mode !== 'draw' || moving || duplicating) return;
        const { offsetX: x, offsetY: y } = e;
        drawing = true;
        currentLine = { 
            x1: x, y1: y, x2: x, y2: y, 
            width: lineWidth, color: lineColor, 
            style: lineStyle, opacity: lineOpacity,
            locked: false, // existing property
            annotation: ""  // new property for annotation
        };
        lines.push(currentLine);
    }

    function startDuplicating(e) {
        if (mode !== 'duplicate' || drawing || moving) return;
        const { offsetX: x, offsetY: y } = e;
        lines.forEach(line => {
            if (isLineClicked(line, x, y)) {
                duplicating = true;
                selectedLine = line;
                currentLine = { ...line, x1: x, y1: y, x2: x + (line.x2 - line.x1), y2: y + (line.y2 - line.y1) };
                lines.push(currentLine);
            }
        });
    }

    function duplicateLine(e) {
        if (!duplicating) return;
        const { offsetX: x, offsetY: y } = e;
        const dx = x - selectedLine.x1;
        const dy = y - selectedLine.y1;
        currentLine.x1 = selectedLine.x1 + dx;
        currentLine.y1 = selectedLine.y1 + dy;
        currentLine.x2 = selectedLine.x2 + dx;
        currentLine.y2 = selectedLine.y2 + dy;
        redrawCanvas();
    }

    function stopDuplicating() {
        duplicating = false;
        selectedLine = null;
        currentLine = null;
    }

    function draw(e) {
        if (!drawing) return;
        const { offsetX: x, offsetY: y } = e;
        currentLine.x2 = x;
        currentLine.y2 = y;
        redrawCanvas();
    }

    function stopDrawing() {
        drawing = false;
        currentLine = null;
    }

    function startMoving(e) {
        if (mode !== 'move' || drawing) return;
        if (currentLine.locked) return; // Prevent moving if the line is locked
        const { offsetX: x, offsetY: y } = e;
        lines.forEach(line => {
            if (isLineClicked(line, x, y)) {
                moving = true;
                currentLine = line;
                movingEnd = determineMovingEnd(line, x, y);
            }
        });
    }

    function toggleLockLine(lineIndex) {
        if (lineIndex >= 0 && lineIndex < lines.length) {
            lines[lineIndex].locked = !lines[lineIndex].locked;
            redrawCanvas(); // Update the canvas to reflect the change
        }
    }
    

    function determineMovingEnd(line, x, y) {
        const distToStart = Math.sqrt((line.x1 - x) ** 2 + (line.y1 - y) ** 2);
        const distToEnd = Math.sqrt((line.x2 - x) ** 2 + (line.y2 - y) ** 2);
        return distToStart < distToEnd ? 'start' : 'end';
    }

    function moveLine(e) {
        if (!moving || currentLine.locked) return; // Check if the line is locked
        const { offsetX: x, offsetY: y } = e;

        if (movingEnd === 'start') {
            currentLine.x1 = x;
            currentLine.y1 = y;
        } else if (movingEnd === 'end') {
            currentLine.x2 = x;
            currentLine.y2 = y;
        }
        redrawCanvas();
    }

    function stopMoving() {
        moving = false;
        movingEnd = 'none';
        currentLine = null;
    }

    function isLineClicked(line, x, y) {
        const A = { x: line.x1, y: line.y1 };
        const B = { x: line.x2, y: line.y2 };
        const P = { x: x, y: y };
        const distToSegment = distanceToSegment(P, A, B);
        return distToSegment < 10; // 10px tolerance for easier clicking
    }

    function distanceToSegment(P, A, B) {
        const lenSquared = distanceSquared(A, B);
        if (lenSquared === 0) return distanceSquared(P, A);
        let t = ((P.x - A.x) * (B.x - A.x) + (P.y - A.y) * (B.y - A.y)) / lenSquared;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt(distanceSquared(P, { x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y) }));
    }

    function distanceSquared(v, w) { 
        return (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    }

    function drawArrowhead(ctx, x, y, radians) {
        const arrowLength = 15; // Length of the arrowhead
        const arrowWidth = 5; // Width of the arrowhead
    
        ctx.save();
        ctx.beginPath();
        ctx.translate(x, y);
        ctx.rotate(radians);
    
        // Draw an arrowhead
        ctx.moveTo(0, 0); // Start at the line end
        ctx.lineTo(-arrowWidth, -arrowLength);
        ctx.lineTo(arrowWidth, -arrowLength);
        ctx.lineTo(0, 0);
    
        ctx.fillStyle = ctx.strokeStyle; // Set the fill color to the same as the line
        ctx.fill();
    
        ctx.restore();
    }
    
    function applyLineStyle(ctx, line) {
        switch (line.style) {
            case 'dashed':
                ctx.setLineDash([10, 10]);
                break;
            case 'dotted':
                ctx.setLineDash([2, 5]);
                break;
            case 'arrows':
                ctx.setLineDash([]);
                // Calculate angle of the line
                let angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
                drawArrowhead(ctx, line.x2, line.y2, angle);
                break;
            default:
                ctx.setLineDash([]);
        }
    }
    
    
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        drawEconomicGraph(); // If you have a static background graph
    
        lines.forEach((line, index) => {
            ctx.beginPath();
            ctx.globalAlpha = line.opacity;
            applyLineStyle(ctx, line);
    
            if (index === selectedLineIndex) {
                if (line.locked) {
                    // Style for a selected and locked line
                    ctx.strokeStyle = 'grey'; // Different color for locked line
                    ctx.lineWidth = line.width + 4; // Thicker line for visibility
                    ctx.setLineDash([5, 5]); // Dashed style for locked line
    
                    // Draw endpoint markers for locked line
                    drawEndpointMarker(line.x1, line.y1, 'red');
                    drawEndpointMarker(line.x2, line.y2, 'red');
                } else {
                    // Style for a selected but not locked line
                    ctx.strokeStyle = 'blue'; // Highlight color for selected line
                    ctx.lineWidth = line.width + 2;
    
                    // Draw endpoint markers for selected line
                    drawEndpointMarker(line.x1, line.y1, 'blue');
                    drawEndpointMarker(line.x2, line.y2, 'blue');
                }
            } else {
                // Regular style for non-selected lines
                ctx.strokeStyle = line.color;
                ctx.lineWidth = line.width;
            }

            // Draw annotation if it exists
            if (line.annotation) {
                const midX = (line.x1 + line.x2) / 2;
                const midY = (line.y1 + line.y2) / 2;
                drawAnnotation(midX, midY, line.annotation);
            }
    
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            ctx.stroke();
        });
    
        // Display mode and selected line index
        displayModeAndSelection();
    }
    
    //Draw
    redrawCanvas();

    function drawAnnotation(x, y, text) {
        ctx.fillStyle = 'black'; // Annotation text color
        ctx.font = '12px Arial'; // Annotation text font
        ctx.fillText(text, x, y);
    }

    // Function to draw endpoint markers
    function drawEndpointMarker(x, y, color) {
        const markerRadius = 5; // Adjust size as needed
        ctx.beginPath();
        ctx.arc(x, y, markerRadius, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
    }
    

    function displayModeAndSelection() {
        // Reset shadow for text
        ctx.shadowBlur = 0;
    
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        const modeTextX =canvas.width - 100; // Horizontal position from the left
        const modeTextY = 30; // Vertical position from the top

        ctx.fillText(`Mode: ${mode}`, modeTextX, modeTextY);

        if (selectedLineIndex !== -1) {
            ctx.fillText(`Selected Line: ${selectedLineIndex}`, modeTextX, modeTextY+20);
        }
    
        ctx.globalAlpha = 1;
    }
    
    
    canvas.addEventListener('mousemove', function(e) {
        const { offsetX: x, offsetY: y } = e;
        let onLine = lines.some(line => isLineClicked(line, x, y));
    
        // Change the cursor to a pointer if it's over a line
        if (onLine) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'default';
        }
    
        // Existing logic for drawing, moving, or duplicating lines
        if (mode === 'draw') {
            draw(e);
        } else if (mode === 'move') {
            moveLine(e);
        } else if (mode === 'duplicate') {
            duplicateLine(e);
        }
    });
    
    canvas.addEventListener('mousedown', function(e) {
        if (mode === 'draw') {
            startDrawing(e);
        } else if (mode === 'move') {
            const { offsetX: x, offsetY: y } = e;
            let lineFound = false;
    
            lines.forEach((line, index) => {
                if (isLineClicked(line, x, y) && !lineFound) {
                    selectedLineIndex = index; // Set the selected line index
                    lineFound = true; // Line is found, no need to check further
                    if (!lines[selectedLineIndex].locked) {
                        currentLine = line; // Set currentLine only if it's not locked
                        startMoving(e); // Start moving the selected line
                    }
                }
            });
    
            if (!lineFound) {
                selectedLineIndex = -1; // Deselect line if none is clicked
                currentLine = null; // Ensure currentLine is null if no line is found
            }
            redrawCanvas(); // Redraw canvas to reflect the selection change
        } else if (mode === 'duplicate') {
            startDuplicating(e);
        }
    });
    
    
    canvas.addEventListener('mouseup', function() {
        if (mode === 'draw') {
            stopDrawing();
        } else if (mode === 'move') {
            stopMoving();
        }else if (mode === 'duplicate') {
            stopDuplicating();
        }
    });
});