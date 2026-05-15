<!DOCTYPE html>
<html>

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="utf-8" />
    <title>AvoApp - 3D Rendition</title>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.2.0/model-viewer.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"></script>

    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>

    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f0f0f0;
        }

        #generateImg {
            position: relative;
            border: 2px solid #333;
            background: white;
            width: 1100px;
            height: 687px;
            margin: 0 auto;
            box-sizing: border-box;
        }

        #blah {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            z-index: 1;
        }

        #modelContainer {
            position: absolute;
            z-index: 10;
            width: 200px;
            height: 200px;
            cursor: move;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
        }

        model-viewer {
            width: 100%;
            height: 100%;
            background-color: transparent;
        }

        .corner-btn {
            position: absolute;
            width: 36px;
            height: 36px;
            background: #ffffff;
            border: 2px solid #333;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 999;
            user-select: none;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
            font-size: 18px;
        }

        .move-btn {
            top: -18px;
            left: -18px;
            cursor: move;
        }

        .resize-btn {
            bottom: -18px;
            right: -18px;
            cursor: nwse-resize;
        }

        .delete-btn {
            top: -18px;
            right: -18px;
            background: #ff4d4d;
            /* Red color to signify deletion */
            color: white;
            border-color: #b30000;
        }

        .delete-btn:hover {
            background: #ff0000;
        }
    </style>
</head>

