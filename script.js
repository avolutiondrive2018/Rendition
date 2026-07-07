document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const uploadStatus = document.getElementById('uploadStatus');
    const dropzone = document.getElementById('dropzone');
    const canvas = document.getElementById('canvas');
    const bgImg = document.getElementById('bgImg');
    const modelsBox = document.getElementById('modelsBox');
    const actionsBox = document.getElementById('actionsBox');
    const btnSaveImage = document.getElementById('btnSaveImage');

    let highestZIndex = 10;

    function bringToFront(wrapper) {
        highestZIndex++;
        wrapper.style.zIndex = highestZIndex;
    }

    // Handle Image Upload
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadStatus.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (event) => {
                bgImg.onload = () => {
                    dropzone.classList.remove('empty');
                    dropzone.querySelector('.dropzone-message').style.display = 'none';
                    canvas.classList.remove('canvas-hidden');
                    modelsBox.style.display = 'flex';
                    actionsBox.style.display = 'flex';
                    const customImageShapeBox = document.getElementById('customImageShapeBox');
                    if (customImageShapeBox) customImageShapeBox.style.display = 'flex';

                    canvas.style.width = bgImg.offsetWidth + 'px';
                    canvas.style.height = bgImg.offsetHeight + 'px';
                };
                bgImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle Custom Image Shape Upload
    const shapeImgUpload = document.getElementById('shapeImgUpload');
    if (shapeImgUpload) {
        shapeImgUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        let w = tempImg.naturalWidth || 300;
                        let h = tempImg.naturalHeight || 200;
                        const maxDim = 300;
                        if (w > maxDim || h > maxDim) {
                            const ratio = w / h;
                            if (w > h) {
                                w = maxDim;
                                h = Math.round(maxDim / ratio);
                            } else {
                                h = maxDim;
                                w = Math.round(maxDim * ratio);
                            }
                        }
                        const bgStyle = `url(${event.target.result}) no-repeat center/cover`;
                        addShapeToCanvas(w, h, bgStyle, 'image');
                    };
                    tempImg.src = event.target.result;
                };
                reader.readAsDataURL(file);
                shapeImgUpload.value = '';
            }
        });
    }

    // Add 2D shapes
    document.querySelectorAll('.btn-model').forEach(btn => {
        btn.addEventListener('click', () => {
            const width = parseInt(btn.getAttribute('data-width'));
            const height = parseInt(btn.getAttribute('data-height'));
            const shapeType = btn.getAttribute('data-shape') || 'color';

            const preview = btn.querySelector('.shape-preview');
            let bg = window.getComputedStyle(preview).background;

            if (shapeType === 'circle-outline' || shapeType === 'box-outline') {
                bg = 'transparent';
            }

            addShapeToCanvas(width, height, bg, shapeType);
        });
    });

    // Deselect all
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.warp-container') && !e.target.closest('.sidebar')) {
            document.querySelectorAll('.warp-container').forEach(w => w.classList.remove('active'));
        }
    });

    function addShapeToCanvas(w, h, bgStyle, shapeType = 'color') {
        const container = document.createElement('div');
        container.className = 'warp-container active';

        bringToFront(container);

        // Container coordinates: center of canvas initially
        let cx = canvas.offsetWidth / 2;
        let cy = canvas.offsetHeight / 2;

        container.style.left = cx + 'px';
        container.style.top = cy + 'px';

        // The image itself (using a div for now as a colored rectangle)
        const img = document.createElement('div');
        img.className = 'warp-img';
        img.style.width = w + 'px';
        img.style.height = h + 'px';
        img.style.background = bgStyle;

        // Customize shape styling
        if (shapeType === 'circle-outline') {
            img.style.borderRadius = '50%';
            img.style.border = '4px solid #3b82f6';
        } else if (shapeType === 'box-outline') {
            img.style.border = '4px solid #3b82f6';
        } else if (shapeType === 'text') {
            img.style.background = 'transparent';
            img.style.boxShadow = 'none';
        }

        // Add grid overlay only to standard colored shapes
        if (shapeType === 'color') {
            const gridOverlay = document.createElement('div');
            gridOverlay.className = 'grid-overlay';
            img.appendChild(gridOverlay);
        }

        // Add editable text inputs only for Text shapes initially (Dimension handles it in updateWarp)
        if (shapeType === 'text') {
            const textEl = document.createElement('div');
            textEl.className = 'warp-editable-text text-only';
            textEl.contentEditable = 'true';
            textEl.textContent = 'Enter text';
            textEl.addEventListener('keydown', (e) => e.stopPropagation());
            textEl.addEventListener('mousedown', (e) => e.stopPropagation());
            textEl.addEventListener('touchstart', (e) => e.stopPropagation());
            img.appendChild(textEl);
        }

        const selectContainer = (e) => {
            document.querySelectorAll('.warp-container').forEach(c => c.classList.remove('active'));
            container.classList.add('active');
            bringToFront(container);
            e.stopPropagation();
        };

        img.addEventListener('mousedown', selectContainer);
        img.addEventListener('touchstart', selectContainer);

        container.appendChild(img);

        const isTwoPoint = (shapeType === 'arrow' || shapeType === 'dimension');
        const numPts = isTwoPoint ? 2 : 4;

        // 4 corners of the source image
        const srcPts = [
            { x: 0, y: 0 },
            { x: w, y: 0 },
            { x: w, y: h },
            { x: 0, y: h }
        ];

        // Initial destination points are centered around 0,0 since container is centered
        let dstPts = isTwoPoint ? [
            { x: -w / 2, y: 0 },
            { x: w / 2, y: 0 }
        ] : [
            { x: -w / 2, y: -h / 2 },
            { x: w / 2, y: -h / 2 },
            { x: w / 2, y: h / 2 },
            { x: -w / 2, y: h / 2 }
        ];

        // Handles
        const handles = [];
        for (let i = 0; i < numPts; i++) {
            const hndl = document.createElement('div');
            hndl.className = 'warp-handle';
            container.appendChild(hndl);
            handles.push(hndl);

            // Drag handle (Mouse)
            hndl.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                document.querySelectorAll('.warp-container').forEach(c => c.classList.remove('active'));
                container.classList.add('active');
                bringToFront(container);

                const startX = e.clientX;
                const startY = e.clientY;
                const startPtX = dstPts[i].x;
                const startPtY = dstPts[i].y;

                const onMouseMove = (ev) => {
                    dstPts[i].x = startPtX + (ev.clientX - startX);
                    dstPts[i].y = startPtY + (ev.clientY - startY);
                    updateWarp();
                };

                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            // Drag handle (Touch)
            hndl.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                e.preventDefault();
                document.querySelectorAll('.warp-container').forEach(c => c.classList.remove('active'));
                container.classList.add('active');
                bringToFront(container);

                const touch = e.touches[0];
                const startX = touch.clientX;
                const startY = touch.clientY;
                const startPtX = dstPts[i].x;
                const startPtY = dstPts[i].y;

                const onTouchMove = (ev) => {
                    const t = ev.touches[0];
                    dstPts[i].x = startPtX + (t.clientX - startX);
                    dstPts[i].y = startPtY + (t.clientY - startY);
                    updateWarp();
                };

                const onTouchEnd = () => {
                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend', onTouchEnd);
                };

                document.addEventListener('touchmove', onTouchMove);
                document.addEventListener('touchend', onTouchEnd);
            }, { passive: false });
        }

        // Center move button
        const btnMove = document.createElement('div');
        btnMove.className = 'warp-move';
        btnMove.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>';
        container.appendChild(btnMove);

        // Mouse Drag Move
        btnMove.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            document.querySelectorAll('.warp-container').forEach(c => c.classList.remove('active'));
            container.classList.add('active');
            bringToFront(container);

            const startX = e.clientX;
            const startY = e.clientY;

            const startLeft = parseFloat(container.style.left) || 0;
            const startTop = parseFloat(container.style.top) || 0;

            const onMouseMove = (ev) => {
                container.style.left = (startLeft + (ev.clientX - startX)) + 'px';
                container.style.top = (startTop + (ev.clientY - startY)) + 'px';
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Touch Drag Move
        btnMove.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            e.preventDefault();
            document.querySelectorAll('.warp-container').forEach(c => c.classList.remove('active'));
            container.classList.add('active');
            bringToFront(container);

            const touch = e.touches[0];
            const startX = touch.clientX;
            const startY = touch.clientY;

            const startLeft = parseFloat(container.style.left) || 0;
            const startTop = parseFloat(container.style.top) || 0;

            const onTouchMove = (ev) => {
                const t = ev.touches[0];
                container.style.left = (startLeft + (t.clientX - startX)) + 'px';
                container.style.top = (startTop + (t.clientY - startY)) + 'px';
            };

            const onTouchEnd = () => {
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
            };

            document.addEventListener('touchmove', onTouchMove);
            document.addEventListener('touchend', onTouchEnd);
        }, { passive: false });

        // Delete button
        const btnDelete = document.createElement('div');
        btnDelete.className = 'warp-delete';
        btnDelete.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        container.appendChild(btnDelete);

        const deleteContainer = (e) => {
            e.stopPropagation();
            container.remove();
        };
        btnDelete.addEventListener('click', deleteContainer);
        btnDelete.addEventListener('touchstart', deleteContainer);

        canvas.appendChild(container);

        // Update function
        function updateWarp() {
            if (isTwoPoint) {
                // Point 0 is start, Point 1 is end
                const p0 = dstPts[0];
                const p1 = dstPts[1];

                // Calculate distance and angle
                const dx = p1.x - p0.x;
                const dy = p1.y - p0.y;
                const L = Math.max(10, Math.sqrt(dx * dx + dy * dy));
                const angle = Math.atan2(dy, dx);

                // Preserve edited text in dimension shape before rebuilding HTML
                let currentText = '5.0m';
                if (shapeType === 'dimension') {
                    const existingTextEl = img.querySelector('.warp-editable-text');
                    if (existingTextEl) {
                        currentText = existingTextEl.textContent;
                    }
                }

                // Update SVG content dynamically to prevent head stretching
                const strokeColor = '#3b82f6';
                if (shapeType === 'arrow') {
                    img.innerHTML = `
                        <svg width="${L}" height="50" viewBox="0 0 ${L} 50" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                          <line x1="5" y1="25" x2="${L - 20}" y2="25" stroke="${strokeColor}" stroke-width="6" stroke-linecap="round" />
                          <path d="M${L - 22} 12 L${L - 2} 25 L${L - 22} 38 Z" fill="${strokeColor}" stroke="#ffffff" stroke-width="2" />
                        </svg>
                    `;
                } else if (shapeType === 'dimension') {
                    img.innerHTML = `
                        <svg width="${L}" height="50" viewBox="0 0 ${L} 50" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                          <line x1="15" y1="25" x2="${L - 15}" y2="25" stroke="${strokeColor}" stroke-width="4" />
                          <path d="M22 12 L7 25 L22 38 Z" fill="${strokeColor}" stroke="#ffffff" stroke-width="1.5" />
                          <path d="M${L - 22} 12 L${L - 2} 25 L${L - 22} 38 Z" fill="${strokeColor}" stroke="#ffffff" stroke-width="1.5" />
                        </svg>
                        <div class="warp-editable-text" contenteditable="true" style="pointer-events: auto;">${currentText}</div>
                    `;

                    // Re-register edit overlay listeners
                    const textEl = img.querySelector('.warp-editable-text');
                    textEl.addEventListener('keydown', (e) => e.stopPropagation());
                    textEl.addEventListener('mousedown', (e) => e.stopPropagation());
                    textEl.addEventListener('touchstart', (e) => e.stopPropagation());
                }

                // Position and rotate the line element
                img.style.width = L + 'px';
                img.style.height = '50px';
                img.style.left = p0.x + 'px';
                img.style.top = (p0.y - 25) + 'px';
                img.style.transformOrigin = '0px 25px';
                img.style.transform = `rotate(${angle}rad)`;

                // Position handles
                handles[0].style.left = p0.x + 'px';
                handles[0].style.top = p0.y + 'px';
                handles[1].style.left = p1.x + 'px';
                handles[1].style.top = p1.y + 'px';

                // Position controls at midpoint of the line
                const midX = (p0.x + p1.x) / 2;
                const midY = (p0.y + p1.y) / 2;

                btnMove.style.left = midX + 'px';
                btnMove.style.top = (midY - 32) + 'px';

                btnDelete.style.left = midX + 'px';
                btnDelete.style.top = (midY + 32) + 'px';
            } else {
                // Apply transform to image (4 points perspective warp)
                const H = getTransform(srcPts, dstPts);
                if (H) {
                    img.style.transform = `matrix3d(${H.join(',')})`;
                }

                // Position handles
                for (let i = 0; i < 4; i++) {
                    handles[i].style.left = dstPts[i].x + 'px';
                    handles[i].style.top = dstPts[i].y + 'px';
                }

                // Position controls at center of the 4 points
                let sumX = 0, sumY = 0;
                for (let i = 0; i < 4; i++) {
                    sumX += dstPts[i].x;
                    sumY += dstPts[i].y;
                }
                btnMove.style.left = (sumX / 4) + 'px';
                btnMove.style.top = (sumY / 4 - 32) + 'px';

                btnDelete.style.left = (sumX / 4) + 'px';
                btnDelete.style.top = (sumY / 4 + 32) + 'px';
            }
        }

        updateWarp();
    }

    // Math for perspective transform (Gaussian elimination for 8 unknowns)
    function getTransform(src, dst) {
        let a = [];
        for (let i = 0; i < 4; i++) {
            a.push([src[i].x, src[i].y, 1, 0, 0, 0, -src[i].x * dst[i].x, -src[i].y * dst[i].x]);
            a.push([0, 0, 0, src[i].x, src[i].y, 1, -src[i].x * dst[i].y, -src[i].y * dst[i].y]);
        }
        let b = [];
        for (let i = 0; i < 4; i++) {
            b.push(dst[i].x);
            b.push(dst[i].y);
        }

        let h = solve(a, b);
        if (!h) return null;

        // Matrix3d uses column-major order:
        return [
            h[0], h[3], 0, h[6],
            h[1], h[4], 0, h[7],
            0, 0, 1, 0,
            h[2], h[5], 0, 1
        ];
    }

    function solve(A, b) {
        let n = A.length;
        for (let i = 0; i < n; i++) A[i].push(b[i]);

        for (let i = 0; i < n; i++) {
            let maxEl = Math.abs(A[i][i]);
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(A[k][i]) > maxEl) {
                    maxEl = Math.abs(A[k][i]);
                    maxRow = k;
                }
            }
            if (maxEl === 0) return null; // Singular matrix

            for (let k = i; k < n + 1; k++) {
                let tmp = A[maxRow][k];
                A[maxRow][k] = A[i][k];
                A[i][k] = tmp;
            }
            for (let k = i + 1; k < n; k++) {
                let c = -A[k][i] / A[i][i];
                for (let j = i; j < n + 1; j++) {
                    if (i === j) A[k][j] = 0;
                    else A[k][j] += c * A[i][j];
                }
            }
        }

        let x = new Array(n);
        for (let i = n - 1; i > -1; i--) {
            x[i] = A[i][n] / A[i][i];
            for (let k = i - 1; k > -1; k--) {
                A[k][n] -= A[k][i] * x[i];
            }
        }
        return x;
    }

    // Save Image Logic
    btnSaveImage.addEventListener('click', async () => {
        const wrappers = document.querySelectorAll('.warp-container');

        btnSaveImage.disabled = true;
        btnSaveImage.innerHTML = 'Capturing...';

        try {
            const isWatermarkChecked = document.getElementById('addWatermark').checked;
            if (isWatermarkChecked) {
                const watermarkEl = document.createElement('img');
                watermarkEl.id = 'temp-watermark';
                watermarkEl.src = '../image/watermark.png';
                watermarkEl.style.position = 'absolute';
                watermarkEl.style.top = '0';
                watermarkEl.style.left = '0';
                watermarkEl.style.width = '100%';
                watermarkEl.style.height = '100%';
                watermarkEl.style.pointerEvents = 'none';
                watermarkEl.style.zIndex = '9999';
                watermarkEl.style.objectFit = 'contain';
                canvas.appendChild(watermarkEl);
            }

            for (let wrapper of wrappers) {
                wrapper.classList.add('hide-controls');
                wrapper.classList.remove('active');
            }

            // High resolution screenshot
            const finalUrl = await domtoimage.toPng(canvas, {
                quality: 1,
                scale: 2
            });

            const win = window.open();
            if (win) {
                win.document.write(`
                    <html>
                    <head>
                        <title>Rendition 2D Result</title>
                        <style>
                            body { margin: 0; display: flex; justify-content: center; align-items: center; background: #0f172a; height: 100vh; }
                            img { max-width: 90%; max-height: 90vh; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                            .download-btn { position: absolute; bottom: 20px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-family: sans-serif; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <img src="${finalUrl}" alt="Result" />
                        <a href="${finalUrl}" download="rendition-2d-screenshot.png" class="download-btn">Download Image</a>
                    </body>
                    </html>
                `);
            } else {
                alert("Please allow popups to save the image.");
            }

        } catch (error) {
            console.error('Screenshot failed:', error);
            alert('Oh no! Failed to capture screenshot.');
        } finally {
            const addedWatermark = document.getElementById('temp-watermark');
            if (addedWatermark) addedWatermark.remove();

            wrappers.forEach(w => w.classList.remove('hide-controls'));
            btnSaveImage.disabled = false;
            btnSaveImage.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Capture & Save
            `;
        }
    });
});
