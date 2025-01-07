// Wait for Supabase to load
let supabaseInstance;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    supabaseInstance = supabase.createClient(
        'https://xwcooeurgfyivmairiwk.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Y29vZXVyZ2Z5aXZtYWlyaXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMzc3MDMsImV4cCI6MjA1MTgxMzcwM30.IkhShRuu5Vy5hE4fJtIEltM9rt1m651E2liIhIJ-uRk'
    );

    // Test connection
    testConnection();
    // Initialize display
    displayPreviousEntries();
});

// Test connection function
async function testConnection() {
    try {
        const { data, error } = await supabaseInstance
            .from('payments')
            .select('*', { count: 'exact' });

        if (error) {
            console.error('Database connection error:', error);
            showSuccessMessage('Adatbázis kapcsolódási hiba!', true);
            return;
        }
        
        if (data) {
            console.log('Database connected successfully. Total records:', data.length);
        } else {
            console.error('Unexpected data format:', data);
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        showSuccessMessage('Adatbázis kapcsolódási hiba!', true);
    }
}

// Add form validation
function validateForm(formData) {
    if (formData.lakber <= 0) return 'Lakbér nem lehet nulla vagy negatív';
    if (formData.kk < 0) return 'KK nem lehet negatív';
    if (formData.gaz < 0) return 'Gáz nem lehet negatív';
    if (formData.villany < 0) return 'Villany nem lehet negatív';
    if (formData.viz < 0) return 'Víz nem lehet negatív';
    return null;
}

// Update handleSubmit function
async function handleSubmit(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.classList.add('loading');
    
    const formData = {
        month: document.getElementById('month').value,
        lakber: Number(document.getElementById('lakber').value) || 0,
        kk: Number(document.getElementById('kk').value) || 0,
        gaz: Number(document.getElementById('gaz').value) || 0,
        villany: Number(document.getElementById('villany').value) || 0,
        viz: Number(document.getElementById('viz').value) || 0,
        notes: document.getElementById('notes').value || '',
        reference_number: Math.random().toString(36).substring(2, 15),
        created_at: new Date().toISOString()
    };

    try {
        console.log('Attempting to save:', formData);
        
        const validationError = validateForm(formData);
        if (validationError) {
            showSuccessMessage(validationError, true);
            submitButton.classList.remove('loading');
            return;
        }

        const { data, error } = await supabaseInstance
            .from('payments')
            .insert([formData])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Save successful:', data);
        event.target.reset();
        await displayPreviousEntries();
        showSuccessMessage('Fizetés sikeresen mentve!');
    } catch (error) {
        console.error('Save failed:', error);
        showSuccessMessage(error.message || 'Hiba történt a mentés során!', true);
    } finally {
        submitButton.classList.remove('loading');
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
        const { data: payments, error } = await supabaseInstance
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const container = document.getElementById('previousEntries');
        if (!payments || payments.length === 0) {
            container.innerHTML = '<p>Nincsenek korábbi befizetések.</p>';
            return;
        }

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
        console.error('Display error:', error);
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
    doc.setTextColor(0, 0, 0);
    doc.text('Fizetés Sikeres!', 105, 55, { align: 'center' });

    // Calculate total
    const total = parseInt(entry.lakber) + parseInt(entry.kk) + 
                 parseInt(entry.gaz) + parseInt(entry.villany) + 
                 parseInt(entry.viz);

    // Add content with exact styling
    const content = [
        ['Referenciaszám', '395646624162'],
        ['Dátum', '2025. 01. 07.'],
        ['Idő', '8:30:03'],  // Using proper Hungarian character
        ['Hónap', entry.month],
        ['Lakbér', `${entry.lakber} Ft`],
        ['KK', `${entry.kk} Ft`],
        ['Gáz', `${entry.gaz} Ft`],
        ['Villany', `${entry.villany} Ft`],
        ['Víz', `${entry.viz} Ft`],
        ['Teljes összeg', `${total} Ft`],
    ];

    if (entry.notes) {
        content.push(['Megjegyzés', entry.notes]);
    }

    // Custom styling for the table
    doc.autoTable({
        body: content,
        theme: 'plain',
        startY: 70,
        margin: { left: 40, right: 40 },
        styles: {
            fontSize: 12,
            cellPadding: 8,
            lineColor: [238, 238, 238],
            lineWidth: 0.5,
            font: "helvetica",
            fontStyle: "normal"
        },
        columnStyles: {
            0: { 
                textColor: [128, 128, 128],
                fontStyle: 'normal',
                cellWidth: 60
            },
            1: { 
                halign: 'right',
                fontStyle: 'bold',
                cellWidth: 70
            }
        },
        didParseCell: function(data) {
            // Add bottom border to each row
            const row = data.row.index;
            const rows = data.table.body.length;
            
            if (row < rows - 1) {
                data.cell.styles.borderBottom = [1, 'dashed', [238, 238, 238]];
            }
            
            // Special styling for total amount
            if (row === rows - 1) {
                data.cell.styles.fontSize = 14;
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.borderTop = [2, 'dashed', [238, 238, 238]];
                data.cell.styles.borderBottom = 0;
            }
        }
    });

    // Save the PDF
    doc.save(`bizonylat_${entry.month}.pdf`);
}

function shareReceipt(entry) {
    // Create a temporary container with fixed dimensions
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 400px;
        background: white;
        padding: 0;
        margin: 0;
        z-index: -1;
    `;
    
    const total = parseInt(entry.lakber) + parseInt(entry.kk) + 
                 parseInt(entry.gaz) + parseInt(entry.villany) + 
                 parseInt(entry.viz);

    // Generate receipt HTML
    container.innerHTML = `
        <div class="receipt-capture">
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
                <span class="receipt-value">395646624162</span>
            </div>

            <div class="receipt-row">
                <span class="receipt-label">Dátum</span>
                <span class="receipt-value">2025. 01. 07.</span>
            </div>

            <div class="receipt-row">
                <span class="receipt-label">Idő</span>
                <span class="receipt-value">8:30:03</span>
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
        </div>
    `;

    // Add to body
    document.body.appendChild(container);

    // Add these styles for the capture
    const style = document.createElement('style');
    style.textContent = `
        .receipt-capture {
            background: white;
            width: 400px;
            padding: 30px;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        .receipt-capture .receipt-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .receipt-capture .receipt-icon {
            width: 60px;
            height: 60px;
            background: #e8f5e9;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .receipt-capture .receipt-icon svg {
            width: 30px;
            height: 30px;
            fill: #4CAF50;
        }
        .receipt-capture .receipt-title {
            font-size: 24px;
            margin: 0 0 30px;
        }
        .receipt-capture .receipt-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #eee;
        }
        .receipt-capture .receipt-label {
            color: #666;
            font-size: 14px;
        }
        .receipt-capture .receipt-value {
            font-weight: bold;
        }
        .receipt-capture .receipt-amount {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px dashed #eee;
        }
        .receipt-capture .receipt-amount .receipt-value {
            font-size: 20px;
        }
    `;
    document.head.appendChild(style);

    // Get the element to capture
    const element = container.querySelector('.receipt-capture');

    // Capture the receipt
    html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: function(clonedDoc) {
            const clonedElement = clonedDoc.querySelector('.receipt-capture');
            clonedElement.style.transform = 'none';
        }
    }).then(canvas => {
        // Cleanup
        container.remove();
        style.remove();

        // Convert to image and download
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bizonylat_${entry.month}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    });
}

// Single event listener for initialization
document.addEventListener('DOMContentLoaded', displayPreviousEntries);

// Add success message function
function showSuccessMessage(message, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isError ? 'error' : 'success'} animate__animated animate__fadeInDown`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.classList.replace('animate__fadeInDown', 'animate__fadeOutUp');
        setTimeout(() => messageDiv.remove(), 1000);
    }, 3000);
} 