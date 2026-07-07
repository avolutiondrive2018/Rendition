document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const uploadStatus = document.getElementById('uploadStatus');
    const dropzone = document.getElementById('dropzone');
    const canvas = document.getElementById('canvas');
    const bgImg = document.getElementById('bgImg');
    const modelsBox = document.getElementById('modelsBox');
    const shapesBox = document.getElementById('shapesBox');
    const actionsBox = document.getElementById('actionsBox');
    const btnSaveImage = document.getElementById('btnSaveImage');

    let activeWrapper = null;
    let highestZIndex = 10;

    // Sidebar Toggle
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const svgCollapse = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`;
    const svgExpand = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            if (sidebar.classList.contains('collapsed')) {
                sidebarToggle.innerHTML = svgExpand;
                sidebarToggle.setAttribute('title', 'Show Sidebar');
            } else {
                sidebarToggle.innerHTML = svgCollapse;
                sidebarToggle.setAttribute('title', 'Hide Sidebar');
            }
        });
    }

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
                    if (shapesBox) shapesBox.style.display = 'flex';
                    actionsBox.style.display = 'flex';

                    canvas.style.width = bgImg.offsetWidth + 'px';
                    canvas.style.height = bgImg.offsetHeight + 'px';
                };
                bgImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Add Model Handlers
    document.querySelectorAll('.btn-model').forEach(btn => {
        btn.addEventListener('click', () => {
            const modelUrl = btn.getAttribute('data-model');
            addModelToCanvas(modelUrl);
        });
    });

    // Add Shape Handlers (Dimension etc.)
    document.querySelectorAll('.btn-shape').forEach(btn => {
        btn.addEventListener('click', () => {
            const shapeType = btn.getAttribute('data-shape');
            const w = parseInt(btn.getAttribute('data-width')) || 240;
            const h = parseInt(btn.getAttribute('data-height')) || 80;
            if (shapeType === 'dimension') addDimensionToCanvas(w, h);
            if (shapeType === 'text') addTextToCanvas(w, h);
        });
    });

    // Global click listener to deselect wrappers
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.model-wrapper') && !e.target.closest('.sidebar') && !e.target.closest('.warp-container')) {
            document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));
            document.querySelectorAll('.warp-container').forEach(w => w.classList.remove('active'));
        }
    });

    function addModelToCanvas(url) {
        const wrapper = document.createElement('div');
        wrapper.className = 'model-wrapper active';
        wrapper.dataset.scale = 1;
        wrapper.style.setProperty('--inv-scale', 1);
        wrapper.style.left = (canvas.offsetWidth / 2) + 'px';
        wrapper.style.top = (canvas.offsetHeight / 2) + 'px';

        // Ensure only one active at a time initially
        document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));
        bringToFront(wrapper);

        wrapper.addEventListener('mousedown', () => {
            document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));
            wrapper.classList.add('active');
            bringToFront(wrapper);
        });

        // Model Viewer
        const modelViewer = document.createElement('model-viewer');
        modelViewer.src = url;
        modelViewer.setAttribute('auto-rotate', '');
        modelViewer.setAttribute('interaction-prompt', 'none'); // Hide the hand icon

        // Stop auto rotation after 5 seconds to let user view it then settle
        setTimeout(() => {
            modelViewer.removeAttribute('auto-rotate');
        }, 5000);

        // Controls
        const btnMove = createControl('btn-move', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>');
        const btnResize = createControl('btn-resize', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>');
        const btnDelete = createControl('btn-delete', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>');

        const svgUnlocked = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>';
        const svgLocked = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
        const btnLock = createControl('btn-lock', svgUnlocked);

        btnLock.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.classList.toggle('locked');
            if (wrapper.classList.contains('locked')) {
                btnLock.innerHTML = svgLocked;
            } else {
                btnLock.innerHTML = svgUnlocked;
            }
        });


        const btnUp = createControl('btn-rot btn-rot-up', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>');
        const btnDown = createControl('btn-rot btn-rot-down', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>');
        const btnLeft = createControl('btn-rot btn-rot-left', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>');
        const btnRight = createControl('btn-rot btn-rot-right', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>');

        function rotateCamera(dTheta, dPhi) {
            if (wrapper.classList.contains('locked')) return;
            const orbit = modelViewer.getCameraOrbit();
            orbit.theta += dTheta;
            orbit.phi += dPhi;
            orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbit.phi));
            modelViewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${orbit.radius}m`;
        }

        const rotStep = 0.1;
        btnUp.addEventListener('click', (e) => { e.stopPropagation(); rotateCamera(0, rotStep); });
        btnDown.addEventListener('click', (e) => { e.stopPropagation(); rotateCamera(0, -rotStep); });
        btnLeft.addEventListener('click', (e) => { e.stopPropagation(); rotateCamera(rotStep, 0); });
        btnRight.addEventListener('click', (e) => { e.stopPropagation(); rotateCamera(-rotStep, 0); });

        wrapper.appendChild(modelViewer);
        wrapper.appendChild(btnMove);
        wrapper.appendChild(btnResize);
        wrapper.appendChild(btnDelete);
        wrapper.appendChild(btnLock);
        wrapper.appendChild(btnUp);
        wrapper.appendChild(btnDown);
        wrapper.appendChild(btnLeft);
        wrapper.appendChild(btnRight);

        canvas.appendChild(wrapper);

        // Delete action
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.remove();
        });

        setupMove(wrapper, btnMove);
        setupResize(wrapper, btnResize);
    }

    function createControl(className, innerHTML) {
        const btn = document.createElement('div');
        btn.className = `model-control ${className}`;
        btn.innerHTML = innerHTML;
        return btn;
    }

    function setupMove(wrapper, handle) {
        // Mouse Events
        handle.addEventListener('mousedown', (e) => {
            if (wrapper.classList.contains('locked')) return;
            const startX = e.clientX;
            const startY = e.clientY;
            const startLeft = parseFloat(wrapper.style.left) || (canvas.offsetWidth / 2);
            const startTop = parseFloat(wrapper.style.top) || (canvas.offsetHeight / 2);

            document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));
            wrapper.classList.add('active');
            bringToFront(wrapper);
            e.stopPropagation();
            e.preventDefault();

            const onMouseMove = (ev) => {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                wrapper.style.left = `${startLeft + dx}px`;
                wrapper.style.top = `${startTop + dy}px`;
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Touch Events
        handle.addEventListener('touchstart', (e) => {
            if (wrapper.classList.contains('locked')) return;
            const touch = e.touches[0];
            const startX = touch.clientX;
            const startY = touch.clientY;
            const startLeft = parseFloat(wrapper.style.left) || (canvas.offsetWidth / 2);
            const startTop = parseFloat(wrapper.style.top) || (canvas.offsetHeight / 2);

            document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));
            wrapper.classList.add('active');
            bringToFront(wrapper);
            e.stopPropagation();
            e.preventDefault();

            const onTouchMove = (ev) => {
                const t = ev.touches[0];
                const dx = t.clientX - startX;
                const dy = t.clientY - startY;
                wrapper.style.left = `${startLeft + dx}px`;
                wrapper.style.top = `${startTop + dy}px`;
            };

            const onTouchEnd = () => {
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
            };

            document.addEventListener('touchmove', onTouchMove);
            document.addEventListener('touchend', onTouchEnd);
        }, { passive: false });
    }

    function setupResize(wrapper, handle) {
        // Mouse Events
        handle.addEventListener('mousedown', (e) => {
            if (wrapper.classList.contains('locked')) return;
            const startX = e.clientX;
            const startY = e.clientY;
            const startScale = parseFloat(wrapper.dataset.scale) || 1;

            document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));
            wrapper.classList.add('active');
            bringToFront(wrapper);
            e.stopPropagation();
            e.preventDefault();

            const onMouseMove = (ev) => {
                const dy = ev.clientY - startY;
                // dy scales it: 100px drag down = +1.0 scale
                let newScale = Math.max(0.2, startScale + (dy / 100));

                wrapper.dataset.scale = newScale;
                wrapper.style.transform = `translate(-50%, -50%) scale(${newScale})`;
                wrapper.style.setProperty('--inv-scale', 1 / newScale);
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Touch Events
        handle.addEventListener('touchstart', (e) => {
            if (wrapper.classList.contains('locked')) return;
            const touch = e.touches[0];
            const startX = touch.clientX;
            const startY = touch.clientY;
            const startScale = parseFloat(wrapper.dataset.scale) || 1;

            document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));
            wrapper.classList.add('active');
            bringToFront(wrapper);
            e.stopPropagation();
            e.preventDefault();

            const onTouchMove = (ev) => {
                const t = ev.touches[0];
                const dy = t.clientY - startY;
                let newScale = Math.max(0.2, startScale + (dy / 100));

                wrapper.dataset.scale = newScale;
                wrapper.style.transform = `translate(-50%, -50%) scale(${newScale})`;
                wrapper.style.setProperty('--inv-scale', 1 / newScale);
            };

            const onTouchEnd = () => {
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
            };

            document.addEventListener('touchmove', onTouchMove);
            document.addEventListener('touchend', onTouchEnd);
        }, { passive: false });
    }

    // Save Image Logic
    btnSaveImage.addEventListener('click', async () => {
        const wrappers = document.querySelectorAll('.model-wrapper');
        const warpContainers = document.querySelectorAll('.warp-container');

        // Save original states and convert to image
        const replacements = [];

        btnSaveImage.disabled = true;
        btnSaveImage.innerHTML = 'Capturing...';

        try {
            // Wait for any model-viewer to finish rendering its frame
            await new Promise(r => setTimeout(r, 100));

            const isWatermarkChecked = document.getElementById('addWatermark').checked;
            if (isWatermarkChecked) {
                const watermarkEl = document.createElement('img');
                watermarkEl.id = 'temp-watermark';
                watermarkEl.src = 'image/watermark.png';
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

            for (let wc of warpContainers) {
                wc.classList.add('hide-controls');
                wc.classList.remove('active');
            }

            for (let wrapper of wrappers) {
                wrapper.classList.add('hide-controls');
                wrapper.classList.remove('active');
                const mv = wrapper.querySelector('model-viewer');

                // Get the current view as data URL
                const dataUrl = mv.toDataURL('image/png', 1.0);

                // Create an img tag precisely matching the viewer
                const img = document.createElement('img');
                img.src = dataUrl;
                img.style.position = 'absolute';
                img.style.top = '0';
                img.style.left = '0';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.pointerEvents = 'none';

                mv.style.visibility = 'hidden';
                wrapper.appendChild(img);

                replacements.push({ wrapper, img, mv });
            }

            // Capture the canvas area
            const canvasShot = await html2canvas(canvas, {
                useCORS: true,
                backgroundColor: null,
                scale: 2 // High resolution screenshot
            });

            const finalUrl = canvasShot.toDataURL('image/png');

            // Open in new window
            const win = window.open();
            if (win) {
                win.document.write(`
                    <html>
                    <head>
                        <title>Rendition Result</title>
                        <style>
                            body { margin: 0; display: flex; justify-content: center; align-items: center; background: #0f172a; height: 100vh; }
                            img { max-width: 90%; max-height: 90vh; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                            .download-btn { position: absolute; bottom: 20px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-family: sans-serif; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <img src="${finalUrl}" alt="Result" />
                        <a href="${finalUrl}" download="rendition-screenshot.png" class="download-btn">Download Image</a>
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

            // Restore model viewers
            replacements.forEach(rep => {
                rep.img.remove();
                rep.mv.style.visibility = 'visible';
                rep.wrapper.classList.remove('hide-controls');
            });

            // Restore warp containers
            warpContainers.forEach(wc => wc.classList.remove('hide-controls'));

            btnSaveImage.disabled = false;
            btnSaveImage.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Capture & Save
            `;
        }
    });

    // ─── Dimension Overlay for 3D View ───────────────────────────────────────
    function addDimensionToCanvas(w, h) {
        const container = document.createElement('div');
        container.className = 'warp-container active';
        bringToFront(container);

        container.style.left = (canvas.offsetWidth  / 2) + 'px';
        container.style.top  = (canvas.offsetHeight / 2) + 'px';

        const img = document.createElement('div');
        img.className = 'warp-img';
        img.style.width      = w + 'px';
        img.style.height     = h + 'px';
        img.style.background = 'transparent';
        img.style.boxShadow  = 'none';

        const selectAll = () => {
            document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));
            document.querySelectorAll('.warp-container').forEach(c => c.classList.remove('active'));
        };

        img.addEventListener('mousedown', (e) => { selectAll(); container.classList.add('active'); bringToFront(container); e.stopPropagation(); });
        img.addEventListener('touchstart', (e) => { selectAll(); container.classList.add('active'); bringToFront(container); e.stopPropagation(); });

        container.appendChild(img);

        let dstPts = [
            { x: -w / 2, y: 0 },
            { x:  w / 2, y: 0 }
        ];

        // ── Handles ──
        const handles = [];
        for (let i = 0; i < 2; i++) {
            const hndl = document.createElement('div');
            hndl.className = 'warp-handle';
            container.appendChild(hndl);
            handles.push(hndl);

            const startDrag = (cx, cy, spx, spy, moveEvt, endEvt) => {
                const onMove = (ev) => {
                    const mx = ev.clientX !== undefined ? ev.clientX : ev.touches[0].clientX;
                    const my = ev.clientY !== undefined ? ev.clientY : ev.touches[0].clientY;
                    dstPts[i].x = spx + (mx - cx);
                    dstPts[i].y = spy + (my - cy);
                    updateWarp();
                };
                const onEnd = () => { document.removeEventListener(moveEvt, onMove); document.removeEventListener(endEvt, onEnd); };
                document.addEventListener(moveEvt, onMove);
                document.addEventListener(endEvt, onEnd);
            };

            hndl.addEventListener('mousedown', (e) => {
                if (container.classList.contains('locked')) return;
                e.stopPropagation(); e.preventDefault();
                selectAll(); container.classList.add('active'); bringToFront(container);
                startDrag(e.clientX, e.clientY, dstPts[i].x, dstPts[i].y, 'mousemove', 'mouseup');
            });
            hndl.addEventListener('touchstart', (e) => {
                if (container.classList.contains('locked')) return;
                e.stopPropagation(); e.preventDefault();
                selectAll(); container.classList.add('active'); bringToFront(container);
                const t = e.touches[0];
                startDrag(t.clientX, t.clientY, dstPts[i].x, dstPts[i].y, 'touchmove', 'touchend');
            }, { passive: false });
        }

        // ── Move button ──
        const btnMove = document.createElement('div');
        btnMove.className = 'warp-move';
        btnMove.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>';
        container.appendChild(btnMove);

        const startMove = (cx, cy, sl, st, moveEvt, endEvt) => {
            const onMove = (ev) => {
                const mx = ev.clientX !== undefined ? ev.clientX : ev.touches[0].clientX;
                const my = ev.clientY !== undefined ? ev.clientY : ev.touches[0].clientY;
                container.style.left = (sl + (mx - cx)) + 'px';
                container.style.top  = (st + (my - cy)) + 'px';
            };
            const onEnd = () => { document.removeEventListener(moveEvt, onMove); document.removeEventListener(endEvt, onEnd); };
            document.addEventListener(moveEvt, onMove);
            document.addEventListener(endEvt, onEnd);
        };

        btnMove.addEventListener('mousedown', (e) => {
            if (container.classList.contains('locked')) return;
            e.stopPropagation(); e.preventDefault();
            selectAll(); container.classList.add('active'); bringToFront(container);
            startMove(e.clientX, e.clientY, parseFloat(container.style.left)||0, parseFloat(container.style.top)||0, 'mousemove', 'mouseup');
        });
        btnMove.addEventListener('touchstart', (e) => {
            if (container.classList.contains('locked')) return;
            e.stopPropagation(); e.preventDefault();
            selectAll(); container.classList.add('active'); bringToFront(container);
            const t = e.touches[0];
            startMove(t.clientX, t.clientY, parseFloat(container.style.left)||0, parseFloat(container.style.top)||0, 'touchmove', 'touchend');
        }, { passive: false });

        // ── Delete button ──
        const btnDelete = document.createElement('div');
        btnDelete.className = 'warp-delete';
        btnDelete.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        container.appendChild(btnDelete);
        const doDelete = (e) => { if (container.classList.contains('locked')) return; e.stopPropagation(); container.remove(); };
        btnDelete.addEventListener('click', doDelete);
        btnDelete.addEventListener('touchstart', doDelete);

        // ── Lock button ──
        const svgU = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>';
        const svgL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
        const btnLock = document.createElement('div');
        btnLock.className = 'warp-lock';
        btnLock.innerHTML = svgU;
        container.appendChild(btnLock);
        const doLock = (e) => {
            e.stopPropagation();
            container.classList.toggle('locked');
            btnLock.innerHTML = container.classList.contains('locked') ? svgL : svgU;
            if (container.classList.contains('locked')) container.classList.remove('active');
            else container.classList.add('active');
        };
        btnLock.addEventListener('click', doLock);
        btnLock.addEventListener('touchstart', doLock);

        canvas.appendChild(container);

        let currentText = '5.0m';

        function updateWarp() {
            const p0 = dstPts[0], p1 = dstPts[1];
            const dx = p1.x - p0.x, dy = p1.y - p0.y;
            const L = Math.max(20, Math.sqrt(dx*dx + dy*dy));
            const angle = Math.atan2(dy, dx);

            const existingTextEl = img.querySelector('.warp-editable-text');
            if (existingTextEl) currentText = existingTextEl.textContent;

            const sc = '#3b82f6';
            img.innerHTML = `
                <svg width="${L}" height="50" viewBox="0 0 ${L} 50" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                  <line x1="15" y1="25" x2="${L-15}" y2="25" stroke="${sc}" stroke-width="4"/>
                  <path d="M22 12 L7 25 L22 38 Z" fill="${sc}" stroke="#fff" stroke-width="1.5"/>
                  <path d="M${L-22} 12 L${L-2} 25 L${L-22} 38 Z" fill="${sc}" stroke="#fff" stroke-width="1.5"/>
                </svg>
                <div class="warp-editable-text" contenteditable="true" style="pointer-events:auto;">${currentText}</div>
            `;

            const textEl = img.querySelector('.warp-editable-text');
            textEl.addEventListener('keydown',   (e) => e.stopPropagation());
            textEl.addEventListener('mousedown',  (e) => { if (container.classList.contains('locked')) { e.preventDefault(); e.stopPropagation(); return; } e.stopPropagation(); });
            textEl.addEventListener('touchstart', (e) => { if (container.classList.contains('locked')) { e.preventDefault(); e.stopPropagation(); return; } e.stopPropagation(); });
            textEl.addEventListener('focus',      ()  => { if (container.classList.contains('locked')) textEl.blur(); });

            img.style.width          = L + 'px';
            img.style.height         = '50px';
            img.style.left           = p0.x + 'px';
            img.style.top            = (p0.y - 25) + 'px';
            img.style.transformOrigin= '0px 25px';
            img.style.transform      = `rotate(${angle}rad)`;

            handles[0].style.left = p0.x + 'px';
            handles[0].style.top  = p0.y + 'px';
            handles[1].style.left = p1.x + 'px';
            handles[1].style.top  = p1.y + 'px';

            const midX = (p0.x + p1.x) / 2;
            const midY = (p0.y + p1.y) / 2;

            btnMove.style.left   = (midX - 20) + 'px';
            btnMove.style.top    = (midY - 36) + 'px';
            btnLock.style.left   = (midX + 20) + 'px';
            btnLock.style.top    = (midY - 36) + 'px';
            btnDelete.style.left = midX + 'px';
            btnDelete.style.top  = (midY + 36) + 'px';
        }

        updateWarp();
    }

    // ─── Text Overlay for 3D View ─────────────────────────────────────────────
    function addTextToCanvas(w, h) {
        const container = document.createElement('div');
        container.className = 'warp-container active';
        bringToFront(container);

        container.style.left = (canvas.offsetWidth  / 2) + 'px';
        container.style.top  = (canvas.offsetHeight / 2) + 'px';

        const img = document.createElement('div');
        img.className = 'warp-img';
        img.style.width      = w + 'px';
        img.style.height     = h + 'px';
        img.style.background = 'transparent';
        img.style.boxShadow  = 'none';

        const textEl = document.createElement('div');
        textEl.className = 'warp-editable-text text-only';
        textEl.contentEditable = 'true';
        textEl.textContent = 'Enter text';
        textEl.addEventListener('keydown', (e) => e.stopPropagation());
        textEl.addEventListener('mousedown', (e) => {
            if (container.classList.contains('locked')) { e.preventDefault(); e.stopPropagation(); return; }
            e.stopPropagation();
        });
        textEl.addEventListener('touchstart', (e) => {
            if (container.classList.contains('locked')) { e.preventDefault(); e.stopPropagation(); return; }
            e.stopPropagation();
        });
        textEl.addEventListener('focus', () => {
            if (container.classList.contains('locked')) textEl.blur();
        });
        img.appendChild(textEl);

        const selectAll = () => {
            document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));
            document.querySelectorAll('.warp-container').forEach(c => c.classList.remove('active'));
        };

        img.addEventListener('mousedown',  (e) => { selectAll(); container.classList.add('active'); bringToFront(container); e.stopPropagation(); });
        img.addEventListener('touchstart', (e) => { selectAll(); container.classList.add('active'); bringToFront(container); e.stopPropagation(); });

        container.appendChild(img);

        // 4 corner handles
        const srcPts = [
            { x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }
        ];
        let dstPts = [
            { x: -w/2, y: -h/2 }, { x: w/2, y: -h/2 },
            { x:  w/2, y:  h/2 }, { x: -w/2, y:  h/2 }
        ];

        const handles = [];
        for (let i = 0; i < 4; i++) {
            const hndl = document.createElement('div');
            hndl.className = 'warp-handle';
            container.appendChild(hndl);
            handles.push(hndl);

            const startDrag = (cx, cy, spx, spy, moveEvt, endEvt) => {
                const onMove = (ev) => {
                    const mx = ev.clientX !== undefined ? ev.clientX : ev.touches[0].clientX;
                    const my = ev.clientY !== undefined ? ev.clientY : ev.touches[0].clientY;
                    dstPts[i].x = spx + (mx - cx);
                    dstPts[i].y = spy + (my - cy);
                    updateLayout();
                };
                const onEnd = () => { document.removeEventListener(moveEvt, onMove); document.removeEventListener(endEvt, onEnd); };
                document.addEventListener(moveEvt, onMove);
                document.addEventListener(endEvt, onEnd);
            };

            hndl.addEventListener('mousedown', (e) => {
                if (container.classList.contains('locked')) return;
                e.stopPropagation(); e.preventDefault();
                selectAll(); container.classList.add('active'); bringToFront(container);
                startDrag(e.clientX, e.clientY, dstPts[i].x, dstPts[i].y, 'mousemove', 'mouseup');
            });
            hndl.addEventListener('touchstart', (e) => {
                if (container.classList.contains('locked')) return;
                e.stopPropagation(); e.preventDefault();
                selectAll(); container.classList.add('active'); bringToFront(container);
                const t = e.touches[0];
                startDrag(t.clientX, t.clientY, dstPts[i].x, dstPts[i].y, 'touchmove', 'touchend');
            }, { passive: false });
        }

        // Move button
        const btnMove = document.createElement('div');
        btnMove.className = 'warp-move';
        btnMove.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>';
        container.appendChild(btnMove);

        const startMove = (cx, cy, sl, st, moveEvt, endEvt) => {
            const onMove = (ev) => {
                const mx = ev.clientX !== undefined ? ev.clientX : ev.touches[0].clientX;
                const my = ev.clientY !== undefined ? ev.clientY : ev.touches[0].clientY;
                container.style.left = (sl + (mx - cx)) + 'px';
                container.style.top  = (st + (my - cy)) + 'px';
            };
            const onEnd = () => { document.removeEventListener(moveEvt, onMove); document.removeEventListener(endEvt, onEnd); };
            document.addEventListener(moveEvt, onMove);
            document.addEventListener(endEvt, onEnd);
        };

        btnMove.addEventListener('mousedown', (e) => {
            if (container.classList.contains('locked')) return;
            e.stopPropagation(); e.preventDefault();
            selectAll(); container.classList.add('active'); bringToFront(container);
            startMove(e.clientX, e.clientY, parseFloat(container.style.left)||0, parseFloat(container.style.top)||0, 'mousemove', 'mouseup');
        });
        btnMove.addEventListener('touchstart', (e) => {
            if (container.classList.contains('locked')) return;
            e.stopPropagation(); e.preventDefault();
            selectAll(); container.classList.add('active'); bringToFront(container);
            const t = e.touches[0];
            startMove(t.clientX, t.clientY, parseFloat(container.style.left)||0, parseFloat(container.style.top)||0, 'touchmove', 'touchend');
        }, { passive: false });

        // Delete button
        const btnDelete = document.createElement('div');
        btnDelete.className = 'warp-delete';
        btnDelete.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        container.appendChild(btnDelete);
        const doDelete = (e) => { if (container.classList.contains('locked')) return; e.stopPropagation(); container.remove(); };
        btnDelete.addEventListener('click', doDelete);
        btnDelete.addEventListener('touchstart', doDelete);

        // Lock button
        const svgU = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>';
        const svgL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
        const btnLock = document.createElement('div');
        btnLock.className = 'warp-lock';
        btnLock.innerHTML = svgU;
        container.appendChild(btnLock);
        const doLock = (e) => {
            e.stopPropagation();
            container.classList.toggle('locked');
            btnLock.innerHTML = container.classList.contains('locked') ? svgL : svgU;
            if (container.classList.contains('locked')) container.classList.remove('active');
            else container.classList.add('active');
        };
        btnLock.addEventListener('click', doLock);
        btnLock.addEventListener('touchstart', doLock);

        canvas.appendChild(container);

        function updateLayout() {
            // Simple bounding box reposition (no perspective warp for text)
            let sumX = 0, sumY = 0;
            for (let i = 0; i < 4; i++) { sumX += dstPts[i].x; sumY += dstPts[i].y; }
            const cx2 = sumX / 4, cy2 = sumY / 4;

            // Width/height from pts
            const newW = Math.max(60, Math.abs(dstPts[1].x - dstPts[0].x));
            const newH = Math.max(30, Math.abs(dstPts[3].y - dstPts[0].y));

            img.style.width  = newW + 'px';
            img.style.height = newH + 'px';
            img.style.left   = (-newW / 2) + 'px';
            img.style.top    = (-newH / 2) + 'px';
            img.style.transform = '';

            // Recalculate dstPts to stay consistent
            dstPts = [
                { x: -newW/2, y: -newH/2 }, { x: newW/2, y: -newH/2 },
                { x:  newW/2, y:  newH/2 }, { x: -newW/2, y:  newH/2 }
            ];

            for (let i = 0; i < 4; i++) {
                handles[i].style.left = dstPts[i].x + 'px';
                handles[i].style.top  = dstPts[i].y + 'px';
            }

            btnMove.style.left   = (cx2 - 20) + 'px';
            btnMove.style.top    = (cy2 - 36) + 'px';
            btnLock.style.left   = (cx2 + 20) + 'px';
            btnLock.style.top    = (cy2 - 36) + 'px';
            btnDelete.style.left = cx2 + 'px';
            btnDelete.style.top  = (cy2 + 36) + 'px';
        }

        updateLayout();
    }
});
