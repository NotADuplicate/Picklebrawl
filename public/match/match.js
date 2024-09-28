document.addEventListener('DOMContentLoaded', () => {
    const sliderIcon = document.querySelector('.slider-icon');
    let position = 50; // Initial position (percentage)

    // Function to move the slider icon
    function moveSliderIcon(newPosition) {
        console.log('Moving slider icon to', newPosition);
        position = newPosition;
        sliderIcon.style.top = `${position}%`;
    }

    // Example: Move the slider icon to a new position after 2 seconds
    setInterval(() => {
        moveSliderIcon(Math.random() * 100); // Move to a random position from the top
    }, 2000);
});