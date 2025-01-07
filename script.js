// Add error handling for Supabase initialization
const supabase = createClient(
    'https://xwcooeurgfyivmairiwk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Y29vZXVyZ2Z5aXZtYWlyaXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMzc3MDMsImV4cCI6MjA1MTgxMzcwM30.IkhShRuu5Vy5hE4fJtIEltM9rt1m651E2liIhIJ-uRk'
);

// Add form validation
function validateForm(formData) {
    if (formData.lakber <= 0) return 'Lakbér nem lehet nulla vagy negatív';
    if (formData.kk < 0) return 'KK nem lehet negatív';
    if (formData.gaz < 0) return 'Gáz nem lehet negatív';
    if (formData.villany < 0) return 'Villany nem lehet negatív';
    if (formData.viz < 0) return 'Víz nem lehet negatív';
    return null;
}

// Update handleSubmit with validation
async function handleSubmit(event) {
    event.preventDefault();
    
    const formData = {
        month: document.getElementById('month').value,
        lakber: Number(document.getElementById('lakber').value),
        kk: Number(document.getElementById('kk').value),
        gaz: Number(document.getElementById('gaz').value),
        villany: Number(document.getElementById('villany').value),
        viz: Number(document.getElementById('viz').value),
        notes: document.getElementById('notes').value,
        reference_number: Math.random().toString().substring(2, 15),
        created_at: new Date().toISOString()
    };

    // Validate form data
    const validationError = validateForm(formData);
    if (validationError) {
        showSuccessMessage(validationError, true);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('payments')
            .insert([formData])
            .select();

        if (error) throw error;
        
        event.target.reset();
        displayPreviousEntries();
        showSuccessMessage('Fizetés sikeresen mentve!');
    } catch (error) {
        console.error('Error:', error);
        showSuccessMessage('Hiba történt a mentés során!', true);
    }
}

// Add offline support
window.addEventListener('online', () => {
    showSuccessMessage('Újra online!');
    displayPreviousEntries();
});

window.addEventListener('offline', () => {
    showSuccessMessage('Offline módban!', true);
});

// Update displayPreviousEntries function
async function displayPreviousEntries() {
    try {
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const container = document.getElementById('previousEntries');
        
        container.innerHTML = payments.map(entry => {
            const total = entry.lakber + entry.kk + entry.gaz + entry.villany + entry.viz;
            const date = new Date(entry.created_at);
            
            return `
                <div class="receipt animate__animated animate__fadeIn">
                    <div class="receipt-header">
                        <div class="receipt-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                        </div>
                        <h2 class="receipt-title">Fizetés Sikeres!</h2>
                    </div>

                    <div class="receipt-row">
                        <span class="receipt-label">Referenciaszám</span>
                        <span class="receipt-value">${entry.reference_number}</span>
                    </div>

                    <div class="receipt-row">
                        <span class="receipt-label">Dátum</span>
                        <span class="receipt-value">${date.toLocaleDateString('hu-HU')}</span>
                    </div>

                    <div class="receipt-row">
                        <span class="receipt-label">Idő</span>
                        <span class="receipt-value">${date.toLocaleTimeString('hu-HU')}</span>
                    </div>

                    <div class="receipt-row">
                        <span class="receipt-label">Hónap</span>
                        <span class="receipt-value">${entry.month}</span>
                    </div>

                    <div class="receipt-row">
                        <span class="receipt-label">Lakbér</span>
                        <span class="receipt-value">${entry.lakber} Ft</span>
                    </div>

                    <div class="receipt-row">
                        <span class="receipt-label">KK</span>
                        <span class="receipt-value">${entry.kk} Ft</span>
                    </div>

                    <div class="receipt-row">
                        <span class="receipt-label">Gáz</span>
                        <span class="receipt-value">${entry.gaz} Ft</span>
                    </div>

                    <div class="receipt-row">
                        <span class="receipt-label">Villany</span>
                        <span class="receipt-value">${entry.villany} Ft</span>
                    </div>

                    <div class="receipt-row">
                        <span class="receipt-label">Víz</span>
                        <span class="receipt-value">${entry.viz} Ft</span>
                    </div>

                    <div class="receipt-amount">
                        <div class="receipt-row">
                            <span class="receipt-label">Teljes összeg</span>
                            <span class="receipt-value">${total} Ft</span>
                        </div>
                    </div>

                    ${entry.notes ? `
                    <div class="receipt-row">
                        <span class="receipt-label">Megjegyzés</span>
                        <span class="receipt-value">${entry.notes}</span>
                    </div>
                    ` : ''}

                    <button class="download-pdf" onclick="shareReceipt(${JSON.stringify(entry).replace(/"/g, '&quot;')})">
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        Kép mentése
                    </button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('previousEntries').innerHTML = 
            '<p class="error">Hiba történt az adatok betöltése során.</p>';
    }
}

function generatePDF(entry) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Set font and language first
    doc.setFont("helvetica", "normal");
    doc.setLanguage("hu");
    
    // Set white background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    // Add checkmark icon
    doc.setFillColor(232, 245, 233); // Light green background
    doc.circle(105, 30, 12, 'F');
    
    doc.setDrawColor(76, 175, 80);
    doc.setLineWidth(1.5);
    // Draw checkmark
    doc.line(99, 30, 103, 34);
    doc.line(103, 34, 111, 26);

    // Add title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColo