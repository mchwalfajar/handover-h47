const dateNowElement = document.getElementById('dateNow');
const shiftSelect = document.getElementById('shiftSelect');

function formatDate(date) {
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function updateDate() {
    const now = new Date();
    let displayedDate = now;

    if (shiftSelect.value === 'shift3') {
        displayedDate = new Date(now);
        displayedDate.setDate(now.getDate() - 1); // Subtract one day
    }

    const formattedDate = formatDate(displayedDate);
    dateNowElement.innerText = `Tanggal: ${formattedDate}`;
}

updateDate();

shiftSelect.addEventListener('change', updateDate);
