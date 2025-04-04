const faceImages = [
    { image: "tile000.png", x: 0, y: 0, scale: 0.6 },
    { image: "tile001.png", x: 3, y: 0, scale: 0.6 },
    { image: "tile002.png", x: 0, y: 0, scale: 0.6 },
    { image: "tile003.png", x: 10, y: -20, scale: 0.6 },
    { image: "tile004.png", x: 0, y: 8, scale: 0.6 },
    { image: "tile005.png", x: 0, y: 0, scale: 0.6 },
    { image: "tile006.png", x: 0, y: 8, scale: 0.6 }    
];
const hairImages = [
    { image: "tile000.png", x: 40, y: 160, scale: 1 },
    { image: "tile001.png", x: 60, y: 120, scale: 0.9 },
    { image: "tile002.png", x: 20, y: 110, scale: 1 },
    { image: "tile003.png", x: 30, y: 120, scale: 1 },
    { image: "tile004.png", x: 30, y: 100, scale: 1 },
    { image: "tile005.png", x: 40, y: 110, scale: 1 },
    { image: "tile006.png", x: 35, y: 110, scale: 1 },   
    { image: "tile007.png", x: 0, y: 160, scale: 1 }
];
const hairColors = [
    { r: 222, g: 184, b: 135 }, // Blonde
    { r: 165, g: 42, b: 42 },   // Brown
    { r: 0, g: 0, b: 0 },       // Black
    { r: 210, g: 105, b: 30 },  // Slightly Red
    { r: 139, g: 69, b: 19 },   // Auburn
    { r: 255, g: 229, b: 180 }  // Platinum Blonde
];
const skinColors = [
    { r: 255, g: 224, b: 189 }, // Light skin
    { r: 255, g: 204, b: 153 }, // Medium skin
    { r: 204, g: 153, b: 102 }, // Dark skin
    { r: 153, g: 102, b: 51 }   // Very dark skin
];

// Optional offsets for the face image.
// Adjust these values as needed.

// Added function to update images based on input values.
function generateImage() {
    return new Promise((resolve, reject) => {
        console.log("Generating image...");
        // Select random face and hair values
        let faceIndex = Math.floor(faceImages.length * Math.random());
        let hairIndex = Math.floor(hairImages.length * Math.random());
        const face = faceImages[faceIndex % faceImages.length];
        const hair = hairImages[hairIndex % hairImages.length];
        const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
        const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)];

        // Calculate transformation for the face image
        const xOffset = face.x + hair.x+20; // horizontal offset in pixels
        const yOffset = face.y + hair.y+20; // vertical offset in pixels
        const scale = face.scale * hair.scale; // scale factor

        // Create image objects for face and hai        
        const hairImg = new Image();
        hairImg.src = "../resources/hair/" + hair.image;
        
        hairImg.onload = function() {
            console.log("Hair image loaded successfully!");
            // Process the hair image to adjust the green pixels
            const hairCanvas = document.createElement("canvas");
            hairCanvas.width = hairImg.naturalWidth;
            hairCanvas.height = hairImg.naturalHeight;
            const hairCtx = hairCanvas.getContext("2d");
            hairCtx.drawImage(hairImg, 0, 0);
            const imageData = hairCtx.getImageData(0, 0, hairCanvas.width, hairCanvas.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                // Adjust pixels that are predominantly green
                if (g > 200 && r < 100 && b < 100) {
                    imageData.data[i] = hairColor.r;
                    imageData.data[i + 1] = hairColor.g;
                    imageData.data[i + 2] = hairColor.b;
                }
                if (g <30 && r > 200 && b < 30) {
                    imageData.data[i] = skinColor.r;
                    imageData.data[i + 1] = skinColor.g;
                    imageData.data[i + 2] = skinColor.b;
                }
            }
            hairCtx.putImageData(imageData, 0, 0);
            const faceImg = new Image();
            faceImg.src = "../resources/faces/" + face.image;

            // Wait for the face image to load
            faceImg.onload = function() {
                console.log("Face image loaded successfully!");
                // Determine a canvas size based on both images
                const finalWidth = Math.max(hairCanvas.width, faceImg.naturalWidth * scale + Math.abs(xOffset));
                const finalHeight = Math.max(hairCanvas.height, faceImg.naturalHeight * scale + Math.abs(yOffset));
                const finalCanvas = document.createElement("canvas");
                finalCanvas.width = finalWidth;
                finalCanvas.height = finalHeight;
                const ctx = finalCanvas.getContext("2d");
                console.log("Final canvas size:", finalWidth, finalHeight);

                // Draw the processed hair image (as the base layer)
                ctx.drawImage(hairCanvas, 0, 0);
                
                // Draw the face image with the computed transformation
                console.log("here2")
                ctx.save();
                ctx.translate(xOffset, yOffset);
                console.log(hairIndex, faceIndex, xOffset, yOffset, scale);
                ctx.scale(scale, scale);
                ctx.drawImage(faceImg, 0, 0);
                ctx.restore();
                console.log("here23")

                // Create an image element from the canvas and return it
                const resultImg = new Image();
                resultImg.src = finalCanvas.toDataURL();
                console.log("Resolving");
                resolve(resultImg);
            };

            faceImg.onerror = function(err) {
                console.error("Error loading face image:", err);
                reject(err);
            };
        };

        hairImg.onerror = function(err) {
            console.error("Error loading hair image:", err);
            reject(err);
        };
        console.log("Here")
    });
}

// Attach event listener to the faceInput element.
// When the input changes, generate an image and display it in the element with id "result".
// If the "result" element isn't found, the image will be appended to the body.
document.getElementById("faceInput").addEventListener("change", () => {
    console.log("Face input changed, generating image...");
    generateImage()
        .then(resultImg => {
            console.log("Image generated successfully!");
            const container = document.getElementById("result");
            if (container) {
                container.innerHTML = "";
                container.appendChild(resultImg);
            } else {
                document.body.appendChild(resultImg);
            }
        })
        .catch(err => console.error("Error generating image:", err));
});
