document.addEventListener('DOMContentLoaded', function () {
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
    let isSnappingEnabled = false;
    let gridSize = parseInt(document.getElementById('gridSizeInput').value, 10);
    let snapDistance = parseInt(document.getElementById('snapDistanceInput').value, 10);
    let freehandDrawing = false;
    let freehandPaths = [];
    let freehandPath = { points: [], color: lineColor, width: lineWidth };
    // curves
    var curves = [];
    var currentCurve = {};
    var isDrawingLine = false;
    var isDraggingCurve = false;
    var selectedCurveId = null;
    let hoveredCurveId = null;
    let selectedLineEffect = 'none';
    // Toggle between draw and move mode with 'm' key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'm') {
            mode = mode === 'draw' ? 'curve'
                : (mode === 'curve' ? 'freehand'
                    : (mode === 'freehand' ? 'duplicate'
                        : (mode === 'duplicate' ? 'move'
                            : 'draw'))); // Added 'curve' mode here
            console.log(`Mode switched to: ${mode}`);
            redrawCanvas();
        } else if (e.key === 'd' && selectedLineIndex !== -1) {
            // Delete the selected line when 'd' is pressed
            lines.splice(selectedLineIndex, 1);
            selectedLineIndex = -1; // Reset selected line index
            redrawCanvas(); // Redraw the canvas without the deleted lin
        } else if (e.key === 'd' && selectedCurveId !== null) {
            // Delete the selected curve when 'd' is pressed in move mode
            curves = curves.filter(curve => curve.id !== selectedCurveId);
            selectedCurveId = null; // Reset selected curve ID
            redrawCanvas(); // Redraw the canvas without the deleted curve
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

    function drawGrid() {
        ctx.strokeStyle = '#e0e0e0'; // Light gray color for the grid
        ctx.lineWidth = 1;

        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    function applySnapping(x, y) {
        if (!isSnappingEnabled) return [x, y];

        // Snap to grid logic
        const nearestGridX = Math.round(x / gridSize) * gridSize;
        const nearestGridY = Math.round(y / gridSize) * gridSize;

        if (Math.abs(x - nearestGridX) < snapDistance) x = nearestGridX;
        if (Math.abs(y - nearestGridY) < snapDistance) y = nearestGridY;

        // Add logic to snap to other objects if needed
        // ...

        return [x, y];
    }


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
        drawBasicLine(margin, margin, margin, canvas.height - margin, "Qc"); // Y-axis
        drawBasicLine(margin, canvas.height - margin, canvas.width - margin, canvas.height - margin, "Qy"); // X-axis

        // Draw ticks on Y-axis
        for (let y = margin; y < canvas.height - margin; y += tickSpacing) {
            drawBasicLine(margin - tickLength / 2, y, margin + tickLength / 2, y); // Ticks on Y-axis
        }

        // Draw ticks on X-axis
        for (let x = margin; x < canvas.width - margin; x += tickSpacing) {
            drawBasicLine(x, canvas.height - margin - tickLength / 2, x, canvas.height - margin + tickLength / 2); // Ticks on X-axis
        }

        // // Draw curves
        // ctx.strokeStyle = 'green'; // Color for curve
        // ctx.lineWidth = 2;
        // drawCurve(/* ... */);

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


    function drawBasicLine(startX, startY, endX, endY, label) {
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
        currentLine.effect = selectedLineEffect; // Add the selected effect to the line
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
        let { offsetX: x, offsetY: y } = e;

        // Apply snapping
        [x, y] = applySnapping(x, y);

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
        console.log("Redrawing canvas. Current freehandPaths:", freehandPaths);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawEconomicGraph(); // If you have a static background graph
        if (isSnappingEnabled) {
            drawGrid(); // Function to draw the grid based on gridSize
        }

        //Draw all stored freehand paths
        freehandPaths.forEach(path => drawPath(path));

        // Draw the current freehand path if it exists
        if (freehandDrawing && freehandPath.points.length > 0) {
            drawPath(freehandPath);
        }

        lines.forEach(line => {
            drawLine(line);
        });

        curves.forEach(curve => {
            if (curve.startPoint) { // Ensure the curve is valid before drawing
                drawCurve(curve);
            }
        });


        if (isDrawingLine || isDraggingCurve) {
            drawCurve(currentCurve); // Draw the current curve
        }

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

    function drawPath(path) {
        if (path.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.moveTo(path.points[0][0], path.points[0][1]);
        for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i][0], path.points[i][1]);
        }
        ctx.stroke();
    }


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
    function drawFreehand(x, y) {
        if (!freehandDrawing) return;
        freehandPath.points.push([x, y]);
        redrawCanvas();
    }


    function startFreehandDrawing(x, y) {
        freehandDrawing = true;
        freehandPath = { points: [[x, y]], color: lineColor, width: lineWidth };
    }

    function addToFreehandPath(x, y) {
        if (freehandDrawing) {
            freehandPath.points.push([x, y]);
            redrawCanvas();
        }
    }

    function stopFreehandDrawing() {
        if (freehandDrawing && freehandPath.points.length > 0) {
            freehandDrawing = false;
            freehandPaths.push(freehandPath);
            redrawCanvas();
        }
    }



    function displayModeAndSelection() {
        // Reset shadow for text
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        const modeTextX = canvas.width - 100; // Horizontal position from the left
        const modeTextY = 30; // Vertical position from the top

        ctx.fillText(`Mode: ${mode}`, modeTextX, modeTextY);

        if (selectedLineIndex !== -1) {
            ctx.fillText(`Selected Line: ${selectedLineIndex}`, modeTextX, modeTextY + 20);
        }

        ctx.globalAlpha = 1;
    }


    canvas.addEventListener('mousemove', function (e) {
        const { offsetX: x, offsetY: y } = e;
        let onLine = lines.some(line => isLineClicked(line, x, y));

        // Change the cursor to a pointer if it's over a line
        if (onLine) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'default';
        }

        let hoverFound = false;
        curves.forEach(curve => {
            if (isCurveHovered(curve, e.offsetX, e.offsetY)) {
                hoveredCurveId = curve.id;
                hoverFound = true;
            }
        });

        if (!hoverFound) {
            hoveredCurveId = null;
        }


        // Existing logic for drawing, moving, or duplicating lines
        if (mode === 'draw') {
            draw(e);
        } else if (mode === 'move') {
            moveLine(e);
        } else if (mode === 'duplicate') {
            duplicateLine(e);
        } else if (mode === 'freehand') {
            drawFreehand(x, y);
        } else if (mode === 'curve') {
            if (isDrawingLine) {
                currentCurve.endPoint = { x: e.offsetX, y: e.offsetY };
                redrawCanvas();
            } else if (isDraggingCurve) {
                currentCurve.controlPoint = { x: e.offsetX, y: e.offsetY };
                redrawCanvas();
            }
        }
    });

    canvas.addEventListener('mousedown', function (e) {
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

            let curveFound = false;
            curves.forEach(function (curve, index) {
                if (isCurveClicked(curve, e.offsetX, e.offsetY)) {
                    selectedCurveId = curve.id;
                    curveFound = true;
                }
            });

            if (!curveFound) {
                selectedCurveId = null;
            }

            redrawCanvas(); // Redraw canvas to reflect the selection change
        } else if (mode === 'duplicate') {
            startDuplicating(e);
        } else if (mode === 'freehand') {
            const { offsetX: x, offsetY: y } = e;
            startFreehandDrawing(x, y);
        } else if (mode === 'curve') {
            if (e.shiftKey) {
                let curveFound = false;
                curves.forEach(function (curve, index) {
                    if (isCurveClicked(curve, e.offsetX, e.offsetY)) {
                        console.log("Trying to select curve with ID:", curve.id);
                        selectedCurveId = curve.id;
                        curveFound = true;
                    }
                });

                if (!curveFound) {
                    selectedCurveId = null;
                }

                redrawCanvas();
            } else if (!isDraggingCurve) {
                // Start drawing a new curve
                currentCurve = {
                    startPoint: { x: e.offsetX, y: e.offsetY },
                    controlPoint: { x: e.offsetX, y: e.offsetY }, // Initialize control point
                    endPoint: { x: e.offsetX, y: e.offsetY }, // Initialize end point
                    effect: selectedLineEffect // Assign the selected effect
                    // Add other properties like color and width if necessary
                };
                isDrawingLine = true;
            }
        }
    });

    canvas.addEventListener('mouseup', function () {
        if (mode === 'draw') {
            stopDrawing();
        } else if (mode === 'move') {
            stopMoving();
        } else if (mode === 'duplicate') {
            stopDuplicating();
        } else if (mode === 'freehand') {
            stopFreehandDrawing();
        } else if (mode === 'curve') {
            if (isDrawingLine) {
                isDrawingLine = false;
                isDraggingCurve = true; // Switch to curve dragging mode
            } else if (isDraggingCurve) {
                isDraggingCurve = false;
                currentCurve.id = curves.length; // Assign an ID to the curve
                curves.push(currentCurve); // Save the current curve
                currentCurve = {}; // Reset current curve
            }
        }
    });


    // adding touch support
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const touchX = touch.clientX - canvas.getBoundingClientRect().left;
        const touchY = touch.clientY - canvas.getBoundingClientRect().top;

        if (mode === 'freehand') {
            freehandDrawing = true;
            freehandPath = { points: [[touchX, touchY]], color: lineColor, width: lineWidth };
        } else if (mode === 'draw') {
            // Create a mock event object with offsetX and offsetY
            const mockEvent = { offsetX: touchX, offsetY: touchY };
            startDrawing(mockEvent);
        } else if (mode === 'curve') {
            const touch = e.touches[0];
            const touchX = touch.clientX - canvas.getBoundingClientRect().left;
            const touchY = touch.clientY - canvas.getBoundingClientRect().top;

            currentCurve = {
                startPoint: { x: touchX, y: touchY },
                controlPoint: { x: touchX, y: touchY }, // Initialize control point
                endPoint: { x: touchX, y: touchY }, // Initialize end point
                id: curves.length, // Assign an ID to the curve
                color: lineColor,
                width: lineWidth,
                effect: selectedLineEffect // Use the selected effect
            };

            isDrawingLine = true;
        }
    }


    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const touchX = touch.clientX - canvas.getBoundingClientRect().left;
        const touchY = touch.clientY - canvas.getBoundingClientRect().top;

        if (mode === 'freehand' && freehandDrawing) {
            freehandPath.points.push([touchX, touchY]);
            redrawCanvas();
        } else if (mode === 'draw' && drawing) {
            currentLine.x2 = touchX;
            currentLine.y2 = touchY;
            redrawCanvas();
        } else if (mode === 'curve' && isDrawingLine) {
            const touch = e.touches[0];
            const touchX = touch.clientX - canvas.getBoundingClientRect().left;
            const touchY = touch.clientY - canvas.getBoundingClientRect().top;

            // Update the control and end points of the curve
            currentCurve.endPoint = { x: touchX, y: touchY };
            // Optionally, you can update controlPoint for more complex interactions

            redrawCanvas();
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        if (mode === 'freehand') {
            freehandDrawing = false;
            if (freehandPath.points.length > 0) {
                freehandPaths.push(freehandPath); // Store the completed path
            }
        } else if (mode === 'draw') {
            stopDrawing();
        } else if (mode === 'curve' && currentCurve && currentCurve.startPoint) {
            curves.push(currentCurve);
            currentCurve = null; // Reset currentCurve
        }

        redrawCanvas(); // Redraw canvas to reflect changes
    }


    canvas.addEventListener("touchstart", handleTouchStart, false);
    canvas.addEventListener("touchmove", handleTouchMove, false);
    canvas.addEventListener("touchend", handleTouchEnd, false);


    // curves

    canvas.addEventListener('dblclick', function (e) {
        if (mode !== 'curve') return;
        curves.forEach(function (curve) {
            if (isCurveClicked(curve, e.offsetX, e.offsetY)) {
                // Logic to highlight or indicate selection
                console.log("Selected curve ID:", curve.id);
                curve.color = 'red'; // Example: Change color to red
                redrawCanvas();
            }
        });
    });

    document.getElementById('scaleCurveButton').addEventListener('click', function () {
        const scaleFactor = parseFloat(document.getElementById('scaleFactor').value);
        if (selectedCurveId !== null && !isNaN(scaleFactor)) {
            let curve = curves.find(curve => curve.id === selectedCurveId);
            if (curve) {
                scaleCurve(curve, scaleFactor);
                redrawCanvas();
            }
        }
    });


    document.getElementById('newCurveButton').addEventListener('click', function () {
        isDraggingCurve = false; // Exit curve dragging mode
    });


    function scaleCurve(curve, scaleFactor) {
        // Calculate the center point of the curve
        let centerX = (curve.startPoint.x + curve.endPoint.x) / 2;
        let centerY = (curve.startPoint.y + curve.endPoint.y) / 2;

        // Scale the start point, control point, and end point
        curve.startPoint.x = scalePoint(curve.startPoint.x, centerX, scaleFactor);
        curve.startPoint.y = scalePoint(curve.startPoint.y, centerY, scaleFactor);
        curve.controlPoint.x = scalePoint(curve.controlPoint.x, centerX, scaleFactor);
        curve.controlPoint.y = scalePoint(curve.controlPoint.y, centerY, scaleFactor);
        curve.endPoint.x = scalePoint(curve.endPoint.x, centerX, scaleFactor);
        curve.endPoint.y = scalePoint(curve.endPoint.y, centerY, scaleFactor);
    }

    function scalePoint(pointCoord, centerCoord, scaleFactor) {
        return centerCoord + (pointCoord - centerCoord) * scaleFactor;
    }

    function isCurveClicked(curve, clickX, clickY) {
        const segmentCount = 50; // Number of segments to divide the curve
        let t, x, y, dx, dy, distance;

        for (let i = 0; i <= segmentCount; i++) {
            t = i / segmentCount;
            x = quadraticBezier(t, curve.startPoint.x, curve.controlPoint.x, curve.endPoint.x);
            y = quadraticBezier(t, curve.startPoint.y, curve.controlPoint.y, curve.endPoint.y);

            dx = x - clickX;
            dy = y - clickY;
            distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 10) { // Threshold for considering a click 'near' the curve
                return true;
            }
        }

        return false;
    }
    function isCurveHovered(curve, clickX, clickY) {
        const segmentCount = 50; // Number of segments to divide the curve
        let t, x, y, dx, dy, distance;

        for (let i = 0; i <= segmentCount; i++) {
            t = i / segmentCount;
            x = quadraticBezier(t, curve.startPoint.x, curve.controlPoint.x, curve.endPoint.x);
            y = quadraticBezier(t, curve.startPoint.y, curve.controlPoint.y, curve.endPoint.y);

            dx = x - clickX;
            dy = y - clickY;
            distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 10) { // Threshold for considering a click 'near' the curve
                return true;
            }
        }

        return false;
    }

    function quadraticBezier(t, p0, p1, p2) {
        return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
    }

    document.getElementById('convertToLineButton').addEventListener('click', function () {
        if (selectedCurveId !== null) {
            let curve = curves.find(curve => curve.id === selectedCurveId);
            if (curve) {
                curve.controlPoint = calculateMidPoint(curve.startPoint, curve.endPoint);
                redrawCanvas();
            }
        }
    });
    function calculateMidPoint(point1, point2) {
        return {
            x: (point1.x + point2.x) / 2,
            y: (point1.y + point2.y) / 2
        };
    }

    // export

    function exportToPng() {
        const dataURL = canvas.toDataURL('image/png');
        downloadImage(dataURL, 'drawing.png');
    }

    function exportToJpg() {
        const dataURL = canvas.toDataURL('image/jpeg');
        downloadImage(dataURL, 'drawing.jpg');
    }

    function exportToSvg() {
        const svgString = convertCanvasToSvgString();
        const dataURL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
        downloadImage(dataURL, 'drawing.svg');
    }
    function convertCanvasToSvgString() {
        let svgString = `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">`;

        // Convert lines to SVG
        lines.forEach(line => {
            svgString += `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${line.color}" stroke-width="${line.width}" stroke-opacity="${line.opacity}" />`;
        });

        // Convert curves to SVG
        curves.forEach(curve => {
            if (curve.startPoint && curve.controlPoint && curve.endPoint) {
                svgString += `<path d="M ${curve.startPoint.x},${curve.startPoint.y} Q ${curve.controlPoint.x},${curve.controlPoint.y} ${curve.endPoint.x},${curve.endPoint.y}" fill="none" stroke="${curve.color}" stroke-width="${curve.width}" />`;
            }
        });

        // Convert freehand paths to SVG
        freehandPaths.forEach(path => {
            let pathData = 'M ' + path.points.map(p => p.join(',')).join(' L ');
            svgString += `<path d="${pathData}" stroke="${path.color}" stroke-width="${path.width}" fill="none" />`;
        });

        svgString += `</svg>`;
        return svgString;
    }


    function downloadImage(dataURL, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    document.getElementById('exportPng').addEventListener('click', exportToPng);
    document.getElementById('exportJpg').addEventListener('click', exportToJpg);
    document.getElementById('exportSvg').addEventListener('click', exportToSvg);

    // effect

    function drawLineWithBlur(line) {
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(line.x1 + i, line.y1 + i);
            ctx.lineTo(line.x2 + i, line.y2 + i);

            ctx.shadowColor = line.color;
            ctx.shadowBlur = i * 2; // Increasing blur

            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.width;
            ctx.stroke();
        }

        // Reset shadow to default
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }


    function drawLineWithGlow(line) {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);

        ctx.shadowColor = 'rgba(255, 255, 0, 0.7)'; // Bright yellow color for glow
        ctx.shadowBlur = 15; // Higher blur for a glow effect

        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.stroke();

        // Reset shadow to default
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }


    function drawLineWithShadow(line) {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // Shadow color
        ctx.shadowBlur = 10; // Blur level
        ctx.shadowOffsetX = 5; // Horizontal offset
        ctx.shadowOffsetY = 5; // Vertical offset

        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.stroke();

        // Reset shadow to default
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    function drawLine(line) {
        console.log("Drawing line with effect:", line.effect); // Debugging
        switch (line.effect) {
            case 'shadow':
                drawLineWithShadow(line);
                break;
            case 'glow':
                drawLineWithGlow(line);
                break;
            case 'blur':
                drawLineWithBlur(line);
                break;
            default:
                drawRegularLine(line);
                break;
        }
    }


    function drawRegularLine(line) {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.stroke();
    }


    // draw curve
    function drawCurve(curve) {
        switch (curve.effect) {
            case 'shadow':
                drawCurveWithShadow(curve);
                break;
            case 'glow':
                drawCurveWithGlow(curve);
                break;
            case 'blur':
                drawCurveWithBlur(curve);
                break;
            default:
                drawRegularCurve(curve);
                break;
        }
    }

    function drawRegularCurve(curve) {
        if (!curve || !curve.startPoint || !curve.controlPoint || !curve.endPoint) {
            console.error("Invalid curve object:", curve);
            return;
        }
        ctx.beginPath(); // Start a new path

        // Move to the starting point of the curve
        ctx.moveTo(curve.startPoint.x, curve.startPoint.y);

        // Draw the quadratic curve
        ctx.quadraticCurveTo(
            curve.controlPoint.x, curve.controlPoint.y,
            curve.endPoint.x, curve.endPoint.y
        );

        // Set the stroke style and line width
        ctx.strokeStyle = curve.color;
        ctx.lineWidth = curve.width;

        // Stroke the path on the canvas
        ctx.stroke();
    }

    function drawCurveWithGlow(curve) {
        ctx.save(); // Save the current state of the context

        ctx.beginPath();
        ctx.moveTo(curve.startPoint.x, curve.startPoint.y);
        ctx.quadraticCurveTo(curve.controlPoint.x, curve.controlPoint.y, curve.endPoint.x, curve.endPoint.y);

        ctx.shadowColor = 'rgba(255, 255, 0, 0.7)'; // Bright yellow color for glow
        ctx.shadowBlur = 15; // Higher blur for a glow effect

        ctx.strokeStyle = curve.color;
        ctx.lineWidth = curve.width;
        ctx.stroke();

        ctx.restore(); // Restore the context state to remove glow for other elements
    }

    function drawCurveWithShadow(curve) {
        ctx.save(); // Save the current state of the context

        ctx.beginPath();
        ctx.moveTo(curve.startPoint.x, curve.startPoint.y);
        ctx.quadraticCurveTo(curve.controlPoint.x, curve.controlPoint.y, curve.endPoint.x, curve.endPoint.y);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // Shadow color
        ctx.shadowBlur = 10; // Blur level
        ctx.shadowOffsetX = 5; // Horizontal offset
        ctx.shadowOffsetY = 5; // Vertical offset

        ctx.strokeStyle = curve.color;
        ctx.lineWidth = curve.width;
        ctx.stroke();

        ctx.restore(); // Restore the context state to remove shadow for other elements
    }


    function drawCurveWithBlur(curve) {
        for (let i = 0; i < 5; i++) {
            ctx.save(); // Save the current state of the context

            ctx.beginPath();
            ctx.moveTo(curve.startPoint.x, curve.startPoint.y);
            ctx.quadraticCurveTo(curve.controlPoint.x, curve.controlPoint.y, curve.endPoint.x, curve.endPoint.y);

            ctx.shadowColor = curve.color;
            ctx.shadowBlur = i * 2; // Increasing blur

            ctx.strokeStyle = curve.color;
            ctx.lineWidth = curve.width;
            ctx.stroke();

            ctx.restore(); // Restore the context state for each iteration
        }
    }


// Add these to your event listeners for the respective buttons/controls
document.getElementById('moveLineForward').addEventListener('click', moveLineForward);
document.getElementById('moveLineBackward').addEventListener('click', moveLineBackward);

document.getElementById('enableSnapping').addEventListener('change', function () {
    isSnappingEnabled = this.checked;
    redrawCanvas(); // Redraw the canvas if needed
});

document.getElementById('gridSizeInput').addEventListener('input', function () {
    gridSize = parseInt(this.value, 10);
    redrawCanvas(); // Redraw the canvas to update the grid
});

document.getElementById('snapDistanceInput').addEventListener('input', function () {
    snapDistance = parseInt(this.value, 10);
});

// Event listener for line width adjustment
document.getElementById('lineWidth').addEventListener('change', function (e) {
    lineWidth = parseInt(e.target.value, 10);
});

document.getElementById('lineColor').addEventListener('change', function (e) {
    lineColor = e.target.value;
});

// Event listener for line style change
document.getElementById('lineStyle').addEventListener('change', function (e) {
    lineStyle = e.target.value;
});

// Event listener for line opacity change
document.getElementById('lineOpacity').addEventListener('change', function (e) {
    lineOpacity = parseFloat(e.target.value);
});

document.getElementById('lockButton').addEventListener('click', function () {
    if (selectedLineIndex !== -1) {
        toggleLockLine(selectedLineIndex);
    }
});
document.getElementById('annotateButton').addEventListener('click', function () {
    const text = document.getElementById('annotationText').value;
    if (selectedLineIndex !== -1 && text) {
        annotateLine(selectedLineIndex, text);
        document.getElementById('annotationText').value = ''; // Clear the input field
    }
});


    document.getElementById('lineEffect').addEventListener('change', function (e) {
        selectedLineEffect = e.target.value;
    });



});