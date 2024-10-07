document.addEventListener('DOMContentLoaded', function () {
    const messages = document.querySelectorAll('.message');
    
    let activeMessage = null; // Track the currently active (open) message

    messages.forEach((message) => {
        const fullText = message.querySelector('p');
        const toggleButton = document.createElement('span');
        
        // Save full text and reduce to first sentence
        const firstSentence = fullText.textContent.split('. ')[0] + '.';
        const remainingText = fullText.textContent.substring(firstSentence.length);

        // Create toggle button and set its style
        toggleButton.textContent = ' + ';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.display = 'block'; // Make it a block element
        toggleButton.style.textAlign = 'center'; // Center the symbol
        toggleButton.style.fontSize = '1.5rem'; // Increase the font size
        toggleButton.style.marginTop = '10px'; // Add space above the symbol

        // Initially show only the first sentence
        fullText.textContent = firstSentence;

        // Toggle function
        function toggleMessage() {
            if (activeMessage && activeMessage !== message) {
                // Close the currently active message
                const activeText = activeMessage.querySelector('p');
                const activeButton = activeMessage.querySelector('span');
                const activeFirstSentence = activeText.textContent.split('. ')[0] + '.';
                activeText.textContent = activeFirstSentence;
                activeButton.textContent = ' + ';
                activeMessage.style.height = 'auto'; // Reset the height
            }
            
            if (toggleButton.textContent === ' + ') {
                fullText.textContent = firstSentence + remainingText;
                toggleButton.textContent = ' - ';
                activeMessage = message;
                message.style.height = 'auto'; // Set height for opened message
            } else {
                fullText.textContent = firstSentence;
                toggleButton.textContent = ' + ';
                activeMessage = null;
                message.style.height = 'auto'; // Reset the height
            }
        }

        // Append toggle button to the message box
        message.appendChild(toggleButton);

        // Add click event to the entire message box
        message.style.cursor = 'pointer';
        message.addEventListener('click', toggleMessage);
    });
});
document.addEventListener('DOMContentLoaded', function () {
    const messages = document.querySelectorAll('.message');

    messages.forEach((message) => {
        const imgElement = message.querySelector('img');

        // Bild tauschen beim Hover
        message.addEventListener('mouseenter', function () {
            imgElement.src = 'images/car-pollution.png'; // Neues Bild beim Hover
        });

        // Originalbild wiederherstellen, wenn der Hover endet
        message.addEventListener('mouseleave', function () {
            imgElement.src = 'images/car-pollution (1).png'; // Originalbild
        });
    });
});
