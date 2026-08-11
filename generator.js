/**
 * Prompt Anatomy hire spoke – shared runtime (EN public product)
 * Locale from <html lang> (build outputs en-US). Authoring template uses lang="lt"; shipped pages use en-US only.
 */
(function() {
    'use strict';

    // ===== LOCALE =====
    var rawLocale = (document.documentElement && document.documentElement.getAttribute('lang')) || 'lt';
    var locale = rawLocale.toLowerCase().indexOf('en') === 0 ? 'en-US' : 'lt';

    function uiText(lt, en) {
        return locale === 'lt' ? lt : en;
    }

    // Phase labels rendered dynamically by JavaScript
    var PHASE_TITLES = {
        lt: { 1: 'Diagnostika', 2: 'Profilis', 3: 'Pritraukimas', 4: 'Atranka', 5: 'Pasiūlymas', 6: 'Išlaikymas' },
        'en-US': { 1: 'Diagnose', 2: 'Define the Role', 3: 'Source Candidates', 4: 'Screen & Interview', 5: 'Close the Offer', 6: 'Onboard & Retain' }
    };

    function getPhaseTitle(phase) {
        var titles = PHASE_TITLES[locale] || PHASE_TITLES.lt;
        return titles[phase] || uiText('Fazė ' + phase, 'Phase ' + phase);
    }

    // ===== KONFIGŪRACIJA =====
    var CONFIG = {
        SELECTION_TIMEOUT: 2000,
        TOAST_DURATION: 3000,
        BUTTON_RESET_TIMEOUT: 2500,
        ERROR_TIMEOUT: 3000,
        DEBOUNCE_DELAY: 100
    };

    // ===== PAGALBINĖS FUNKCIJOS =====
    var copyPromptDebounceTimer = null;
    var isCopying = false;

    function debounceCopyPrompt(func, delay) {
        return function() {
            var args = arguments;
            var ctx = this;
            clearTimeout(copyPromptDebounceTimer);
            copyPromptDebounceTimer = setTimeout(function() { func.apply(ctx, args); }, delay);
        };
    }

    function selectTextInternal(element) {
        if (!element) return;
        try {
            var pre = element.querySelector('pre');
            if (!pre) return;
            var range = document.createRange();
            range.selectNodeContents(pre);
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            element.classList.add('selected');
            setTimeout(function() { element.classList.remove('selected'); }, CONFIG.SELECTION_TIMEOUT);
        } catch (_) { /* fallback */ }
    }

    function copyPromptInternal(button, promptId) {
        if (isCopying) return;
        if (!button || !promptId) {
            showError(button, uiText('Klaida: trūksta parametrų', 'Error: missing parameters'));
            return;
        }
        var promptElement = document.getElementById(promptId);
        if (!promptElement) {
            showError(button, uiText('Promptas nerastas', 'Prompt not found'));
            return;
        }
        var promptText = promptElement.textContent ? promptElement.textContent.trim() : '';
        if (!promptText) {
            showError(button, uiText('Promptas tuščias', 'Prompt is empty'));
            return;
        }
        isCopying = true;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(promptText)
                .then(function() { showSuccess(button); isCopying = false; })
                .catch(function() { fallbackCopy(promptText, button); });
        } else {
            fallbackCopy(promptText, button);
        }
    }

    function scheduleCopyAfterCodeBlockActivate(button, promptId) {
        if (!button || !promptId) return;
        setTimeout(function() { copyPromptInternal(button, promptId); }, 300);
    }

    function activateCodeBlock(element) {
        if (!element) return;
        selectTextInternal(element);
        var pre = element.querySelector('pre');
        var promptId = pre && pre.id ? pre.id : null;
        if (!promptId) return;
        var button = element.closest('.prompt') ? element.closest('.prompt').querySelector('.btn') : null;
        if (button) scheduleCopyAfterCodeBlockActivate(button, promptId);
    }

    function handleCodeBlockKeydown(event, element) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activateCodeBlock(element);
        }
    }

    function fallbackCopy(text, button) {
        var textarea = document.getElementById('hiddenTextarea');
        if (!textarea) {
            showError(button, uiText('Kopijavimas nepavyko', 'Copy failed'));
            isCopying = false;
            return;
        }
        try {
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '0';
            textarea.style.top = '0';
            textarea.style.opacity = '0';
            textarea.style.pointerEvents = 'none';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            textarea.setSelectionRange(0, text.length);
            var successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            textarea.style.pointerEvents = 'auto';
            if (successful) {
                showSuccess(button);
            } else {
                throw new Error('copy failed');
            }
        } catch (_) {
            showError(button, uiText('Nepavyko. Pažymėk tekstą ranka ir nukopijuok.', 'Failed. Select the text manually and copy.'));
        } finally {
            isCopying = false;
        }
    }

    function showSuccess(button) {
        if (!button) return;
        var original = button.innerHTML;
        var copiedLabel = uiText('Nukopijuota!', 'Copied!');
        button.innerHTML = '<span aria-hidden="true"><i data-lucide="check" class="icon icon--sm"></i></span><span>' + copiedLabel + '</span>';
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons({ root: button });
        }
        button.classList.add('success');
        button.setAttribute('aria-label', uiText('Promptas sėkmingai nukopijuotas', 'Prompt copied successfully'));
        showToast();
        setTimeout(function() {
            button.innerHTML = original;
            button.classList.remove('success');
            var promptId = button.getAttribute('data-prompt-id');
            if (promptId) {
                var num = promptId.replace('prompt', '');
                button.setAttribute('aria-label', uiText('Kopijuoti promptą ' + num + ' į mainų atmintinę', 'Copy prompt ' + num + ' to clipboard'));
            }
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons({ root: button });
            }
        }, CONFIG.BUTTON_RESET_TIMEOUT);
    }

    function showError(button, message) {
        if (!button) return;
        var original = button.innerHTML;
        var errorMessage = message || uiText('Pažymėk tekstą', 'Select the text');
        button.innerHTML = '<span aria-hidden="true"><i data-lucide="alert-triangle" class="icon icon--sm"></i></span><span>' + errorMessage + '</span>';
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons({ root: button });
        }
        button.setAttribute('aria-label', uiText('Klaida: ', 'Error: ') + errorMessage);
        setTimeout(function() {
            button.innerHTML = original;
            var promptId = button.getAttribute('data-prompt-id');
            if (promptId) {
                var num = promptId.replace('prompt', '');
                button.setAttribute('aria-label', uiText('Kopijuoti promptą ' + num + ' į mainų atmintinę', 'Copy prompt ' + num + ' to clipboard'));
            }
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons({ root: button });
            }
        }, CONFIG.ERROR_TIMEOUT);
    }

    function showToast() {
        var toast = document.getElementById('toast');
        if (!toast) return;
        toast.classList.add('show');
        toast.setAttribute('aria-live', 'polite');
        setTimeout(function() { toast.classList.remove('show'); }, CONFIG.TOAST_DURATION);
    }

    // ===== GLOBAL (legacy window hooks + delegated listeners; no inline handlers) =====
    window.selectText = selectTextInternal;
    window.copyPrompt = debounceCopyPrompt(copyPromptInternal, CONFIG.DEBOUNCE_DELAY);
    window.activateCodeBlock = activateCodeBlock;
    window.handleCodeBlockKeydown = handleCodeBlockKeydown;

    function bindDelegatedPromptInteractions() {
        document.addEventListener('click', function(event) {
            var copyBtn = event.target.closest('button.btn[data-prompt-id]');
            if (copyBtn && copyBtn.closest('.prompt-footer')) {
                var promptId = copyBtn.getAttribute('data-prompt-id');
                if (promptId) {
                    window.copyPrompt(copyBtn, promptId);
                }
                return;
            }
            var codeBlock = event.target.closest('.code-block[role="button"]');
            if (codeBlock) {
                activateCodeBlock(codeBlock);
            }
        });
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                var toast = document.getElementById('toast');
                if (toast) toast.classList.remove('show');
                return;
            }
            var codeBlock = event.target.closest('.code-block[role="button"]');
            if (codeBlock) {
                handleCodeBlockKeydown(event, codeBlock);
            }
        });
    }

    // ===== localStorage – "Pažymėjau kaip atlikau" =====
    var PROMPT_DONE_KEY_PREFIX = 'di_prompt_done_';
    var PHASE_TO_PROMPTS = { 1: [1], 2: [2], 3: [3, 4], 4: [5, 6], 5: [7], 6: [8, 9, 10] };

    function loadPromptDoneState() {
        var checkboxes = document.querySelectorAll('.prompt-done');
        checkboxes.forEach(function(cb) {
            var id = cb.getAttribute('data-prompt-id');
            if (id) {
                try {
                    cb.checked = localStorage.getItem(PROMPT_DONE_KEY_PREFIX + id) === 'true';
                } catch (e) { /* ignore */ }
            }
        });
    }

    function savePromptDoneState(promptId, checked) {
        try {
            localStorage.setItem(PROMPT_DONE_KEY_PREFIX + promptId, checked ? 'true' : 'false');
        } catch (e) { /* ignore */ }
    }

    function getPhaseDoneCount() {
        var phasesDone = 0;
        try {
            for (var phase = 1; phase <= 6; phase++) {
                var promptIds = PHASE_TO_PROMPTS[phase];
                var allDone = promptIds.every(function(id) {
                    return localStorage.getItem(PROMPT_DONE_KEY_PREFIX + id) === 'true';
                });
                if (allDone) phasesDone++;
            }
        } catch (e) { /* ignore */ }
        return phasesDone;
    }

    function updateProgressIndicator() {
        var phaseCount = getPhaseDoneCount();
        var textEl = document.getElementById('progressText');
        var fillEl = document.getElementById('progressBarFill');
        var barEl = document.querySelector('.progress-bar[role="progressbar"]');
        if (textEl) {
            textEl.textContent = phaseCount === 6
                ? uiText('Puiku – atlikai visas 6 fazes.', 'Great – you\'ve completed all 6 phases.')
                : uiText('Sistema: ' + phaseCount + ' iš 6 fazių', 'Progress: ' + phaseCount + ' of 6');
        }
        if (fillEl) fillEl.style.width = (phaseCount / 6 * 100) + '%';
        if (barEl) {
            barEl.setAttribute('aria-valuenow', phaseCount);
            barEl.setAttribute('aria-valuemax', 6);
            barEl.setAttribute('aria-label', uiText('Progresas: ' + phaseCount + ' iš 6 fazių', 'Progress: ' + phaseCount + ' of 6'));
        }
    }

    // ===== 6 FAZIŲ AKORDEONAS =====
    function setupPhaseAccordion() {
        var phases = [];

        function isPhaseDone(phase) {
            try {
                var ids = PHASE_TO_PROMPTS[phase] || [];
                return ids.every(function(id) {
                    return localStorage.getItem(PROMPT_DONE_KEY_PREFIX + id) === 'true';
                });
            } catch (e) { return false; }
        }

        var defaultOpenPhase = 1;
        for (var p = 1; p <= 6; p++) {
            if (!isPhaseDone(p)) { defaultOpenPhase = p; break; }
        }

        for (var phase = 1; phase <= 6; phase++) {
            var phasePrompts = Array.prototype.slice.call(document.querySelectorAll('article.prompt[data-phase="' + phase + '"]'));
            if (!phasePrompts.length) continue;

            var firstPrompt = phasePrompts[0];
            var title = getPhaseTitle(phase);
            var count = phasePrompts.length;
            var countLabel = count === 1
                ? uiText('1 promptas', '1 prompt')
                : (count + uiText(' promptai', ' prompts'));

            var section = document.createElement('section');
            section.className = 'phase';
            section.id = 'phase' + phase;
            section.setAttribute('data-phase', String(phase));

            var body = document.createElement('div');
            body.className = 'phase-body';
            body.id = 'phase' + phase + '-body';

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'phase-header';
            btn.setAttribute('aria-controls', body.id);
            btn.innerHTML =
                '<span class="phase-badge">' + uiText('Fazė ', 'Phase ') + phase + '</span>' +
                '<span class="phase-title">' + title + '</span>' +
                '<span class="phase-meta">' + countLabel + '</span>' +
                '<span class="phase-chevron" aria-hidden="true">▾</span>';

            section.appendChild(btn);
            section.appendChild(body);
            firstPrompt.parentNode.insertBefore(section, firstPrompt);
            phasePrompts.forEach(function(promptEl) { body.appendChild(promptEl); });
            phases.push({ phase: phase, section: section, button: btn, body: body });
        }

        function setOpen(phaseObj, open) {
            phaseObj.section.classList.toggle('is-open', open);
            phaseObj.body.hidden = !open;
            phaseObj.button.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        function closeAllExcept(phaseToKeepOpen) {
            phases.forEach(function(ph) {
                if (phaseToKeepOpen && ph.phase === phaseToKeepOpen.phase) return;
                setOpen(ph, false);
            });
        }

        phases.forEach(function(ph) { setOpen(ph, ph.phase === defaultOpenPhase); });

        var headerPhaseButtons = document.querySelectorAll('.header-phase-link[data-phase]');
        function setActiveHeaderPhase(phaseNum) {
            headerPhaseButtons.forEach(function(btn) {
                var btnPhase = parseInt(btn.getAttribute('data-phase'), 10);
                if (btnPhase === phaseNum) {
                    btn.classList.add('is-active');
                    btn.setAttribute('aria-current', 'true');
                } else {
                    btn.classList.remove('is-active');
                    btn.removeAttribute('aria-current');
                }
            });
        }
        setActiveHeaderPhase(defaultOpenPhase);

        headerPhaseButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var phaseNum = parseInt(btn.getAttribute('data-phase'), 10);
                var phaseObj = getPhaseObjByNumber(phaseNum);
                if (!phaseObj) return;
                closeAllExcept(phaseObj);
                setOpen(phaseObj, true);
                setActiveHeaderPhase(phaseNum);
                var smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                try {
                    phaseObj.section.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
                } catch (_) { /* ignore */ }
            });
        });

        phases.forEach(function(ph) {
            ph.button.addEventListener('click', function() {
                var isOpen = ph.button.getAttribute('aria-expanded') === 'true';
                if (isOpen) { setOpen(ph, false); return; }
                closeAllExcept(ph);
                setOpen(ph, true);
            });
        });

        function getPhaseObjBySection(sectionEl) {
            for (var i = 0; i < phases.length; i++) {
                if (phases[i].section === sectionEl) return phases[i];
            }
            return null;
        }

        function getPhaseObjByNumber(phaseNum) {
            for (var i = 0; i < phases.length; i++) {
                if (phases[i].phase === phaseNum) return phases[i];
            }
            return null;
        }

        function openPhaseForElement(el) {
            if (!el) return;
            var phaseSection = el.closest ? el.closest('.phase') : null;
            if (!phaseSection) return;
            var phaseObj = getPhaseObjBySection(phaseSection);
            if (!phaseObj) return;
            closeAllExcept(phaseObj);
            setOpen(phaseObj, true);
        }

        function openFromHash() {
            var hash = window.location.hash || '';
            if (!hash) return;
            var phaseMatch = hash.match(/^#phase([1-6])$/);
            if (phaseMatch) {
                var phaseNum = parseInt(phaseMatch[1], 10);
                var target = document.getElementById('phase' + phaseNum);
                if (target) {
                    var phaseObj = getPhaseObjByNumber(phaseNum);
                    if (phaseObj) {
                        closeAllExcept(phaseObj);
                        setOpen(phaseObj, true);
                        setActiveHeaderPhase(phaseNum);
                        setTimeout(function() {
                            try { target.scrollIntoView({ block: 'start' }); } catch (_) { /* ignore */ }
                        }, 0);
                    }
                }
                return;
            }
            var el = document.getElementById(hash.slice(1));
            if (el) {
                openPhaseForElement(el);
                setTimeout(function() {
                    try { el.scrollIntoView({ block: 'start' }); } catch (_) { /* ignore */ }
                }, 0);
            }
        }

        window.addEventListener('hashchange', openFromHash);
        openFromHash();
    }

    // ===== PAID PDF GUIDES (config/sot.json) =====
    // Fallback pages MUST match files under /assets/pdf-covers/*-p{N}.png (see config/sot.json
    // previewPages). Legacy [2,3,4] placeholders were removed — using them caused 404 previews.
    var PDF_PREVIEW_FALLBACK_PAGES = {
        beginner: [6, 8, 9],
        advanced: [10, 15, 17]
    };
    var PDF_PREVIEW_DEFS = {
        beginner: {
            title: 'Sample pages — Beginner HR Hiring Guide',
            altPrefix: 'Beginner guide',
            pages: PDF_PREVIEW_FALLBACK_PAGES.beginner.slice()
        },
        advanced: {
            title: 'Sample pages — Advanced HR Hiring Guide',
            altPrefix: 'Advanced guide',
            pages: PDF_PREVIEW_FALLBACK_PAGES.advanced.slice()
        }
    };
    var cachedSotConfig = null;
    var pdfGuidesRuntimeReady = false;
    var pdfPreviewPendingOpen = null;

    function trackEvent(name, props) {
        var safeProps = props || {};
        if (typeof window.plausible === 'function') {
            try { window.plausible(name, { props: safeProps }); } catch (_e) { /* ignore */ }
        }
        if (typeof window.va === 'function') {
            try { window.va('event', Object.assign({ name: name }, safeProps)); } catch (_e) { /* ignore */ }
        }
    }

    function bindAnalyticsClickables(root) {
        if (!root) return;
        root.querySelectorAll('[data-analytics]').forEach(function(el) {
            el.addEventListener('click', function() {
                trackEvent(el.getAttribute('data-analytics'), {
                    product: el.getAttribute('data-product') || el.getAttribute('data-preview-trigger') || ''
                });
            });
        });
    }

    function escapeHtmlText(text) {
        return String(text == null ? '' : text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * DS v0.3.3 Phase B: single "See inside" affordance per PDF guide card.
     * Replaces the legacy split between initPdfGuideTocs (chapters) and
     * initPdfGuideHighlights (3 bullet list). Populates, in one pass per card:
     *   - [data-see-inside-thumbs] : N thumbnail <button>s, each one a
     *     [data-preview-trigger] that delegates to the existing modal preview
     *     dialog (initPdfPreviewDialog binds these via querySelectorAll, so
     *     this function MUST run BEFORE initPdfPreviewDialog in init()).
     *   - [data-toc-list]          : chapter <li>s
     *   - [data-see-inside-meta]   : "{N} pages + {M} chapters" summary text
     */
    function initPdfSeeInside(config) {
        if (!config || !config.pdfGuides || typeof config.pdfGuides !== 'object') return;
        document.querySelectorAll('[data-see-inside]').forEach(function(root) {
            var key = root.getAttribute('data-see-inside');
            var def = config.pdfGuides[key];
            if (!def) return;
            var thumbsEl = root.querySelector('[data-see-inside-thumbs="' + key + '"]');
            var pages = Array.isArray(def.previewPages) ? def.previewPages : [];
            if (thumbsEl) {
                var thumbsHtml = '';
                for (var i = 0; i < pages.length; i += 1) {
                    var pageNum = pages[i];
                    var altText = escapeHtmlText((def.title || key) + ' sample page ' + pageNum);
                    var ariaText = escapeHtmlText('Preview sample page ' + pageNum);
                    thumbsHtml += '<li><button type="button" class="pdf-see-inside__thumb" data-preview-trigger="' + escapeHtmlText(key) + '" data-analytics="pdf_preview_open" aria-label="' + ariaText + '">'
                        + '<img src="/assets/pdf-covers/' + escapeHtmlText(key) + '-p' + pageNum + '.png" alt="' + altText + '" loading="lazy" decoding="async" width="734" height="950">'
                        + '<span class="pdf-see-inside__thumb-label" aria-hidden="true">p.' + pageNum + '</span>'
                        + '</button></li>';
                }
                thumbsEl.innerHTML = thumbsHtml;
            }
            var chapters = Array.isArray(def.chapters) ? def.chapters : [];
            var listEl = root.querySelector('[data-toc-list="' + key + '"]');
            if (listEl) {
                var chaptersHtml = '';
                for (var j = 0; j < chapters.length; j += 1) {
                    chaptersHtml += '<li>' + escapeHtmlText(chapters[j]) + '</li>';
                }
                listEl.innerHTML = chaptersHtml;
            }
            var metaEl = root.querySelector('[data-see-inside-meta="' + key + '"]');
            if (metaEl) {
                metaEl.textContent = pages.length + ' pages + ' + chapters.length + ' chapters';
            }
            var countEl = document.querySelector('[data-toc-count="' + key + '"]');
            if (countEl) countEl.textContent = chapters.length + ' sections';
        });
    }

    function linkifyContactEmail(text, email) {
        if (!text) return '';
        var safeText = escapeHtmlText(text);
        if (!email) return safeText;
        var safeEmail = escapeHtmlText(email);
        var parts = safeText.split(safeEmail);
        if (parts.length === 1) return safeText;
        return parts.join('<a href="mailto:' + safeEmail + '">' + safeEmail + '</a>');
    }

    function initStripeLinks(config) {
        if (!config || !config.pdfGuides) return;
        ['beginner', 'advanced', 'bundle'].forEach(function(key) {
            var def = config.pdfGuides[key];
            if (!def || !def.stripePaymentLink || def.stripePaymentLink.indexOf('REPLACE_') !== -1) return;
            document.querySelectorAll('a[data-product="' + def.id + '"]').forEach(function(anchor) {
                anchor.setAttribute('href', def.stripePaymentLink);
            });
        });
        var bundleOffer = document.querySelector('[data-bundle-offer]');
        var bundleDef = config.pdfGuides.bundle;
        if (bundleOffer && bundleDef && bundleDef.stripePaymentLink && bundleDef.stripePaymentLink.indexOf('REPLACE_') === -1) {
            bundleOffer.hidden = false;
            var priceEl = bundleOffer.querySelector('[data-bundle-price]');
            var wasEl = bundleOffer.querySelector('[data-bundle-price-was]');
            var savingsEl = bundleOffer.querySelector('[data-bundle-savings]');
            var price = bundleDef.price != null ? Number(bundleDef.price) : NaN;
            var was = bundleDef.priceWas != null ? Number(bundleDef.priceWas) : NaN;
            if (priceEl && !isNaN(price)) priceEl.textContent = '$' + price.toFixed(2);
            if (wasEl && !isNaN(was)) wasEl.textContent = '$' + was.toFixed(2);
            if (savingsEl && !isNaN(price) && !isNaN(was) && was > price) {
                savingsEl.textContent = 'Save $' + (was - price).toFixed(2);
            }
        }
    }

    /**
     * Fill text-only highlight lists from SOT (`pdfGuides.*.highlights`).
     * Per-guide cards (beginner/advanced) + bundle (#pdf-bundle-offer).
     * Image proof stays behind See inside / sample PDF triggers (Phase D).
     */
    function initPdfGuideHighlights(config) {
        if (!config || !config.pdfGuides) return;
        document.querySelectorAll('[data-guide-highlights]').forEach(function(list) {
            var key = list.getAttribute('data-guide-highlights');
            var def = config.pdfGuides[key];
            if (!def || !Array.isArray(def.highlights)) return;
            var html = '';
            for (var i = 0; i < def.highlights.length; i += 1) {
                html += '<li>' + escapeHtmlText(def.highlights[i]) + '</li>';
            }
            list.innerHTML = html;
        });
    }

    function initSamplePdfLinks(config) {
        if (!config || !config.pdfGuides) return;
        document.querySelectorAll('[data-sample-link]').forEach(function(anchor) {
            var key = anchor.getAttribute('data-sample-link');
            var def = config.pdfGuides[key];
            if (def && def.samplePdfUrl) anchor.setAttribute('href', def.samplePdfUrl);
        });
    }

    function applyPreviewPagesFromConfig(config) {
        ['beginner', 'advanced'].forEach(function(key) {
            var guideDef = config && config.pdfGuides && config.pdfGuides[key];
            if (guideDef && Array.isArray(guideDef.previewPages) && guideDef.previewPages.length) {
                PDF_PREVIEW_DEFS[key].pages = guideDef.previewPages.slice();
            } else {
                PDF_PREVIEW_DEFS[key].pages = PDF_PREVIEW_FALLBACK_PAGES[key].slice();
            }
        });
    }

    function initPdfStickyCta() {
        var bar = document.getElementById('pdfStickyCta');
        var pdfSection = document.getElementById('pdf-guides');
        var hero = document.querySelector('.header');
        if (!bar || !pdfSection) return;

        var heroVisible = true;
        var pdfSectionVisible = false;

        function syncStickyBodyClass() {
            document.body.classList.toggle('has-pdf-sticky-cta', !bar.hidden);
        }

        function updateBar() {
            bar.hidden = heroVisible || pdfSectionVisible;
            syncStickyBodyClass();
        }

        if (typeof window.IntersectionObserver === 'function') {
            var heroObserver = new IntersectionObserver(function(entries) {
                for (var i = 0; i < entries.length; i += 1) {
                    heroVisible = entries[i].isIntersecting;
                }
                updateBar();
            }, { threshold: 0 });
            if (hero) heroObserver.observe(hero);

            var pdfObserver = new IntersectionObserver(function(entries) {
                for (var i = 0; i < entries.length; i += 1) {
                    pdfSectionVisible = entries[i].intersectionRatio >= 0.5;
                }
                updateBar();
            }, { threshold: [0, 0.5, 1] });
            pdfObserver.observe(pdfSection);

            updateBar();
            return;
        }

        function updateBarFallback() {
            var heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
            var pdfTop = pdfSection.getBoundingClientRect().top;
            var show = heroBottom < 0 && pdfTop > window.innerHeight * 0.35;
            bar.hidden = !show;
            syncStickyBodyClass();
        }

        updateBarFallback();
        window.addEventListener('scroll', updateBarFallback, { passive: true });
        window.addEventListener('resize', updateBarFallback, { passive: true });
    }

    function initBuyerFaq(config) {
        if (!config || !Array.isArray(config.buyerFaq)) return;
        var list = document.querySelector('[data-buyer-faq-list]');
        if (!list) return;
        // Build-time pre-render: skip re-render if list already has FAQ entries.
        if (list.querySelector('.faq-details')) return;
        var contactEmail = config.product && config.product.contactEmail;
        var html = '';
        for (var i = 0; i < config.buyerFaq.length; i += 1) {
            var item = config.buyerFaq[i];
            if (!item || !item.q || !item.a) continue;
            var detailsId = item.id ? ' id="' + escapeHtmlText(item.id) + '"' : '';
            html += '<details class="faq-details"' + detailsId + '>' +
                '<summary class="faq-summary">' + escapeHtmlText(item.q) + '</summary>' +
                '<div class="faq-panel">' + linkifyContactEmail(item.a, contactEmail) + '</div>' +
                '</details>';
        }
        list.innerHTML = html;
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function initPdfPreviewDialog() {
        var dialog = document.getElementById('pdfPreviewDialog');
        if (!dialog || typeof dialog.showModal !== 'function') return;
        var titleEl = document.getElementById('pdfPreviewTitle');
        var pagesEl = document.getElementById('pdfPreviewPages');
        var closeBtn = document.getElementById('pdfPreviewClose');
        var backLink = document.getElementById('pdfPreviewBack');
        if (!titleEl || !pagesEl || !closeBtn) return;

        var lastTrigger = null;

        function renderPages(productKey) {
            applyPreviewPagesFromConfig(cachedSotConfig);
            var def = PDF_PREVIEW_DEFS[productKey];
            if (!def) return false;
            titleEl.textContent = def.title;
            if (!def.pages.length) {
                pagesEl.innerHTML =
                    '<p class="pdf-preview-error" role="alert">Preview pages are not available right now. ' +
                    'Try again in a moment or download the 1-page sample PDF from the card. ' +
                    '<a href="#pdf-guides" class="pdf-preview-back">Back to guides</a></p>';
                return true;
            }
            var html = '';
            for (var i = 0; i < def.pages.length; i += 1) {
                var pageNum = def.pages[i];
                html += '<figure><img src="/assets/pdf-covers/' + productKey + '-p' + pageNum + '.png" width="734" height="950" alt="' +
                    escapeHtmlText(def.altPrefix + ' sample page ' + pageNum) + '" loading="lazy" decoding="async">' +
                    '<figcaption>Page ' + pageNum + '</figcaption></figure>';
            }
            pagesEl.innerHTML = html;
            return true;
        }

        function openFor(triggerEl) {
            if (!triggerEl) return;
            var productKey = triggerEl.getAttribute('data-preview-trigger');
            if (!PDF_PREVIEW_DEFS[productKey]) return;
            if (!renderPages(productKey)) return;
            lastTrigger = triggerEl;
            dialog.showModal();
            window.requestAnimationFrame(function() {
                if (typeof closeBtn.focus === 'function') closeBtn.focus();
            });
        }

        function closeDialog() {
            if (dialog.open) dialog.close();
        }

        function flushPendingPreviewOpen() {
            if (!pdfPreviewPendingOpen) return;
            var pending = pdfPreviewPendingOpen;
            pdfPreviewPendingOpen = null;
            openFor(pending);
        }

        // Delegation: works for static "Open all pages" links and See-inside thumbs
        // injected after fetch; avoids race if user clicks before SOT resolves.
        document.addEventListener('click', function(event) {
            var triggerEl = event.target.closest('[data-preview-trigger]');
            if (!triggerEl) return;
            var pdfRoot = document.getElementById('pdf-guides');
            if (!pdfRoot || !pdfRoot.contains(triggerEl)) return;
            event.preventDefault();
            if (!pdfGuidesRuntimeReady) {
                pdfPreviewPendingOpen = triggerEl;
                return;
            }
            openFor(triggerEl);
        });

        dialog._flushPendingPreviewOpen = flushPendingPreviewOpen;

        closeBtn.addEventListener('click', closeDialog);
        if (backLink) backLink.addEventListener('click', closeDialog);
        dialog.addEventListener('click', function(event) {
            var rect = dialog.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
                closeDialog();
            }
        });
        dialog.addEventListener('close', function() {
            if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
            lastTrigger = null;
            pagesEl.innerHTML = '';
        });
    }

    function loadSotConfig() {
        if (!document.getElementById('pdf-guides')) {
            return Promise.resolve(null);
        }
        return fetch('/config/sot.json', { cache: 'no-store' })
            .then(function(res) {
                if (!res.ok) throw new Error('sot.json HTTP ' + res.status);
                return res.json();
            })
            .catch(function(err) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn(
                        '[Prompt Anatomy] config/sot.json failed to load; PDF preview uses on-disk fallback pages.',
                        err && err.message ? err.message : err
                    );
                }
                return null;
            });
    }

    // ===== INICIALIZACIJA =====
    function init() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
        setupPhaseAccordion();
        var codeBlocks = document.querySelectorAll('.code-block');
        codeBlocks.forEach(function(block) {
            if (!block.hasAttribute('tabindex')) block.setAttribute('tabindex', '0');
        });
        bindDelegatedPromptInteractions();
        loadPromptDoneState();
        document.querySelectorAll('.prompt-done').forEach(function(cb) {
            cb.addEventListener('change', function() {
                var id = cb.getAttribute('data-prompt-id');
                if (id) savePromptDoneState(id, cb.checked);
                updateProgressIndicator();
            });
        });
        updateProgressIndicator();

        if (document.getElementById('pdf-guides')) {
            initPdfPreviewDialog();
        }

        loadSotConfig().then(function(config) {
            cachedSotConfig = config;
            applyPreviewPagesFromConfig(config);
            initPdfSeeInside(config);
            initPdfGuideHighlights(config);
            initSamplePdfLinks(config);
            initStripeLinks(config);
            initBuyerFaq(config);
            initPdfStickyCta();
            pdfGuidesRuntimeReady = true;
            var dialog = document.getElementById('pdfPreviewDialog');
            if (dialog && typeof dialog._flushPendingPreviewOpen === 'function') {
                dialog._flushPendingPreviewOpen();
            }
            var pdfRoot = document.getElementById('pdf-guides');
            bindAnalyticsClickables(pdfRoot);
            bindAnalyticsClickables(document.getElementById('pdfStickyCta'));
            bindAnalyticsClickables(document.querySelector('.footer'));
            bindAnalyticsClickables(document.querySelector('.prompt-spoke-card'));
            bindAnalyticsClickables(document.querySelector('.prompt-spoke-ctas'));
            var heroPdf = document.querySelector('.header a[href="#pdf-guides"]');
            if (heroPdf) {
                heroPdf.addEventListener('click', function() {
                    trackEvent('hero_pdf_cta', {});
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
