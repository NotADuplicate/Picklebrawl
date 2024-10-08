        // JavaScript to handle tab switching
        function openTab(event, tabName) {
            var i, tabcontent, tabbuttons;

            // Hide all tab content
            tabcontent = document.getElementsByClassName("tab-content");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].classList.remove("active");
            }

            // Remove active class from all buttons
            tabbuttons = document.getElementsByClassName("tab-button");
            for (i = 0; i < tabbuttons.length; i++) {
                tabbuttons[i].classList.remove("active");
            }

            // Show the selected tab content and set the button as active
            document.getElementById(tabName).classList.add("active");
            event.currentTarget.classList.add("active");
        }

        // Set default active tab
        window.onload = function() {
            document.getElementsByClassName('tab-button')[0].click();
        };