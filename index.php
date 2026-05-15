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
            z-index: 9999;
        }

        .resize-btn {
            bottom: -18px;
            right: -18px;
            cursor: nwse-resize;
            z-index: 9999;
        }

        .delete-btn {
            top: -18px;
            right: -18px;
            background: #ffc1c1ff;
            /* Red color to signify deletion */
            color: white;
            border-color: #b30000;
            z-index: 9999;
        }

        .delete-btn:hover {
            background: #ff0000;
        }
    </style>
</head>

<body>

    <h4>Rendition: (3D Mode)</h4>

    <button id="gimg" type="button" class="btn btn-success pull-right" style="margin-right:10px;">Save Image</button>

    <div style="margin:10px;">
        <label class="custom-file-upload">
            <input type="file" id="photoUpload" />
            Upload Background Photo
        </label>
        <button onclick="resetModel()" class="btn btn-default">Reset Position</button>
    </div>

    <div style="margin:10px; display: flex; gap: 10px;">
        <button onclick="spawnModel('models/led-display.glb')" class="btn btn-info">
            <img src="placeholder1.png" style="width:20px;"> Add LED Display
        </button>
        <button onclick="spawnModel('models/led-display.glb')" class="btn btn-info">
            <img src="placeholder2.png" style="width:20px;"> Add Other Model
        </button>
    </div>

    <div id="generateImg">
        <img id="blah" src="#" alt="Background" />

        <!-- <div id="modelContainer">

            <model-viewer id="my3dmodel" src="models/led-display.glb" alt="3D LED" shadow-intensity="1" exposure="0.8"
                camera-controls style="pointer-events:auto;">
            </model-viewer> -->

        <!-- <div class="corner-btn move-btn">
                ✋
            </div> -->

        <!-- <div class="corner-btn delete-btn" id="deleteBtn">
                ❌
            </div>

            <div class="corner-btn resize-btn">
                ↔
            </div>

        </div> -->
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

        // function resetModel() {
        //     const container = document.getElementById('modelContainer');
        //     container.style.transform = 'translate(80px, 80px)';
        //     container.style.width = '200px';
        //     container.style.height = '200px';
        //     container.setAttribute('data-x', 80);
        //     container.setAttribute('data-y', 80);
        // }

        $(document).ready(function () {

            document.getElementById('photoUpload').addEventListener('change', function () {
                readURL(this);
            });

            // Delete Model Logic
            // document.getElementById('deleteBtn').addEventListener('click', function () {
            //     if (confirm("Are you sure you want to remove the 3D model?")) {
            //         const container = document.getElementById('modelContainer');
            //         container.remove();
            //         console.log("Model removed from workspace.");
            //     }
            // });

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

            // ==================== FINAL RECOMMENDED VERSION ====================


            // $("#gimg").off('click').on('click', async function (e) {
            //     e.preventDefault();

            //     const generateImg = document.getElementById('generateImg');
            //     // FIX: Look for ALL models (static or spawned)
            //     const activeModels = document.querySelectorAll('#modelContainer, .model-instance');

            //     // Hide buttons for the photo
            //     document.querySelectorAll('.corner-btn').forEach(el => el.style.display = 'none');

            //     try {
            //         const scale = 2;
            //         const canvas = document.createElement('canvas');
            //         const ctx = canvas.getContext('2d');
            //         canvas.width = generateImg.offsetWidth * scale;
            //         canvas.height = generateImg.offsetHeight * scale;

            //         // 1. Draw Background
            //         const bgImg = document.getElementById('blah');
            //         if (bgImg.src && bgImg.src !== '#' && bgImg.src !== window.location.href) {
            //             const bg = new Image();
            //             await new Promise(r => { bg.onload = r; bg.src = bgImg.src; });
            //             ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
            //         }

            //         // 2. Draw Every Model on the screen
            //         for (const modelGroup of activeModels) {
            //             const viewer = modelGroup.querySelector('model-viewer');
            //             if (!viewer) continue;

            //             await viewer.updateComplete;
            //             const modelDataURL = viewer.toDataURL('image/png');
            //             const modelImg = new Image();
            //             await new Promise(res => { modelImg.onload = res; modelImg.src = modelDataURL; });

            //             const modelRect = modelGroup.getBoundingClientRect();
            //             const genRect = generateImg.getBoundingClientRect();

            //             ctx.drawImage(
            //                 modelImg,
            //                 (modelRect.left - genRect.left) * scale,
            //                 (modelRect.top - genRect.top) * scale,
            //                 modelRect.width * scale,
            //                 modelRect.height * scale
            //             );
            //         }

            //         // 3. Open Preview
            //         const finalDataURL = canvas.toDataURL("image/png", 1.0);
            //         const win = window.open("", "_blank");
            //         win.document.write(`<img src="${finalDataURL}" style="max-width:100%;">`);

            //     } catch (err) {
            //         console.error(err);
            //         alert("Capture failed - check console");
            //     } finally {
            //         document.querySelectorAll('.corner-btn').forEach(el => el.style.display = 'flex');
            //     }
            // });



            $("#gimg").off('click').on('click', async function (e) {
                e.preventDefault();

                const generateImg = document.getElementById('generateImg');
                const activeModels = document.querySelectorAll('.model-instance');

                // Hide buttons for a clean photo
                $(".corner-btn").hide();

                try {
                    const scale = 2; // Keep high resolution
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Use the container's current size
                    // const stageW = generateImg.offsetWidth;
                    // const stageH = generateImg.offsetHeight;

                    // canvas.width = stageW * scale;
                    // canvas.height = stageH * scale;
                    canvas.width = generateImg.offsetWidth * scale;
                    canvas.height = generateImg.offsetHeight * scale;

                    // 1. Draw Background
                    const bgImg = document.getElementById('blah');
                    if (bgImg.src && bgImg.src !== '#' && !bgImg.src.includes(window.location.host)) {
                        const bg = new Image();
                        await new Promise(r => { bg.onload = r; bg.src = bgImg.src; });
                        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
                    }

                    // 2. Draw Every Model (Corrected loop)
                    // for (const modelGroup of activeModels) {
                    //     const viewer = modelGroup.querySelector('model-viewer');
                    //     if (!viewer) continue;


                    //     // --- ADD THESE THREE LINES HERE ---
                    //     const modelRect = modelGroup.getBoundingClientRect();
                    //     const genRect = generateImg.getBoundingClientRect();

                    //     viewer.style.width = modelRect.width + 'px';
                    //     viewer.style.height = modelRect.height + 'px';
                    //     await viewer.updateComplete;
                    //     // ----------------------------------

                    //     // Get the snapshot of the 3D model
                    //     const modelDataURL = viewer.toDataURL('image/png');
                    //     const modelImg = new Image();
                    //     await new Promise(res => { modelImg.onload = res; modelImg.src = modelDataURL; });

                    //     // IMPORTANT: Get the CURRENT dimensions of THIS specific model container
                    //     // const modelRect = modelGroup.getBoundingClientRect();


                    //     // Calculate relative positions and sizes
                    //     const drawX = (modelRect.left - genRect.left) * scale;
                    //     const drawY = (modelRect.top - genRect.top) * scale;
                    //     const drawW = modelRect.width * scale;
                    //     const drawH = modelRect.height * scale;

                    //     // Draw specifically at the calculated size for this instance
                    //     ctx.drawImage(modelImg, drawX, drawY, drawW, drawH);
                    // }
                    for (const modelGroup of activeModels) {
                        const viewer = modelGroup.querySelector('model-viewer');
                        if (!viewer) continue;

                        const modelRect = modelGroup.getBoundingClientRect();
                        const genRect = generateImg.getBoundingClientRect();

                        // Store original dimensions
                        const originalWidth = viewer.style.width;
                        const originalHeight = viewer.style.height;

                        // Set temporary dimensions for screenshot
                        viewer.style.width = modelRect.width + 'px';
                        viewer.style.height = modelRect.height + 'px';

                        // Wait for model to update
                        await viewer.updateComplete;

                        // Small delay to ensure render is complete
                        await new Promise(resolve => setTimeout(resolve, 50));

                        // Get the snapshot of the 3D model
                        const modelDataURL = viewer.toDataURL('image/png');
                        const modelImg = new Image();
                        await new Promise(res => { modelImg.onload = res; modelImg.src = modelDataURL; });

                        // Restore original dimensions
                        viewer.style.width = originalWidth;
                        viewer.style.height = originalHeight;

                        const drawX = (modelRect.left - genRect.left) * scale;
                        const drawY = (modelRect.top - genRect.top) * scale;
                        const drawW = modelRect.width * scale;
                        const drawH = modelRect.height * scale;

                        ctx.drawImage(modelImg, drawX, drawY, drawW, drawH);
                    }

                    // 3. Open Preview
                    const finalDataURL = canvas.toDataURL("image/png", 1.0);
                    const win = window.open("", "_blank");
                    win.document.write(`<img src="${finalDataURL}" style="max-width:100%;">`);

                } catch (err) {
                    console.error(err);
                    alert("Capture failed - check console");
                } finally {
                    $(".corner-btn").show();
                }
            });


        });



        //     function addNewModel() {
        //         // 1. Create the container
        //         const container = document.createElement('div');
        //         container.className = 'model-container-dynamic'; // Use a class for dynamic ones
        //         container.style.position = 'absolute';
        //         container.style.width = '200px';
        //         container.style.height = '200px';
        //         container.style.zIndex = '10';
        //         container.style.cursor = 'move';
        //         container.style.left = '0px';
        //         container.style.top = '0px';
        //         container.style.transform = 'translate(50px, 50px)';
        //         container.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.4)';
        //         container.setAttribute('data-x', 50);
        //         container.setAttribute('data-y', 50);

        //         // 2. Add the inner HTML (Model + Buttons)
        //         container.innerHTML = `
        //     <model-viewer src="models/led-display.glb" alt="3D LED" shadow-intensity="1" exposure="0.8"
        //         camera-controls style="width:100%; height:100%; background-color:transparent;">
        //     </model-viewer>
        //     <div class="corner-btn move-btn">✋</div>
        //     <div class="corner-btn delete-btn" onclick="this.parentElement.remove()">❌</div>
        //     <div class="corner-btn resize-btn">↔</div>
        // `;

        //         // 3. Append to your workspace
        //         document.getElementById('generateImg').appendChild(container);

        //         // 4. Initialize Interact.js for this specific new element
        //         initInteract(container);
        //     }

        //     // Wrap your interact logic in a reusable function
        //     function initInteract(element) {
        //         interact(element)
        //             .draggable({
        //                 allowFrom: '.move-btn',
        //                 listeners: {
        //                     move(event) {
        //                         let x = (parseFloat(element.getAttribute('data-x')) || 0) + event.dx;
        //                         let y = (parseFloat(element.getAttribute('data-y')) || 0) + event.dy;
        //                         element.style.transform = `translate(${x}px, ${y}px)`;
        //                         element.setAttribute('data-x', x);
        //                         element.setAttribute('data-y', y);
        //                     }
        //                 }
        //             })
        //             .resizable({
        //                 edges: { bottom: '.resize-btn', right: '.resize-btn' },
        //                 listeners: {
        //                     move(event) {
        //                         let x = parseFloat(element.getAttribute('data-x')) || 0;
        //                         let y = parseFloat(element.getAttribute('data-y')) || 0;
        //                         Object.assign(element.style, {
        //                             width: `${event.rect.width}px`,
        //                             height: `${event.rect.height}px`
        //                         });
        //                     }
        //                 }
        //             });
        //     }

        function spawnModel(modelPath) {
            const container = document.createElement('div');
            container.className = 'model-instance'; // Using class instead of ID

            // Set initial styles (matches your CSS)
            Object.assign(container.style, {
                position: 'absolute',
                width: '200px',
                height: '200px',
                zIndex: '10',
                transform: 'translate(50px, 50px)'
            });

            container.setAttribute('data-x', 50);
            container.setAttribute('data-y', 50);

            // container.innerHTML = `
            //     <model-viewer src="${modelPath}" alt="3D Model" shadow-intensity="1" exposure="0.8" 
            //                 camera-controls style="width:100%; height:100%;"></model-viewer>
            //     <div class="corner-btn move-btn">✋</div>
            //     <div class="corner-btn delete-btn" onclick="this.parentElement.remove()">❌</div>
            //     <div class="corner-btn resize-btn">↔</div>
            // `;

            container.innerHTML = `
    <model-viewer src="${modelPath}" alt="3D Model" shadow-intensity="1" exposure="0.8" 
                camera-controls style="width:100%; height:100%;"></model-viewer>
    <div class="corner-btn move-btn">✋</div>
    <div class="corner-btn delete-btn" onclick="if(confirm('Remove this model?')) this.parentElement.remove()">❌</div>
    <div class="corner-btn resize-btn">↔</div>
`;

            document.getElementById('generateImg').appendChild(container);

            // Re-initialize interact.js for the new element
            initInteract(container);
        }

        // Move your interact logic into this function so new models can use it
        function initInteract(selector) {
            interact(selector)
                .draggable({
                    allowFrom: '.move-btn',
                    listeners: {
                        move(event) {
                            let x = (parseFloat(event.target.getAttribute('data-x')) || 0) + event.dx;
                            let y = (parseFloat(event.target.getAttribute('data-y')) || 0) + event.dy;
                            event.target.style.transform = `translate(${x}px, ${y}px)`;
                            event.target.setAttribute('data-x', x);
                            event.target.setAttribute('data-y', y);
                        }
                    }
                })
                // .resizable({
                //     edges: { bottom: '.resize-btn', right: '.resize-btn' },
                //     listeners: {
                //         move(event) {
                //             let x = parseFloat(event.target.dataset.x) || 0;
                //             let y = parseFloat(event.target.dataset.y) || 0;
                //             Object.assign(event.target.style, {
                //                 width: `${event.rect.width}px`,
                //                 height: `${event.rect.height}px`
                //             });
                //         }
                //     }
                // });
                .resizable({
                    edges: { bottom: '.resize-btn', right: '.resize-btn' },
                    listeners: {
                        move(event) {
                            let x = parseFloat(event.target.dataset.x) || 0;
                            let y = parseFloat(event.target.dataset.y) || 0;
                            Object.assign(event.target.style, {
                                width: `${event.rect.width}px`,
                                height: `${event.rect.height}px`
                            });
                            // Keep position stable while resizing
                            event.target.style.transform = `translate(${x}px, ${y}px)`;
                        }
                    }
                });
        }
        // Attach the button click
        // document.getElementById('addModelBtn').addEventListener('click', addNewModel);
    </script>

</body>

</html>