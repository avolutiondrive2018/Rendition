document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const uploadStatus = document.getElementById('uploadStatus');
    const dropzone = document.getElementById('dropzone');
    const canvas = document.getElementById('canvas');
    const bgImg = document.getElementById('bgImg');
    const modelsBox = document.getElementById('modelsBox');
    const actionsBox = document.getElementById('actionsBox');
    const btnSaveImage = document.getElementById('btnSaveImage');

    let activeWrapper = null;

    // Handle Image Upload
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadStatus.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (event) => {
                bgImg.src = event.target.result;
                bgImg.onload = () => {
                    // Update UI state
                    dropzone.classList.remove('empty');
                    dropzone.querySelector('.dropzone-message').style.display = 'none';
                    canvas.classList.remove('canvas-hidden');
                    modelsBox.style.display = 'flex';
                    actionsBox.style.display = 'flex';
                };
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

    // Global click listener to deselect wrappers
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.model-wrapper') && !e.target.closest('.sidebar')) {
            document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));
        }
    });

    function addModelToCanvas(url) {
        const wrapper = document.createElement('div');
        wrapper.className = 'model-wrapper active';
        wrapper.dataset.scale = 1;

        // Ensure only one active at a time initially
        document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));

        wrapper.addEventListener('mousedown', () => {
            document.querySelectorAll('.model-wrapper').forEach(w => w.classList.remove('active'));
            wrapper.classList.add('active');
        });

        // Model Viewer
        const modelViewer = document.createElement('model-viewer');
        modelViewer.src = url;
        modelViewer.setAttribute('camera-controls', '');
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

        wrapper.appendChild(modelViewer);
        wrapper.appendChild(btnMove);
        wrapper.appendChild(btnResize);
        wrapper.appendChild(btnDelete);

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
        handle.addEventListener('mousedown', (e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const startLeft = wrapper.offsetLeft;
            const startTop = wrapper.offsetTop;

            wrapper.classList.add('active');
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
    }

    function setupResize(wrapper, handle) {
        handle.addEventListener('mousedown', (e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const startScale = parseFloat(wrapper.dataset.scale) || 1;

            wrapper.classList.add('active');
            e.stopPropagation();
            e.preventDefault();

            const onMouseMove = (ev) => {
                const dy = ev.clientY - startY;
                // dy scales it: 100px drag down = +1.0 scale
                let newScale = Math.max(0.2, startScale + (dy / 100));

                wrapper.dataset.scale = newScale;
                wrapper.style.transform = `translate(-50%, -50%) scale(${newScale})`;
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    // Save Image Logic
    btnSaveImage.addEventListener('click', async () => {
        const wrappers = document.querySelectorAll('.model-wrapper');

        // Save original states and convert to image
        const replacements = [];

        btnSaveImage.disabled = true;
        btnSaveImage.innerHTML = 'Capturing...';

        try {
            // Wait for any model-viewer to finish rendering its frame
            await new Promise(r => setTimeout(r, 100));

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
                img.style.objectFit = 'contain';
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
            // Restore model viewers
            replacements.forEach(rep => {
                rep.img.remove();
                rep.mv.style.visibility = 'visible';
                rep.wrapper.classList.remove('hide-controls');
            });

            btnSaveImage.disabled = false;
            btnSaveImage.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Capture & Save
            `;
        }
    });
});
