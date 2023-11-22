function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the economic graph if it exists
    drawEconomicGraph(); 

    // Draw the grid if snapping is enabled
    if (isSnappingEnabled) {
        drawGrid(); 
    }

    // Draw all freehand paths
    freehandPaths.forEach(path => {
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.moveTo(path.points[0][0], path.points[0][1]);
        path.points.forEach(([x, y], index) => {
            if (index > 0) ctx.lineTo(x, y);
        });
        ctx.stroke();
    });

    // Draw the freehand path currently being drawn, if it exists
    if (currentPath && currentPath.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = currentPath.color;
        ctx.lineWidth = currentPath.width;
        ctx.moveTo(currentPath.points[0][0], currentPath.points[0][1]);
        for (let i = 1; i < currentPath.points.length; i++) {
            ctx.lineTo(currentPath.points[i][0], currentPath.points[i][1]);
        }
        ctx.stroke();
    }

    // Draw all other lines
    lines.forEach((line, index) => {
        ctx.beginPath();
        ctx.globalAlpha = line.opacity;
        applyLineStyle(ctx, line);

        // Additional styling based on the line's status (selected, locked, etc.)
        if (index === selectedLineIndex) {
            // Custom styling for selected line
        } else {
            // Default styling
            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.width;
        }

        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();

        // Draw annotations if they exist
        if (line.annotation) {
            const midX = (line.x1 + line.x2) / 2;
            const midY = (line.y1 + line.y2) / 2;
            drawAnnotation(midX, midY, line.annotation);
        }
    });

    // Display the current mode and selected line index
    displayModeAndSelection();
}
