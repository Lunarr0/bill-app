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
        console.log('Attempting to save form data:', formData);  // Debug log 1
        
        const validationError = validateForm(formData);
        if (validationError) {
            console.log('Validation failed:', validationError);  // Debug log 2
            showSuccessMessage(validationError, true);
            submitButton.classList.remove('loading');
            return;
        }

        console.log('Validation passed, connecting to Supabase...');  // Debug log 3
        console.log('Supabase instance:', supabaseInstance);  // Debug log 4

        const { data, error } = await supabaseInstance
            .from('payments')
            .insert([formData])
            .select();

        console.log('Supabase response:', { data, error });  // Debug log 5
        
        if (error) {
            console.error('Supabase error:', error);  // Debug log 6
            throw error;
        }

        console.log('Save successful:', data);  // Debug log 7
        event.target.reset();
        await displayPreviousEntries();
        showSuccessMessage('Fizetés sikeresen mentve!');
    } catch (error) {
        console.error('Detailed error:', error);  // Debug log 8
        console.error('Error stack:', error.stack);  // Debug log 9
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
                 