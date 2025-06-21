
// Master Blueprint Generator JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('promptForm');
    const generateBtn = document.getElementById('generateBtn');
    const resultSection = document.getElementById('resultSection');
    const promptResult = document.getElementById('promptResult');
    const copyBtn = document.getElementById('copyBlueprint');

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const query = document.getElementById('query').value.trim();
        const platform = document.getElementById('platform').value;
        
        if (!query) {
            alert('Please describe your application idea');
            return;
        }

        // Update UI for generation
        generateBtn.disabled = true;
        generateBtn.textContent = '🎯 Generating Master Blueprint...';
        resultSection.classList.add('hidden');

        try {
            const response = await fetch('/api/generate-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query, platform })
            });

            const result = await response.json();

            if (response.ok) {
                promptResult.textContent = result.prompt;
                resultSection.classList.remove('hidden');
                
                // Smooth scroll to results
                resultSection.scrollIntoView({ behavior: 'smooth' });
                
                // Show success message
                showNotification('✅ Master Blueprint Generated Successfully!', 'success');
            } else {
                throw new Error(result.error || 'Failed to generate blueprint');
            }
        } catch (error) {
            console.error('Generation error:', error);
            showNotification('❌ Failed to generate blueprint: ' + error.message, 'error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '🎯 Generate Master Blueprint';
        }
    });

    // Copy blueprint functionality
    if (copyBtn) {
        copyBtn.addEventListener('click', async function() {
            try {
                await navigator.clipboard.writeText(promptResult.textContent);
                copyBtn.textContent = '✅ Copied!';
                copyBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                copyBtn.classList.add('bg-green-800');
                
                setTimeout(() => {
                    copyBtn.textContent = '📋 Copy Blueprint';
                    copyBtn.classList.remove('bg-green-800');
                    copyBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                }, 2000);
                
                showNotification('📋 Master Blueprint copied to clipboard!', 'success');
            } catch (error) {
                console.error('Copy failed:', error);
                showNotification('❌ Failed to copy blueprint', 'error');
            }
        });
    }

    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white max-w-sm`;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Auto-resize textarea
    const textarea = document.getElementById('query');
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
});