<body>

    <h4>Rendition: <?php echo $mode; ?> (3D Mode)</h4>

    <button onclick="history.back()" class="btn btn-primary pull-right">Back</button>
    <button id="gimg" type="button" class="btn btn-success pull-right" style="margin-right:10px;">Save Image</button>

    <div style="margin:10px;">
        <label class="custom-file-upload">
            <input type="file" id="photoUpload" />
            Upload Background Photo
        </label>
        <button onclick="resetModel()" class="btn btn-default">Reset Position</button>
    </div>


    <div id="generateImg">
        <img id="blah" src="#" alt="Background" />

        <div id="modelContainer">

            <model-viewer id="my3dmodel" src="models/led-display.glb" alt="3D LED" shadow-intensity="1" exposure="0.8"
                camera-controls style="pointer-events:auto;">
            </model-viewer>

            <!-- Corner Controls -->
            <div class="corner-btn move-btn">
                ✋
            </div>

            <div class="corner-btn delete-btn" id="deleteBtn" title="Remove 3D Model">
                ❌
            </div>

            <div class="corner-btn resize-btn">
                ↔
            </div>

        </div>
    </div>


    <script>
        // Background Upload
        function readURL(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    const img = document.getElementById('blah');
                    const container = document.getElementById('generateImg');

                    img.src = e.target.result;

                    img.onload = function () {
                        // 1. Get the original file dimensions
                        var realW = this.naturalWidth;
                        var realH = this.naturalHeight;

                        // 2. Calculate the aspect ratio (Width / Height)
                        var ratio = realW / realH;

                        // 3. Force height to 600px and calculate the proportional width
                        var forcedHeight = 600;
                        var calculatedWidth = 600 * ratio;

                        // 4. Apply these to the container
                        container.style.height = forcedHeight + "px";
                        container.style.width = calculatedWidth + "px";

                        // 5. Ensure the image fills this container completely
                        img.style.width = "100%";
                        img.style.height = "100%";

                        console.log("Layout forced to 600px height. New width: " + calculatedWidth);

                        // Re-center your 3D model
                        resetModel();
                    };
                }
                reader.readAsDataURL(input.files[0]);
            }
        }

        function resetModel() {
            const container = document.getElementById('modelContainer');
            container.style.transform = 'translate(80px, 80px)';
            container.style.width = '200px';
            container.style.height = '200px';
            container.setAttribute('data-x', 80);
            container.setAttribute('data-y', 80);
        }

        $(document).ready(function () {

            document.getElementById('photoUpload').addEventListener('change', function () {
                readURL(this);
            });

            // Drag & Resize
            const modelContainer = document.getElementById('modelContainer');
            if (modelContainer) {
                interact(modelContainer)
                    .draggable({
                        allowFrom: '.move-btn',
                        listeners: {
                            move(event) {
                                let x = (parseFloat(modelContainer.getAttribute('data-x')) || 0) + event.dx;
                                let y = (parseFloat(modelContainer.getAttribute('data-y')) || 0) + event.dy;
                                modelContainer.style.transform = `translate(${x}px, ${y}px)`;
                                modelContainer.setAttribute('data-x', x);
                                modelContainer.setAttribute('data-y', y);
                            }
                        }
                    })
                    .resizable({
                        edges: { bottom: '.resize-btn', right: '.resize-btn' },
                        listeners: {
                            move(event) {
                                let { x, y } = modelContainer.dataset;
                                x = (parseFloat(x) || 0) + event.deltaRect.left;
                                y = (parseFloat(y) || 0) + event.deltaRect.top;
                                Object.assign(modelContainer.style, {
                                    width: `${event.rect.width}px`,
                                    height: `${event.rect.height}px`,
                                    transform: `translate(${x}px, ${y}px)`
                                });
                                Object.assign(modelContainer.dataset, { x, y });
                            }
                        }
                    });
            }

            // Delete Model Logic
            document.getElementById('deleteBtn').addEventListener('click', function () {
                if (confirm("Are you sure you want to remove the 3D model?")) {
                    const container = document.getElementById('modelContainer');
                    container.remove();
                    console.log("Model removed from workspace.");
                }
            });
            // ==================== FINAL RECOMMENDED VERSION ====================

            $("#gimg").off('click').on('click', async function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();

                const generateImg = document.getElementById('generateImg');
                const modelContainer = document.getElementById('modelContainer');
                const viewer = document.getElementById('my3dmodel');
                // If model was deleted, just capture the background
                const hasModel = (modelContainer !== null);

                document.querySelectorAll('.corner-btn').forEach(el => el.style.display = 'none');

                try {
                    // Only try to capture model data if it still exists
                    // await viewer.updateComplete;
                    // await new Promise(r => setTimeout(r, 400));
                    let modelImg = null;
                    if (hasModel) {
                        await viewer.updateComplete;
                        const modelDataURL = viewer.toDataURL('image/png');
                        modelImg = new Image();
                        await new Promise(res => { modelImg.onload = res; modelImg.src = modelDataURL; });
                    }
                    const modelDataURL = viewer.toDataURL('image/png');

                    const scale = 2;
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    canvas.width = generateImg.offsetWidth * scale;
                    canvas.height = generateImg.offsetHeight * scale;

                    // White background
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Background Image - Calculate based on real image size
                    const bgImg = document.getElementById('blah');
                    if (bgImg.src && bgImg.src !== '#') {
                        const bg = new Image();

                        await new Promise(resolve => {
                            bg.onload = resolve;
                            bg.onerror = resolve;
                            bg.src = bgImg.src;
                        });

                        if (bg.complete && bg.naturalWidth > 0) {

                            const imgW = bg.naturalWidth;
                            const imgH = bg.naturalHeight;
                            const containerW = canvas.width;
                            const containerH = canvas.height;

                            const imgRatio = imgW / imgH;
                            const containerRatio = containerW / containerH;

                            let drawW = containerW;
                            let drawH = containerH;
                            let offsetX = 0;
                            let offsetY = 0;

                            if (imgRatio > containerRatio) {
                                // Image is wider → fit to height
                                drawH = containerH;
                                drawW = drawH * imgRatio;
                                offsetX = (containerW - drawW) / 2;
                            } else {
                                // Image is taller or square → fit to width
                                drawW = containerW;
                                drawH = drawW / imgRatio;
                                offsetY = (containerH - drawH) / 2;
                            }

                            ctx.drawImage(bg, offsetX, offsetY, drawW, drawH);
                            console.log(`✅ Background drawn | Original: ${imgW}x${imgH} | Drawn: ${drawW}x${drawH}`);
                        }
                    }

                    // 3D Model
                    // Only draw the model if it exists
                    if (hasModel && modelImg) {
                        const modelRect = modelContainer.getBoundingClientRect();
                        const genRect = generateImg.getBoundingClientRect();

                        const x = (modelRect.left - genRect.left) * scale;
                        const y = (modelRect.top - genRect.top) * scale;
                        const w = modelRect.width * scale;
                        const h = modelRect.height * scale;

                        ctx.drawImage(modelImg, x, y, w, h);
                    }onst finalDataURL = canvas.toDataURL("image/png", 1.0);

                    // Preview
                    const win = window.open("", "_blank");
                    win.document.write(`
            <html><head><title>Preview</title>
            <style>body{margin:0;background:#f0f0f0;display:flex;justify-content:center;align-items:center;min-height:100vh;flex-direction:column;}
            img{max-width:95%;box-shadow:0 0 30px rgba(0,0,0,0.4);}</style>
            </head><body>
                <img src="${finalDataURL}">
                <br><br>
                <button onclick="window.close()">Close</button>
                <button onclick="window.print()">Print</button>
            </body></html>
        `);

                } catch (err) {
                    console.error(err);
                    alert("Capture failed");
                } finally {
                    document.querySelectorAll('.corner-btn').forEach(el => el.style.display = 'flex');
                }
            });
        });


    </script>

</body>

</html>