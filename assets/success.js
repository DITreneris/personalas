'use strict';

(function () {
    var statusEl = document.getElementById('status');
    var emailEl = document.getElementById('email-line');
    var downloadEl = document.getElementById('download');
    var singleWrap = document.getElementById('single-download-wrap');
    var listEl = document.getElementById('download-list');
    var errorEl = document.getElementById('error');
    var upsellEl = document.getElementById('upsell');
    var upsellText = document.getElementById('upsell-text');
    var upsellCta = document.getElementById('upsell-cta');
    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get('session_id') || '';
    var attempts = 0;
    var maxAttempts = 30;
    var intervalMs = 2000;

    function showError(msg) {
        statusEl.innerHTML = '';
        statusEl.textContent = 'We hit a snag preparing your download.';
        errorEl.textContent = msg;
        errorEl.hidden = false;
    }

    function showUpsell(productId, config) {
        if (!config || !config.pdfGuides || productId === 'bundle') return;
        var advanced = config.pdfGuides.advanced;
        var beginner = config.pdfGuides.beginner;
        if (productId === 'beginner' && advanced && advanced.stripePaymentLink && advanced.stripePaymentLink.indexOf('REPLACE_') === -1) {
            upsellText.textContent = 'Add the 32-page Advanced guide with scorecards and debrief protocols.';
            upsellCta.textContent = 'Buy Advanced — $' + Number(advanced.price).toFixed(2);
            upsellCta.href = advanced.stripePaymentLink;
            upsellEl.hidden = false;
        } else if (productId === 'advanced' && beginner) {
            upsellText.textContent = 'Share the free 10-prompt builder with a colleague:';
            upsellCta.textContent = 'Open free prompts';
            upsellCta.href = '/en/#block1';
            upsellCta.classList.remove('btn-secondary');
            upsellEl.hidden = false;
        }
    }

    function renderReady(data, config) {
        statusEl.innerHTML = '';
        statusEl.textContent = 'Your ' + (data.productName || 'PDF') + ' is ready.';
        if (data.maskedEmail) {
            emailEl.textContent = 'A copy was emailed to ' + data.maskedEmail + '.';
            emailEl.hidden = false;
        }
        if (data.downloads && data.downloads.length) {
            listEl.innerHTML = '';
            data.downloads.forEach(function (item) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.className = 'btn';
                a.href = item.downloadUrl;
                a.textContent = 'Download ' + (item.productName || 'PDF');
                li.appendChild(a);
                listEl.appendChild(li);
            });
            listEl.hidden = false;
        } else if (data.downloadUrl) {
            downloadEl.href = data.downloadUrl;
            singleWrap.hidden = false;
        }
        showUpsell(data.productId, config);
    }

    if (!sessionId) {
        showError('Missing checkout session id. If you just paid, check your email for the download link.');
        return;
    }

    var sotPromise = fetch('/config/sot.json', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });

    async function poll() {
        attempts += 1;
        try {
            var res = await fetch('/api/download-link?session_id=' + encodeURIComponent(sessionId), {
                headers: { 'Accept': 'application/json' }
            });
            if (res.status === 202) {
                if (attempts >= maxAttempts) {
                    showError('Your purchase is still processing. Your download link will arrive by email shortly.');
                    return;
                }
                setTimeout(poll, intervalMs);
                return;
            }
            if (!res.ok) {
                var body = await res.json().catch(function () { return {}; });
                showError(body.error || 'We could not find that checkout session. Check your email for the download link.');
                return;
            }
            var data = await res.json();
            var config = await sotPromise;
            if (data.status === 'ready' && (data.downloadUrl || (data.downloads && data.downloads.length))) {
                renderReady(data, config);
                return;
            }
            showError('Unexpected response. Check your email for the download link.');
        } catch (_err) {
            if (attempts >= maxAttempts) {
                showError('Network error. Your download link will arrive by email.');
                return;
            }
            setTimeout(poll, intervalMs);
        }
    }
    poll();
})();
