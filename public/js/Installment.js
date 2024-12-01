// public/js/scripts.js

// Function to toggle between card and table views
function toggleView() {
    const url = new URL(window.location.href);
    const currentView = url.searchParams.get('view');
    const newView = currentView === 'card' ? 'table' : 'card';
    url.searchParams.set('view', newView);
    window.location.href = url.toString();
}

// Function to handle search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('clientSearch');
    const clientList = document.getElementById('clientList');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const isCardView = clientList.classList.contains('grid');

            if (isCardView) {
                const cards = clientList.querySelectorAll('.bg-white');
                cards.forEach(card => {
                    const name = card.querySelector('h3').textContent.toLowerCase();
                    const phone = card.querySelectorAll('p')[0].textContent.toLowerCase();
                    if (name.includes(searchTerm) || phone.includes(searchTerm)) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            } else {
                const rows = clientList.querySelectorAll('table tbody tr');
                rows.forEach(row => {
                    const name = row.children[0].textContent.toLowerCase();
                    const phone = row.children[1].textContent.toLowerCase();
                    if (name.includes(searchTerm) || phone.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            }
        });
    }
});
