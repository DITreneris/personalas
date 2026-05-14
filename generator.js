/**
 * DI Promptų Biblioteka – shared LT/en-US behavior
 * Locale is detected from <html lang> (build sets lt/en-US). The language switcher navigates to /lt/ or /en/ with the current hash.
 */
(function() {
    'use strict';

    // ===== LOCALE =====
    var rawLocale = (document.documentElement && document.documentElement.getAttribute('lang')) || 'lt';
    var locale = rawLocale.toLowerCase().indexOf('en') === 0 ? 'en-US' : 'lt';
    var LANG_KEY = 'di_prompt_lib_lang';

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
    var copyTimeout = null;
    var isCopying = false;

    function debounce(func, delay) {
        return function() {
            var args = arguments;
            clearTimeout(copyTimeout);
            copyTimeout = setTimeout(function() { func.apply(this, args); }.bind(this), delay);
        };
    }

    function selectText(element) {
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

    function handleCodeBlockKeydown(event, element) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectText(element);
            var promptId = element.querySelector('pre') ? element.querySelector('pre').id : null;
            if (promptId) {
                var button = element.closest('.prompt') ? element.closest('.prompt').querySelector('.btn') : null;
                if (button) {
                    setTimeout(function() { copyPrompt(button, promptId); }, 300);
                }
            }
        }
    }

    function copyPrompt(button, promptId) {
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

    // ===== GLOBAL (HTML onclick/onkeydown) =====
    window.selectText = debounce(selectText, CONFIG.DEBOUNCE_DELAY);
    window.copyPrompt = debounce(copyPrompt, CONFIG.DEBOUNCE_DELAY);
    window.handleCodeBlockKeydown = handleCodeBlockKeydown;

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            var toast = document.getElementById('toast');
            if (toast) toast.classList.remove('show');
        }
    });

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
                : uiText('Sistema: ' + phaseCount + ' / 6 fazės', 'System: ' + phaseCount + ' / 6 phases');
        }
        if (fillEl) fillEl.style.width = (phaseCount / 6 * 100) + '%';
        if (barEl) {
            barEl.setAttribute('aria-valuenow', phaseCount);
            barEl.setAttribute('aria-valuemax', 6);
            barEl.setAttribute('aria-label', uiText('Progresas: ' + phaseCount + ' iš 6 fazių', 'Progress: ' + phaseCount + ' of 6 phases'));
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
                if (btnPhase === phaseNum) btn.classList.add('is-active');
                else btn.classList.remove('is-active');
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
                try { phaseObj.section.scrollIntoView({ block: 'start' }); } catch (_) { /* ignore */ }
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

    // ===== KALBOS PERJUNGIKLIS =====
    function setupLanguageSwitcher() {
        var basePath = (typeof window.BASE_PATH !== 'undefined' && window.BASE_PATH) ? window.BASE_PATH : '';
        if (basePath && basePath.indexOf('/') !== basePath.length - 1) basePath += '/';

        var langLt = document.getElementById('langLtBtn');
        var langEn = document.getElementById('langEnBtn');
        if (langLt) {
            langLt.setAttribute('aria-label', uiText('Perjungti į lietuvių kalbą', 'Switch to Lithuanian'));
            if (locale === 'lt') langLt.classList.add('is-active');
            langLt.addEventListener('click', function() {
                try { localStorage.setItem(LANG_KEY, 'lt'); } catch (_) { /* ignore */ }
                window.location.href = basePath + 'lt/' + (window.location.hash || '');
            });
        }
        if (langEn) {
            langEn.setAttribute('aria-label', uiText('Perjungti į anglų kalbą', 'Switch to English'));
            if (locale === 'en-US') langEn.classList.add('is-active');
            langEn.addEventListener('click', function() {
                try { localStorage.setItem(LANG_KEY, 'en-US'); } catch (_) { /* ignore */ }
                window.location.href = basePath + 'en/' + (window.location.hash || '');
            });
        }
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
        loadPromptDoneState();
        document.querySelectorAll('.prompt-done').forEach(function(cb) {
            cb.addEventListener('change', function() {
                var id = cb.getAttribute('data-prompt-id');
                if (id) savePromptDoneState(id, cb.checked);
                updateProgressIndicator();
            });
        });
        updateProgressIndicator();
        setupLanguageSwitcher();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
