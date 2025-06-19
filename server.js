const http = require('http');
const { createCanvas, loadImage } = require('canvas'); // Install 'canvas' package for image manipulation

const PORT = 3000;

// Create the HTTP server
const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        // Respond to a GET request for the homepage
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Camera Grid</title>
    <style>
        #camera-container {
            position: relative;
            width: 100%;
            max-width: 640px;
            margin: auto;
        }
        #camera-feed {
            width: 100%;
            height: auto;
        }
        #grid-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(4, 1fr);
            pointer-events: none;
        }
        #grid-overlay div {
            border: 1px solid rgba(255, 255, 255, 0.5);
        }
    </style>
</head>
<body>
    <div id="camera-container">
        <video id="camera-feed" autoplay></video>
        <div id="grid-overlay">
            <!-- Grid cells -->
            <div></div><div></div><div></div><div></div>
            <div></div><div></div><div></div><div></div>
            <div></div><div></div><div></div><div></div>
            <div></div><div></div><div></div><div></div>
        </div>
    </div>
    <script>
    // Access the user's camera and display the video feed
async function startCamera() {
    const video = document.getElementById('camera-feed');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.play();
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please check your permissions.');
    }
}

// Add event listener to start the camera when the page loads
window.addEventListener('load', startCamera);
    </script>
</body>
</html>
        `);
    } else if (req.method === 'POST' && req.url === '/process') {
        // Handle a POST request to process an image
        let body = [];
        req.on('data', chunk => {
            body.push(chunk);
        });
        req.on('end', async () => {
            const buffer = Buffer.concat(body);

            try {
                // Load the image from the buffer
                const image = await loadImage(buffer);

                // Create a canvas to manipulate the image
                const canvas = createCanvas(image.width, image.height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);

                // Convert the image to grayscale
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
                    imageData.data[i] = avg;     // Red
                    imageData.data[i + 1] = avg; // Green
                    imageData.data[i + 2] = avg; // Blue
                }
                ctx.putImageData(imageData, 0, 0);

                // Return the processed image
                res.writeHead(200, { 'Content-Type': 'image/png' });
                res.end(canvas.toBuffer());
            } catch (error) {
                console.error('Error processing image:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to process image' }));
            }
        });
    } else {
        // Respond with a 404 for other routes
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});