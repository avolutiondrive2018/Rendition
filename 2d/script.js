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
                const tempImg = new Image();
                tempImg.onload = () => {
                    const h = 800;
                    const w = (tempImg.width / tempImg.height) * h;
                    
                    const resizer = document.createElement('canvas');
                    resizer.width = w;
                    resizer.height = h;
                    const ctx = resizer.getContext('2d');
                    ctx.drawImage(tempImg, 0, 0, w, h);
                    
                    bgImg.src = resizer.toDataURL('image/png');
                    canvas.style.width = w + 'px';
                    canvas.style.height = h + 'px';

                    bgImg.onload = () => {
                        dropzone.classList.remove('empty');
                        dropzone.querySelector('.dropzone-message').style.display = 'none';
                        canvas.classList.remove('canvas-hidden');
                        modelsBox.style.display = 'flex';
                        actionsBox.style.display = 'flex';
                    };
                };
                tempImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Add 2D shapes
    document.querySelectorAll('.btn-model').forEach(btn => {
        btn.addEventListener('click', () => {
            const width = parseInt(btn.getAttribute('data-width'));
            const height = parseInt(btn.getAttribute('data-height'));
            
            // For now, generate a colorful placeholder image based on the button's background
            const preview = btn.querySelector('.shape-preview');
            const bg = window.getComputedStyle(preview).background;
            
            addShapeToCanvas(width, height, bg);
        });
    });

    // Deselect all
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.warp-container') && !e.target.closest('.sidebar')) {
            document.querySelectorAll('.warp-container').forEach(w => w.classList.remove('active'));
        }
    });

    function addShapeToCanvas(w, h, bgStyle) {
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

        const gridOverlay = document.createElement('div');
        gridOverlay.className = 'grid-overlay';
        img.appendChild(gridOverlay);

        img.addEventListener('mousedown', (e) => {
            document.querySelectorAll('.warp-container').forEach(c => c.classList.remove('active'));
            container.classList.add('active');
            bringToFront(container);
            e.stopPropagation();
        });

        container.appendChild(img);

        // 4 corners of the source image
        const srcPts = [
            { x: 0, y: 0 },
            { x: w, y: 0 },
            { x: w, y: h },
            { x: 0, y: h }
        ];

        // Initial destination points are centered around 0,0 since container is centered
        let dstPts = [
            { x: -w/2, y: -h/2 },
            { x: w/2, y: -h/2 },
            { x: w/2, y: h/2 },
            { x: -w/2, y: h/2 }
        ];

        // Handles
        const handles = [];
        for (let i = 0; i < 4; i++) {
            const hndl = document.createElement('div');
            hndl.className = 'warp-handle';
            container.appendChild(hndl);
            handles.push(hndl);

            // Drag handle
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
        }

        // Center move button
        const btnMove = document.createElement('div');
        btnMove.className = 'warp-move';
        btnMove.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>';
        container.appendChild(btnMove);

        btnMove.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            document.querySelectorAll('.warp-container').forEach(c => c.classList.remove('active'));
            container.classList.add('active');
            bringToFront(container);

            const startX = e.clientX;
            const startY = e.clientY;
            
            // Current left/top
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

        // Delete button
        const btnDelete = document.createElement('div');
        btnDelete.className = 'warp-delete';
        btnDelete.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        container.appendChild(btnDelete);

        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            container.remove();
        });

        canvas.appendChild(container);

        // Update function
        function updateWarp() {
            // Apply transform to image
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
            btnMove.style.top = (sumY / 4 - 24) + 'px';
            
            btnDelete.style.left = (sumX / 4) + 'px';
            btnDelete.style.top = (sumY / 4 + 24) + 'px';
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
             0  ,  0  , 1,  0  ,
            h[2], h[5], 0,  1
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
            wrappers.forEach(w => w.classList.remove('hide-controls'));
            btnSaveImage.disabled = false;
            btnSaveImage.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Capture & Save
            `;
        }
    });
});
