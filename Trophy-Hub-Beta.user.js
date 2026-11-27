// ==UserScript==
// @name         Trophy Hub Beta
// @namespace    trophydeck.local
// @updateURL    https://raw.githubusercontent.com/radze90/psnp-trophy-hub-beta/main/Trophy-Hub-Beta.user.js
// @downloadURL  https://raw.githubusercontent.com/radze90/psnp-trophy-hub-beta/main/Trophy-Hub-Beta.user.js
// @version      1.0.47
// @description  Enhancements for PSNProfiles and PSNP+
// @match        https://psnprofiles.com/*
// @run-at       document-start
// @noframes
// @grant        none
// @require      https://raw.githubusercontent.com/radze90/psnp-trophy-hub-beta/main/locales/de.js
// @require      https://raw.githubusercontent.com/radze90/psnp-trophy-hub-beta/main/locales/en.js
// ==/UserScript==

(function () {
    'use strict';

// Translation catalogs are loaded separately by Tampermonkey using @require.
const translations = {"de": __trophyDeckLocale_de, "en": __trophyDeckLocale_en};
const languageOptions = [["de","Deutsch"],["en","English"]];
const APP_VERSION = "1.0.47";

function getLanguage() {
    const saved = localStorage.getItem('trophydeck.language');
    if (Object.prototype.hasOwnProperty.call(translations, saved)) return saved;
    const browserLanguages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const value of browserLanguages) {
        const language = String(value || '').toLowerCase().split('-')[0];
        if (Object.prototype.hasOwnProperty.call(translations, language)) return language;
    }
    return 'en';
}

function t(key) {
    const catalog = translations[getLanguage()];
    return Object.prototype.hasOwnProperty.call(catalog, key) ? catalog[key] : key;
}


for (let i = localStorage.length - 1; i >= 0; i--) {
    const oldKey = localStorage.key(i);
    if (oldKey && oldKey.startsWith('psnpepic.')) {
        const newKey = 'trophydeck.' + oldKey.slice('psnpepic.'.length);
        if (localStorage.getItem(newKey) === null) {
            localStorage.setItem(newKey, localStorage.getItem(oldKey));
        }
    }
}

const features = [
    { key: 'trophydeck.hidePsnpVersion', label: t('Hide PSNP+ version label'), defaultValue: false },
    { key: 'trophydeck.hideFlaggedBox', label: t("Hide flagged notice"), defaultValue: true },
    { key: 'trophydeck.showRail', label: t("Show Trophy Deck"), defaultValue: true },
    { key: 'trophydeck.showAccountLinks', label: t('Account shortcuts in the deck'), defaultValue: true },
    { key: 'trophydeck.showStats', label: t("Progress in the deck"), defaultValue: true },
    { key: 'trophydeck.showLinks', label: t("Quick filters in the deck"), defaultValue: true },
    { key: 'trophydeck.showNote', label: t("Profile note in the deck"), defaultValue: true },
    { key: 'trophydeck.favorites', label: t("Favorite players in the deck"), defaultValue: true },
    { key: 'trophydeck.cabinet', label: t("Show game cabinet"), defaultValue: true },
    { key: 'trophydeck.cabinetNames', label: t("Show game names in cabinet"), defaultValue: false },
    { key: 'trophydeck.scrollButtons', label: t("Show scroll-to-bottom button"), defaultValue: true },
    { key: 'trophydeck.globalNote', label: t("Global note in the deck"), defaultValue: true },
    { key: 'trophydeck.gameNotes', label: t("Show notes below games"), defaultValue: true },
    { key: 'trophydeck.stickyNav', label: t("Keep profile navigation visible when scrolling"), defaultValue: true },
    { key: 'trophydeck.customLinks', label: t("Custom links in the deck"), defaultValue: true },
    { key: 'trophydeck.noteWrap', label: t("Wrap game notes"), defaultValue: true },
    { key: 'trophydeck.psnpColors', label: t("Apply theme to PSNProfiles"), defaultValue: false },
    { key: 'trophydeck.analytics', label: t("Count anonymous usage locally"), defaultValue: true }
];

const removed = new Map();

let railOpen = localStorage.getItem('trophydeck.railOpen') !== 'false';

function enabled(key) {
    const value = localStorage.getItem(key);
    const feature = features.find(item => item.key === key);
    return value === null ? feature.defaultValue : value === 'true';
}

const themes = {
    'Blau':['#192b40','#223b55','#315c89'], 'Ozean':['#102d47','#183e5a','#28678b'],
    'Mitternacht':['#171e30','#232c43','#455c95'], 'Indigo':['#24283f','#333a58','#5867a0'],
    'Petrol':['#15363b','#204a50','#28747a'], 'Türkis':['#163432','#224946','#387d76'],
    'Grün':['#203726','#294b32','#3d764d'], 'Wald':['#172e27','#214438','#39715a'],
    'Violett':['#30263e','#403250','#704f8f'], 'Pflaume':['#352337','#4b3150','#805187'],
    'GTA VI Sunset':['#302235','#503149','#bd5488'], 'Bordeaux':['#3c222a','#512e37','#8b465c'],
    'Kirschrot':['#392127','#522d35','#934353'], 'Kupfer':['#3d2b21','#50382b','#916341'],
    'Bernstein':['#392c1b','#503d27','#8c6332'], 'Schiefer':['#292f37','#39414a','#607488'],
    'Graphit':['#25292e','#383d44','#626b76']
};

const defaultCustomTheme = ['#192b40', '#223b55', '#315c89'];
function readCustomTheme() {
    try {
        const colors = JSON.parse(localStorage.getItem('trophydeck.customTheme') || 'null');
        if (Array.isArray(colors) && colors.length === 3 && colors.every(color => /^#[0-9a-f]{6}$/i.test(color))) return colors;
    } catch (_) {}
    return [...defaultCustomTheme];
}
themes.Custom = readCustomTheme();

function applyTheme() {
    const name = localStorage.getItem('trophydeck.theme') || 'Blau';
    const [base, card, accent] = themes[name] || themes.Blau;
    document.documentElement.style.setProperty('--td-base', base);
    document.documentElement.style.setProperty('--td-card', card);
    document.documentElement.style.setProperty('--td-accent', accent);
    document.documentElement.classList.toggle('td-hide-psnp-version', enabled('trophydeck.hidePsnpVersion'));
    document.documentElement.classList.toggle('trophydeck-psnp-colors', enabled('trophydeck.psnpColors'));
}

function logEvent(event) {
    if (!enabled('trophydeck.analytics')) {
        return;
    }
    let counts = {};
    try {
        counts = JSON.parse(localStorage.getItem('trophydeck.usage') || '{}');
    } catch (_) {}
    counts[event] = (Number(counts[event]) || 0) + 1;
    localStorage.setItem('trophydeck.usage', JSON.stringify(counts));
}

function exportUsage() {
    const counts = JSON.parse(localStorage.getItem('trophydeck.usage') || '{}');
    const settings = Object.fromEntries(features.filter(f => f.key !== 'trophydeck.analytics').map(f => [f.key.replace('trophydeck.', ''), enabled(f.key)]));
    const appearance={theme:localStorage.getItem('trophydeck.theme')||'Blau',side:localStorage.getItem('trophydeck.side')||'right',mode:localStorage.getItem('trophydeck.positionMode')||'follow',width:railWidth(),heightPercent:Number(localStorage.getItem('trophydeck.panelHeight')||72)};
    const blob = new Blob([JSON.stringify({ version:'Beta '+APP_VERSION, counters:counts, settings, appearance }, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url;
    a.download = 'trophy-hub-nutzung.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function make(tag, text, className) {
    const element = document.createElement(tag);
    if (text != null) {
        element.textContent = text;
    }
    if (className) {
        element.className = className;
    }
    return element;
}

function updateFlagged() {
    document.querySelectorAll('div.sidebar div.title h3').forEach(heading => {
            if (heading.textContent.trim() !== 'Flagged for leaderboard removal') {
                return;
            }
            const title = heading.closest('div.title');
            const box = title.nextElementSibling;
            if (!box || !box.matches('div.box')) {
                return;
            }
            [title, box].forEach(element => {
                    if (!removed.has(element)) {
                        removed.set(element, document.createComment('Trophy Deck'));
                    }
                });
        });
    removed.forEach((placeholder, element) => {
            if (enabled('trophydeck.hideFlaggedBox') && element.parentNode) {
                element.replaceWith(placeholder);
            }
            else if (!enabled('trophydeck.hideFlaggedBox') && placeholder.parentNode) {
                placeholder.replaceWith(element);
            }
        });
}

function toggleControl(feature) {
    const label = make('label', null, 'epic-toggle');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = enabled(feature.key);
    input.addEventListener('change', () => {
            localStorage.setItem(feature.key, String(input.checked));
            logEvent('setting.' + feature.key.replace('trophydeck.', ''));
            applyTheme();
            updateFlagged();
            renderRail();
            updateGameNotes(true);
            updateStickyNav();
            updateGameCabinet();
            setupScrollControls();
            document.querySelectorAll('[data-epic-toggle]').forEach(other => {
                    if (other.dataset.epicToggle === feature.key) {
                        other.checked = input.checked;
                    }
                });
        });
    input.dataset.epicToggle = feature.key;
    const copy=make('span');
    copy.append(make('span',feature.label));
    const descriptions={hidePsnpVersion:t('Hides the PSNP+ version below the site logo.'),showAccountLinks:t('Links to your own profile and account pages.'),hideFlaggedBox:t("Hides the leaderboard notice on profile pages."),showRail:t("Shows Trophy Deck as a collapsible sidebar."),showStats:t("Calculates additional profile statistics."),showLinks:t("Provides preset views of the game list."),showNote:t("A note for the profile currently displayed."),globalNote:t("The same note on every page."),favorites:t("Saves profile links as favorites."),cabinet:t("Use the star in the profile game list to save games to the cabinet."),cabinetNames:t("Shows shortened game names below covers."),scrollButtons:t("Adds a scroll-to-bottom button next to the scroll-to-top button."),customLinks:t("Manage your own links and categories."),gameNotes:t("Shows the same game note across profiles on this browser."),noteWrap:t("Displays long game notes over multiple lines."),stickyNav:t("Keeps the profile navigation with Profile, Trophy Log and Stats visible while scrolling."),psnpColors:t("Applies the selected theme to page headers and dialogs."),analytics:t("Counts selected actions locally; nothing is sent automatically.")};
    const desc=descriptions[feature.key.replace('trophydeck.','')];
    if(desc){
        copy.append(make('small',desc,'td-setting-description'));
    }
    label.append(input,copy);
    return label;
}

function prepareDialog(dialog) {
    const close=make('button','×','td-dialog-close');
    close.type='button';
    close.setAttribute('aria-label',t("Close window"));
    close.addEventListener('click',()=>dialog.close());
    const heading=dialog.querySelector('h2');
    if(heading){
        heading.append(close);
    }else {
        dialog.prepend(close);
    }
    if (heading) {
        const scrollBody = make('div', null, 'td-dialog-scroll');
        Array.from(dialog.children).forEach(child => { if (child !== heading) scrollBody.append(child); });
        dialog.append(scrollBody);
        dialog.classList.add('td-scroll-dialog');
    }
    dialog.addEventListener('click',event=>{
            if(event.target!==dialog){
                return;
            }const r=dialog.getBoundingClientRect();
            if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){
                dialog.close();
            }
        });
}

function exportData() {
    const data={};
    for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);
        if(key&&key.startsWith('trophydeck.')){
            data[key]=localStorage.getItem(key);
        }
    }
    const url=URL.createObjectURL(new Blob([JSON.stringify({format:'Trophy Deck',version:1,appVersion:APP_VERSION,data},null,2)],{type:'application/json'}));
    const a=make('a');
    a.href=url;
    a.download='trophy-hub-daten.json';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    logEvent('export.all');
}

function parseBackup(text) {
    let backup;
    try {
        backup=JSON.parse(text);
    } catch (_) {
        throw new Error(t("The file does not contain valid JSON."));
    }
    if (!backup || typeof backup!=='object' || Array.isArray(backup) || backup.format!=='Trophy Deck') {
        throw new Error(t("This is not a Trophy Deck backup."));
    }
    if (backup.version!==1) {
        throw new Error(t("This backup format is not supported by this version. Please update Trophy Deck."));
    }
    if (!backup.data || typeof backup.data!=='object' || Array.isArray(backup.data)) {
        throw new Error(t("The backup data is missing or invalid."));
    }
    const entries=[];
    const seen=new Set();
    for (const [key,value] of Object.entries(backup.data)) {
        if ((!key.startsWith('trophydeck.') && !key.startsWith('psnpepic.')) || key.length>512 || typeof value!=='string') {
            throw new Error(t("The backup contains invalid or unrelated data."));
        }
        const normalized=key.startsWith('psnpepic.') ? 'trophydeck.'+key.slice('psnpepic.'.length) : key;
        if(seen.has(normalized)) {
            throw new Error(t("The backup contains conflicting duplicate entries."));
        }
        seen.add(normalized);
        entries.push([normalized,value]);
    }
    return entries;
}

function storedDeckEntries() {
    const entries=[];
    for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);
        if(key && (key.startsWith('trophydeck.') || key.startsWith('psnpepic.'))) {
            entries.push([key,localStorage.getItem(key)]);
        }
    }
    return entries;
}

function restoreBackup(entries) {
    const previous=storedDeckEntries();
    try {
        previous.forEach(([key])=>localStorage.removeItem(key));
        entries.forEach(([key,value])=>localStorage.setItem(key,value));
    } catch (error) {
        let restored=true;
        try {
            storedDeckEntries().forEach(([key])=>localStorage.removeItem(key));
            previous.forEach(([key,value])=>localStorage.setItem(key,value));
        } catch (_) {
            restored=false;
        }
        throw new Error(restored ? t("Import failed, possibly due to insufficient storage. Your previous data was restored.") : t("Import and automatic recovery failed. Please use your previous backup."));
    }
}

async function importBackup(file) {
    if(!file){
        return;
    }
    if(file.size>5*1024*1024){
        await tdDialog(t("Backup too large"),[],t("The file must not exceed 5 MB."));
        return;
    }
    let entries;
    try {
        entries=parseBackup(await file.text());
    }
    catch(error){
        await tdDialog(t("Backup not imported"),[],error.message || t("The file could not be read."));
        return;
    }
    const confirmed=await tdDialog(t("Restore backup"),[],entries.length+t(" saved entries found. Restoring will replace existing Trophy Deck settings, notes, links, favorites and cabinet data. PSNP+ will not be changed. Continue?"));
    if(!confirmed){
        return;
    }
    try {
        restoreBackup(entries);
    }
    catch(error){
        await tdDialog(t("Backup not imported"),[],error.message);
        return;
    }
    await tdDialog(t("Backup restored"),[],t("The data was imported. The page will now reload."));
    location.reload();
}


const themeLabels = {
    "Custom": "Custom",
    "Blau": "Blue",
    "Ozean": "Ocean",
    "Mitternacht": "Midnight",
    "Indigo": "Indigo",
    "Petrol": "Teal",
    "Türkis": "Turquoise",
    "Grün": "Green",
    "Wald": "Forest",
    "Violett": "Violet",
    "Pflaume": "Plum",
    "GTA VI Sunset": "GTA VI Sunset",
    "Bordeaux": "Burgundy",
    "Kirschrot": "Cherry red",
    "Kupfer": "Copper",
    "Bernstein": "Amber",
    "Schiefer": "Slate",
    "Graphit": "Graphite"
};

function translateThemeName(name) { return t(themeLabels[name] || name); }

function openSettings() {
    if (document.getElementById('trophydeck-settings')) {
        return;
    }
    const dialog = make('dialog');
    dialog.id = 'trophydeck-settings';
    dialog.append(make('h2', t("TROPHY DECK · SETTINGS")));
    const viewportHeader=make('p','','epic-muted');
    dialog.append(viewportHeader);
    // IDs remain stable when the display language changes.
    const categories = [
        ['language', 'Language', []],
        ['profile', "Profile page", ['stickyNav', 'hideFlaggedBox', 'scrollButtons', 'hidePsnpVersion']],
        ['deck', 'Trophy Deck', ['showRail']],
        ['blocks', "Deck sections", ['showAccountLinks', 'showStats', 'showLinks', 'showNote', 'globalNote', 'customLinks', 'favorites', 'cabinet', 'cabinetNames']],
        ['notes', "Game notes", ['gameNotes', 'noteWrap']],
        ['colors', "Colors", ['psnpColors']],
        ['analytics', "Usage statistics", ['analytics']],
        ['backup', 'Backup', []],
        ['maintenance', 'Maintenance', []],
    ];
    const sections = {};
    categories.forEach(([id, name, keys]) => {
        const section = make('details', null, 'td-settings-section');
        section.open = true;
        sections[id] = section;
        section.append(make('summary', t(name), 'epic-setting-heading'));
        features
            .filter(feature => keys.includes(feature.key.replace('trophydeck.', '')))
            .forEach(feature => section.append(toggleControl(feature)));
        dialog.append(section);
    });

    const pagePositionLabel = make('label', t('Page position: '), 'epic-width');
    const pagePositionValue = make('span');
    const pagePosition = make('input');
    pagePosition.type = 'range';
    pagePosition.min = '-100';
    pagePosition.max = '100';
    pagePosition.step = '5';
    pagePosition.value = localStorage.getItem('trophydeck.pagePosition') || '0';
    pagePosition.setAttribute('aria-label', t('Page position'));
    function updatePagePositionValue() {
        const value = Number(pagePosition.value);
        pagePositionValue.textContent = value === 0 ? t('Centered') : Math.abs(value) + '% ' + t(value < 0 ? 'left' : 'right');
    }
    pagePosition.addEventListener('input', () => {
        localStorage.setItem('trophydeck.pagePosition', pagePosition.value);
        updatePagePositionValue();
        applyPagePosition();
        window.dispatchEvent(new Event('scroll'));
    });
    pagePosition.addEventListener('change', () => logEvent('setting.pagePosition'));
    updatePagePositionValue();
    pagePositionLabel.append(pagePositionValue, pagePosition);
    sections.profile.append(pagePositionLabel, make('small', t('Moves the page within the available empty space without changing its width. Centered keeps the original layout.'), 'td-setting-description'));

    const layoutHint = make('small', t('Use “Edit profile layout” on a profile page to move or hide sections.'), 'epic-muted td-profile-layout-hint');
    const layoutReset = make('button', t('Restore profile layout'), 'epic-button');
    layoutReset.type = 'button';
    layoutReset.addEventListener('click', resetProfileLayout);
    sections.profile.append(layoutHint, layoutReset);

    const languageLabel = make('label', t("Language") + ': ', 'epic-width');
    const languageSelect = make('select');
    const autoLanguage = make('option', t("Automatic (browser language)"));
    autoLanguage.value = 'auto';
    languageSelect.append(autoLanguage);
    languageOptions.forEach(([code, name]) => {
            const option = make('option', name);
            option.value = code;
            languageSelect.append(option);
        });
    const savedLanguage = localStorage.getItem('trophydeck.language');
    languageSelect.value = languageOptions.some(([code]) => code === savedLanguage) ? savedLanguage : 'auto';
    languageSelect.addEventListener('change', () => {
            localStorage.setItem('trophydeck.language', languageSelect.value);
            logEvent('setting.language');
            location.reload();
        });
    languageLabel.append(languageSelect);
    sections.language.append(languageLabel);
    sections.language.append(make('small', t("The language is applied after reloading the page."), 'epic-muted'));
    const welcomeButton = make('button', t('Show welcome guide'), 'epic-button td-welcome-open');
    welcomeButton.type = 'button';
    welcomeButton.addEventListener('click', () => { dialog.close(); openWelcome(); });
    sections.language.append(welcomeButton);

    const linesLabel = make('label', t("Maximum lines in game notes: "), 'epic-width');
    const lines = document.createElement('select');
    for (let i=1; i<=8; i++) {
        const option=make('option', String(i));
        option.value=String(i);
        lines.append(option);
    }
    lines.value = localStorage.getItem('trophydeck.noteLines') || '3';
    lines.addEventListener('change', () => {
            localStorage.setItem('trophydeck.noteLines', lines.value);
            logEvent('setting.noteLines');
            updateGameNotes(true);
        });
    linesLabel.append(lines);
    sections.notes.append(linesLabel);
    const themeLabel = make('label', t("Color theme: "), 'epic-width');
    const theme = document.createElement('select');
    Object.keys(themes).forEach(name => {
            const option=make('option', translateThemeName(name));
            option.value=name;
            theme.append(option);
        });
    theme.value=localStorage.getItem('trophydeck.theme') || 'Blau';
    theme.addEventListener('change', () => {
            localStorage.setItem('trophydeck.theme', theme.value);
            logEvent('setting.theme');
            logEvent('theme.'+theme.value);
            applyTheme();
        });
    themeLabel.append(theme);
    sections.colors.append(themeLabel);
    const swatches=make('div',null,'td-theme-swatches');
    function drawSwatches(){
        swatches.replaceChildren();
        Object.entries(themes).forEach(([name,colors])=>{
                const b=make('button',null,'td-theme-swatch');
                b.type='button';
                b.title=translateThemeName(name);
                b.setAttribute('aria-label',t("Color theme ")+translateThemeName(name));
                b.setAttribute('aria-pressed',String(theme.value===name));
                b.style.background='linear-gradient(90deg,'+colors.join(',')+')';
                b.addEventListener('click',()=>{
                        theme.value=name;
                        theme.dispatchEvent(new Event('change'));
                        drawSwatches();
                    });
                swatches.append(b);
            });
    }drawSwatches();
    theme.addEventListener('change',drawSwatches);
    sections.colors.append(swatches);
    sections.colors.append(createCustomColorControls(() => { theme.value = 'Custom'; drawSwatches(); }));
    const reset = make('button', t("Reset section order"), 'epic-button');
    reset.type='button';
    reset.addEventListener('click', () => {
            localStorage.removeItem('trophydeck.cardOrder');
            logEvent('reset.order');
            renderRail();
        });
    sections.blocks.append(reset);
    const notesManager = make('button', t("Manage notes"), 'epic-button');
    notesManager.type='button';
    notesManager.addEventListener('click', () => {
            dialog.close();
            openNotesManager();
        });
    sections.notes.append(notesManager);
    const exportButton = make('button', t("Export usage statistics"), 'epic-button');
    exportButton.type='button';
    exportButton.addEventListener('click', exportUsage);
    const statsTop=make('div',null,'td-stats-top');
    const analyticsToggle=sections.analytics.querySelector('.epic-toggle');
    analyticsToggle.before(statsTop);
    statsTop.append(analyticsToggle,exportButton);
    const statsActions=make('div',null,'td-setting-actions');
    sections.analytics.append(statsActions);
    const clearUsage = make('button', t("Clear counters"), 'epic-button td-danger');
    clearUsage.type='button';
    clearUsage.addEventListener('click', () => {
            localStorage.removeItem('trophydeck.usage');
        });
    statsActions.append(clearUsage);
    const exportAll=make('button',t("Download backup"),'epic-button');
    exportAll.type='button';
    exportAll.addEventListener('click',exportData);
    sections.backup.append(make('p',t("The backup contains your Trophy Deck settings, notes, links, favorites and locally stored data. Keep it safe. Importing replaces your current Trophy Deck data."),'epic-muted'));
    const wipe=make('button',t("Reset Trophy Deck completely"),'epic-button td-danger');
    wipe.type='button';
    wipe.addEventListener('click',async()=>{
            const confirmed=await tdDialog(t("Reset Trophy Deck completely"),[], t("Permanently delete all Trophy Deck settings, notes, links, favorites, cabinet data and usage counters in this browser? PSNP+ will not be changed."));
            if(!confirmed){
                return;
            }
            const keys=[];
            for(let i=0;i<localStorage.length;i++){
                const key=localStorage.key(i);
                if(key&&(key.startsWith('trophydeck.')||key.startsWith('psnpepic.'))){
                    keys.push(key);
                }
            }
            keys.forEach(key=>localStorage.removeItem(key));
            location.reload();
        });
    sections.maintenance.append(make('p',t("A full reset permanently deletes all local Trophy Deck data. Download a backup first if needed."),'epic-muted'),wipe);
    const fileInput=make('input');
    fileInput.type='file';
    fileInput.accept='.json,application/json';
    fileInput.hidden=true;
    const importButton=make('button',t("Import backup"),'epic-button');
    importButton.type='button';
    importButton.addEventListener('click',()=>fileInput.click());
    fileInput.addEventListener('change',()=>{
            const file=fileInput.files && fileInput.files[0];
            fileInput.value='';
            importBackup(file);
        });
    const backupActions=make('div',null,'td-setting-actions');
    backupActions.append(importButton,exportAll,fileInput);
    sections.backup.append(backupActions);


    sections.analytics.append(make('p', t("Optional local counters, switches and appearance settings including the color theme. No note content, URLs or profile names. Export is manual; nothing is sent automatically."), 'epic-muted'));
    // Group the existing controls by the decision the user is making.
    const positionGroup = make('div', null, 'td-deck-settings-group');
    const sizeGroup = make('div', null, 'td-deck-settings-group');
    function deckGroupHeading(group, symbol, title, description) {
        const heading = make('div', null, 'td-deck-group-heading');
        const icon = make('span', null, 'td-deck-group-icon');
        const glyph = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        glyph.setAttribute('viewBox', '0 0 24 24');
        glyph.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', symbol === 'horizontal' ? 'M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4' : 'M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        glyph.append(path);
        icon.append(glyph);
        icon.setAttribute('aria-hidden', 'true');
        const copy = make('div');
        copy.append(make('strong', t(title)), make('small', t(description), 'td-setting-description'));
        heading.append(icon, copy);
        group.append(heading);
    }
    deckGroupHeading(positionGroup, 'horizontal', 'Position and scrolling', 'Choose a screen edge and how the sidebar follows you.');
    deckGroupHeading(sizeGroup, 'vertical', 'Size', 'Set how much space the open sidebar uses.');
    sections.deck.append(positionGroup, sizeGroup);
    const widthLabel = make('label', t("Trophy Deck width: "), 'epic-width');
    const widthValue = make('span', railWidth() + ' px');
    const width = document.createElement('input');
    width.type = 'range';
    width.min = '260';
    width.max = String(maxRailWidth());
    width.step = '10';
    width.value = railWidth();
    width.setAttribute('aria-label', t("Trophy Deck width"));
    width.addEventListener('input', () => {
            localStorage.setItem('trophydeck.railWidth', width.value);
            widthValue.textContent = width.value + ' px';
            const rail = document.getElementById('trophydeck-rail');
            if (rail) {
                rail.style.setProperty('--epic-width', width.value + 'px');
                applyRailPosition();
            }
        });
    widthLabel.append(widthValue, width);
    sizeGroup.append(widthLabel);
    const viewportHint=make('small','','epic-muted');
    sizeGroup.append(viewportHint);
    const sideLabel = make('label', t("Trophy Deck side: "), 'epic-width');
    const side = document.createElement('select');
    [['right', t("Right")], ['left', t("Left")]].forEach(([value, text]) => {
            const option = make('option', text);
            option.value = value;
            side.append(option);
        });
    side.value = localStorage.getItem('trophydeck.side') || 'right';
    side.addEventListener('change', () => {
            localStorage.setItem('trophydeck.side', side.value);
            renderRail();
        });
    sideLabel.append(side);
    positionGroup.append(sideLabel);
    const dockLabel = make('label', t('Horizontal anchor: '), 'epic-width');
    const dock = make('select');
    [['auto', t('Automatic (when space allows)')], ['screen', t('Screen edge')], ['page', t('Page edge')]].forEach(([value, label]) => {
        const option = make('option', label);
        option.value = value;
        dock.append(option);
    });
    const savedAnchor = localStorage.getItem('trophydeck.horizontalAnchor');
    dock.value = ['auto', 'screen', 'page'].includes(savedAnchor) ? savedAnchor : 'auto';
    dock.addEventListener('change', () => {
        localStorage.setItem('trophydeck.horizontalAnchor', dock.value);
        logEvent('setting.horizontalAnchor');
        renderRail();
    });
    dockLabel.append(dock);
    positionGroup.append(dockLabel, make('small', t('Automatic docks beside the page when the entire sidebar fits. Otherwise it stays at the screen edge. Page edge can overlap the page when space is tight.'), 'td-setting-description'));

    const behaviorLabel=make('label',t("Deck behavior: "),'epic-width');
    const behavior=make('select');
    [['follow',t("Scroll until pinned to the top")],['fixed',t("Fixed on screen")]].forEach(([v,t])=>{
            const o=make('option',t);
            o.value=v;
            behavior.append(o);
        });
    behavior.value=localStorage.getItem('trophydeck.positionMode')||'follow';
    behavior.addEventListener('change',()=>{
            localStorage.setItem('trophydeck.positionMode',behavior.value);
            logEvent('setting.positionMode');
            applyRailPosition();
        });
    behaviorLabel.append(behavior);
    const behaviorHint = make('small', '', 'td-setting-description');
    function updateBehaviorHint() {
        behaviorHint.textContent = behavior.value === 'fixed'
            ? t('The sidebar stays at the same height in the browser window while you scroll.')
            : t('The sidebar moves with the page until it reaches the top, then stays visible.');
    }
    behavior.addEventListener('change', updateBehaviorHint);
    updateBehaviorHint();
    positionGroup.append(behaviorLabel, behaviorHint);
    const heightLabel=make('label',t("Deck position from top: "),'epic-width');
    const heightValue=make('span');
    const height=make('input');
    height.type='range';
    height.min='0';
    height.max='90';
    height.step='1';
    height.value=localStorage.getItem('trophydeck.positionPercent')||'22';
    heightValue.textContent=height.value+' %';
    height.addEventListener('input',()=>{
            localStorage.setItem('trophydeck.positionPercent',height.value);
            localStorage.setItem('trophydeck.positionDocked','false');
            localStorage.setItem('trophydeck.positionAnchorScroll',String(window.scrollY));
            heightValue.textContent=height.value+' %';
            applyRailPosition();
        });
    height.addEventListener('change',()=>logEvent('setting.position'));
    heightLabel.append(heightValue,height);
    positionGroup.append(heightLabel);
    positionGroup.append(make('small', t('Distance from the top of the browser window. You can also drag the sidebar header up or down.'), 'td-setting-description'));
    const panelHeightLabel=make('label',t("Trophy Deck height: "),'epic-width');
    const panelHeightValue=make('span');
    const panelHeight=make('input');
    panelHeight.type='range';
    panelHeight.min='25';
    panelHeight.max='95';
    panelHeight.step='1';
    panelHeight.value=localStorage.getItem('trophydeck.panelHeight')||'72';
    panelHeightValue.textContent=panelHeight.value+t("% of window height");
    panelHeight.addEventListener('input',()=>{
            localStorage.setItem('trophydeck.panelHeight',panelHeight.value);
            panelHeightValue.textContent=panelHeight.value+t("% of window height");
            const el=document.getElementById('trophydeck-rail');
            if(el){
                el.style.setProperty('--epic-height',panelHeight.value+'vh');
            }
        });
    panelHeight.addEventListener('change',()=>logEvent('setting.panelHeight'));
    panelHeightLabel.append(panelHeightValue,panelHeight);
    sizeGroup.append(panelHeightLabel);
    const defaults=make('button',t("Restore Trophy Deck defaults"),'epic-button');
    defaults.type='button';
    defaults.addEventListener('click',()=>{
            ['railWidth','panelHeight','positionPercent','positionMode','positionAnchorScroll','positionDocked','side','horizontalAnchor'].forEach(k=>localStorage.removeItem('trophydeck.'+k));
            railOpen=true;
            localStorage.setItem('trophydeck.railOpen','true');
            logEvent('settings.resetDeck');
            renderRail();
            dialog.close();
            setTimeout(openSettings,0);
        });
    sections.deck.append(defaults);
    const updateWidth=()=>{
        width.max=String(maxRailWidth());
        width.value=String(railWidth());
        const effective=Math.max(0,Math.min(Number(width.value),window.innerWidth*.45,window.innerWidth-40));
        widthValue.textContent=Math.round(effective)+' px ('+(100*effective/window.innerWidth).toFixed(1)+t("% of window width)");
        viewportHeader.textContent='Beta '+APP_VERSION+' · '+t("Browser window ")+window.innerWidth+' × '+window.innerHeight+' px';
        viewportHint.textContent=t("Recommended width: approximately ")+recommendedRailWidth()+t(" px. Trophy Deck uses at most 45% of the window width.");
        heightValue.textContent=height.value+' % ('+Math.round(window.innerHeight*Number(height.value)/100)+' px)';
        panelHeightValue.textContent=panelHeight.value+' % ('+Math.round(window.innerHeight*Number(panelHeight.value)/100)+' px)';
    };
    updateWidth();
    width.addEventListener('input',updateWidth);
    height.addEventListener('input',updateWidth);
    panelHeight.addEventListener('input',updateWidth);
    window.addEventListener('resize',updateWidth);
    dialog.addEventListener('close',()=>window.removeEventListener('resize',updateWidth),{once:true});


    let bytes=0;
    for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(k&&k.startsWith('trophydeck.')){
            bytes+=2*(k.length+(localStorage.getItem(k)||'').length);
        }
    }
    dialog.append(make('p', t("Trophy Deck storage: approx. ")+(bytes/1024).toFixed(1)+t(" KiB (estimated local browser storage)."), 'epic-muted'));
    dialog.append(make('p', t("Profile and game notes are stored only in this browser."), 'epic-muted'));
    dialog.addEventListener('close', () => dialog.remove());
    document.body.append(dialog);
    prepareDialog(dialog);
    dialog.showModal();
}

// Shared by the full settings and the palette shortcut in Trophy Deck.
function createCustomColorControls(onChange = () => {}) {
    themes.Custom = readCustomTheme();
    const container = make('div', null, 'td-custom-colors');
    container.append(make('strong', t('Custom colors')));
    [['Background', 0], ['Cards', 1], ['Accent', 2]].forEach(([label, index]) => {
        const field = make('label', t(label));
        const input = make('input'); input.type = 'color'; input.value = themes.Custom[index];
        input.setAttribute('aria-label', t(label));
        input.addEventListener('input', () => {
            const colors = readCustomTheme(); colors[index] = input.value;
            localStorage.setItem('trophydeck.customTheme', JSON.stringify(colors));
            themes.Custom = colors;
            localStorage.setItem('trophydeck.theme', 'Custom');
            applyTheme(); onChange();
        });
        input.addEventListener('change', () => logEvent('theme.custom'));
        field.append(input); container.append(field);
    });
    return container;
}

function openThemePicker() {
    if(document.getElementById('trophydeck-theme-picker')){
        return;
    }
    const dialog=make('dialog');
    dialog.id='trophydeck-theme-picker';
    dialog.className='td-dialog';
    dialog.append(make('h2',t("COLOR THEME")));
    dialog.append(make('p',t("Choose a color theme. The preview is applied immediately."),'epic-muted'));
    const grid=make('div',null,'td-palette-grid');
    function draw(){
        grid.replaceChildren();
        const selected=localStorage.getItem('trophydeck.theme')||'Blau';
        Object.entries(themes).forEach(([name,colors])=>{
                const b=make('button',null,'td-palette-choice');
                b.type='button';
                b.title=translateThemeName(name);
                b.setAttribute('aria-pressed',String(selected===name));
                const swatch=make('span',null,'td-palette-color');
                swatch.style.background='linear-gradient(90deg,'+colors.join(',')+')';
                b.append(swatch,make('span',translateThemeName(name)));
                b.addEventListener('click',()=>{
                        localStorage.setItem('trophydeck.theme',name);
                        logEvent('setting.theme');
                        logEvent('theme.'+name);
                        applyTheme();
                        draw();
                    });
                grid.append(b);
            });
    }
    draw();
    dialog.append(grid, createCustomColorControls(draw));
    dialog.addEventListener('close',()=>dialog.remove());
    document.body.append(dialog);
    prepareDialog(dialog);
    dialog.showModal();
}

function openFeatureGuide() {
    if (document.getElementById('trophydeck-guide')) {
        return;
    }
    const dialog = make('dialog');
    dialog.id = 'trophydeck-guide';
    dialog.append(make('h2', t("Trophy Deck · Features")));
    const sections = [
        [t("Getting started and position"), [
                [t("Open"), t("The arrow at the edge of the screen opens or closes Trophy Deck.")],
                [t("Move"), t("Drag the deck title up or down. It snaps to the profile navigation when moved nearby.")],
                [t("Size and behavior"), t("Under Settings → Trophy Deck, adjust the side, width, height, position and scrolling behavior, or restore defaults.")]
            ]],
        [t("On profile and game pages"), [
                [t("Profile layout"), t("Use the edit icon beside the profile name. Drag sections around the three-column grid and use the width button to change their size. The reset icon appears while editing.")],
                [t("Game notes"), t("Click the note below a game or on its trophy page. The same note appears for this game on every profile in this browser. Text is saved locally as you type. Clicking outside closes the editor. Web links are clickable.")],
                [t("Game cabinet"), t("Use the star beside a game to save it to the displayed profile’s cabinet. Hover over its cover to reveal the remove button.")],
                [t("Profile navigation"), t("Optionally keep the upper navigation with Profile, Trophy Log and Stats visible while scrolling.")]
            ]],
        [t("In Trophy Deck"), [
                [t('My account'), t('When signed in, use the menu links to open your profile, game lists, trophies, statistics or profile update.')],
                [t("Quick filters and progress"), t("Filters open preset game-list views. Progress calculates additional values from the displayed profile.")],
                [t("Notes"), t("The global note appears on all pages; profile notes belong to a specific profile. Manage notes to view or delete saved notes.")],
                [t("Favorites and links"), t("Add players or links. In edit mode, reorder or remove players; links can be organized into categories.")],
                [t("Sections"), t("Click a section heading to expand or collapse it. Use the eye icon to hide a section and enable it again in settings; reorder sections using the handle or arrows.")]
            ]],
        [t("Colors and data"), [
                [t("Color theme"), t("Choose a theme in Settings. The optional page theme also colors selected areas of PSNProfiles.")],
                [t("Usage statistics"), t("Optional counters remain local and can be exported separately. Nothing is sent automatically.")],
                [t("Backup"), t("The backup contains personal notes, links, favorites and settings. Import replaces current Trophy Deck data after confirmation.")]
            ]]
    ];
    sections.forEach(([heading, entries]) => {
            dialog.append(make('h3', heading));
            entries.forEach(([name, description]) => {
                    const row = make('p');
                    row.append(make('strong', name + ': '), document.createTextNode(description));
                    dialog.append(row);
                });
        });
    dialog.append(make('p', t("Notes and settings are stored locally in this browser."), 'epic-muted'));
    const close = make('button', t("Close"), 'epic-button');
    close.type = 'button';
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => dialog.remove());
    dialog.append(close);
    document.body.append(dialog);
    prepareDialog(dialog);
    dialog.showModal();
}


// The illustrations use the current theme and contain no external assets.
function openWelcome() {
    if (document.getElementById('trophydeck-welcome')) return;
    const dialog = make('dialog', null, 'td-dialog td-welcome');
    dialog.id = 'trophydeck-welcome';
    dialog.append(make('h2', t('Welcome to Trophy Hub')));
    const body = make('div', null, 'td-welcome-body');
    const illustration = make('div', null, 'td-welcome-illustration');
    illustration.setAttribute('aria-hidden', 'true');
    const heading = make('h3');
    const description = make('p');
    const progress = make('span', '', 'td-welcome-progress');
    const controls = make('div', null, 'td-welcome-controls');
    const previous = make('button', t('Back'), 'epic-button');
    const next = make('button', '', 'epic-button');
    previous.type = next.type = 'button';
    controls.append(previous, progress, next);
    body.append(illustration, heading, description, controls);
    dialog.append(body);
    const pages = [
        ['Your personal trophy dashboard', 'Trophy Hub adds a customizable sidebar and useful features to PSNProfiles. It also works alongside PSNP+.', 'dashboard'],
        ['Your sidebar', 'Open or collapse the sidebar with its arrow. Rearrange sections, use quick filters and open settings or colors from the header.', 'sidebar'],
        ['Arrange your profile', 'Use the edit button in the profile navigation to move, resize or hide profile sections. Restore the original arrangement whenever you like.', 'layout'],
        ['Notes, favorites and settings', 'Save game and profile notes, favorite players and links locally. Adjust appearance and position in settings, and export a backup when needed.', 'notes']
    ];
    let index = 0;
    function draw() {
        const [title, text, kind] = pages[index];
        heading.textContent = t(title);
        description.textContent = t(text);
        illustration.className = 'td-welcome-illustration td-welcome-' + kind;
        illustration.replaceChildren();
        const canvas = make('div', null, 'td-welcome-canvas');
        if (kind === 'dashboard' || kind === 'sidebar') {
            const page = make('div', null, 'td-welcome-page');
            page.append(make('div', null, 'td-welcome-line'), make('div', null, 'td-welcome-block'), make('div', null, 'td-welcome-block'));
            const rail = make('div', null, 'td-welcome-rail');
            rail.append(make('div', null, 'td-welcome-rail-header'), make('div', null, 'td-welcome-card'), make('div', null, 'td-welcome-card'), make('div', null, 'td-welcome-card'));
            canvas.append(page, rail);
        } else if (kind === 'layout') {
            const grid = make('div', null, 'td-welcome-grid');
            ['wide', '', '', '', ''].forEach(cls => grid.append(make('div', null, 'td-welcome-tile ' + cls)));
            canvas.append(grid);
        } else {
            const notes = make('div', null, 'td-welcome-note-stack');
            notes.append(make('div', '≡', 'td-welcome-note-symbol'), make('div', null, 'td-welcome-line'), make('div', null, 'td-welcome-line'), make('div', null, 'td-welcome-line'));
            canvas.append(notes, make('div', '★', 'td-welcome-star'));
        }
        illustration.append(canvas);
        progress.textContent = (index + 1) + ' / ' + pages.length;
        previous.disabled = index === 0;
        next.textContent = index === pages.length - 1 ? t('Get started') : t('Next');
    }
    previous.addEventListener('click', () => { if (index > 0) { index--; draw(); } });
    next.addEventListener('click', () => { if (index < pages.length - 1) { index++; draw(); } else dialog.close(); });
    dialog.addEventListener('close', () => dialog.remove());
    document.body.append(dialog);
    prepareDialog(dialog);
    draw();
    localStorage.setItem('trophydeck.welcomeSeen', '1');
    dialog.showModal();
}

function isNewTrophyHubInstallation() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('trophydeck.') || key.startsWith('psnpepic.'))) return false;
    }
    return true;
}


// Move only centered page-width wrappers. Their layout width stays unchanged.
function pageShiftPixels(viewportWidth, elementWidth, position) {
    const freeSpace = Math.max(0, (viewportWidth - elementWidth) / 2);
    const amount = Math.max(-100, Math.min(100, Number(position) || 0));
    return freeSpace * amount / 100;
}

function applyPagePosition() {
    const position = Math.max(-100, Math.min(100, Number(localStorage.getItem('trophydeck.pagePosition')) || 0));
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const elements = Array.from(document.querySelectorAll('.width'));
    elements.forEach(element => {
        element.classList.remove('td-page-shifted');
        element.style.removeProperty('--td-page-offset');
    });
    if (!position) return;
    elements.forEach(element => {
        if (element.parentElement && element.parentElement.closest('.width')) return;
        const rect = element.getBoundingClientRect();
        if (rect.width < Math.min(500, viewportWidth * .6) || Math.abs(rect.left + rect.right - viewportWidth) > 8) return;
        const offset = pageShiftPixels(viewportWidth, rect.width, position);
        if (!offset) return;
        element.style.setProperty('--td-page-offset', offset + 'px');
        element.classList.add('td-page-shifted');
    });
}

function profileInfo() {
    const stats = document.querySelector('.stats.flex');
    const nav = document.querySelector('.title-bar .navigation');
    if (!stats || !nav) {
        return null;
    }
    const first = nav.querySelector('a[href]');
    if (!first) {
        return null;
    }
    const profile = new URL(first.href, location.href);
    if (profile.origin !== location.origin || !/^\/[^/]+\/?$/.test(profile.pathname)) {
        return null;
    }
    return { stats, nav, path: profile.pathname.replace(/\/$/, '') };
}

function addStats(panel, profile) {
    if (!profile) {
        return;
    }
    const values = {};
    profile.stats.querySelectorAll('.stat').forEach(stat => {
            const label = stat.querySelector('span');
            if (!label) {
                return;
            }
            const raw = Array.from(stat.childNodes).filter(node => node.nodeType === 3).map(node => node.textContent).join('').trim();
            values[label.textContent.trim()] = Number(raw.replace(/,/g, ''));
        });
    const total = values['Games Played'], completed = values['Completed Games'];
    if (!Number.isFinite(total) || !Number.isFinite(completed) || completed > total) {
        return;
    }
    const box = make('section', null, 'epic-card');
    box.append(make('h3', t("Progress")));
    const row = make('div', null, 'epic-stat');
    row.title=t("Games played minus games completed to 100%. DLC can affect completion.");
    row.tabIndex=0;
    row.append(make('span', t("Games below 100%")), make('strong', String(total - completed)));
    box.append(row);
    function addMetric(label, value, description) {
        const r=make('div', null, 'epic-stat');
        r.title=description;
        r.tabIndex=0;
        r.append(make('span',label),make('strong',value));
        box.append(r);
    }
    if (total > 0) {
        addMetric(t("Games at 100%"), (completed / total * 100).toFixed(1) + ' %',t("Percentage of games played that are fully completed."));
        addMetric(t("Games under 100%"), ((total-completed)/total*100).toFixed(1)+' %',t("Percentage of games played that are not fully completed."));
    }
    const trophyTotal=document.querySelector('#user-bar li.total');
    if (trophyTotal && total > 0) {
        const earned=Number(trophyTotal.textContent.trim().replace(/,/g,''));
        if (Number.isFinite(earned)) {
            addMetric(t("Avg. trophies per game"), (earned/total).toFixed(1),t("Earned trophies divided by games played, including DLC."));
        }
    }
    const missing=values['Unearned Trophies'];
    if (Number.isFinite(missing) && total > completed) {
        addMetric(t("Avg. remaining per game"), (missing / (total-completed)).toFixed(1),t("Unearned trophies divided by games under 100%, including DLC."));
    }
    panel.append(box);
}

function addLinks(panel, profile) {
    if (!profile) {
        return;
    }
    const box = make('section', null, 'epic-card');
    box.append(make('h3', t("Quick filters")));
    const group = make('div', null, 'epic-link-group');
    const filters = [
        [t("All"), '', t("All games")],
        [t("Incomplete"), 'incomplete', t("Below 100%")],
        [t("No platinum"), 'very-incomplete', t("Neither platinum nor 100%")],
        [t("Platinum + DLC"), 'platinum-only', t("Platinum, but below 100%")],
        [t("100%"), 'complete', t("Fully completed")]
    ];
    filters.forEach(([name, value, detail]) => {
            const url = new URL(profile.path, location.origin);
            const existing = new URL(location.href);
            if (existing.pathname.replace(/\/$/,'') === profile.path && existing.searchParams.get('pf')) {
                url.searchParams.set('pf',existing.searchParams.get('pf'));
            }
            if (value) {
                url.searchParams.set('completion', value);
            }
            const link = make('a');
            link.href = url.href;
            link.append(make('strong', name), make('small', detail));
            const current = new URL(location.href);
            if (current.pathname.replace(/\/$/, '') === profile.path && (current.searchParams.get('completion') || '') === value) {
                link.classList.add('epic-current');
                link.setAttribute('aria-current', 'page');
            }
            link.addEventListener('click', () => logEvent('filter.' + (value || 'all')));
            group.append(link);
        });
    box.append(group);
    const platform=make('div',null,'td-platforms');
    [[t("All"),''],['PS5','ps5'],['PS4','ps4'],['PS3','ps3'],['Vita','vita'],['PSVR','psvr']].forEach(([name,value])=>{
            const current=new URL(location.href);
            const url=new URL(profile.path,location.origin);
            if(current.pathname.replace(/\/$/,'')===profile.path && current.searchParams.get('completion')){
                url.searchParams.set('completion',current.searchParams.get('completion'));
            }
            if(value){
                url.searchParams.set('pf',value);
            }
            const a=make('a',name);
            a.href=url.href;
            a.addEventListener('click',()=>logEvent('platform.'+(value||'all')));
            if(current.pathname.replace(/\/$/,'')===profile.path && (current.searchParams.get('pf')||'')===value) {
                a.className='active';
            }
            platform.append(a);
        });
    // PSNP+ owns the classic-platform data and filters the loaded rows.
    const classicPlatforms = make('div', null, 'td-platforms td-classic-platforms');
    ['PS1', 'PS2', 'PSP'].forEach(name => {
        const button = make('button', name, 'td-classic-filter');
        button.type = 'button';
        button.dataset.tdClassicPlatform = name;
        button.addEventListener('click', () => applyClassicPlatformFilter(name));
        classicPlatforms.append(button);
    });
    const status = make('small', '', 'td-classic-status');
    status.dataset.tdClassicStatus = 'true';
    status.setAttribute('role', 'status');
    const platformSection = make('div', null, 'td-platform-section');
    platformSection.append(make('small', t('Platform'), 'epic-muted'), platform, classicPlatforms, status);
    box.append(platformSection);
    panel.append(box);
    syncPsnpClassicFilters(box);
}

let classicPlatformLoading = false;
let classicPlatformStatus = '';

function classicLoadButton(option) {
    const title = option?.closest('.title');
    const icon = title?.querySelector('a > i.fa-arrow-circle-down, a > i.fa-spinner.fa-spin');
    return icon?.closest('a') || null;
}

// PSNP+ removes its load-all button only after the final page has loaded.
function waitForPsnpLoadAll(button) {
    return new Promise((resolve, reject) => {
        const observer = new MutationObserver(() => {
            if (!button.isConnected) finish();
        });
        const timer = setTimeout(() => finish(new Error('timeout')), 30 * 60 * 1000);
        function finish(error) {
            observer.disconnect();
            clearTimeout(timer);
            if (error) reject(error); else resolve();
        }
        observer.observe(document.body, {childList:true, subtree:true});
        // A spinning button means PSNP+ is already loading the list.
        if (!button.querySelector('i.fa-spinner.fa-spin')) button.click();
        if (!button.isConnected) finish();
    });
}

async function applyClassicPlatformFilter(name) {
    if (classicPlatformLoading) return;
    let option = findPsnpClassicFilter(name);
    if (!option) return;
    const loader = classicLoadButton(option);
    if (loader) {
        classicPlatformLoading = true;
        classicPlatformStatus = t('Loading all games through PSNP+. Please keep this page open.');
        syncPsnpClassicFilters();
        try {
            await waitForPsnpLoadAll(loader);
        } catch (_) {
            classicPlatformStatus = t('Loading did not finish. Please try again or use the PSNP+ load button.');
            classicPlatformLoading = false;
            syncPsnpClassicFilters();
            return;
        }
        classicPlatformLoading = false;
        option = findPsnpClassicFilter(name);
    } else if (document.querySelector('#load-more')) {
        classicPlatformStatus = t('Please load all games with PSNP+ before applying this filter.');
        syncPsnpClassicFilters();
        return;
    }
    if (!option) {
        classicPlatformStatus = t('The PSNP+ platform filter is no longer available.');
        syncPsnpClassicFilters();
        return;
    }
    classicPlatformStatus = '';
    option.click();
    logEvent('platform.' + name.toLowerCase());
    syncPsnpClassicFilters();
}

function findPsnpClassicFilter(name) {
    const toggles = document.querySelectorAll('a.dropdown-toggle.platform');
    for (const toggle of toggles) {
        const menu = toggle.parentElement?.querySelector('ul.dropdown-menu');
        const option = menu && Array.from(menu.querySelectorAll('a')).find(link => link.textContent.trim().toUpperCase() === name);
        if (option) return option;
    }
    return null;
}

function syncPsnpClassicFilters(scope = document) {
    scope.querySelectorAll('[data-td-classic-platform]').forEach(button => {
        const name = button.dataset.tdClassicPlatform;
        const option = findPsnpClassicFilter(name);
        button.disabled = !option || classicPlatformLoading;
        button.title = option ? t('Loads all games if needed, then filters using PSNP+.') : t('Requires the classic platform filters in PSNP+.');
        const toggle = option?.closest('.dropdown')?.querySelector('a.dropdown-toggle.platform');
        const active = !!toggle && new RegExp('\\(' + name + '\\)', 'i').test(toggle.textContent);
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    scope.querySelectorAll('[data-td-classic-status]').forEach(status => {
        if (status.textContent !== classicPlatformStatus) status.textContent = classicPlatformStatus;
    });
}

function markPsnpVersionLabel() {
    document.querySelectorAll('#header .logo > a').forEach(link => {
        if (/^PSNP\+\s*v\d/i.test(link.textContent.trim())) link.dataset.tdPsnpVersion = 'true';
    });
}

function copyTypography(source, target) {
    const computed = getComputedStyle(source);
    ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform'].forEach(property => {
            target.style.setProperty(property, computed.getPropertyValue(property));
        });
}

function createProfileNavigationAvatar() {
    const source = document.querySelector('#user-bar .avatar img');
    if (!source || !(source.currentSrc || source.src)) return null;
    const image = make('img', null, 'td-profile-nav-avatar');
    image.src = source.currentSrc || source.src;
    image.alt = '';
    return image;
}

let stickyController = new AbortController();

function updateStickyNav() {
    stickyController.abort();
    stickyController = new AbortController();
    const old = document.getElementById('trophydeck-sticky');
    if (old) {
        old.remove();
    }
    if (!enabled('trophydeck.stickyNav')) {
        return;
    }
    const profile = profileInfo();
    if (!profile) {
        return;
    }
    const bar = profile.nav.closest('.title-bar');
    if (!bar) {
        return;
    }
    const sticky = make('div');
    sticky.id = 'trophydeck-sticky';
    sticky.hidden = true;
    const heading = bar.querySelector('h3');
    if (heading) {
        const title = make('h3', heading.textContent.trim());
        copyTypography(heading, title);
        title.style.margin = '0';
        const titleGroup = make('div', null, 'td-sticky-title');
        const avatar = createProfileNavigationAvatar();
        if (avatar) titleGroup.append(avatar);
        titleGroup.append(title);
        sticky.append(titleGroup);
    }
    const links = make('nav');
    links.setAttribute('aria-label', t("Profile navigation"));
    sticky.append(links);
    document.body.append(sticky);
    setupProfileLayoutEditor();
    function sync() {
        if (!sticky.isConnected) {
            return;
        }
        const rect = bar.getBoundingClientRect();
        sticky.hidden = rect.bottom > 0 || rect.width === 0;
        if (!sticky.hidden) {
            sticky.style.left = Math.max(0, rect.left) + 'px';
            sticky.style.width = Math.min(window.innerWidth, rect.width) + 'px';
            const originals = Array.from(profile.nav.querySelectorAll('a[href]'));
            const visibleRects = originals.map(link => link.getBoundingClientRect()).filter(box => box.width > 0 && box.height > 0);
            if (visibleRects.length > 1) {
                const gap = visibleRects[1].left - visibleRects[0].right;
                if (gap >= 0 && gap <= 40) links.style.columnGap = gap + 'px';
            }
            const signature = profile.nav.innerHTML;
            if (links.dataset.signature !== signature) {
                links.replaceChildren();
                originals.forEach(original => {
                        const link = make('a', original.textContent.trim());
                        link.href = original.href;
                        copyTypography(original, link);
                        const sourceStyle = getComputedStyle(original);
                        link.style.color = sourceStyle.color;
                        link.style.textDecoration = sourceStyle.textDecoration;
                        link.style.borderBottom = sourceStyle.borderBottom;
                        if (original.parentElement.classList.contains('active')) {
                            link.setAttribute('aria-current', 'page');
                        }
                        links.append(link);
                    });
                links.dataset.signature = signature;
            }
        }
    }
    window.addEventListener('scroll', sync, { passive:true, signal: stickyController.signal });
    window.addEventListener('resize', sync, { passive:true, signal: stickyController.signal });
    sync();
}

function addNote(panel, profile) {
    if(!profile){
        return;
    }
    const box=make('section',null,'epic-card');
    box.append(make('h3',t("Profile note")));
    box.append(make('small',t("Only for ")+decodeURIComponent(profile.path.slice(1)), 'epic-muted'));
    box.append(noteWidget('trophydeck.note.'+profile.path.toLowerCase(),t("Profile note"),t("+ Add profile note")));
    panel.append(box);
}

function addGlobalNote(panel) {
    const box=make('section',null,'epic-card');
    box.append(make('h3',t("Global note")));
    box.append(make('small',t("Visible on every page"),'epic-muted'));
    box.append(noteWidget('trophydeck.globalNoteText',t("Global note"),t("+ Add global note")));
    panel.append(box);
}

function addCustomLinks(panel) {
    const box = make('section', null, 'epic-card');
    box.append(make('h3', t('My links')));
    const content = make('div', null, 'td-links-content');
    function read() {
        try {
            const data = JSON.parse(localStorage.getItem('trophydeck.customLinkData') || '{}');
            return {categories:Array.isArray(data.categories) ? data.categories : [], links:Array.isArray(data.links) ? data.links : []};
        } catch (_) { return {categories:[], links:[]}; }
    }
    function save(data) {
        localStorage.setItem('trophydeck.customLinkData', JSON.stringify(data));
        logEvent('customLinks.change'); draw();
    }
    function btn(text, title, callback, editable = false) {
        const button = make('button', t(text), 'td-link-button' + (editable ? ' td-edit-control' : ''));
        button.type='button'; button.title=t(title); button.setAttribute('aria-label', button.title);
        button.addEventListener('click', event => { event.stopPropagation(); callback(); });
        return button;
    }
    async function askCategory(old) {
        const value=await tdDialog(t('Category'), [{label:t('Name (up to 30 characters)'),value:old||'',max:30}]);
        return value && value[0] ? value[0] : null;
    }
    async function askLink(current, category) {
        const data = read();
        const categoriesHidden = localStorage.getItem('trophydeck.hideLinkCategories') === 'true';
        const fields = [{label:t('Link text'),value:current?.text||'',max:80},{label:t('Address (HTTP or HTTPS)'),value:current?.url||'https://'}];
        if (data.categories.length && !categoriesHidden) fields.push({label:t('Category'), value:current?.category ?? category ?? '', required:false, options:[{value:'',label:t('Uncategorized')},...data.categories.map(name=>({value:name,label:name}))]});
        const result=await tdDialog(t(current ? 'Edit link' : 'Add link'), fields);
        if (!result || !result[0]) return null;
        try {
            const url=new URL(result[1]);
            if (!['http:','https:'].includes(url.protocol) || url.username || url.password) throw new Error();
            const selected = fields.length > 2 ? result[2] : (current?.category ?? category ?? '');
            return {text:result[0],url:url.href,category:selected};
        } catch (_) { await tdDialog(t('Invalid address'),[],t('Enter an HTTP or HTTPS address without credentials.')); return null; }
    }
    function draw() {
        content.replaceChildren();
        const data = read();
        const categoriesHidden = localStorage.getItem('trophydeck.hideLinkCategories') === 'true';
        const flat = categoriesHidden || data.categories.length === 0;
        const groups = flat ? [null] : [...(data.links.some(link=>!link.category)?['']:[]), ...data.categories];
        let dragging = null;
        function moveLink(targetIndex, targetCategory) {
            if (dragging === null) return;
            const from = dragging; dragging = null;
            const [moved] = data.links.splice(from,1);
            if (!moved) return;
            if (targetCategory !== null) moved.category = targetCategory;
            let to = targetIndex === null ? data.links.length : targetIndex;
            if (targetIndex !== null && from < to) to--;
            data.links.splice(Math.max(0,to),0,moved); save(data);
        }
        async function addLink(category) {
            if (data.links.length >= 100) { await tdDialog(t('Maximum 100 links')); return; }
            const item = await askLink(null, category);
            if (item) { data.links.push(item); save(data); }
        }
        groups.forEach(category => {
            const section = make('div',null,'td-custom-group');
            if (category !== null) {
                const title = make('div',null,'td-custom-heading');
                title.append(make('strong',category || t('Uncategorized')));
                if (category) {
                    title.append(btn('✎','Rename category',async()=>{
                        const name=await askCategory(category);
                        if (!name || data.categories.includes(name)) return;
                        data.categories=data.categories.map(value=>value===category?name:value);
                        data.links.forEach(link=>{if(link.category===category)link.category=name;}); save(data);
                    },true),btn('×','Delete category',async()=>{
                        if (!await tdDialog(t('Delete category'),[],t('The links will remain uncategorized.'))) return;
                        data.categories=data.categories.filter(value=>value!==category);
                        data.links.forEach(link=>{if(link.category===category)link.category='';}); save(data);
                    },true));
                }
                title.append(btn('+','Add link',()=>addLink(category)));
                section.append(title);
            }
            data.links.forEach((item,index)=>{
                if (category !== null && (item.category||'') !== category) return;
                const row=make('div',null,'td-custom-row');
                const drag=make('button','', 'td-link-button td-link-drag td-edit-control');
                drag.type='button'; drag.draggable=true; drag.title=t('Drag to move this link'); drag.setAttribute('aria-label',drag.title);
                setProfileLayoutIcon(drag,'drag');
                drag.addEventListener('dragstart',event=>{dragging=index;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',String(index));row.classList.add('td-link-dragging');});
                drag.addEventListener('dragend',()=>{dragging=null;row.classList.remove('td-link-dragging');});
                row.addEventListener('dragover',event=>{if(dragging!==null){event.preventDefault();row.classList.add('td-link-drop');}});
                row.addEventListener('dragleave',()=>row.classList.remove('td-link-drop'));
                row.addEventListener('drop',event=>{if(dragging===null)return;event.preventDefault();event.stopPropagation();row.classList.remove('td-link-drop');moveLink(index,category);});
                const a=make('a',item.text);a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.addEventListener('click',()=>logEvent('customLinks.open'));
                row.append(a,drag,btn('✎','Edit link',async()=>{const updated=await askLink(item,category);if(updated){data.links[index]=updated;save(data);}},true),btn('×','Delete link',async()=>{if(await tdDialog(t('Delete link'),[],t('Delete this link?'))){data.links.splice(index,1);save(data);}},true));
                section.append(row);
            });
            section.addEventListener('dragover',event=>{if(dragging!==null)event.preventDefault();});
            section.addEventListener('drop',event=>{if(dragging===null)return;event.preventDefault();moveLink(null,category);});
            content.append(section);
        });
        const actions=make('div',null,'td-link-actions');
        actions.append(btn('+ Link','Add link',()=>addLink('')));
        if (!categoriesHidden) actions.append(btn('+ Category','Add category',async()=>{
            if(data.categories.length>=12){await tdDialog(t('Maximum 12 categories'));return;}
            const name=await askCategory('');if(name&&!data.categories.includes(name)){data.categories.push(name);save(data);}
        }));
        if (data.categories.length) actions.append(btn(categoriesHidden?'Show categories':'Hide categories',categoriesHidden?'Show categories':'Hide categories',()=>{
            localStorage.setItem('trophydeck.hideLinkCategories',String(!categoriesHidden));draw();
        }));
        content.append(actions);
    }
    draw(); box.append(content); panel.append(box);
}

// Only links actually provided by the signed-in user's own menu are used.
function readAccountShortcuts(menu) {
    const identity = menu && menu.querySelector('a.dropdown-toggle[href]');
    if (!identity) return [];
    const definitions = [
        ['your profile', 'My profile', 'accountUser'],
        ['game lists', 'Game lists', 'accountList'],
        ['trophy log', 'Trophy log', 'accountLog'],
        ['trophy advisor', 'Trophy advisor', 'accountAdvisor'],
        ['statistics', 'Statistics', 'accountStats'],
        ['update profile', 'Update profile', 'accountRefresh']
    ];
    const links = Array.from(menu.querySelectorAll('ul.dropdown-menu a[href]'));
    return definitions.flatMap(([text, label, icon]) => {
        const original = links.find(link => link.textContent.trim().toLowerCase() === text);
        if (!original) return [];
        try {
            let url = new URL(original.href, location.href);
            if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return [];
            if (text === 'update profile') {
                const account = new URL(identity.href, location.href);
                if (account.origin !== location.origin || !/^\/[^/]+\/?$/.test(account.pathname)) return [];
                const current = new URL(location.href);
                url = new URL('/', location.origin);
                url.searchParams.set('psnId', decodeURIComponent(account.pathname.replace(/^\/|\/$/g, '')));
                url.searchParams.set('redirect', current.pathname + current.search + current.hash);
            }
            return [{label, icon, href:url.href}];
        } catch (_) { return []; }
    });
}

function addAccountShortcuts(panel) {
    const menu = document.querySelector('div.user-menu > div.dropdown.user-nav');
    const shortcuts = readAccountShortcuts(menu);
    if (!shortcuts.length) return;
    const box = make('section', null, 'epic-card td-account-card');
    box.append(make('h3', t('My account')));
    const links = make('nav', null, 'td-account-links');
    links.setAttribute('aria-label', t('My account'));
    shortcuts.forEach(shortcut => {
        const link = make('a');
        link.href = shortcut.href;
        const icon = make('span', null, 'td-account-icon');
        setProfileLayoutIcon(icon, shortcut.icon);
        link.append(icon, make('span', t(shortcut.label)));
        link.addEventListener('click', () => logEvent('account.' + shortcut.icon));
        links.append(link);
    });
    box.append(links); panel.append(box);
}


function maxRailWidth() {
    return Math.max(260, Math.min(1600, Math.floor(window.innerWidth * 0.45 / 10)*10));
}

function recommendedRailWidth() {
    return Math.max(260, Math.min(maxRailWidth(), 400));
}

function railWidth() {
    const stored = localStorage.getItem('trophydeck.railWidth');
    const value = stored === null ? recommendedRailWidth() : Number(stored);
    return Math.max(260, Math.min(maxRailWidth(), Number.isFinite(value) && value > 0 ? value : recommendedRailWidth()));
}

const GLOBAL_GAME_NOTE_PREFIX = 'trophydeck.gameNote.global.';
const GLOBAL_GAME_INFO_PREFIX = 'trophydeck.gameInfo.global.';

// Copy old profile-specific notes once. Conflicting texts remain available in
// the notes manager so that no user-written note is overwritten or discarded.
function migrateGameNotes() {
    const grouped = new Map();
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const match = key && key.match(/^trophydeck\.gameNote\.\/([^/]+)\.(\d+)$/);
        if (!match || !localStorage.getItem(key)) continue;
        if (!grouped.has(match[2])) grouped.set(match[2], []);
        grouped.get(match[2]).push({key, user:match[1].toLowerCase(), value:localStorage.getItem(key)});
    }
    let ownUser = '';
    try {
        const own = Array.from(document.querySelectorAll('div.user-menu ul.dropdown-menu a')).find(link => link.textContent.trim() === 'Your Profile');
        if (own) ownUser = decodeURIComponent(new URL(own.href, location.href).pathname.replace(/^\/|\/$/g, '')).toLowerCase();
    } catch (_) {}
    for (const [id, candidates] of grouped) {
        const marker = 'trophydeck.gameNoteMigration.' + id;
        if (localStorage.getItem(marker) === '1') continue;
        candidates.sort((a, b) => (b.user === ownUser) - (a.user === ownUser) || a.key.localeCompare(b.key));
        const globalKey = GLOBAL_GAME_NOTE_PREFIX + id;
        if (localStorage.getItem(globalKey) === null) localStorage.setItem(globalKey, candidates[0].value);
        const chosen = localStorage.getItem(globalKey);
        const matching = candidates.find(candidate => candidate.value === chosen);
        if (matching && localStorage.getItem(GLOBAL_GAME_INFO_PREFIX + id) === null) {
            const info = localStorage.getItem(matching.key.replace('trophydeck.gameNote.', 'trophydeck.gameInfo.'));
            if (info !== null) localStorage.setItem(GLOBAL_GAME_INFO_PREFIX + id, info);
        }
        for (const candidate of candidates) if (candidate.value === chosen) localStorage.removeItem(candidate.key);
        localStorage.setItem(marker, '1');
    }
}

function noteWidget(key, label, placeholder) {
    const isGameNote = key.startsWith('trophydeck.gameNote.');
    const wrap=make('div',null,'trophydeck-game-note' + (isGameNote ? '' : ' td-note-unlimited'));
    const preview=make('div',null,'td-note-preview');
    preview.tabIndex=0;
    const editor=make('textarea',null,'td-note-editor');
    editor.wrap='soft';
    editor.hidden=true;
    editor.value=localStorage.getItem(key)||'';
    editor.setAttribute('aria-label',label);
    function display() {
        preview.replaceChildren();
        const text=editor.value;
        if(!text) {
            preview.textContent=placeholder;
            preview.classList.add('td-note-placeholder');
        }
        else {
            preview.classList.remove('td-note-placeholder');
            const re=/https?:\/\/[^\s<>]+/gi;
            let last=0,m;
            while((m=re.exec(text))) {
                preview.append(document.createTextNode(text.slice(last,m.index)));
                const a=make('a',m[0]);
                a.href=m[0];
                a.target='_blank';
                a.rel='noopener noreferrer';
                a.addEventListener('click',()=>logEvent('note.link'));
                preview.append(a);
                last=m.index+m[0].length;
            }
            preview.append(document.createTextNode(text.slice(last)));
        }
        preview.style.setProperty('--td-lines',enabled('trophydeck.noteWrap')?String(Math.min(8,Math.max(1,Number(localStorage.getItem('trophydeck.noteLines'))||3))):'1');
    }
    function resizeEditor() {
        editor.style.height='auto';
        editor.style.height=Math.max(48,editor.scrollHeight)+'px';
    }
    function start() {
        preview.hidden=true;
        editor.hidden=false;
        resizeEditor();
        editor.focus();
        logEvent('note.edit');
    }
    preview.addEventListener('click',event=>{
            if(!event.target.closest('a')){
                start();
            }
        });
    preview.addEventListener('keydown',event=>{
            if(event.key==='Enter' || event.key===' '){
                event.preventDefault();
                start();
            }
        });
    editor.addEventListener('input',()=>{
            localStorage.setItem(key,editor.value);
            resizeEditor();
        });
    editor.addEventListener('blur',()=>{
            editor.hidden=true;
            preview.hidden=false;
            display();
        });
    display();
    wrap.append(preview,editor);
    return wrap;
}

function updateGameNotes(refresh = false) {
    if (refresh) {
        document.querySelectorAll('[data-game-page-note]').forEach(element=>element.remove());
        document.querySelectorAll('.trophydeck-game-note[data-game-note]').forEach(element=>element.remove());
    }
    document.querySelectorAll('.trophydeck-game-note[data-game-note]').forEach(element=>{
            element.hidden=!enabled('trophydeck.gameNotes');
        });
    document.querySelectorAll('[data-game-page-note]').forEach(element=>{
            element.hidden=!enabled('trophydeck.gameNotes');
        });
    if(!enabled('trophydeck.gameNotes')){
        return;
    }
    const profile=profileInfo();
    if(profile) {
        document.querySelectorAll('tr td a.title[href*="/trophies/"]').forEach(link=>{
                const url=new URL(link.href,location.href),m=url.pathname.match(/^\/trophies\/(\d+)(?:-[^/]*)?\/([^/]+)\/?$/);
                if(!m || url.origin!==location.origin || ('/'+m[2]).toLowerCase()!==profile.path.toLowerCase()){
                    return;
                }
                const cell=link.closest('td');
                if(!cell||cell.querySelector('[data-game-note]')){
                    return;
                }
                localStorage.setItem(GLOBAL_GAME_INFO_PREFIX+m[1],JSON.stringify({name:link.textContent.trim(),href:url.pathname}));
                const wrap=noteWidget(GLOBAL_GAME_NOTE_PREFIX+m[1],t("Note for ")+link.textContent.trim(),t("+ Game note"));
                wrap.dataset.gameNote='true';
                const infos=cell.querySelectorAll('.small-info');
                if(infos.length){
                    infos[infos.length-1].after(wrap);
                }else {
                    cell.append(wrap);
                }
            });
    }
    const match=location.pathname.match(/^\/trophies\/(\d+)(?:-[^/]*)?(?:\/([^/]+))?\/?$/);
    if(!match){
        return;
    }
    const title=Array.from(document.querySelectorAll('#content .title h3')).find(h=>/trophies$/i.test(h.textContent.trim()));
    if(!title){
        return;
    }
    const bar=title.closest('.title');
    if(!bar||bar.parentElement.querySelector('[data-game-page-note]')){
        return;
    }
    localStorage.setItem(GLOBAL_GAME_INFO_PREFIX+match[1],JSON.stringify({name:title.textContent.trim().replace(/\s+Trophies$/i,''),href:location.pathname}));
    const section=make('div',null,'td-game-page-note');
    section.dataset.gamePageNote='true';
    section.append(make('strong',t('Game note')));
    const note=noteWidget(GLOBAL_GAME_NOTE_PREFIX+match[1],t('Game note'),t("+ Game note"));
    note.dataset.gameNote='true';
    section.append(note);
    bar.after(section);
}


function setupCardSorting(cards) {
    const defaults = ['account', 'overview', 'filters', 'globalNote', 'profileNote', 'customLinks', 'favorites', 'settings'];
    let saved = [];
    try {
        saved = JSON.parse(localStorage.getItem('trophydeck.cardOrder') || '[]');
    } catch (_) { /* use default order */ }
    if (!Array.isArray(saved)) {
        saved = [];
    }
    if (!saved.includes('account')) saved.unshift('account');
    let order = [...new Set(saved.filter(key => defaults.includes(key)).concat(defaults))];
    const elements = Array.from(cards.children);
    elements.sort((a, b) => order.indexOf(a.dataset.deckCard) - order.indexOf(b.dataset.deckCard));
    elements.forEach(element => cards.append(element));
    function persist() {
        const visible = Array.from(cards.children).map(element => element.dataset.deckCard);
        let next = 0;
        order = order.map(key => visible.includes(key) ? visible[next++] : key);
        localStorage.setItem('trophydeck.cardOrder', JSON.stringify(order));
    }
    let dragged = null, originalOrder = null, dropped = false;
    elements.forEach(card => {
            const toolbar = make('div', null, 'epic-sort td-edit-control');
            const handle = make('button', '', 'epic-drag');
            setProfileLayoutIcon(handle, 'drag');
            handle.type = 'button';
            handle.draggable = true;
            handle.title = t("Drag to move this section");
            handle.setAttribute('aria-label', t("Drag section to reorder"));
            handle.addEventListener('dragstart', event => {
                    dragged = card;
                    originalOrder=Array.from(cards.children);
                    dropped=false;
                    card.classList.add('epic-dragging');
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', card.dataset.deckCard);
                });
            handle.addEventListener('dragend', () => {
                    if(!dropped && originalOrder){
                        originalOrder.forEach(el=>cards.append(el));
                    }card.classList.remove('epic-dragging');
                    dragged = null;
                });
            toolbar.append(handle);
            [['↑', -1, t("Move section up")], ['↓', 1, t("Move section down")]].forEach(([symbol, direction, label]) => {
                    const button = make('button', symbol, 'epic-move');
                    button.type = 'button';
                    button.title = label;
                    button.setAttribute('aria-label', label);
                    button.addEventListener('click', () => {
                            const neighbor = direction < 0 ? card.previousElementSibling : card.nextElementSibling;
                            if (!neighbor) {
                                return;
                            }
                            if (direction < 0) {
                                cards.insertBefore(card, neighbor);
                            }
                            else {
                                cards.insertBefore(neighbor, card);
                            }
                            persist();
                            button.focus();
                        });
                    toolbar.append(button);
                });
            const cardKey = card.dataset.deckCard;
            const hideKeys = {account:'showAccountLinks', overview:'showStats', filters:'showLinks', profileNote:'showNote', globalNote:'globalNote', customLinks:'customLinks', favorites:'favorites'};
            if (hideKeys[cardKey]) {
                const hide = make('button', '', 'epic-hide'); hide.type = 'button';
                setProfileLayoutIcon(hide, 'eyeOff');
                hide.title = t('Hide deck section'); hide.setAttribute('aria-label', hide.title);
                hide.addEventListener('click', event => {
                    event.stopPropagation();
                    localStorage.setItem('trophydeck.' + hideKeys[cardKey], 'false');
                    logEvent('card.hide.' + cardKey);
                    renderRail();
                });
                toolbar.append(hide);
            }
            if (card.tagName === 'DETAILS') {
                const summary=card.querySelector('summary');
                summary.append(toolbar);
                toolbar.addEventListener('click', event => event.preventDefault());
            } else {
                const title=card.querySelector('h3');
                const body=make('div',null,'td-card-body');
                Array.from(card.children).forEach(child => {
                        if(child!==title) {
                            body.append(child);
                        }
                    });
                const head=make('div',null,'td-card-head');
                head.append(title,toolbar);
                card.append(head,body);
                const collapsedKey='trophydeck.cardCollapsed.'+cardKey;
                const collapse=make('button','','epic-collapse');
                collapse.type='button';
                function setCollapsed(collapsed) {
                    body.hidden=collapsed;
                    collapse.textContent=collapsed?'＋':'−';
                    collapse.title=collapsed?t("Expand section"):t("Collapse section");
                    collapse.setAttribute('aria-label', collapse.title);
                    collapse.setAttribute('aria-expanded',String(!collapsed));
                }
                collapse.addEventListener('click',()=>{
                        const state=!body.hidden;
                        localStorage.setItem(collapsedKey,String(state));
                        setCollapsed(state);
                        logEvent('card.toggle.'+cardKey);
                    });
                toolbar.append(collapse);
                const savedCollapsed=localStorage.getItem(collapsedKey);
                setCollapsed(savedCollapsed===null ? cardKey==='settings' : savedCollapsed==='true');
                head.addEventListener('click', event => {
                        if (!event.target.closest('button')) {
                            collapse.click();
                        }
                    });
            }
            card.addEventListener('dragover', event => {
                    if (!dragged || dragged === card) {
                        return;
                    }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    const rect=card.getBoundingClientRect();
                    cards.insertBefore(dragged,event.clientY<rect.top+rect.height/2?card:card.nextSibling);
                });
            card.addEventListener('drop', event => {
                    if (!dragged) {
                        return;
                    }
                    event.preventDefault();
                    if(dragged!==card){
                        const rect = card.getBoundingClientRect();
                        cards.insertBefore(dragged, event.clientY < rect.top + rect.height / 2 ? card : card.nextSibling);
                    }
                    dropped=true;
                    persist();
                    logEvent('card.reorder');
                });
        });
}

function tdDialog(title, fields = [], message = '') {
    return new Promise(resolve => {
            const dialog=make('dialog');
            dialog.className='td-dialog';
            dialog.append(make('h2',title));
            if(message) {
                dialog.append(make('p',message));
            }
            const form=make('form');
            form.method='dialog';
            const inputs=[];
            fields.forEach(field=>{
                    const label=make('label',field.label);
                    const input=make(field.options ? 'select' : 'input');
                    if (field.options) field.options.forEach(option => { const element=make('option', option.label); element.value=option.value; input.append(element); });
                    else { input.type=field.type||'text'; if (input.type !== 'color') input.maxLength=field.max||2048; }
                    input.value=field.value||'';
                    input.required=field.required!==false;
                    label.append(input);
                    form.append(label);
                    inputs.push(input);
                });
            const error=make('p','','td-error');
            form.append(error);
            const actions=make('div',null,'td-dialog-actions');
            const cancel=make('button',t("Cancel"));
            cancel.type='button';
            cancel.addEventListener('click',()=>dialog.close('cancel'));
            const ok=make('button',fields.length?t("Save"):t("Confirm"));
            ok.type='submit';
            actions.append(cancel,ok);
            form.append(actions);
            dialog.append(form);
            document.body.append(dialog);
            form.addEventListener('submit',e=>{
                    e.preventDefault();
                    if(!form.reportValidity()){
                        return;
                    } dialog.close('ok');
                });
            dialog.addEventListener('close',()=>{
                    const result=dialog.returnValue==='ok' ? (fields.length?inputs.map(i=>i.value.trim()):true) : null;
                    dialog.remove();
                    resolve(result);
                });
            prepareDialog(dialog);
            dialog.showModal();
        });
}

function readList(key) {
    try {
        const value=JSON.parse(localStorage.getItem(key)||'[]');
        return Array.isArray(value)?value:[];
    } catch (_) {
        return [];
    }
}

let favoritesEditing=false;

function addFavorites(panel) {
    const box=make('section',null,'epic-card');
    box.append(make('h3',t("Favorite players")));
    const body=make('div');
    function draw(){
        body.replaceChildren();
        const list=readList('trophydeck.favoritePlayers');
        let favoriteColors = {};
        try { favoriteColors = JSON.parse(localStorage.getItem('trophydeck.favoriteColors') || '{}') || {}; } catch (_) {}
        function saveColors() { localStorage.setItem('trophydeck.favoriteColors', JSON.stringify(favoriteColors)); }
        const grid=make('div',null,'td-favorites-grid');
        let dragging=null;
        function persist(){
            localStorage.setItem('trophydeck.favoritePlayers',JSON.stringify(list));
            logEvent('favorites.change');
            draw();
        }
        list.forEach((name,index)=>{
                const tile=make('div',null,'td-favorite');
                const savedColor = favoriteColors[name.toLowerCase()];
                if (typeof savedColor === 'string' && /^#[0-9a-f]{6}$/i.test(savedColor)) {
                    tile.style.setProperty('--td-favorite-color', savedColor);
                    const value = parseInt(savedColor.slice(1), 16);
                    const luminance = ((value >> 16) * 299 + ((value >> 8) & 255) * 587 + (value & 255) * 114) / 1000;
                    tile.style.setProperty('--td-favorite-text', luminance > 155 ? '#17212b' : '#ffffff');
                }
                const viewed=profileInfo()?.path || '';
                tile.classList.toggle('td-current-profile',viewed.toLowerCase()===('/'+name).toLowerCase());
                tile.draggable=favoritesEditing;
                tile.classList.toggle('td-editing',favoritesEditing);
                const a=make('a',name);
                a.href='/'+encodeURIComponent(name);
                a.title=t("Open profile");
                const controls=make('div',null,'td-favorite-controls');
                controls.hidden=!favoritesEditing;
                [['↑',-1],['↓',1]].forEach(([symbol,delta])=>{
                        const b=make('button',symbol,'td-link-button');
                        b.type='button';
                        b.title=delta<0?t("Move favorite earlier"):t("Move favorite later");
                        b.setAttribute('aria-label',b.title);
                        b.addEventListener('click',()=>{
                                const n=index+delta;
                                if(n<0||n>=list.length){
                                    return;
                                }[list[index],list[n]]=[list[n],list[index]];
                                persist();
                            });
                        controls.append(b);
                    });
                const rename=make('button','✎','td-link-button');
                rename.type='button';
                rename.title=t("Edit favorite");
                rename.setAttribute('aria-label',t("Edit favorite"));
                rename.addEventListener('click',async()=>{
                        const result=await tdDialog(t("Edit favorite"),[{label:'PSN-ID',value:name,max:16}]);
                        if(result&&/^[a-zA-Z0-9_-]{1,16}$/.test(result[0])&&!list.some((other,i)=>i!==index&&other.toLowerCase()===result[0].toLowerCase())){
                            if (favoriteColors[name.toLowerCase()]) {
                                favoriteColors[result[0].toLowerCase()] = favoriteColors[name.toLowerCase()];
                                if (result[0].toLowerCase() !== name.toLowerCase()) delete favoriteColors[name.toLowerCase()];
                                saveColors();
                            }
                            list[index]=result[0];
                            persist();
                        }
                    });
                controls.append(rename);
                const color = make('input'); color.type='color'; color.className='td-favorite-color';
                color.value = /^#[0-9a-f]{6}$/i.test(savedColor || '') ? savedColor : '#315c89';
                color.title=t('Player color'); color.setAttribute('aria-label',t('Player color') + ': ' + name);
                color.addEventListener('input', () => { favoriteColors[name.toLowerCase()]=color.value; saveColors(); tile.style.setProperty('--td-favorite-color',color.value); });
                color.addEventListener('change', () => { logEvent('favorites.color'); draw(); });
                const colorControl = make('label', null, 'td-favorite-color-control');
                colorControl.title = t('Player color');
                const colorIcon = make('span', null, 'td-favorite-color-icon');
                setProfileLayoutIcon(colorIcon, 'palette'); colorIcon.setAttribute('aria-hidden', 'true');
                colorControl.append(colorIcon, color); controls.prepend(colorControl);
                const del=make('button','×','td-link-button');
                del.type='button';
                del.setAttribute('aria-label',name+t(" remove"));
                del.addEventListener('click',async()=>{
                        if(await tdDialog(t("Remove favorite"),[],name+t(" from favorites?"))){
                            list.splice(index,1);
                            delete favoriteColors[name.toLowerCase()]; saveColors();
                            persist();
                        }
                    });
                controls.append(del);
                if (favoritesEditing) {
                    const handle = make('span', null, 'td-favorite-drag');
                    setProfileLayoutIcon(handle, 'drag'); handle.setAttribute('aria-hidden', 'true');
                    tile.append(handle);
                }
                tile.append(a,controls);
                tile.addEventListener('dragstart',e=>{
                        dragging=index;
                        e.dataTransfer.effectAllowed='move';
                        e.dataTransfer.setData('text/plain',String(index));
                    });
                tile.addEventListener('dragover',e=>{
                        if(dragging!==null){
                            e.preventDefault();
                            grid.querySelectorAll('.td-drop-target').forEach(x=>x.classList.remove('td-drop-target'));
                            tile.classList.add('td-drop-target');
                        }
                    });
                tile.addEventListener('drop',e=>{
                        e.preventDefault();
                        if(dragging===null||dragging===index){
                            return;
                        }const [moved]=list.splice(dragging,1);
                        list.splice(index,0,moved);
                        dragging=null;
                        persist();
                    });
                tile.addEventListener('dragend',()=>{
                        dragging=null;
                        grid.querySelectorAll('.td-drop-target').forEach(x=>x.classList.remove('td-drop-target'));
                    });
                grid.append(tile);
            });
        body.append(grid);
        const add=make('button',t("+ Player"),'td-link-button td-fav-add');
        add.type='button';
        add.addEventListener('click',async()=>{
                let defaultColor = '#315c89';
                try {
                    const accent = getComputedStyle(document.documentElement).getPropertyValue('--td-accent').trim();
                    if (/^#[0-9a-f]{6}$/i.test(accent)) defaultColor = accent;
                } catch (_) {}
                const answer=await tdDialog(t('Add player'),[
                    {label:'PSN-ID',max:16},
                    {label:t('Player color'),type:'color',value:defaultColor,required:false}
                ]);
                if(!answer){
                    return;
                }
                const name=answer[0];
                if(!/^[a-zA-Z0-9_-]{1,16}$/.test(name)){
                    await tdDialog(t("Invalid PSN ID"),[],t("Enter a valid PSN ID."));
                    return;
                }
                if(!list.some(n=>n.toLowerCase()===name.toLowerCase())){
                    list.push(name);
                    if (/^#[0-9a-f]{6}$/i.test(answer[1] || '')) { favoriteColors[name.toLowerCase()] = answer[1]; saveColors(); }
                    persist();
                }
            });
        const edit=make('button',favoritesEditing?t("Done"):t("Edit"),'td-link-button');
        edit.type='button';
        edit.addEventListener('click',()=>{
                favoritesEditing=!favoritesEditing;
                logEvent('favorites.edit');
                draw();
            });
        const actions=make('div',null,'td-favorite-actions');
        actions.append(add);
        let currentName = '';
        try { currentName = decodeURIComponent((profileInfo()?.path || '').replace(/^\//, '')); } catch (_) {}
        if (/^[a-zA-Z0-9_-]{1,16}$/.test(currentName)) {
            const alreadyAdded = list.some(name => name.toLowerCase() === currentName.toLowerCase());
            const current = make('button', t(alreadyAdded ? 'Already in favorites' : '+ Current player'), 'td-link-button td-fav-current');
            current.type = 'button'; current.disabled = alreadyAdded;
            current.title = t(alreadyAdded ? 'This player is already in your favorites.' : 'Add the currently viewed player.');
            current.setAttribute('aria-label', current.title);
            current.addEventListener('click', () => {
                const latest = readList('trophydeck.favoritePlayers');
                if (!latest.some(name => name.toLowerCase() === currentName.toLowerCase())) {
                    latest.push(currentName);
                    localStorage.setItem('trophydeck.favoritePlayers', JSON.stringify(latest));
                    logEvent('favorites.addCurrent');
                }
                draw();
            });
            actions.append(current);
        }
        actions.append(edit);
        body.append(actions);
    } draw();
    box.append(body);
    panel.append(box);
}

function openNotesManager() {
    const dialog=make('dialog');
    dialog.className='td-dialog td-manager';
    dialog.append(make('h2',t("MANAGE NOTES")));
    const list=make('div',null,'td-manager-list');
    dialog.append(list);
    function draw(){
        list.replaceChildren();
        const keys=[];
        for(let i=0;i<localStorage.length;i++){
            const k=localStorage.key(i);
            if(k==='trophydeck.globalNoteText'||k.startsWith('trophydeck.note./')||k.startsWith('trophydeck.gameNote./')||k.startsWith(GLOBAL_GAME_NOTE_PREFIX)) {
                if(localStorage.getItem(k)) {
                    keys.push(k);
                }
            }
        }
        keys.sort();
        if(!keys.length){
            list.append(make('p',t("No saved notes yet.")));
        }
        keys.forEach(key=>{
                const item=make('section',null,'td-managed-note');
                let label;
                if(key==='trophydeck.globalNoteText') {
                    label=t("Global note");
                }
                else if(key.startsWith(GLOBAL_GAME_NOTE_PREFIX)) {
                    label=t('Game note')+t(' · Game ID ')+key.slice(GLOBAL_GAME_NOTE_PREFIX.length);
                }
                else if(key.startsWith('trophydeck.gameNote./')) {
                    const part=key.slice('trophydeck.gameNote./'.length), split=part.lastIndexOf('.');
                    label=t('Previous game note · ')+part.slice(0,split)+t(' · Game ID ')+part.slice(split+1);
                }
                
                else {
                    label=t("Profile note · ")+key.slice('trophydeck.note./'.length);
                }
                item.append(make('strong',label));
                if(key.startsWith('trophydeck.gameNote./') || key.startsWith(GLOBAL_GAME_NOTE_PREFIX)) {
                    let info=null;
                    try{
                        info=JSON.parse(localStorage.getItem(key.replace('trophydeck.gameNote.','trophydeck.gameInfo.'))||'null');
                    }catch(_){}
                    if(info && info.name && /^\/trophies\/\d+[-/]/.test(info.href||'')){
                        const a=make('a',info.name,'td-note-game-link');
                        a.href=info.href;
                        item.append(a);
                    }
                    else {
                        item.append(make('small',t("The game name will appear after the next visit to the game or profile page."),'epic-muted'));
                    }
                }
                const area=make('textarea');
                area.wrap='soft';
                area.value=localStorage.getItem(key);
                area.setAttribute('aria-label',label);
                area.addEventListener('input',()=>localStorage.setItem(key,area.value));
                const del=make('button',t("Delete"),'td-danger');
                del.type='button';
                del.addEventListener('click',async()=>{
                        if(await tdDialog(t("Delete note"),[],t("Permanently delete this note?"))){
                            localStorage.removeItem(key);
                            draw();
                            updateGameNotes(true);
                            renderRail();
                        }
                    });
                item.append(area,del);
                list.append(item);
            });
    }
    draw();
    const clear=make('button',t("Delete all notes"),'td-danger');
    clear.type='button';
    clear.addEventListener('click',async()=>{
            if(!await tdDialog(t("Delete all notes"),[],t("Permanently delete all global, profile and game notes in this browser?"))){
                return;
            }
            const keys=[];
            for(let i=0;i<localStorage.length;i++){
                const key=localStorage.key(i);
                if(key==='trophydeck.globalNoteText'||key.startsWith('trophydeck.note./')||key.startsWith('trophydeck.gameNote./')||key.startsWith(GLOBAL_GAME_NOTE_PREFIX)){
                    keys.push(key);
                }
            }
            keys.forEach(key=>localStorage.removeItem(key));
            logEvent('notes.clearAll');
            draw();
            updateGameNotes(true);
            renderRail();
        });
    const close=make('button',t("Back"));
    close.type='button';
    close.addEventListener('click',()=>dialog.close());
    const footer=make('div',null,'td-manager-footer');
    footer.append(close,clear);
    dialog.append(footer);
    dialog.addEventListener('close',()=>{
            dialog.remove();
            updateGameNotes(true);
            renderRail();
            setTimeout(openSettings,0);
        });
    document.body.append(dialog);
    prepareDialog(dialog);
    dialog.showModal();
}


function cabinetKey(profile) {
    return 'trophydeck.gameCabinet.'+profile.path.toLowerCase();
}

function updateGameCabinet() {
    const profile=profileInfo();
    if(!profile){
        return;
    }
    const cabinetEnabled = enabled('trophydeck.cabinet');
    if (!cabinetEnabled) {
        document.querySelectorAll('.td-cabinet-add').forEach(e=>e.remove());
        if (!profileLayoutEditing) { document.querySelectorAll('[data-td-cabinet]').forEach(e=>e.remove()); return; }
    }
    const key=cabinetKey(profile);
    if (cabinetEnabled) document.querySelectorAll('tr td a.title[href*="/trophies/"]').forEach(link=>{
            const u=new URL(link.href,location.href), match=u.pathname.match(/^\/trophies\/(\d+)(?:-[^/]*)?\/([^/]+)\/?$/);
            if(!match || ('/'+match[2]).toLowerCase()!==profile.path.toLowerCase()){
                return;
            }
            const cell=link.closest('td'),row=link.closest('tr'),img=row && row.querySelector('picture.game img');
            if(!cell||!img){
                return;
            }
            const existing=cell.querySelector('.td-cabinet-add');
            if(existing){
                const saved=readList(key).some(g=>g.id===match[1]);
                existing.textContent=saved?'★':'☆';
                existing.dataset.saved=String(saved);
                existing.setAttribute('aria-label',saved?t("Remove from game cabinet"):t("Add to game cabinet"));
                return;
            }
            const add=make('button','☆','td-cabinet-add td-edit-control');
            add.type='button';
            add.title=t("Add game to cabinet");
            function sync(){
                const saved=readList(key).some(g=>g.id===match[1]);
                add.textContent=saved?'★':'☆';
                add.dataset.saved=String(saved);
                add.setAttribute('aria-label',saved?t("Remove from game cabinet"):t("Add to game cabinet"));
            }
            add.addEventListener('click',()=>{
                    const list=readList(key), index=list.findIndex(g=>g.id===match[1]);
                    if(index>=0){
                        list.splice(index,1);
                    }else {
                        list.push({id:match[1],name:link.textContent.trim(),href:u.pathname,img:img.currentSrc||img.src});
                    }
                    localStorage.setItem(key,JSON.stringify(list));
                    logEvent('cabinet.toggle');
                    sync();
                    renderCabinet();
                });
            link.parentElement.append(' ',add);
            sync();
        });
    function renderCabinet() {
        const sidebar=document.querySelector('#content > .td-profile-source > .sidebar') || document.querySelector('#content > .row:not(.td-unified-grid) > .sidebar');
        if(!sidebar){
            return;
        }
        let container=document.querySelector('[data-td-cabinet]');
        const anchor=Array.from(sidebar.querySelectorAll('div.title h3')).find(h=>h.textContent.trim()==='Trophy Cabinet');
        if(!container){
            container=make('section',null,'td-game-cabinet');
            container.dataset.tdCabinet='true';
            if(anchor){
                const title = anchor.closest('div.title');
                const section = title.closest('[data-td-profile-section]');
                (section && section.parentElement === sidebar ? section : title).before(container);
            }else {
                sidebar.prepend(container);
            }
        }
        container.replaceChildren();
        const list=readList(key);
        if (!list.length && !profileLayoutEditing) { container.remove(); return; }
        const heading=make('div',null,'title flex v-align');
        const grow=make('div',null,'grow');
        grow.append(make('h3',t("Game cabinet")));
        heading.append(grow);
        const grid=make('div',null,list.length ? 'box td-cabinet-grid' : 'box td-cabinet-empty');
        if (!list.length) grid.append(make('p', t(cabinetEnabled ? 'No games in the cabinet yet.' : 'Enable the game cabinet in settings.'), 'td-cabinet-placeholder'));
        list.forEach(game=>{
                const tile=make('div',null,'td-cabinet-tile');
                const open=make('a',null,'td-cabinet-image');
                open.href=game.href;
                open.title=game.name;
                open.setAttribute('aria-label',game.name+t(" open"));
                const img=make('img');
                img.src=game.img;
                img.alt=game.name;
                open.append(img);
                const del=make('button','−','td-cabinet-remove');
                del.type='button';
                del.title=t("Remove from cabinet");
                del.setAttribute('aria-label',game.name+t(" remove from cabinet"));
                del.addEventListener('click',()=>{
                        localStorage.setItem(key,JSON.stringify(readList(key).filter(g=>g.id!==game.id)));
                        logEvent('cabinet.remove');
                        updateGameCabinet();
                    });
                tile.append(open,del);
                if(enabled('trophydeck.cabinetNames')){
                    tile.append(make('span',game.name,'td-cabinet-name'));
                }grid.append(tile);
            });
        container.append(heading,grid);
    }
    renderCabinet();
}

function setupScrollControls() {
    let bottom=document.getElementById('td-scroll-bottom');
    if(!bottom){
        bottom=make('button');
        bottom.id='td-scroll-bottom';
        bottom.type='button';
        bottom.title=t("Scroll to bottom");
        bottom.setAttribute('aria-label',t("Scroll to bottom"));
        bottom.append(make('i',null,'fa fa-chevron-down'));
        bottom.addEventListener('click',()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'}));
        document.body.append(bottom);
    }
    bottom.hidden=!enabled('trophydeck.scrollButtons');
    document.documentElement.classList.remove('td-hide-scroll-buttons');
    document.documentElement.classList.toggle('td-has-scroll-down',enabled('trophydeck.scrollButtons'));
    function align(){
        const top=document.querySelector('a.scroll-top');
        if(!top){
            return;
        }
        const cs=getComputedStyle(top);
        const w=parseFloat(cs.width)||60,h=parseFloat(cs.height)||60,r=parseFloat(cs.right)||20,b=parseFloat(cs.bottom)||20;
        bottom.style.width=w+'px';
        bottom.style.height=h+'px';
        bottom.style.right=r+'px';
        bottom.style.bottom=b+'px';
    }
    align();
    if(!bottom.dataset.tdResize){
        window.addEventListener('resize',align,{passive:true});
        bottom.dataset.tdResize='true';
    }
}

function railRectanglesIntersect(a, b) {
    return !!(a && b && a.width > 0 && a.height > 0 && b.width > 0 && b.height > 0 &&
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
}

function positionPsnpProfileMenu(rail) {
    const railRect = rail?.getBoundingClientRect();
    const canMove = rail && rail.classList.contains('epic-left') && !rail.classList.contains('epic-closed');
    document.querySelectorAll('.psnpp-floating-menu').forEach(menu => {
        const isProfileMenu = Array.from(menu.querySelectorAll('a')).some(link => link.textContent.trim().toLowerCase() === 'update profile');
        if (!isProfileMenu) return;
        const bounds = menu.getBoundingClientRect();
        const originalLeft = parseFloat(menu.style.left);
        const left = Number.isFinite(originalLeft) ? originalLeft : 20;
        const originalBounds = {left, right:left+bounds.width, top:bounds.top, bottom:bounds.bottom, width:bounds.width, height:bounds.height};
        menu.classList.toggle('td-psnpp-menu-right', !!canMove && railRectanglesIntersect(railRect, originalBounds));
    });
}

function updateRailOverlap(rail = document.getElementById('trophydeck-rail')) {
    positionPsnpProfileMenu(rail);
    if (!rail) return;
    const tab = rail.querySelector('.epic-tab');
    if (!tab) return;
    const tabRect = tab.getBoundingClientRect();
    const profile = profileInfo();
    const nav = profile?.nav.closest('.title-bar');
    const sticky = document.getElementById('trophydeck-sticky');
    const headers = [nav, sticky && !sticky.hidden ? sticky : null].filter(Boolean);
    const headerOverlap = headers.some(element => railRectanglesIntersect(tabRect, element.getBoundingClientRect()));
    const menuOverlap = Array.from(document.querySelectorAll('.psnpp-floating-menu')).some(element => {
        const style = getComputedStyle(element);
        if (element.hidden || style.display === 'none' || style.visibility === 'hidden') return false;
        return railRectanglesIntersect(tabRect, element.getBoundingClientRect());
    });
    rail.classList.toggle('td-rail-overlap', headerOverlap || menuOverlap);
}

// Keep the tab beside the page when closed and the full sidebar on screen when open.
function pageDockLeft(page, viewportWidth, panelWidth, tabWidth, isLeft, closed) {
    const total = panelWidth + tabWidth;
    const clamp = (value, max) => Math.max(0, Math.min(Math.max(0, max), value));
    if (closed) {
        const tabLeft = clamp(isLeft ? page.left - tabWidth : page.right, viewportWidth - tabWidth);
        return tabLeft;
    }
    return clamp(isLeft ? page.left - total : page.right, viewportWidth - total);
}

function usePageDock(anchor, page, viewportWidth, panelWidth, tabWidth, isLeft) {
    if (!page || page.width <= 0) return false;
    if (anchor === 'page') return true;
    if (anchor === 'screen') return false;
    const freeSpace = isLeft ? page.left : viewportWidth - page.right;
    return freeSpace >= panelWidth + tabWidth;
}

function applyRailHorizontalPosition(rail) {
    const page = document.querySelector('#content')?.closest('.width');
    const tab = rail.querySelector('.epic-tab');
    const panel = rail.querySelector('.epic-panel');
    if (!tab || !panel) return;
    const viewport = document.documentElement.clientWidth || window.innerWidth;
    const panelWidth = Math.max(0, Math.min(railWidth(), window.innerWidth * .45, window.innerWidth - 40));
    const isLeft = rail.classList.contains('epic-left');
    const closed = rail.classList.contains('epic-closed');
    const rect = page?.getBoundingClientRect();
    const docked = usePageDock(localStorage.getItem('trophydeck.horizontalAnchor') || 'auto', rect,
        viewport, panelWidth, tab.offsetWidth, isLeft);
    rail.classList.toggle('td-page-docked', docked);
    if (docked) {
        const left = pageDockLeft(rect, viewport, panelWidth, tab.offsetWidth, isLeft, closed);
        rail.style.left = left + 'px';
        rail.style.right = 'auto';
    } else {
        rail.style.removeProperty('left');
        rail.style.removeProperty('right');
    }
    const arrow = tab.querySelector('.epic-tab-arrow');
    if (arrow) {
        const opensRight = isLeft !== docked;
        arrow.textContent = opensRight ? (closed ? '»' : '«') : (closed ? '«' : '»');
    }
}

function applyRailPosition() {
    const rail=document.getElementById('trophydeck-rail');
    if(!rail){
        return;
    }
    applyRailHorizontalPosition(rail);
    const pct=Math.min(90,Math.max(0,Number(localStorage.getItem('trophydeck.positionPercent')||22)));
    const base=window.innerHeight*pct/100;
    const profile=profileInfo();
    const nav=profile?.nav.closest('.title-bar') || document.querySelector('.title-bar:has(.navigation)');
    const navRect=nav?.getBoundingClientRect();
    const sticky=document.getElementById('trophydeck-sticky');
    const stickyRect=sticky&&!sticky.hidden?sticky.getBoundingClientRect():null;
    const fixed=localStorage.getItem('trophydeck.positionMode')==='fixed';
    // Fixed mode uses the original profile bar consistently, independent of the floating copy.
    const fixedHeight=sticky ? parseFloat(getComputedStyle(sticky).minHeight) : 0;
    const headerHeight=fixed ? (fixedHeight || (navRect && navRect.height>0 ? navRect.height : 58)) : (stickyRect && stickyRect.height>0 ? stickyRect.height : navRect && navRect.height>0 ? navRect.height : 58);
    rail.style.setProperty('--td-header-height',headerHeight+'px');
    const header=rail.querySelector('.epic-header');
    if(header){
        header.style.height=headerHeight+'px';
        header.style.minHeight=headerHeight+'px';
        header.style.paddingBlock='2px';
        header.style.boxSizing='border-box';
    }
    if(localStorage.getItem('trophydeck.positionMode')!=='fixed' && localStorage.getItem('trophydeck.positionDocked')!=='false' && navRect){
        rail.style.top=Math.max(0,navRect.top)+'px';
        updateRailOverlap(rail);
        return;
    }
    const anchor=Number(localStorage.getItem('trophydeck.positionAnchorScroll')||0);
    rail.style.top=Math.max(0,localStorage.getItem('trophydeck.positionMode')==='fixed'?base:base-Math.max(0,window.scrollY-anchor))+'px';
    updateRailOverlap(rail);
}

function enableRailDragging(header) {
    header.title=t("Drag up or down to move");
    header.addEventListener('pointerdown',event=>{
            if(event.button!==0||event.target.closest('button')){
                return;
            }
            const rail=header.closest('#trophydeck-rail');
            const start=event.clientY,top=rail.getBoundingClientRect().top;
            header.setPointerCapture(event.pointerId);
            let moved=false;
            const move=e=>{
                if(Math.abs(e.clientY-start)>3){
                    moved=true;
                }const pos=Math.max(0,Math.min(window.innerHeight*.9,top+e.clientY-start));
                localStorage.setItem('trophydeck.positionPercent',String(Math.round(pos/window.innerHeight*100)));
                rail.style.top=pos+'px';
                updateRailOverlap(rail);
            };
            const stop=()=>{
                header.removeEventListener('pointermove',move);
                header.removeEventListener('pointerup',stop);
                header.removeEventListener('pointercancel',stop);
                if(moved){
                    const nav=document.querySelector('.title-bar:has(.navigation)');
                    const target=nav?Math.max(0,nav.getBoundingClientRect().top):null;
                    const current=parseFloat(rail.style.top);
                    const dock=target!==null && Math.abs(current-target)<=24 && localStorage.getItem('trophydeck.positionMode')!=='fixed';
                    localStorage.setItem('trophydeck.positionDocked',String(dock));
                    localStorage.setItem('trophydeck.positionAnchorScroll',String(window.scrollY));
                    logEvent('deck.move');
                    applyRailPosition();
                }
            };
            header.addEventListener('pointermove',move);
            header.addEventListener('pointerup',stop);
            header.addEventListener('pointercancel',stop);
        });
}


// Profile layout is stored independently of PSNProfiles and PSNP+ settings.
const profileLayoutDefinitions = [
    {id:'recent', label:'Recent trophies', zone:'top'},
    {id:'games', label:'Games list', zone:'main'},
    {id:'gameCabinet', label:'Game cabinet', zone:'sidebar'},
    {id:'scanned', label:'Scanned games', zone:'sidebar'},
    {id:'trophyCabinet', label:'Trophy cabinet', zone:'sidebar'},
    {id:'rarest', label:'Rarest trophies', zone:'sidebar'},
    {id:'milestones', label:'Trophy milestones', zone:'sidebar'},
    {id:'updateInfo', label:'Profile update status', zone:'sidebar'}
];
const profileLayoutKey = 'trophydeck.profileLayout';
let profileLayoutEditing = false;
let draggedProfileSection = null;

function readProfileLayout() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(profileLayoutKey) || '{}') || {}; } catch (_) {}
    const items = Array.isArray(saved.items) ? saved.items : [];
    const known = new Set(profileLayoutDefinitions.map(item => item.id));
    const order = [...new Set(items.map(item => item && item.id).filter(id => known.has(id)))];
    profileLayoutDefinitions.forEach(item => { if (!order.includes(item.id)) order.push(item.id); });
    return order.map(id => {
        const previous = items.find(item => item && item.id === id) || {};
        const defaultSpan = id === 'recent' ? 3 : id === 'games' ? 2 : 1;
        const span = [1,2,3].includes(previous.span) ? previous.span : (previous.full ? 3 : defaultSpan);
        const safeSpan = id === 'recent' ? 3 : id === 'games' ? Math.max(2, span) : span;
        const defaultColumn = id === 'recent' || id === 'games' ? 0 : 2;
        let col = Number.isInteger(previous.col) ? previous.col : (previous.zone === 'left' ? 0 : previous.zone === 'center' ? 1 : previous.zone === 'sidebar' ? 2 : id === 'games' && previous.align === 'right' ? 1 : defaultColumn);
        col = Math.max(0, Math.min(3 - safeSpan, col));
        return {id, span:safeSpan, col, hidden:previous.hidden === true, breakBefore:previous.breakBefore === true};
    });
}

function saveProfileLayout(items) {
    localStorage.setItem(profileLayoutKey, JSON.stringify({version:2, items}));
    logEvent('profileLayout.change');
    applyProfileLayout();
}

function profileLayoutAreas() {
    const profile = profileInfo();
    if (!profile || location.pathname.replace(/\/$/, '').toLowerCase() !== profile.path.toLowerCase()) return null;
    const content = document.querySelector('#content');
    const row = content && content.querySelector(':scope > .row:not(.td-unified-grid)');
    const sidebar = row && row.querySelector(':scope > .sidebar');
    const main = row && row.querySelector(':scope > .col-xs-8');
    if (!content || !row || !sidebar || !main) return null;
    row.classList.add('td-profile-source');
    let grid = content.querySelector(':scope > [data-td-unified-grid]');
    if (!grid) {
        grid = make('div', null, 'td-unified-grid row');
        grid.dataset.tdUnifiedGrid = 'true';
        row.before(grid);
    }
    return {content, row, main, sidebar, grid};
}

function collectProfileSections(areas) {
    const {content, main, sidebar} = areas;
    const sections = {};
    content.querySelectorAll('[data-td-profile-section]').forEach(element => { sections[element.dataset.tdProfileSection] = element; });
    if (!sections.recent) {
        const recent = content.querySelector('#recent-trophies');
        if (recent) {
            const wrapper = make('div', null, 'td-profile-section');
            wrapper.dataset.tdProfileSection = 'recent';
            recent.before(wrapper); wrapper.append(recent); sections.recent = wrapper;
        }
    }
    if (!sections.games) {
        const heading = Array.from(main.querySelectorAll(':scope > .title h3')).find(node => /^games(?:\s*\([^)]*\))?$/i.test(node.textContent.trim()));
        if (heading) {
            const wrapper = make('div', null, 'td-profile-section');
            wrapper.dataset.tdProfileSection = 'games';
            wrapper.classList.add('col-xs-8');
            while (main.firstChild) wrapper.append(main.firstChild);
            main.append(wrapper); sections.games = wrapper;
        }
    }
    const cabinet = content.querySelector('[data-td-cabinet]');
    if (cabinet && !sections.gameCabinet) {
        cabinet.dataset.tdProfileSection = 'gameCabinet';
        cabinet.classList.add('td-profile-section');
        sections.gameCabinet = cabinet;
    }
    const titles = {'scanned games':'scanned','trophy cabinet':'trophyCabinet','rarest trophies':'rarest','rarest unique trophies':'rarest','trophy milestones':'milestones'};
    // PSNP+ can insert its scanned-games block beside the cabinet title after
    // Trophy Deck has already moved that title into the grid.
    const sidebarHosts = [sidebar, sections.trophyCabinet].filter(Boolean);
    for (const host of sidebarHosts) Array.from(host.querySelectorAll(':scope > .title h3')).forEach(heading => {
        const id = titles[heading.textContent.trim().toLowerCase().replace(/\s*\([^)]*\)$/, '')];
        const title = heading.closest('.title');
        const box = title && title.nextElementSibling;
        if (!id || sections[id] || !box || !box.matches('.box')) return;
        const wrapper = make('div', null, 'td-profile-section');
        if (id === 'trophyCabinet') wrapper.classList.add('sidebar');
        wrapper.dataset.tdProfileSection = id;
        title.before(wrapper); wrapper.append(title, box); sections[id] = wrapper;
    });
    if (!sections.updateInfo) {
        const status = Array.from(sidebar.querySelectorAll(':scope > span.floatr')).find(element => {
            const small = element.querySelector('small');
            return small && /^updated\b/i.test(small.textContent.trim());
        });
        if (status) {
            const wrapper = make('div', null, 'td-profile-section td-profile-update sidebar');
            wrapper.dataset.tdProfileSection = 'updateInfo';
            status.before(wrapper); wrapper.append(status); sections.updateInfo = wrapper;
        }
    }
    return sections;
}

// Packs blocks into whole rows of three slots, with no overlapping cells.
function packProfileRows(items, visibleIds) {
    const placement = new Map();
    let row = 0, occupied = [false, false, false];
    for (const item of items) {
        if (visibleIds && !visibleIds.has(item.id)) continue;
        if (item.breakBefore && occupied.some(Boolean)) { row++; occupied = [false, false, false]; }
        function findSlot() {
            const valid = col => col >= 0 && col + item.span <= 3 && occupied.slice(col, col + item.span).every(value => !value);
            if (valid(item.col)) return item.col;
            for (let col = 0; col <= 3 - item.span; col++) if (valid(col)) return col;
            return -1;
        }
        let col = findSlot();
        if (col < 0) { row++; occupied = [false, false, false]; col = findSlot(); }
        for (let i = col; i < col + item.span; i++) occupied[i] = true;
        placement.set(item.id, {row, col});
    }
    return placement;
}

function visibleProfileIds() {
    const areas = profileLayoutAreas();
    if (!areas) return new Set();
    return new Set(Array.from(areas.grid.children).filter(section => section.dataset.tdProfileSection && !section.hidden).map(section => section.dataset.tdProfileSection));
}

let profileGridObserver = null;
let profileGridFrame = 0;
function scheduleProfileGrid() {
    if (profileGridFrame) return;
    profileGridFrame = requestAnimationFrame(() => {
        profileGridFrame = 0;
        const grid = document.querySelector('[data-td-unified-grid]');
        if (!grid) return;
        const heights = Array.from(grid.children)
            .filter(section => section.dataset.tdProfileSection && !section.hidden)
            .map(section => [section, section.getBoundingClientRect().height]);
        // Finer tracks preserve the site's spacing; cap the total implicit tracks
        // for very long profiles so browser grid limits are not exceeded.
        const unit = Math.max(1, Math.ceil(heights.reduce((sum, entry) => sum + entry[1], 0) / 8000));
        const unitValue = unit + 'px';
        if (grid.style.gridAutoRows !== unitValue) grid.style.gridAutoRows = unitValue;
        heights.forEach(([section, height]) => {
            const span = 'span ' + Math.max(1, Math.ceil(height / unit));
            if (section.style.gridRowEnd !== span) section.style.gridRowEnd = span;
        });
    });
}

const PROFILE_EDIT_GAME_LIMIT = 15;
const PROFILE_EDIT_MILESTONE_LIMIT = 15;
function updateProfileGamePreview(section) {
    if (!section) return;
    for (const table of section.querySelectorAll('#gamesTable, #search-results')) {
        let count = 0;
        table.querySelectorAll('tr').forEach(row => {
            if (!row.querySelector('a.title[href*="/trophies/"]')) return;
            count++;
            row.classList.toggle('td-profile-game-overflow', profileLayoutEditing && count > PROFILE_EDIT_GAME_LIMIT);
        });
    }
}

function updateProfileMilestonePreview(section) {
    if (!section) return;
    let count = 0;
    section.querySelectorAll('table.box tr').forEach(row => {
        count++;
        row.classList.toggle('td-profile-milestone-overflow', profileLayoutEditing && count > PROFILE_EDIT_MILESTONE_LIMIT);
    });
}

// The site's infinite-scroll handler checks nextPage on scroll. Temporarily set it
// to zero for the duration of that event, without blocking unrelated listeners.
let profileNextPageRestore = null;
function pauseProfileAutoloadForScroll() {
    if (!profileLayoutEditing || profileNextPageRestore || !(window.nextPage > 0)) return;
    const saved = window.nextPage;
    window.nextPage = 0;
    profileNextPageRestore = () => {
        if (window.nextPage === 0) window.nextPage = saved;
        profileNextPageRestore = null;
    };
    setTimeout(() => { if (profileNextPageRestore) profileNextPageRestore(); }, 0);
}


function applyProfileLayout() {
    const areas = profileLayoutAreas();
    if (!areas) return;
    const sections = collectProfileSections(areas), items = readProfileLayout();
    if (!profileGridObserver && typeof ResizeObserver !== 'undefined') profileGridObserver = new ResizeObserver(scheduleProfileGrid);
    updateProfileGamePreview(sections.games);
    updateProfileMilestonePreview(sections.milestones);
    for (const item of items) {
        const section = sections[item.id];
        if (!section) continue;
        section.hidden = item.hidden && !profileLayoutEditing;
        section.dataset.tdSpan = String(item.span);

        if (profileLayoutEditing) updateProfileSectionControls(section, item);
        if (section.parentElement !== areas.grid) {
            areas.grid.append(section);
            if (profileGridObserver) profileGridObserver.observe(section);
        }
    }
    let anchor = null;
    for (const item of items.slice().reverse()) {
        const section = sections[item.id];
        if (!section) continue;
        if (section.nextElementSibling !== anchor) areas.grid.insertBefore(section, anchor);
        anchor = section;
    }
    for (const item of items) {
        const section = sections[item.id];
        if (!section || section.hidden) continue;
        section.style.gridColumn = (item.col + 1) + ' / span ' + item.span;
        section.style.gridRowStart = 'auto';
        if (!section.style.gridRowEnd) section.style.gridRowEnd = 'span 1';
    }
    // Keep unrecognized site sections intact, including the flagged notice.
    const hasExtras = [areas.main, areas.sidebar].some(parent => Array.from(parent.children).some(child => !['SCRIPT','STYLE'].includes(child.tagName)));
    areas.row.classList.toggle('td-profile-source-empty', !hasExtras);
    if (profileLayoutEditing) for (const item of items) if (sections[item.id]) updateProfileSectionControls(sections[item.id], item);
    scheduleProfileGrid();
}

function moveProfileSection(items, id, col, targetId, after = false) {
    const next = items.map(item => ({...item}));
    const source = next.findIndex(item => item.id === id);
    if (source < 0) return next;
    const [moved] = next.splice(source, 1);
    moved.col = Math.max(0, Math.min(3 - moved.span, Number.isFinite(col) ? col : moved.col));
    moved.breakBefore = false;
    const target = next.findIndex(item => item.id === targetId);
    if (target >= 0) next.splice(target + (after ? 1 : 0), 0, moved);
    else if (id === targetId) next.splice(source, 0, moved);
    else next.push(moved);
    return next;
}

function resizeProfileSection(items, id, span, visibleIds) {
    const next = items.map(item => ({...item}));
    const index = next.findIndex(item => item.id === id);
    if (index < 0 || id === 'recent') return next;
    const before = packProfileRows(next, visibleIds), position = before.get(id);
    const selected = next[index];
    selected.span = id === 'games' ? Math.max(2, Math.min(3, span)) : Math.max(1, Math.min(3, span));
    selected.col = Math.min(selected.col, 3 - selected.span);
    const trial = packProfileRows(next, visibleIds).get(id);
    if (position && trial && trial.row !== position.row) {
        const rowStart = next.findIndex(entry => before.get(entry.id)?.row === position.row);
        if (rowStart >= 0 && rowStart < index) { next.splice(index, 1); next.splice(rowStart, 0, selected); }
        selected.col = 0;
        selected.breakBefore = position.row > 0;
    }
    return next;
}

function swapGamesInRow(items, visibleIds) {
    const next = items.map(item => ({...item}));
    const game = next.find(item => item.id === 'games');
    if (!game || game.span !== 2) return next;
    const areas = profileLayoutAreas();
    const elements = new Map(areas ? Array.from(areas.grid.children).filter(element => element.dataset.tdProfileSection).map(element => [element.dataset.tdProfileSection, element]) : []);
    const gameElement = elements.get('games');
    const gameBounds = gameElement && gameElement.getBoundingClientRect();
    const right = game.col === 0;
    const sourceColumn = right ? 2 : 0;
    for (const item of next) {
        if (item.id === 'games' || item.span !== 1 || item.col !== sourceColumn || !visibleIds.has(item.id)) continue;
        const element = elements.get(item.id), bounds = element && element.getBoundingClientRect();
        if (!gameBounds || !bounds || (bounds.top < gameBounds.top + gameBounds.height && bounds.top + bounds.height > gameBounds.top)) item.col = right ? 0 : 2;
    }
    game.col = right ? 1 : 0;
    return next;
}

function resetProfileLayout() {
    saveProfileLayout(profileLayoutDefinitions.map(({id}) => ({id, span:id === 'recent' ? 3 : id === 'games' ? 2 : 1, col:id === 'recent' || id === 'games' ? 0 : 2, hidden:false})));
}

function clearProfileDropIndicators() {
    document.querySelectorAll('.td-profile-drop-before, .td-profile-drop-after, .td-profile-drop-zone').forEach(element => {
        element.classList.remove('td-profile-drop-before', 'td-profile-drop-after', 'td-profile-drop-zone');
    });
}

function installProfileDropZone(grid) {
    if (grid.dataset.tdDropReady) return;
    grid.dataset.tdDropReady = 'true';
    function targetFor(event) {
        const section = event.target.closest('[data-td-profile-section]');
        return section && section.parentElement === grid ? section : null;
    }
    grid.addEventListener('dragover', event => {
        if (!profileLayoutEditing || !draggedProfileSection) return;
        event.preventDefault(); event.dataTransfer.dropEffect = 'move';
        clearProfileDropIndicators();
        const target = targetFor(event);
        if (target && target.dataset.tdProfileSection !== draggedProfileSection) {
            const bounds = target.getBoundingClientRect();
            target.classList.add(event.clientY > bounds.top + bounds.height / 2 ? 'td-profile-drop-after' : 'td-profile-drop-before');
        } else grid.classList.add('td-profile-drop-zone');
    });
    grid.addEventListener('drop', event => {
        if (!profileLayoutEditing || !draggedProfileSection) return;
        event.preventDefault();
        const bounds = grid.getBoundingClientRect();
        const column = Math.max(0, Math.min(2, Math.floor(3 * (event.clientX - bounds.left) / bounds.width)));
        const target = targetFor(event);
        const after = !!target && event.clientY > target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
        const items = moveProfileSection(readProfileLayout(), draggedProfileSection, column, target?.dataset.tdProfileSection, after);
        draggedProfileSection = null;
        clearProfileDropIndicators(); saveProfileLayout(items);
    });
}

function updateProfileSectionControls(section, item) {
    section.classList.toggle('td-profile-section-hidden', item.hidden);
    let toolbar = section.querySelector(':scope > .td-profile-section-controls');
    if (!toolbar) {
        toolbar = make('div', null, 'td-profile-section-controls');
        const handle = make('button', '', 'td-profile-drag');
        setProfileLayoutIcon(handle, 'drag');
        handle.type = 'button'; handle.draggable = true;
        handle.title = t('Drag to move this section');
        handle.setAttribute('aria-label', t('Drag section to reorder'));
        handle.addEventListener('dragstart', event => {
            draggedProfileSection = section.dataset.tdProfileSection;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', draggedProfileSection);
            if (event.dataTransfer.setDragImage) event.dataTransfer.setDragImage(section, 20, 20);
            section.classList.add('td-profile-dragging');
        });
        handle.addEventListener('dragend', () => {
            draggedProfileSection = null; section.classList.remove('td-profile-dragging'); clearProfileDropIndicators();
        });
        const title = make('strong', t(profileLayoutDefinitions.find(entry => entry.id === item.id).label));
        const visibility = make('button', '', 'td-profile-visibility'); visibility.type = 'button';
        visibility.addEventListener('click', () => {
            const items = readProfileLayout();
            const current = items.find(entry => entry.id === section.dataset.tdProfileSection);
            if (current) { current.hidden = !current.hidden; saveProfileLayout(items); }
        });
        function moveButton(symbol, direction, label) {
            const button = make('button', symbol, direction < 0 ? 'td-profile-up' : 'td-profile-down');
            button.type = 'button'; button.title = t(label);
            button.setAttribute('aria-label', t(label) + ': ' + t(profileLayoutDefinitions.find(entry => entry.id === item.id).label));
            button.addEventListener('click', () => {
                const siblings = Array.from(section.parentElement.children).filter(child => child.dataset.tdProfileSection);
                const neighbor = siblings[siblings.indexOf(section) + direction];
                if (!neighbor) return;
                const items = readProfileLayout();
                const current = items.find(entry => entry.id === section.dataset.tdProfileSection);
                if (current) saveProfileLayout(moveProfileSection(items, current.id, current.col, neighbor.dataset.tdProfileSection, direction > 0));
            });
            return button;
        }
        const up = moveButton('', -1, 'Move section up'); setProfileLayoutIcon(up, 'up');
        const down = moveButton('', 1, 'Move section down'); setProfileLayoutIcon(down, 'down');
        const width = make('button', '', 'td-profile-width'); width.type = 'button';
        width.addEventListener('click', () => {
            const items = readProfileLayout();
            const current = items.find(entry => entry.id === section.dataset.tdProfileSection);
            if (!current) return;
            if (current.id === 'recent') return;
            const span = current.id === 'games' ? (current.span === 2 ? 3 : 2) : current.span % 3 + 1;
            saveProfileLayout(resizeProfileSection(items, current.id, span, visibleProfileIds()));
        });
        const spanLabel = make('span', '', 'td-profile-span-label');
        if (item.id === 'games') {
            const align = make('button', '', 'td-profile-align'); align.type = 'button';
            align.addEventListener('click', () => saveProfileLayout(swapGamesInRow(readProfileLayout(), visibleProfileIds())));
            toolbar.append(handle, title, up, down, align, spanLabel, width, visibility);
        } else toolbar.append(handle, title, up, down, spanLabel, width, visibility);
        section.prepend(toolbar);
    }
    const width = toolbar.querySelector('.td-profile-width');
    const wide = item.span === 3;
    width.disabled = item.id === 'recent';
    setProfileLayoutIcon(width, wide ? 'shrink' : 'expand');
    width.title = item.id === 'recent' ? t('Recent trophies always use full width') : t('Change section width') + ' (' + item.span + '/3)';
    width.setAttribute('aria-label', width.title + ': ' + t(profileLayoutDefinitions.find(entry => entry.id === item.id).label));
    width.setAttribute('aria-pressed', String(wide));
    const label = toolbar.querySelector('.td-profile-span-label');
    if (label.textContent !== item.span + '/3') label.textContent = item.span + '/3';
    const visibility = toolbar.querySelector('.td-profile-visibility');
    const siblings = Array.from(section.parentElement.children).filter(child => child.dataset.tdProfileSection);
    const siblingIndex = siblings.indexOf(section);
    toolbar.querySelector('.td-profile-up').disabled = siblingIndex <= 0;
    toolbar.querySelector('.td-profile-down').disabled = siblingIndex < 0 || siblingIndex >= siblings.length - 1;
    if (item.id === 'games') {
        const align = toolbar.querySelector('.td-profile-align');
        const gameOnRight = item.col === 1;
        setProfileLayoutIcon(align, gameOnRight ? 'alignLeft' : 'alignRight');
        align.title = gameOnRight ? t('Move games to the left') : t('Move games to the right');
        align.setAttribute('aria-label', align.title); align.disabled = item.span === 3;
    }
    setProfileLayoutIcon(visibility, item.hidden ? 'eyeOff' : 'eye');
    visibility.title = item.hidden ? t('Show section') : t('Hide section');
    visibility.setAttribute('aria-label', visibility.title + ': ' + t(profileLayoutDefinitions.find(entry => entry.id === item.id).label));
}

function setProfileLayoutEditing(editing) {
    const areas = profileLayoutAreas();
    if (!areas) { tdDialog(t('Profile layout'), [], t('Open a profile page to arrange its sections.')); return false; }
    profileLayoutEditing = editing;
    updateGameCabinet();
    if (!editing && profileNextPageRestore) profileNextPageRestore();
    document.querySelectorAll('[data-td-layout-controls]').forEach(bar => {
        const button = bar.querySelector('.td-profile-layout-edit');
        setProfileLayoutIcon(button, editing ? 'done' : 'edit');
        button.title = editing ? t('Done editing profile layout') : t('Edit profile layout');
        button.setAttribute('aria-label', button.title);
        button.setAttribute('aria-pressed', String(editing));
        bar.querySelector('.td-profile-layout-reset').hidden = !editing;
        if (bar.parentElement?.classList.contains('td-profile-nav-controls-host')) bar.parentElement.classList.toggle('td-profile-nav-editing', editing);
    });
    areas.grid.classList.toggle('td-profile-edit-zone', editing);
    installProfileDropZone(areas.grid);
    if (!editing) {
        draggedProfileSection = null;
        clearProfileDropIndicators();
        areas.content.querySelectorAll('.td-profile-section-controls').forEach(element => element.remove());
        areas.content.querySelectorAll('.td-profile-section-hidden, .td-profile-dragging').forEach(element => element.classList.remove('td-profile-section-hidden', 'td-profile-dragging'));
    }
    applyProfileLayout();
    return true;
}

const profileLayoutIcons = {
    palette: 'M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 1.4-3.4 1.6 1.6 0 0 1 1.2-2.7h1A3.7 3.7 0 0 0 21 11c0-4.4-4-8-9-8z M7.5 10h.01 M10 7h.01 M14 7h.01 M17 10h.01',
    accountUser:'M20 21v-2a7 7 0 0 0-14 0v2 M13 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    accountList:'M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
    accountLog:'M5 4h14v16H5z M8 8h8 M8 12h8 M8 16h5',
    accountAdvisor:'M12 3l2.4 5 5.5.8-4 4 .9 5.5-4.8-2.5-4.8 2.5.9-5.5-4-4 5.5-.8z',
    accountStats:'M4 20V11 M10 20V5 M16 20v-7 M22 20H2',
    accountRefresh:'M3 12a9 9 0 1 0 3-6.7 M3 3v6h6',
    edit: 'M12 20h9 M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4z',
    alignRight: 'M4 7h16 M4 12h16 M4 17h16 M15 4l4 3-4 3', alignLeft: 'M4 7h16 M4 12h16 M4 17h16 M9 4L5 7l4 3',
    done: 'M5 12l5 5L20 6', reset: 'M3 12a9 9 0 1 0 3-6.7 M3 3v6h6',
    drag: 'M12 2v20 M2 12h20 M9 5l3-3 3 3 M9 19l3 3 3-3 M5 9l-3 3 3 3 M19 9l3 3-3 3',
    up: 'M6 14l6-6 6 6', down: 'M6 10l6 6 6-6',
    expand: 'M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5',
    shrink: 'M4 9h5V4 M15 4v5h5 M20 15h-5v5 M9 20v-5H4',
    eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    eyeOff: 'M3 3l18 18 M10 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a14 14 0 0 1-3 3.4 M6.4 6.4A15 15 0 0 0 2 12s3.5 6 10 6c1.4 0 2.6-.3 3.7-.7'
};
function setProfileLayoutIcon(button, name) {
    if (button.dataset.tdIcon === name) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', profileLayoutIcons[name]); svg.append(path); button.replaceChildren(svg);
    button.dataset.tdIcon = name;
}
function makeProfileLayoutControls(id) {
    const bar = make('span', null, 'td-profile-layout-bar');
    if (id) bar.id = id;
    bar.dataset.tdLayoutControls = 'true';
    const button = make('button', '', 'td-profile-layout-edit');
    button.type = 'button'; button.title = profileLayoutEditing ? t('Done editing profile layout') : t('Edit profile layout');
    button.setAttribute('aria-label', button.title); button.setAttribute('aria-pressed', String(profileLayoutEditing));
    setProfileLayoutIcon(button, profileLayoutEditing ? 'done' : 'edit');
    button.addEventListener('click', () => setProfileLayoutEditing(!profileLayoutEditing));
    const reset = make('button', '', 'td-profile-layout-reset');
    reset.type = 'button'; reset.title = t('Restore profile layout'); reset.setAttribute('aria-label', reset.title);
    reset.hidden = !profileLayoutEditing; setProfileLayoutIcon(reset, 'reset');
    reset.addEventListener('click', resetProfileLayout);
    for (const control of [button, reset]) {
        for (const [property, value] of Object.entries({width:'32px', 'min-width':'32px', 'max-width':'32px', height:'32px', 'min-height':'32px', 'max-height':'32px', padding:'0', margin:'0', border:'0', 'box-sizing':'border-box'})) control.style.setProperty(property, value, 'important');
    }
    bar.append(button, reset);
    return bar;
}
function setupProfileLayoutEditor() {
    const areas = profileLayoutAreas();
    if (!areas) return;
    const profile = profileInfo();
    const nav = profile?.nav;
    const host = nav?.parentElement;
    if (host && !document.getElementById('td-profile-layout-bar')) {
        host.classList.add('td-profile-nav-controls-host');
        host.append(makeProfileLayoutControls('td-profile-layout-bar'));
    }
    const sticky = document.getElementById('trophydeck-sticky');
    if (sticky && !sticky.querySelector('[data-td-layout-controls]')) sticky.append(makeProfileLayoutControls());
}


const quickSettingGroups = [
    ['profile', 'Profile page', ['hideFlaggedBox', 'stickyNav', 'scrollButtons', 'cabinet', 'cabinetNames', 'hidePsnpVersion']],
    ['deck', 'Deck sections', ['showAccountLinks', 'showStats', 'showLinks', 'showNote', 'globalNote', 'customLinks', 'favorites']],
    ['notes', 'Game notes', ['gameNotes', 'noteWrap']],
    ['appearance', 'Colors', ['psnpColors']]
];

const openQuickSettingGroups = new Set();

function renderRail() {
    const old = document.getElementById('trophydeck-rail');
    const previousScroll=(old?.querySelector('.epic-panel-scroll') || old?.querySelector('.epic-panel'))?.scrollTop || 0;
    if (old) {
        old.remove();
    }
    if (!enabled('trophydeck.showRail')) {
        updateRailOverlap(null);
        return;
    }
    const root = make('aside');
    root.id = 'trophydeck-rail';
    root.style.setProperty('--epic-width', railWidth() + 'px');
    root.style.setProperty('--epic-height',(Number(localStorage.getItem('trophydeck.panelHeight'))||72)+'vh');
    const isLeft = localStorage.getItem('trophydeck.side') === 'left';
    root.classList.toggle('epic-left', isLeft);
    root.classList.toggle('epic-closed', !railOpen);
    const tab = make('button', '', 'epic-tab');
    tab.type = 'button';
    const tabArrow = make('span', '', 'epic-tab-arrow');
    const tabTitle = make('span', 'TROPHY HUB', 'epic-tab-title');
    tab.append(tabArrow, tabTitle);
    function updateTab() {
        tabArrow.textContent = isLeft ? (railOpen ? '«' : '»') : (railOpen ? '»' : '«');
        tabTitle.hidden = railOpen;
        tab.setAttribute('aria-label', railOpen ? t("Collapse Trophy Deck") : t("Expand Trophy Deck"));
        tab.setAttribute('aria-expanded', String(railOpen));
        root.classList.toggle('epic-closed', !railOpen);
        requestAnimationFrame(() => { if (root.isConnected) updateRailOverlap(root); });
    }
    tab.addEventListener('click', () => {
            logEvent('deck.toggle');
            railOpen = !railOpen;
            localStorage.setItem('trophydeck.railOpen', String(railOpen));
            updateTab();
            applyRailHorizontalPosition(root);
        });
    updateTab();
    root.addEventListener('transitionend', event => { if (['transform', 'left', 'width'].includes(event.propertyName)) updateRailOverlap(root); });
    root.append(tab);
    const panel = make('div', null, 'epic-panel');
    const header = make('header', null, 'epic-header');
    header.append(make('h2', 'TROPHY HUB'));
    enableRailDragging(header);
    const actions = make('div', null, 'epic-header-actions');
    const guide = make('button', '?', 'epic-header-button');
    guide.type = 'button';
    guide.title = t("Features and guide");
    guide.setAttribute('aria-label', t("Features and guide"));
    guide.addEventListener('click', () => {
            logEvent('guide.open');
            openFeatureGuide();
        });
    const gear = make('button', null, 'epic-header-button');
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('fill','none');
    icon.setAttribute('stroke','currentColor');
    icon.setAttribute('stroke-width','2');
    icon.setAttribute('stroke-linecap','round');
    icon.setAttribute('stroke-linejoin','round');
    const shape = document.createElementNS('http://www.w3.org/2000/svg','path');
    shape.setAttribute('d','M10 2h4l.5 2.1 1.5.7 1.9-1.1 2.8 2.8-1.1 1.9.7 1.5 2.1.5v4l-2.1.5-.7 1.5 1.1 1.9-2.8 2.8-1.9-1.1-1.5.7L14 22h-4l-.5-2.1-1.5-.7-1.9 1.1-2.8-2.8 1.1-1.9-.7-1.5L2 14v-4l2.1-.5.7-1.5-1.1-1.9 2.8-2.8 1.9 1.1 1.5-.7L10 2z');
    const center=document.createElementNS('http://www.w3.org/2000/svg','circle');
    center.setAttribute('cx','12');
    center.setAttribute('cy','12');
    center.setAttribute('r','3');
    icon.append(shape,center);
    gear.append(icon);
    gear.type = 'button';
    gear.title = t("Settings");
    gear.setAttribute('aria-label', t("Trophy Deck settings"));
    gear.addEventListener('click', () => {
            logEvent('settings.open');
            openSettings();
        });
    const palette=make('button',null,'epic-header-button');
    palette.type='button';
    palette.title=t("Choose color theme");
    palette.setAttribute('aria-label',t("Choose color theme"));
    const paletteIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');
    paletteIcon.setAttribute('viewBox','0 0 24 24');
    paletteIcon.setAttribute('fill','none');
    paletteIcon.setAttribute('stroke','currentColor');
    paletteIcon.setAttribute('stroke-width','1.8');
    paletteIcon.setAttribute('stroke-linecap','round');
    paletteIcon.setAttribute('aria-hidden','true');
    const outline=document.createElementNS('http://www.w3.org/2000/svg','path');
    outline.setAttribute('d','M12 3a9 9 0 1 0 0 18h1.5a2.2 2.2 0 0 0 1.6-3.7 1.7 1.7 0 0 1 1.3-2.8h1.1A3.5 3.5 0 0 0 21 11c0-4.4-4-8-9-8Z');
    paletteIcon.append(outline);
    [[7.5,10],[10,6.8],[14,6.8],[17,9.5]].forEach(([x,y])=>{
            const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
            dot.setAttribute('cx',x);
            dot.setAttribute('cy',y);
            dot.setAttribute('r','0.8');
            dot.setAttribute('fill','currentColor');
            dot.setAttribute('stroke','none');
            paletteIcon.append(dot);
        });
    palette.append(paletteIcon);
    palette.addEventListener('click',()=>{
            logEvent('palette.open');
            openThemePicker();
        });
    actions.append(guide, palette, gear);
    header.append(actions);
    panel.append(header);
    const panelScroll = make('div', null, 'epic-panel-scroll');
    panel.append(panelScroll);
    const profile = profileInfo();
    const cards = make('div', null, 'epic-cards');
    function addCard(key, add) {
        const count = cards.children.length;
        add(cards, profile);
        if (cards.children.length > count) {
            cards.lastElementChild.dataset.deckCard = key;
        }
    }
    if (enabled('trophydeck.showAccountLinks')) {
        addCard('account', addAccountShortcuts);
    }
    if (enabled('trophydeck.showStats')) {
        addCard('overview', addStats);
    }
    if (enabled('trophydeck.showLinks')) {
        addCard('filters', addLinks);
    }
    if (enabled('trophydeck.showNote')) {
        addCard('profileNote', addNote);
    }
    if (enabled('trophydeck.globalNote')) {
        addCard('globalNote', addGlobalNote);
    }
    if (enabled('trophydeck.customLinks')) {
        addCard('customLinks', addCustomLinks);
    }
    if (enabled('trophydeck.favorites')) {
        addCard('favorites', addFavorites);
    }
    const settings = make('section', null, 'epic-card epic-settings');
    settings.append(make('h3', t("Quick settings")));
    quickSettingGroups.forEach(([id, name, keys]) => {
        const group = make('details', null, 'td-quick-group');
        group.open = openQuickSettingGroups.has(id);
        group.append(make('summary', t(name)));
        const controls = make('div', null, 'td-quick-group-controls');
        features.filter(feature => keys.includes(feature.key.replace('trophydeck.', '')))
            .forEach(feature => controls.append(toggleControl(feature)));
        if (id === 'appearance') {
            const hint=make('small', null, 'td-quick-color-hint');
            const icon=make('span', null, 'td-quick-color-icon'); setProfileLayoutIcon(icon,'palette');
            hint.append(icon, make('span', t('Choose colors with the palette icon above or in All settings.')));
            controls.append(hint);
        }
        group.append(controls);
        group.addEventListener('toggle', () => {
            if (group.open) openQuickSettingGroups.add(id);
            else openQuickSettingGroups.delete(id);
        });
        settings.append(group);
    });
    const manageNotes = make('button', t("Manage notes"), 'epic-button');
    manageNotes.type='button';
    manageNotes.addEventListener('click', openNotesManager);
    settings.append(manageNotes);
    const full = make('button', t("All settings"), 'epic-button');
    full.type = 'button';
    full.addEventListener('click', openSettings);
    const quickActions=make('div',null,'td-quick-actions');
    quickActions.append(manageNotes,full);
    settings.append(quickActions);
    settings.dataset.deckCard = 'settings';
    cards.append(settings);
    setupCardSorting(cards);
    panelScroll.append(cards);
    root.append(panel);
    document.body.append(root);
    panelScroll.scrollTop=previousScroll;
    requestAnimationFrame(() => {
        if (document.getElementById('trophydeck-rail') === root) panelScroll.scrollTop=previousScroll;
    });
    applyRailPosition();
}

function addMenuItem() {
    const menu = document.querySelector('div.user-menu > div.dropdown > ul.dropdown-menu');
    if (!menu) return false;
    if (menu.querySelector('[data-trophydeck-settings]')) return true;

    const item = make('li');
    const link = make('a', t('Trophy Deck Settings'));
    link.href = '#';
    link.dataset.trophydeckSettings = 'true';
    link.addEventListener('click', event => {
        event.preventDefault();
        openSettings();
    });
    item.append(link);

    // PSNP+ is optional. Place the entry near its settings when available,
    // otherwise use the site's own settings or append it to the account menu.
    const links = Array.from(menu.querySelectorAll('a'));
    const anchor = links.find(entry => entry.textContent.trim() === 'PSNP+ Settings')
        || links.find(entry => entry.textContent.trim() === 'Settings');
    const anchorItem = anchor?.closest('li');
    if (anchorItem) {
        anchorItem.after(item);
    } else {
        menu.append(item);
    }
    return true;
}


// Observe late additions from PSNProfiles and PSNP+ without rebuilding the
// profile layout more than once per animation frame.
function observePageChanges() {
    let layoutPending = false;
    const layoutObserver = new MutationObserver(records => {
        if (layoutPending || !records.some(record => record.addedNodes.length)) return;
        layoutPending = true;
        requestAnimationFrame(() => {
            layoutPending = false;
            applyProfileLayout();
            updateRailOverlap();
            markPsnpVersionLabel();
            syncPsnpClassicFilters();
        });
    });
    layoutObserver.observe(document.body, {childList:true, subtree:true});

    let notesPending = false;
    const notesObserver = new MutationObserver(records => {
        if (notesPending || !enabled('trophydeck.gameNotes') ||
            !records.some(record => record.addedNodes.length)) return;
        notesPending = true;
        requestAnimationFrame(() => {
            notesPending = false;
            updateGameNotes();
        });
    });
    notesObserver.observe(document.body, {childList:true, subtree:true});

    const cabinetObserver = new MutationObserver(records => {
        const gameAdded = records.some(record => Array.from(record.addedNodes).some(node =>
            node.nodeType === 1 && (node.matches?.('tr') || node.querySelector?.('tr td a.title[href*="/trophies/"]'))
        ));
        if (gameAdded) updateGameCabinet();
    });
    cabinetObserver.observe(document.body, {childList:true, subtree:true});
}

function observeAccountMenu() {
    const menu = document.querySelector('div.user-menu');
    if (!menu) return;
    const signature = () => Array.from(menu.querySelectorAll('div.user-nav a[href]'))
        .map(link => link.getAttribute('href') + ':' + link.textContent.trim()).join('|');
    let previous = signature();
    const observer = new MutationObserver(() => {
        const current = signature();
        if (current !== previous) {
            previous = current;
            renderRail();
        }
    });
    observer.observe(menu, {childList:true, subtree:true});
}

function installSettingsMenu() {
    if (addMenuItem()) return;
    const observer = new MutationObserver(() => {
        if (addMenuItem()) observer.disconnect();
    });
    observer.observe(document.documentElement, {childList:true, subtree:true});
}

function init() {
    const showWelcome = isNewTrophyHubInstallation();
    const style = make('style');
    style.textContent = `
#trophydeck-rail, #trophydeck-settings, #trophydeck-guide { font:14px/1.45 Arial,sans-serif; color:#e6edf6; }
#trophydeck-rail { position:fixed; z-index:9999; right:0; top:22%; display:flex; align-items:flex-start; transform:translateX(0); transition:transform .28s ease; }
#trophydeck-rail.epic-closed { transform:translateX(min(var(--epic-width), 45vw, calc(100vw - 40px))); }
#trophydeck-rail.epic-left { left:0; right:auto; flex-direction:row-reverse; }
#trophydeck-rail.epic-left.epic-closed { transform:translateX(calc(-1 * min(var(--epic-width), 45vw, calc(100vw - 40px)))); }
#trophydeck-rail.epic-left .epic-tab { border-radius:0 6px 6px 0; }
#trophydeck-sticky { position:fixed; top:0; z-index:9990; display:flex; gap:16px; align-items:center; justify-content:space-between; background:#f1f2f4; color:#414b55; padding:16px 16px; min-height:58px; box-sizing:border-box; box-shadow:0 2px 8px #0003; font:13px Arial,sans-serif; }
#trophydeck-sticky[hidden] { display:none !important; }
#trophydeck-sticky nav { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:12px; }
#trophydeck-sticky a { color:#4c5862; text-decoration:none; }
#trophydeck-sticky a[aria-current] { font-weight:bold; border-bottom:2px solid #427eaf; }
@media (max-width:700px) { #trophydeck-sticky { display:none !important; } }
@media (prefers-reduced-motion: reduce) { #trophydeck-rail { transition:none; } }
#trophydeck-rail *, #trophydeck-settings *, #trophydeck-guide * { box-sizing:border-box; }
#trophydeck-rail .epic-tab { cursor:pointer; background:var(--td-accent,#315c89); border:1px solid var(--td-accent); color:white; padding:12px 7px; border-radius:6px 0 0 6px; font-weight:bold; font-size:18px; }
#trophydeck-rail .epic-tab { display:flex; flex-direction:column; align-items:center; gap:8px; }
#trophydeck-rail .epic-tab-title { writing-mode:vertical-rl; font-size:12px; letter-spacing:.04em; white-space:nowrap; }
#trophydeck-rail .epic-tab-title[hidden] { display:none !important; }
#trophydeck-rail .epic-panel { width:min(var(--epic-width),45vw,calc(100vw - 40px)); height:min(var(--epic-height,72vh), calc(100vh - 12px)); max-height:calc(100vh - 12px); overflow:auto; background:var(--td-base,#192b40); border:1px solid var(--td-accent); padding:14px; box-shadow:0 6px 24px #0008; }
#trophydeck-rail h2, #trophydeck-settings h2, #trophydeck-guide h2 { margin:0 0 14px; color:inherit; font-size:19px; }
#trophydeck-rail .epic-header { position:sticky; top:-14px; z-index:2; display:flex; justify-content:space-between; align-items:center; gap:8px; margin:-14px -14px 14px; padding:12px 14px; background:var(--td-base,#192b40); border-bottom:1px solid var(--td-accent); }
#trophydeck-rail .epic-header h2 { margin:0; }
#trophydeck-rail .epic-header-actions { display:flex; align-items:center; gap:5px; }
#trophydeck-rail .epic-header-button { display:inline-flex; align-items:center; justify-content:center; padding:0; border:0; background:transparent; color:#e6edf6; border-radius:4px; cursor:pointer; font-size:29px; line-height:1; width:42px; height:42px; }
#trophydeck-rail .epic-header-button svg { display:block; width:24px; height:24px; flex:none; }
#trophydeck-rail .epic-header-button:hover, #trophydeck-rail .epic-header-button:focus-visible { background:var(--td-accent,#315c89); }
#trophydeck-guide h3 { color:#b9d7f1; font-size:14px; margin:20px 0 8px; }
#trophydeck-guide p { margin:8px 0; }
#trophydeck-rail h3 { color:#fff; font-size:13px; margin:0 0 10px; text-transform:uppercase; letter-spacing:.04em; }
#trophydeck-rail .epic-card { background:var(--td-card,#223b55); padding:12px; border-radius:5px; margin-bottom:10px; }
#trophydeck-rail .epic-stat { display:flex; justify-content:space-between; gap:12px; padding:3px 0; }
#trophydeck-rail .epic-link-group + .epic-link-group { border-top:1px solid var(--td-accent); margin-top:10px; padding-top:10px; }
#trophydeck-rail .epic-link-group h4 { color:#9bb9d3; font-size:11px; letter-spacing:.08em; margin:0 0 5px; }
#trophydeck-rail .epic-link-group { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(135px,100%),1fr)); gap:6px; }
#trophydeck-rail .epic-link-group a { display:block; background:color-mix(in srgb,var(--td-accent) 32%,transparent); border-radius:4px; color:#e1f0ff; padding:5px 7px; border-radius:3px; text-decoration:none; }
#trophydeck-rail .epic-link-group a:hover, #trophydeck-rail .epic-link-group a.epic-current { background:var(--td-accent,#315c89); }
#trophydeck-rail .epic-link-group a strong, #trophydeck-rail .epic-link-group a small { display:block; }
#trophydeck-rail .epic-link-group a small { color:#acc3d8; font-size:11px; }
#trophydeck-rail textarea { width:100%; min-height:90px; resize:vertical; padding:7px; color:#15263a; background:color-mix(in srgb,white 91%,var(--td-accent)); border:0; border-radius:3px; font:inherit; }
#trophydeck-rail .epic-muted, #trophydeck-settings .epic-muted, #trophydeck-guide .epic-muted { color:#a9bed0; font-size:12px; }
#trophydeck-rail .epic-toggle, #trophydeck-settings .epic-toggle { display:flex; align-items:flex-start; gap:8px; padding:5px 0; cursor:pointer; }
#trophydeck-rail .epic-toggle input, #trophydeck-settings .epic-toggle input { margin:3px 0 0; flex:none; }
#trophydeck-rail .epic-button, #trophydeck-settings .epic-button, #trophydeck-guide .epic-button { cursor:pointer; border:0; border-radius:3px; background:var(--td-accent,#376b9a); color:white; padding:8px 10px; margin-top:8px; }
#trophydeck-settings, #trophydeck-guide { background:var(--td-base,#192b40); border:1px solid var(--td-accent); border-radius:6px; padding:24px; width:min(720px,92vw); max-height:85vh; overflow:auto; box-shadow:0 5px 30px #0009; }
#trophydeck-settings::backdrop, #trophydeck-guide::backdrop { background:#0008; }
#trophydeck-settings .epic-width { display:block; margin-top:14px; }
#trophydeck-settings .epic-width input { display:block; width:100%; margin-top:8px; }
#trophydeck-rail .td-card-head { background:color-mix(in srgb,var(--td-accent) 32%,var(--td-card)); border-left:3px solid var(--td-accent); padding:7px 8px; border-radius:3px; display:flex; align-items:center; justify-content:space-between; gap:5px; margin-bottom:8px; }
#trophydeck-rail .td-card-head h3 { margin:0; min-width:0; }
#trophydeck-rail .td-card-body[hidden] { display:none !important; }
#trophydeck-rail .epic-sort { display:flex; justify-content:flex-end; align-items:center; flex:none; gap:2px; margin:0; }
#trophydeck-rail .epic-settings summary { display:flex; align-items:center; justify-content:space-between; gap:4px; }
#trophydeck-rail .td-custom-group { border-bottom:1px solid var(--td-accent); padding:8px 0; }
#trophydeck-rail .td-custom-heading, #trophydeck-rail .td-custom-row { display:flex; gap:4px; align-items:center; }
#trophydeck-rail .td-custom-heading strong, #trophydeck-rail .td-custom-row a { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
#trophydeck-rail .td-custom-heading { background:var(--td-accent); padding:5px 6px; border-radius:3px; text-transform:uppercase; font-size:11px; letter-spacing:.04em; }
#trophydeck-rail .td-custom-row { padding:5px 4px; }
#trophydeck-rail .td-custom-row a { color:#d6ecff; text-decoration:underline; text-underline-offset:3px; }
#trophydeck-rail .td-custom-row a:hover { color:#fff; }
#trophydeck-rail .td-card-head { cursor:pointer; }
#trophydeck-rail .td-links-content { position:relative; z-index:1; }
#trophydeck-rail .td-setting-description, #trophydeck-settings .td-setting-description { display:block; color:#aec1d1; font-size:11px; line-height:1.35; margin-top:2px; }
#trophydeck-settings .epic-toggle { padding:7px 0; }
#trophydeck-settings .epic-width select { color:#222; }
.td-game-page-note { padding:10px; border:1px solid #ddd; background:#f8f8f8; color:#333; }
.td-game-page-note[hidden] { display:none !important; }
.trophydeck-game-note .td-note-preview a { color:#246cb1; text-decoration:underline; }

#trophydeck-rail .td-link-button { background:transparent; color:#c9d9e8; border:0; cursor:pointer; padding:3px 6px; }
#trophydeck-rail .td-link-button:hover { background:var(--td-accent); }
#trophydeck-rail .epic-sort button { width:27px; height:25px; display:inline-flex; align-items:center; justify-content:center; padding:0; background:transparent; border:0; color:#b5cee1; cursor:pointer; font-size:15px; line-height:1; }
#trophydeck-rail .epic-sort button:hover { background:var(--td-accent,#315c89); color:#fff; border-radius:3px; }
#trophydeck-rail .epic-sort .epic-drag { cursor:grab; }
#trophydeck-rail .epic-dragging { opacity:.5; }
#trophydeck-rail .epic-settings summary { cursor:pointer; font-weight:bold; color:#fff; }
.trophydeck-game-note { display:flex; align-items:flex-start; gap:4px; width:100%; min-width:0; margin-top:4px; color:#333; font:12px/1.4 Arial,sans-serif; }
.trophydeck-game-note .td-note-preview { flex:1; min-width:0; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:var(--td-lines,1); overflow:hidden; overflow-wrap:anywhere; white-space:pre-wrap; border:1px solid #ccd4dc; border-radius:3px; padding:3px 5px; background:color-mix(in srgb,white 91%,var(--td-accent)); cursor:text; }
.trophydeck-game-note .td-note-placeholder { color:#888; }
.trophydeck-game-note .td-note-editor { width:100%; min-width:0; min-height:48px; resize:vertical; font:inherit; }
.trophydeck-game-note .td-note-edit, .trophydeck-game-note .td-note-save { flex:none; cursor:pointer; }
.trophydeck-game-note [hidden] { display:none !important; }
/* Überschriften: Links mit class="title" sind Spiel- und Trophäennamen. */
.trophydeck-psnp-colors #facebox .holder div.title:not(.red),
.trophydeck-psnp-colors #content div.title:not(.red),
.trophydeck-psnp-colors .sidebar > div.title:not(.red) { background:var(--td-accent) !important; }
/* Profilname und Markierungen in der normalen und mitlaufenden Profilnavigation. */
html.trophydeck-psnp-colors .title-bar:has(.navigation) h3 a {
    color:var(--td-accent, #315c89) !important;
}
html.trophydeck-psnp-colors .title-bar .navigation li.active a,
html.trophydeck-psnp-colors .title-bar .navigation a:hover,
html.trophydeck-psnp-colors #trophydeck-sticky nav a[aria-current],
html.trophydeck-psnp-colors #trophydeck-sticky nav a:hover {
    border-bottom-color:var(--td-accent, #315c89) !important;
    text-decoration-color:var(--td-accent, #315c89) !important;
}
html.trophydeck-psnp-colors .title-bar .navigation li.active a::after,
html.trophydeck-psnp-colors .title-bar .navigation a:hover::after {
    background-color:var(--td-accent, #315c89) !important;
}
/* Navigation, Menüs und Seltenheitsübersicht */
html.trophydeck-psnp-colors #header .navigation a:hover,
html.trophydeck-psnp-colors #header .navigation li.active > a,
html.trophydeck-psnp-colors #header .navigation li.active {
    border-color:var(--td-accent, #315c89) !important;
    text-decoration-color:var(--td-accent, #315c89) !important;
}
html.trophydeck-psnp-colors #header .navigation a:hover::after,
html.trophydeck-psnp-colors #header .navigation li.active > a::after,
html.trophydeck-psnp-colors #header .navigation li.active::after {
    background-color:var(--td-accent, #315c89) !important;
}
html.trophydeck-psnp-colors #header .user-menu .dropdown-menu > li > a:hover,
html.trophydeck-psnp-colors #header .user-menu .dropdown-menu > li > a:focus,
html.trophydeck-psnp-colors #header .user-menu .dropdown-menu > li.active > a,
html.trophydeck-psnp-colors #content .button-bar .dropdown-menu > li > a:hover,
html.trophydeck-psnp-colors #content .button-bar .dropdown-menu > li > a:focus,
html.trophydeck-psnp-colors #content .button-bar .dropdown-menu > li.active > a {
    background-color:var(--td-accent, #315c89) !important; color:#fff !important;
}
html.trophydeck-psnp-colors .sidebar a[href*="rarity="] .typo-top,
html.trophydeck-psnp-colors .sidebar a[href*="rarity="] .typo-bottom {
    color:var(--td-accent, #315c89) !important;
}
/* Dunklere Filterleiste mit thematisch passenden Trennlinien. */
html.trophydeck-psnp-colors #content .button-bar {
    background:var(--td-base, #192b40) !important;
}
html.trophydeck-psnp-colors #content .button-bar > .dropdown,
html.trophydeck-psnp-colors #content .button-bar > a {
    background:var(--td-base, #192b40) !important;
    border-color:var(--td-accent, #315c89) !important;
}
html.trophydeck-psnp-colors #content .button-bar > .dropdown > a {
    background:transparent !important;
    border-color:var(--td-accent, #315c89) !important;
}
html.trophydeck-psnp-colors #content .button-bar > .dropdown > a:hover,
html.trophydeck-psnp-colors #content .button-bar > a:hover {
    background:var(--td-card, #223b55) !important;
}
html.trophydeck-psnp-colors .pagination > li.button,
html.trophydeck-psnp-colors .pagination > li.button > a {
    background-color:var(--td-accent, #315c89) !important;
    border-color:var(--td-accent, #315c89) !important;
}
html.trophydeck-psnp-colors .pagination > li.button > a:hover {
    background-color:var(--td-card, #223b55) !important;
}
#trophydeck-settings .epic-setting-heading { margin:18px 0 5px; color:#b9d7f1; font-size:14px; }
#trophydeck-settings select { margin-left:8px; }
#trophydeck-theme-picker .td-palette-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(135px,1fr)); gap:8px; }
#trophydeck-theme-picker .td-palette-choice { margin:0; display:flex; align-items:center; gap:8px; min-width:0; text-align:left; background:var(--td-card); border:2px solid transparent; }
#trophydeck-theme-picker .td-palette-choice[aria-pressed="true"] { border-color:#fff; }
#trophydeck-theme-picker .td-palette-color { display:block; flex:none; width:32px; height:22px; border-radius:3px; }

#trophydeck-rail .epic-tab { padding:0; gap:0; min-width:32px; }
#trophydeck-rail .epic-tab-arrow { min-height:var(--td-header-height,46px); display:flex; align-items:center; justify-content:center; }
#trophydeck-rail .epic-tab-title { padding:4px 8px 12px; }
#trophydeck-rail .epic-header-button { width:36px; height:36px; font-size:24px; }
#trophydeck-rail .epic-header-button svg { width:22px; height:22px; }
#trophydeck-settings .td-stats-top { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; }
#trophydeck-settings .td-stats-top .epic-toggle { flex:1; min-width:220px; }
#trophydeck-settings .td-stats-top .epic-button { margin:0; }
#trophydeck-settings .td-setting-actions { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
#trophydeck-settings .td-setting-actions .epic-button { margin:8px 0 0; }
#trophydeck-settings > .epic-button, #trophydeck-guide > .epic-button { display:block; margin:16px auto 0; }
#trophydeck-settings, #trophydeck-guide, .td-dialog, .td-manager-list { scrollbar-color:var(--td-accent) var(--td-base); }
#trophydeck-settings::-webkit-scrollbar, #trophydeck-guide::-webkit-scrollbar, .td-dialog::-webkit-scrollbar, .td-manager-list::-webkit-scrollbar { width:10px; }
#trophydeck-settings::-webkit-scrollbar-track, #trophydeck-guide::-webkit-scrollbar-track, .td-dialog::-webkit-scrollbar-track, .td-manager-list::-webkit-scrollbar-track { background:var(--td-base); }
#trophydeck-settings::-webkit-scrollbar-thumb, #trophydeck-guide::-webkit-scrollbar-thumb, .td-dialog::-webkit-scrollbar-thumb, .td-manager-list::-webkit-scrollbar-thumb { background:var(--td-accent); border:2px solid var(--td-base); border-radius:8px; }
#trophydeck-guide h2, .td-dialog h2 { background:var(--td-accent); padding:14px 48px 14px 14px; border-radius:4px; }
#trophydeck-settings .epic-button, #trophydeck-guide .epic-button, .td-dialog button:not(.td-dialog-close), #trophydeck-rail .epic-button { border:0; border-radius:4px; padding:8px 12px; color:white; background:var(--td-accent); font:600 14px/1.3 Arial,sans-serif; cursor:pointer; }
#trophydeck-settings .td-danger, .td-dialog .td-danger { background:#b52e3d !important; }
#trophydeck-settings .epic-button:hover, #trophydeck-guide .epic-button:hover, .td-dialog button:not(.td-dialog-close):hover, #trophydeck-rail .epic-button:hover { filter:brightness(1.16); }

#trophydeck-rail .td-quick-actions, #trophydeck-rail .td-favorite-actions { display:flex; justify-content:flex-end; align-items:center; flex-wrap:wrap; gap:8px; margin-top:8px; }
#trophydeck-rail .td-quick-actions .epic-button { margin:0; }
#trophydeck-rail .td-favorite-controls[hidden] { display:none !important; }
#trophydeck-rail .td-favorite:not(.td-editing):hover a { transform:none; }
#trophydeck-rail .td-favorite.td-editing a { transform:translateY(-12px); }
#trophydeck-rail .td-favorite.td-editing .td-favorite-controls { opacity:1; pointer-events:auto; }
#trophydeck-rail .td-fav-add, #trophydeck-rail .td-links-content > .td-link-button:not(.td-edit-control) { opacity:1; pointer-events:auto; }
.td-cabinet-remove { position:absolute; top:3px; right:3px; color:white; background:var(--td-accent); width:19px; height:19px; box-sizing:border-box; display:flex; align-items:center; justify-content:center; border:0; border-radius:3px; cursor:pointer; opacity:0; }
.td-cabinet-tile:hover .td-cabinet-remove, .td-cabinet-tile:focus-within .td-cabinet-remove { opacity:1; }
@media (hover:none) { .td-cabinet-remove { opacity:1; } }
.td-cabinet-add[data-saved="true"] { opacity:1 !important; pointer-events:auto !important; }
#trophydeck-settings h2, #trophydeck-guide h2, .td-dialog h2 { position:relative; padding-right:48px; }
#trophydeck-settings h2 .td-dialog-close, #trophydeck-guide h2 .td-dialog-close, .td-dialog h2 .td-dialog-close { top:50%; right:8px; transform:translateY(-50%); }
.td-manager { width:min(900px,95vw); box-sizing:border-box; }
.td-manager-list { padding-right:18px; box-sizing:border-box; }
.td-managed-note { width:100%; box-sizing:border-box; }
.td-managed-note textarea { width:100%; box-sizing:border-box; }
.td-managed-note > .td-danger { margin-right:0; }
.trophydeck-game-note .td-note-editor, .td-manager textarea { background:color-mix(in srgb,white 90%,var(--td-accent)) !important; color:#222; }

#trophydeck-rail .td-custom-heading { font-size:13px; }
#trophydeck-rail .td-custom-row a { font-size:12px; }
#trophydeck-rail .td-favorite { min-height:68px; display:flex; align-items:center; justify-content:center; flex-direction:column; }
#trophydeck-rail .td-favorite-controls { position:absolute; bottom:3px; left:0; right:0; }
#trophydeck-rail .td-favorite.td-editing:hover a, #trophydeck-rail .td-favorite.td-editing:focus-within a { transform:translateY(-12px); }
#trophydeck-rail .td-drop-target { outline:3px solid #fff; outline-offset:2px; }
#trophydeck-rail .epic-dragging { outline:2px dashed #fff; opacity:.55; }
#trophydeck-rail .epic-header h2 { cursor:grab; touch-action:none; }
#trophydeck-settings, #trophydeck-guide, .td-dialog { position:fixed; inset:0; margin:auto; }
#trophydeck-settings .td-dialog-close, #trophydeck-guide .td-dialog-close, .td-dialog .td-dialog-close { position:absolute; top:8px; right:10px; display:flex; align-items:center; justify-content:center; width:32px; height:32px; margin:0; padding:0; border:0; border-radius:3px; background:transparent; color:white; font-size:25px; cursor:pointer; }
#trophydeck-settings h2, .td-manager h2 { padding-right:48px; }
.td-manager h2 { background:var(--td-accent); padding:14px 48px 14px 14px; border-radius:4px; }
.td-manager-list { max-height:55vh; overflow:auto; scrollbar-color:var(--td-accent) var(--td-base); }
.td-managed-note .td-note-game-link { display:block; color:#d6ecff; text-decoration:underline; margin:4px 0; }
.td-manager > button:not(.td-dialog-close) { float:right; }
#trophydeck-settings .td-danger, .td-dialog .td-danger { background:#b52e3d; color:white; }
#trophydeck-settings .epic-button { display:block; margin-left:auto; }
.td-managed-note > .td-danger { display:block; margin-left:auto; }
#trophydeck-rail .epic-settings .epic-button { display:block; margin-left:auto; }
#trophydeck-rail .td-theme-swatches, #trophydeck-settings .td-theme-swatches { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
#trophydeck-settings .td-theme-swatch { width:36px; height:26px; border:2px solid transparent; border-radius:4px; cursor:pointer; }
#trophydeck-settings .td-theme-swatch[aria-pressed="true"] { border-color:#fff; }
.td-cabinet-tile { position:relative; min-width:0; }
.td-cabinet-image { display:block; width:100%; padding:0; border:0; cursor:pointer; background:transparent; }
.td-cabinet-actions { display:flex; position:absolute; top:3px; right:3px; gap:2px; align-items:center; }
.td-cabinet-actions[hidden] { display:none !important; }
.td-cabinet-actions a { color:white; background:var(--td-accent); padding:3px 5px; font-size:11px; border:0; cursor:pointer; text-decoration:none; }
.td-cabinet-remove { padding:0; font:600 13px/1 Arial,sans-serif; }

#trophydeck-settings h2 { background:var(--td-accent); padding:14px; border-radius:4px; }
#trophydeck-settings .td-settings-section { margin:10px 0; border:1px solid var(--td-accent); border-radius:4px; padding:8px 12px; }
#trophydeck-settings .td-settings-section summary { cursor:pointer; background:color-mix(in srgb,var(--td-accent) 40%,var(--td-base)); color:#fff; font-size:15px; font-weight:bold; padding:10px; margin:-8px -12px 8px; }
#trophydeck-rail .epic-panel { scrollbar-color:var(--td-accent) var(--td-base); }
#trophydeck-rail .epic-panel::-webkit-scrollbar { width:10px; }
#trophydeck-rail .epic-panel::-webkit-scrollbar-track { background:var(--td-base); }
#trophydeck-rail .epic-panel::-webkit-scrollbar-thumb { background:var(--td-accent); border:2px solid var(--td-base); border-radius:8px; }
#trophydeck-rail .td-favorites-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(100px,1fr)); gap:6px; }
#trophydeck-rail .td-favorite { position:relative; background:var(--td-accent); border-radius:4px; min-width:0; padding:12px 7px; text-align:center; }
#trophydeck-rail .td-favorite a { display:block; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-decoration:none; }
#trophydeck-rail .td-favorite-controls { display:flex; justify-content:center; }
.td-cabinet-name { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; overflow-wrap:anywhere; font-size:11px; line-height:1.2; margin-top:4px; }
.td-dialog .td-danger { background:#b52e3d; color:#fff; }
@media (hover:hover) and (pointer:fine) {
 #trophydeck-rail .td-edit-control, #trophydeck-rail .td-favorite-controls, .td-cabinet-add { opacity:0; pointer-events:none; }
 #trophydeck-rail .td-card-head:hover > .td-edit-control, #trophydeck-rail .td-card-head:focus-within > .td-edit-control,
 #trophydeck-rail .td-custom-heading:hover > .td-edit-control, #trophydeck-rail .td-custom-heading:focus-within > .td-edit-control,
 #trophydeck-rail .td-custom-row:hover > .td-edit-control, #trophydeck-rail .td-custom-row:focus-within > .td-edit-control,
 #trophydeck-rail .td-links-content:hover > .td-edit-control, #trophydeck-rail .td-links-content:focus-within > .td-edit-control,
 #trophydeck-rail .td-card-body:hover > div > .td-fav-add, #trophydeck-rail .td-card-body:focus-within > div > .td-fav-add,
 #trophydeck-rail .td-favorite:hover .td-favorite-controls, #trophydeck-rail .td-favorite:focus-within .td-favorite-controls,
 tr:hover .td-cabinet-add, tr:focus-within .td-cabinet-add, .td-cabinet-add[data-saved="true"] { opacity:1; pointer-events:auto; }
}
#td-scroll-bottom[hidden] { display:none !important; }
html.td-has-scroll-down a.scroll-top { transform:translateX(calc(-100% - 8px)); }

#trophydeck-guide h3::before { content:"▸ "; color:var(--td-accent); }
.td-dialog { border:1px solid var(--td-accent); border-radius:6px; padding:22px; width:min(560px,92vw); max-height:85vh; overflow:auto; color:#e6edf6; background:var(--td-base); font:14px/1.45 Arial,sans-serif; }
.td-dialog::backdrop { background:#0009; }
.td-dialog h2 { color:#fff; font-size:19px; margin:0 0 15px; }
.td-dialog label { display:block; margin:12px 0; }
.td-dialog input,.td-dialog textarea { display:block; width:100%; box-sizing:border-box; margin-top:5px; padding:8px; color:#222; background:color-mix(in srgb,white 92%,var(--td-accent)); border:0; border-radius:3px; }
.td-dialog textarea { min-height:75px; resize:vertical; }
.td-dialog button { cursor:pointer; color:white; border:0; padding:8px 12px; margin:4px; border-radius:3px; background:var(--td-accent); }
.td-dialog-actions { display:flex; justify-content:flex-end; }
.td-managed-note { padding:10px 0; border-bottom:1px solid var(--td-accent); }
#trophydeck-rail .td-platforms { display:flex; flex-wrap:wrap; gap:5px; margin-top:5px; }
#trophydeck-rail .td-platforms a { padding:4px 7px; border-radius:3px; color:#fff; text-decoration:none; background:color-mix(in srgb,var(--td-accent) 32%,transparent); font-size:12px; }
#trophydeck-rail .td-platforms a:hover,#trophydeck-rail .td-platforms a.active { background:var(--td-accent); }
.td-cabinet-add { background:none; border:0; padding:0 3px; color:var(--td-accent); cursor:pointer; font-size:18px; }
.td-cabinet-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(64px,1fr)); gap:6px; padding:8px; margin-bottom:10px; }
.td-cabinet-grid img { display:block; width:100%; aspect-ratio:1; object-fit:cover; }
#td-scroll-bottom { position:fixed; bottom:20px; right:88px; z-index:1000; width:60px; height:60px; cursor:pointer; border:0; border-radius:3px; background:var(--td-accent); color:white; display:flex; align-items:center; justify-content:center; font-size:20px; }
html.trophydeck-psnp-colors a.scroll-top { background-color:var(--td-accent) !important; }



#trophydeck-settings h2, .td-manager h2 { position:sticky; top:-24px; z-index:5; margin:-24px -24px 14px; padding:14px 52px 14px 16px; background:var(--td-accent); border-radius:4px 4px 0 0; }
#trophydeck-settings h2 .td-dialog-close, #trophydeck-guide h2 .td-dialog-close, .td-dialog h2 .td-dialog-close { position:absolute; top:50%; right:12px; transform:translateY(-50%); margin:0; padding:0; display:flex; align-items:center; justify-content:center; line-height:1; }
.td-manager .td-manager-footer { position:sticky; bottom:-22px; z-index:3; display:flex; align-items:center; justify-content:flex-end; gap:8px; margin:12px -22px -22px; padding:14px 22px; background:var(--td-base); border-top:1px solid var(--td-accent); }
.td-manager .td-manager-footer button { float:none; margin:0; }
#trophydeck-rail .td-favorite-actions { justify-content:space-between; }
#trophydeck-rail .td-favorite.td-current-profile { outline:2px solid #fff; outline-offset:-2px; box-shadow:0 0 0 2px var(--td-accent); }
#trophydeck-rail .td-favorite:not(.td-editing) a { transform:none !important; }
#trophydeck-rail .td-quick-actions { gap:4px; }
#trophydeck-rail .epic-settings .td-quick-actions .epic-button { margin:0; }
#trophydeck-rail .epic-stat[title] { cursor:help; }
#trophydeck-rail .epic-tab-arrow { height:var(--td-header-height,46px); min-height:var(--td-header-height,46px); }


/* Notizen brechen lange Wörter und URLs um, statt horizontal zu scrollen. */
.trophydeck-game-note { max-width:100%; overflow-x:hidden; }
.trophydeck-game-note .td-note-preview { min-width:0; max-width:100%; white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word; overflow-x:hidden; }
.trophydeck-game-note .td-note-editor, .td-manager textarea { box-sizing:border-box; min-width:0; max-width:100%; white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word; overflow-x:hidden; }
.td-manager-list { min-width:0; overflow-x:hidden; }

.trophydeck-game-note[hidden] { display:none !important; }
/* Profile layout manager */
.td-profile-section[hidden] { display:none !important; }
.td-profile-section { min-width:0; }
.td-profile-layout-dialog { width:min(780px,94vw); }
.td-profile-layout-list { display:grid; gap:6px; margin:14px 0; }
.td-profile-layout-row { display:flex; align-items:center; gap:10px; padding:8px; border:1px solid var(--td-accent); border-radius:4px; background:var(--td-card); cursor:grab; }
.td-profile-layout-row.td-layout-dragging { opacity:.45; }
.td-profile-layout-row.td-layout-target { outline:2px solid var(--td-accent); }
.td-profile-layout-dialog .td-profile-layout-name { display:flex; flex:1; align-items:center; gap:8px; flex-wrap:wrap; margin:0; min-width:0; }
.td-profile-layout-dialog .td-profile-layout-name input { display:inline-block; width:auto; margin:0; }
.td-profile-layout-name small { width:100%; padding-left:21px; }
.td-profile-layout-row select { max-width:42%; padding:6px; border-radius:4px; }
.td-profile-layout-controls { display:flex; gap:3px; }
.td-profile-layout-dialog .td-profile-layout-controls button { margin:0; padding:5px 9px; }
.td-profile-layout-controls button:disabled { opacity:.4; cursor:default; }
@media (max-width:600px) { .td-profile-layout-row { flex-wrap:wrap; } .td-profile-layout-name { flex-basis:100% !important; } }
.trophydeck-psnp-colors .td-profile-section > div.title:not(.red) { background:var(--td-accent) !important; }

/* Keep the floated update timestamp below the preceding profile section. */
.td-profile-update { display:flow-root; clear:both; }
/* Inline profile layout editor */
.td-profile-layout-bar { position:sticky; top:0; z-index:20; display:flex; align-items:center; gap:10px; padding:6px 8px; background:var(--td-base,#192b40); color:#fff; font:13px/1.4 Arial,sans-serif; }
.td-profile-layout-bar button, .td-profile-section-controls button { border:0; border-radius:4px; padding:6px 10px; color:white; background:var(--td-accent,#315c89); cursor:pointer; font:600 13px/1.3 Arial,sans-serif; }
.td-profile-layout-bar button:hover, .td-profile-section-controls button:hover { filter:brightness(1.15); }
.td-profile-layout-bar small[hidden] { display:none; }
.td-profile-edit-zone { outline:1px dashed var(--td-accent,#315c89); outline-offset:-2px; min-height:48px; }
.td-profile-section-controls { display:flex; align-items:center; gap:8px; padding:5px 7px; background:var(--td-card,#223b55); border:1px solid var(--td-accent,#315c89); color:#fff; font:13px/1.3 Arial,sans-serif; }
.td-profile-section-controls strong { flex:1; min-width:0; }
.td-profile-section-controls .td-profile-drag { cursor:grab; font-size:18px; line-height:1; padding:3px 8px; }
.td-profile-section-controls .td-profile-drag:active { cursor:grabbing; }
.td-profile-section-hidden > :not(.td-profile-section-controls) { opacity:.38; }
.td-profile-dragging { opacity:.5; }
.td-profile-drop-before { box-shadow:inset 0 5px var(--td-accent,#315c89); }
.td-profile-drop-after { box-shadow:inset 0 -5px var(--td-accent,#315c89); }
.td-profile-drop-zone { background:color-mix(in srgb,var(--td-accent,#315c89) 18%,transparent); }
/* Responsive profile grid: game list is always at least two columns wide. */
#content .row.td-profile-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); align-items:start; }
#content .td-profile-grid > .col-xs-8, #content .td-profile-grid > .sidebar, #content .td-profile-grid > .td-profile-small-column { width:auto !important; float:none !important; min-width:0; }
#content .td-profile-grid > .col-xs-8 { grid-column:span 2; order:2; }
#content .td-profile-grid > [data-td-profile-zone="left"] { order:1; }
#content .td-profile-grid > [data-td-profile-zone="center"] { order:3; }
#content .td-profile-grid > .sidebar { order:4; }
#content .td-profile-grid.td-profile-columns-0 > .col-xs-8 { grid-column:1 / -1; }
#content .td-profile-grid.td-profile-columns-2 { grid-template-columns:repeat(2,minmax(0,1fr)); }
#content .td-profile-grid.td-profile-columns-2 > .col-xs-8, #content .td-profile-grid.td-profile-columns-3 > .col-xs-8 { grid-column:1 / -1; order:0; }
#content .td-profile-grid > .td-profile-zone-empty { display:none; }
#content .td-profile-small-column { padding:0 5px; }
#content .td-profile-section-controls .td-profile-width { min-width:32px; padding:4px 8px; font-size:18px; line-height:1; }
#td-profile-layout-bar { position:static; display:inline-flex; vertical-align:middle; gap:3px; padding:0; margin-left:8px; background:transparent; }
#td-profile-layout-bar button { display:inline-flex; align-items:center; justify-content:center; width:29px; height:29px; padding:0; font-size:18px; line-height:1; }
#td-profile-layout-bar button[hidden] { display:none !important; }

@media (max-width:800px) { #content .row.td-profile-grid { grid-template-columns:minmax(0,1fr); } #content .td-profile-grid > .col-xs-8 { grid-column:1 / -1 !important; order:0; } }
.title-bar .grow:has(> #td-profile-layout-bar) { display:flex; align-items:center; }
.td-profile-edit-zone::before { content:attr(data-td-drop-label); display:block; padding:3px 6px; font:600 11px/1.3 Arial,sans-serif; color:var(--td-accent,#315c89); background:color-mix(in srgb,white 85%,var(--td-accent)); }
#content .td-profile-grid.td-profile-main-empty > .col-xs-8 { display:none; }
#content .td-profile-grid.td-profile-main-empty.td-profile-columns-1 > [data-td-profile-zone="center"] { grid-column:2; }
#content .td-profile-grid.td-profile-main-empty.td-profile-columns-1 > .sidebar { grid-column:3; }
@media (max-width:800px) { #content .td-profile-grid.td-profile-main-empty.td-profile-columns-1 > .sidebar, #content .td-profile-grid.td-profile-main-empty.td-profile-columns-1 > [data-td-profile-zone="center"] { grid-column:1; } }
/* Flexbox Grid's column max-width must not constrain items inside our CSS grid. */
#content .td-profile-grid > .col-xs-8,
#content .td-profile-grid > .sidebar,
#content .td-profile-grid > .td-profile-small-column {
    width:100% !important;
    max-width:none !important;
    min-width:0;
    box-sizing:border-box;
    justify-self:stretch;
}
/* All layout-editor controls share the same touch target and centered glyph. */
#td-profile-layout-bar button,
#content .td-profile-section-controls button {
    display:inline-flex;
    align-items:center;
    justify-content:center;
    flex:0 0 32px;
    width:32px;
    min-width:32px;
    max-width:32px;
    height:32px;
    min-height:32px;
    padding:0;
    margin:0;
    box-sizing:border-box;
    font:600 17px/1 Arial,sans-serif;
    text-align:center;
}
#content .td-profile-section-controls { gap:4px; }
#content .td-profile-section-controls button:disabled { opacity:.4; cursor:default; }
/* The floating profile navigation mirrors the editor controls. */
#trophydeck-sticky .td-sticky-title { display:flex; align-items:center; min-width:0; gap:8px; }
.td-profile-layout-bar { position:static; display:inline-flex; align-items:center; gap:3px; padding:0; margin-left:8px; background:transparent; vertical-align:middle; }
.td-profile-layout-bar button, #content .td-profile-section-controls button {
    display:inline-flex; align-items:center; justify-content:center; flex:0 0 32px;
    width:32px; min-width:32px; max-width:32px; height:32px; min-height:32px; max-height:32px;
    margin:0; padding:0; border:0; border-radius:4px; box-sizing:border-box;
    color:#fff; background:var(--td-accent,#315c89); line-height:1; cursor:pointer;
}
.td-profile-layout-bar button[hidden] { display:none !important; }
.td-profile-layout-bar button svg, #content .td-profile-section-controls button svg { display:block; flex:none; width:18px; height:18px; }
#content .td-profile-section-controls button:disabled { opacity:.4; cursor:default; }
/* Empty docking targets overlay the grid during editing without changing its widths. */
#content .row.td-profile-grid { position:relative; }
#content .td-profile-grid > .td-profile-zone-empty.td-profile-edit-zone { display:block; position:absolute; z-index:2; top:0; bottom:0; width:22px !important; min-height:48px; padding:0; }
#content .td-profile-grid > [data-td-profile-zone="left"].td-profile-zone-empty { left:0; }
#content .td-profile-grid > [data-td-profile-zone="center"].td-profile-zone-empty { left:calc(50% - 11px); }
#content .td-profile-grid > .sidebar.td-profile-zone-empty { right:0; }
#content .td-profile-grid > .td-profile-zone-empty.td-profile-edit-zone::before { content:''; }
/* Narrow sections in the upper/lower area remain tiles; full sections span the row. */
.td-profile-top, .td-profile-bottom { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); align-items:start; }
.td-profile-top > .td-profile-section, .td-profile-bottom > .td-profile-section { grid-column:span 1; min-width:0; }
.td-profile-top > .td-profile-is-wide, .td-profile-bottom > .td-profile-is-wide { grid-column:1 / -1; }
.td-profile-top.td-profile-edit-zone::before, .td-profile-bottom.td-profile-edit-zone::before { grid-column:1 / -1; }
.td-profile-section > #recent-trophies { width:100%; max-width:100%; }
@media (max-width:800px) { .td-profile-top, .td-profile-bottom { grid-template-columns:minmax(0,1fr); } }
/* Match both copies of the navigation controls despite PSNProfiles button rules. */
#td-profile-layout-bar button,
#trophydeck-sticky .td-profile-layout-bar button {
    display:inline-flex; align-items:center; justify-content:center; flex:0 0 32px;
    width:32px; min-width:32px; max-width:32px;
    height:32px; min-height:32px; max-height:32px;
    padding:0; margin:0; box-sizing:border-box;
}
#td-profile-layout-bar button svg,
#trophydeck-sticky .td-profile-layout-bar button svg { display:block; width:18px; height:18px; flex:none; }
/* Adjustable tile widths and left/right game alignment. */
#content .td-profile-grid.td-games-align-right.td-profile-columns-1 > .col-xs-8 { order:5; }
#content .td-profile-grid:not(.td-games-align-right).td-profile-columns-1 > .col-xs-8 { order:0; }
.td-profile-top > .td-profile-span-2, .td-profile-bottom > .td-profile-span-2 { grid-column:span 2; }
.td-profile-top > .td-profile-span-2.td-profile-align-right, .td-profile-bottom > .td-profile-span-2.td-profile-align-right { grid-column-end:-1; }
@media (max-width:800px) { .td-profile-top > .td-profile-span-2, .td-profile-bottom > .td-profile-span-2 { grid-column:1 / -1; } }
/* The host page applies button dimensions in its own navigation; override both copies equally. */
#td-profile-layout-bar > button, #trophydeck-sticky .td-profile-layout-bar > button {
  display:inline-flex !important; align-items:center !important; justify-content:center !important;
  width:32px !important; min-width:32px !important; max-width:32px !important;
  height:32px !important; min-height:32px !important; max-height:32px !important;
  padding:0 !important; margin:0 !important; border:0 !important; border-radius:4px !important;
  box-sizing:border-box !important; line-height:1 !important; vertical-align:middle;
}
#td-profile-layout-bar > button[hidden], #trophydeck-sticky .td-profile-layout-bar > button[hidden] { display:none !important; }
#td-profile-layout-bar > button svg, #trophydeck-sticky .td-profile-layout-bar > button svg { width:18px !important; height:18px !important; max-width:18px !important; max-height:18px !important; }
/* One masonry-style grid for every movable profile section. */
#content > .td-unified-grid {
    display:grid; position:relative; grid-template-columns:repeat(3,minmax(0,1fr));
    grid-auto-rows:8px; grid-auto-flow:row dense; column-gap:10px; align-items:start;
}
#content > .td-unified-grid > .td-profile-section { box-sizing:border-box; min-width:0; width:100% !important; max-width:none !important; padding:0 0 10px; align-self:start; }
#content > .td-unified-grid > .td-profile-section[hidden] { display:none !important; }
#content > .td-unified-grid.td-profile-edit-zone::before { content:none; }
#content > .td-unified-grid.td-profile-edit-zone { min-height:65px; }
#content > .td-unified-grid [data-td-profile-section="recent"][data-td-span="1"] > #recent-trophies > li:nth-child(n+5),
#content > .td-unified-grid [data-td-profile-section="recent"][data-td-span="2"] > #recent-trophies > li:nth-child(n+9) { display:none !important; }
#content > .td-unified-grid [data-td-profile-section="recent"] > #recent-trophies { width:100%; max-width:100%; }
html.trophydeck-psnp-colors .td-unified-grid a[href*="rarity="] .typo-top,
html.trophydeck-psnp-colors .td-unified-grid a[href*="rarity="] .typo-bottom { color:var(--td-accent) !important; }
@media (max-width:800px) { #content > .td-unified-grid { column-gap:5px; } }
/* Leave the original sidebar available to PSNP+ for sections added later. */
#content .row.td-profile-source-empty { height:1px; min-height:0; margin-top:0; margin-bottom:0; overflow:visible; }
/* Each grid row has three slots and a shared top edge. */
#content > .td-unified-grid { grid-auto-rows:auto; grid-auto-flow:row; gap:10px; }
#content > .td-unified-grid > .td-profile-section { padding-bottom:0; }
#content > .td-unified-grid [data-td-profile-section="milestones"] > .title { margin-top:0 !important; }
.td-profile-section-controls .td-profile-span-label { color:#fff; background:color-mix(in srgb,var(--td-accent) 70%,black); border-radius:3px; padding:4px 6px; font:bold 12px/1 Arial,sans-serif; white-space:nowrap; }

/* Independent column heights; edit mode shows only a short game preview. */
#content > .td-unified-grid { grid-auto-rows:16px; grid-auto-flow:row dense; row-gap:0; }
#content > .td-unified-grid > .td-profile-section { padding-bottom:10px; }
#content > .td-unified-grid.td-profile-edit-zone .td-profile-game-overflow,
#content > .td-unified-grid.td-profile-edit-zone #gamesTable #load-more,
#content > .td-unified-grid.td-profile-edit-zone #gamesTable #table-loading { display:none !important; }
/* Keep the structural hooks used by PSNP+ without adding its row margins. */
#content > .td-unified-grid.row { margin:0; }
#content > .td-unified-grid.td-profile-edit-zone .td-profile-milestone-overflow { display:none !important; }
.td-cabinet-placeholder { margin:0; padding:8px; color:#555; }
/* Align active and inactive navigation buttons without an outer halo. */
#td-profile-layout-bar > button,
#trophydeck-sticky .td-profile-layout-bar > button { box-shadow:none !important; }
#td-profile-layout-bar > button:focus-visible,
#trophydeck-sticky .td-profile-layout-bar > button:focus-visible { outline:2px solid white; outline-offset:-3px; }
/* The original boxes already include their own spacing. */
#content > .td-unified-grid { grid-auto-rows:1px; }
#content > .td-unified-grid > .td-profile-section { padding-bottom:0; }
/* Breathing room inside every deck section, including quick settings. */
#trophydeck-rail .td-card-body { min-width:0; padding:2px 6px 4px; }
#trophydeck-rail .epic-toggle > span { min-width:0; }
#trophydeck-rail .td-quick-group { border:1px solid color-mix(in srgb,var(--td-accent) 65%,transparent); border-radius:4px; margin:6px 0; }
#trophydeck-rail .epic-settings .td-quick-group > summary { display:list-item; padding:7px 9px; cursor:pointer; }
#trophydeck-rail .td-quick-group-controls { padding:0 9px 5px; }
/* High-contrast insertion markers stay visible regardless of the selected theme. */
#content .td-profile-section { position:relative; }
#content .td-profile-section.td-profile-drop-before::before,
#content .td-profile-section.td-profile-drop-after::after {
    content:''; position:absolute; z-index:20; left:0; right:0; height:8px;
    background:repeating-linear-gradient(135deg,#111 0 6px,#ffe600 6px 12px);
    border:1px solid #fff; box-shadow:0 0 0 1px #111; pointer-events:none;
}
#content .td-profile-section.td-profile-drop-before::before { top:0; }
#content .td-profile-section.td-profile-drop-after::after { bottom:0; }
#content .td-unified-grid.td-profile-drop-zone { outline:3px dashed #ffe600; outline-offset:-4px; box-shadow:inset 0 0 0 6px #111; }
#trophydeck-rail .td-platform-section { border-top:1px solid color-mix(in srgb,var(--td-accent) 75%,white); margin-top:10px; padding-top:9px; }
#trophydeck-rail .epic-panel { overflow-anchor:none; }
#trophydeck-rail .epic-sort .epic-hide svg { display:block; width:16px; height:16px; }
#trophydeck-rail .td-quick-color-hint { display:block; margin:6px 0 4px; color:#c4d6e5; line-height:1.4; }
#trophydeck-rail .td-account-links { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(125px,100%),1fr)); gap:6px; }
#trophydeck-rail .td-account-links a { display:flex; align-items:center; gap:7px; min-width:0; padding:7px; border-radius:3px; color:#e1f0ff; text-decoration:none; background:color-mix(in srgb,var(--td-accent) 32%,transparent); }
#trophydeck-rail .td-account-links a:hover { background:var(--td-accent); }
#trophydeck-rail .td-account-icon { display:flex; align-items:center; justify-content:center; flex:none; }
#trophydeck-rail .td-account-icon svg { display:block; width:17px; height:17px; }
/* Scrollable dialog content starts below the fixed header. */
#trophydeck-settings.td-scroll-dialog, #trophydeck-guide.td-scroll-dialog, .td-dialog.td-scroll-dialog { display:flex; flex-direction:column; padding:0; overflow:hidden; }
#trophydeck-settings.td-scroll-dialog h2, #trophydeck-guide.td-scroll-dialog h2, .td-dialog.td-scroll-dialog h2 { position:relative; top:auto; flex:none; margin:0; padding:14px 52px 14px 16px; border-radius:4px 4px 0 0; background:var(--td-accent); }
.td-dialog-scroll { min-height:0; overflow:auto; padding:18px 22px 22px; scrollbar-color:var(--td-accent) var(--td-base); }
.td-dialog-scroll::-webkit-scrollbar { width:10px; }
.td-dialog-scroll::-webkit-scrollbar-track { background:var(--td-base); }
.td-dialog-scroll::-webkit-scrollbar-thumb { background:var(--td-accent); border:2px solid var(--td-base); border-radius:8px; }
#trophydeck-rail .epic-sort .epic-drag svg { width:16px; height:16px; display:block; }
#trophydeck-settings .td-custom-colors { display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin-top:12px; }
#trophydeck-settings .td-custom-colors label { display:flex; align-items:center; gap:6px; }
#trophydeck-settings .td-custom-colors input[type="color"] { width:34px; height:28px; padding:0; border:0; cursor:pointer; background:transparent; }
#trophydeck-rail .td-custom-group { border-bottom:0; }
#trophydeck-rail .td-link-actions { display:flex; align-items:center; flex-wrap:wrap; gap:5px; border-top:1px solid var(--td-accent); padding-top:8px; margin-top:6px; }
#trophydeck-rail .td-link-drag { cursor:grab; flex:none; }
#trophydeck-rail .td-link-drag svg { display:block; width:15px; height:15px; }
#trophydeck-rail .td-link-dragging { opacity:.5; }
#trophydeck-rail .td-link-drop { outline:2px dashed #ffe600; outline-offset:-2px; }
#trophydeck-rail .td-favorite { background:var(--td-favorite-color,var(--td-accent)); }
#trophydeck-rail .td-favorite a { color:var(--td-favorite-text,#fff); }
#trophydeck-rail .td-favorite-color { width:25px; height:24px; padding:0; border:0; background:transparent; cursor:pointer; }
#trophydeck-rail .td-quick-color-hint { display:flex; align-items:flex-start; gap:6px; }
#trophydeck-rail .td-quick-color-icon svg { display:block; width:16px; height:16px; flex:none; }
#trophydeck-rail .td-favorite-controls button { padding:2px 3px; font-size:12px; }
#trophydeck-rail .td-favorite-color { width:20px; height:20px; }
#trophydeck-rail .td-favorite-drag { position:absolute; top:4px; left:4px; pointer-events:none; }
#trophydeck-rail .td-favorite-drag svg { display:block; width:14px; height:14px; color:var(--td-favorite-text,#fff); }
/* Keep the Trophy Deck scrollbar below its fixed header as well. */
#trophydeck-rail .epic-panel { display:flex; flex-direction:column; overflow:hidden; }
#trophydeck-rail .epic-header { position:relative; top:auto; flex:none; margin:-14px -14px 0; }
#trophydeck-rail .epic-panel-scroll { flex:1 1 auto; min-height:0; overflow:auto; overflow-anchor:none; margin:0 -14px -14px; padding:14px; scrollbar-color:var(--td-accent) var(--td-base); }
#trophydeck-rail .epic-panel-scroll::-webkit-scrollbar { width:10px; }
#trophydeck-rail .epic-panel-scroll::-webkit-scrollbar-track { background:var(--td-base); }
#trophydeck-rail .epic-panel-scroll::-webkit-scrollbar-thumb { background:var(--td-accent); border:2px solid var(--td-base); border-radius:8px; }
/* Fade a left-side deck only while it actually covers profile navigation or a PSNP+ menu. */
#trophydeck-rail { transition:transform .28s ease; }
@media (prefers-reduced-motion:reduce) { #trophydeck-rail { transition:none; } }
/* Only the inner content area owns a scrollbar, never the dialog frame. */
#trophydeck-settings.td-scroll-dialog,
#trophydeck-guide.td-scroll-dialog,
.td-dialog.td-scroll-dialog { scrollbar-width:none; }
#trophydeck-settings.td-scroll-dialog::-webkit-scrollbar,
#trophydeck-guide.td-scroll-dialog::-webkit-scrollbar,
.td-dialog.td-scroll-dialog::-webkit-scrollbar { display:none; }
.td-scroll-dialog > .td-dialog-scroll { scrollbar-width:auto; }
/* Cover the header edge so a scroll gutter cannot show through at the corner. */
.td-scroll-dialog > h2::after {
    content:''; position:absolute; top:0; bottom:0; right:-1px; width:11px;
    background:var(--td-accent); border-radius:0 4px 0 0; pointer-events:none;
}
.td-scroll-dialog > h2 > .td-dialog-close { z-index:1; }
/* Only the tab fades. The open deck stays fully readable on either side. */
#trophydeck-rail .epic-tab { transition:opacity .2s ease; }
#trophydeck-rail.td-rail-overlap .epic-tab:not(:hover):not(:focus-visible) { opacity:.14; }
.psnpp-floating-menu.td-psnpp-menu-right { left:auto !important; right:20px !important; }
@media (prefers-reduced-motion:reduce) { #trophydeck-rail .epic-tab { transition:none; } }
/* Favorite color control uses a palette glyph with the native picker above it. */
#trophydeck-rail .td-favorite-color-control { position:relative; display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; cursor:pointer; }
#trophydeck-rail .td-favorite-color-icon svg { display:block; width:15px; height:15px; color:var(--td-favorite-text,#fff); }
#trophydeck-rail .td-favorite-color-control input.td-favorite-color { position:absolute; inset:0; width:100%; height:100%; padding:0; margin:0; opacity:0; cursor:pointer; }
.td-dialog-scroll label select { margin-left:8px; }
.title-bar .td-profile-title-group { display:flex; align-items:center; gap:8px; min-width:0; }
.td-profile-nav-avatar { display:block; width:32px; height:32px; flex:none; object-fit:cover; border-radius:4px; }
.title-bar .navigation .td-profile-layout-nav-item { display:inline-flex; align-items:center; vertical-align:middle; }
#trophydeck-sticky > .td-profile-layout-bar { flex:none; margin-left:4px; }
/* The site navigation keeps its original line box and vertical alignment. */
.title-bar .td-profile-nav-controls-host { position:relative; padding-right:40px; }
.title-bar .td-profile-nav-controls-host.td-profile-nav-editing { padding-right:76px; }
.title-bar .td-profile-nav-controls-host > #td-profile-layout-bar { position:absolute; right:0; top:50%; transform:translateY(-50%); margin:0; }
#trophydeck-rail .td-favorite-actions .td-fav-current { opacity:1; pointer-events:auto; }
#trophydeck-rail .td-favorite-actions .td-fav-current:disabled { opacity:.55; cursor:default; }
#trophydeck-theme-picker .td-custom-colors { display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin-top:16px; }
#trophydeck-theme-picker .td-custom-colors label { display:flex; align-items:center; gap:6px; margin:0; }
#trophydeck-theme-picker .td-custom-colors input[type="color"] { width:34px; height:28px; padding:0; margin:0; border:0; cursor:pointer; background:transparent; }
.td-cabinet-empty { margin-bottom:10px; }
/* Profile and global notes grow with their content. Game notes keep their own line limit. */
.trophydeck-game-note.td-note-unlimited .td-note-preview { display:block; -webkit-line-clamp:unset; overflow:visible; }
/* The navigation fills the remaining header space, with its links flush right. */
#trophydeck-sticky { justify-content:flex-start; }
#trophydeck-sticky > nav {
    display:flex !important;
    flex:1 1 auto;
    min-width:0;
    width:auto !important;
    margin:0 !important;
    justify-content:flex-end !important;
    align-items:center;
}
#trophydeck-sticky > nav > a { flex:0 0 auto; }
#trophydeck-sticky > .td-profile-layout-bar { flex:0 0 auto; }

/* Settings groups keep position and size controls easy to scan. */
#trophydeck-settings .td-deck-settings-group { margin:12px 0; padding:12px; background:color-mix(in srgb,var(--td-card) 72%,var(--td-base)); border-radius:4px; }
#trophydeck-settings .td-deck-group-heading { display:flex; align-items:center; gap:10px; }
#trophydeck-settings .td-deck-group-icon { display:flex; align-items:center; justify-content:center; flex:none; width:30px; height:30px; border-radius:4px; background:var(--td-accent); color:#fff; font-size:20px; line-height:1; }
#trophydeck-settings .td-deck-settings-group .epic-width { margin-top:12px; }
#trophydeck-settings .td-deck-settings-group .td-setting-description { font-size:12px; }

/* Shift centered site wrappers without changing their layout width. */
.width.td-page-shifted { position:relative; left:var(--td-page-offset, 0px) !important; }
#trophydeck-settings .td-deck-group-icon { padding:0; line-height:0; }
#trophydeck-settings .td-deck-group-icon svg { display:block; width:20px; height:20px; flex:none; }

#trophydeck-settings .td-profile-layout-hint { display:block; margin-top:18px; padding-top:14px; border-top:1px solid color-mix(in srgb,var(--td-accent) 60%,transparent); }
#trophydeck-rail.td-page-docked { transition:transform .28s ease, left .28s ease; }
@media (prefers-reduced-motion:reduce) { #trophydeck-rail.td-page-docked { transition:none; } }

/* With a page anchor, the handle sits on the outer side of the panel. */
#trophydeck-rail.td-page-docked { flex-direction:row-reverse; transform:none; }
#trophydeck-rail.td-page-docked.epic-left { flex-direction:row; }
#trophydeck-rail.td-page-docked .epic-tab { border-radius:0 6px 6px 0; }
#trophydeck-rail.td-page-docked.epic-left .epic-tab { border-radius:6px 0 0 6px; }
#trophydeck-rail.td-page-docked .epic-panel { flex:none; transition:width .28s ease, padding .28s ease, border-width .28s ease; }
#trophydeck-rail.td-page-docked.epic-closed { transform:none; }
#trophydeck-rail.td-page-docked.epic-closed .epic-panel { width:0 !important; padding-left:0; padding-right:0; border-left-width:0; border-right-width:0; overflow:hidden; visibility:hidden; transition:width .28s ease, padding .28s ease, border-width .28s ease, visibility 0s linear .28s; }
@media (prefers-reduced-motion:reduce) { #trophydeck-rail.td-page-docked .epic-panel, #trophydeck-rail.td-page-docked.epic-closed .epic-panel { transition:none; } }

html.td-hide-psnp-version #header .logo > a[data-td-psnp-version] { display:none !important; }
#trophydeck-rail .td-platforms button { padding:4px 7px; border:0; border-radius:3px; color:#fff; background:color-mix(in srgb,var(--td-accent) 32%,transparent); font:inherit; font-size:12px; cursor:pointer; }
#trophydeck-rail .td-platforms button:hover:not(:disabled), #trophydeck-rail .td-platforms button.active { background:var(--td-accent); }
#trophydeck-rail .td-platforms button:disabled { opacity:.42; cursor:not-allowed; }
#trophydeck-settings .td-welcome-open { margin-top:12px; }

/* Four-step welcome guide, illustrated with theme-aware UI shapes. */
#trophydeck-welcome { width:min(620px,92vw); }
#trophydeck-welcome .td-welcome-body h3 { margin:16px 0 6px; color:#fff; font-size:19px; }
#trophydeck-welcome .td-welcome-body p { color:#d9e4ef; min-height:3em; line-height:1.5; }
#trophydeck-welcome .td-welcome-illustration { display:flex; align-items:center; justify-content:center; height:175px; overflow:hidden; border:1px solid var(--td-accent); border-radius:5px; background:color-mix(in srgb,var(--td-card) 65%,var(--td-base)); }
#trophydeck-welcome .td-welcome-canvas { display:flex; gap:12px; width:75%; max-width:350px; height:125px; }
#trophydeck-welcome .td-welcome-page { flex:1; padding:10px; background:#e8edf2; border-radius:3px; }
#trophydeck-welcome .td-welcome-line { height:7px; width:75%; background:var(--td-accent); border-radius:4px; margin-bottom:9px; opacity:.8; }
#trophydeck-welcome .td-welcome-block { height:32px; background:#c8d2de; border-radius:3px; margin:8px 0; }
#trophydeck-welcome .td-welcome-rail { width:35%; padding:7px; background:var(--td-base); border:1px solid var(--td-accent); border-radius:3px; }
#trophydeck-welcome .td-welcome-rail-header { height:12px; background:var(--td-accent); border-radius:2px; margin-bottom:7px; }
#trophydeck-welcome .td-welcome-card { height:23px; margin-bottom:5px; background:var(--td-card); border-left:3px solid var(--td-accent); }
#trophydeck-welcome .td-welcome-grid { display:grid; width:100%; grid-template-columns:repeat(3,1fr); gap:7px; }
#trophydeck-welcome .td-welcome-tile { background:var(--td-card); border-top:9px solid var(--td-accent); border-radius:2px; }
#trophydeck-welcome .td-welcome-tile.wide { grid-column:span 2; }
#trophydeck-welcome .td-welcome-note-stack { flex:1; padding:12px; background:#e8edf2; border-radius:4px; }
#trophydeck-welcome .td-welcome-note-symbol { color:var(--td-accent); font-size:28px; line-height:1; margin-bottom:10px; }
#trophydeck-welcome .td-welcome-star { display:flex; align-items:center; justify-content:center; width:105px; color:#fff; background:var(--td-accent); border-radius:4px; font-size:48px; }
#trophydeck-welcome .td-welcome-controls { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:18px; }
#trophydeck-welcome .td-welcome-controls button:disabled { opacity:.4; cursor:default; }
#trophydeck-welcome .td-welcome-progress { color:#c8d6e6; font-size:12px; }

/* Classic platforms have their own row and a deeper background. */
#trophydeck-rail .td-classic-platforms { margin-top:6px; }
#trophydeck-rail .td-classic-platforms button { background:color-mix(in srgb,var(--td-base) 78%,var(--td-accent)); border:1px solid color-mix(in srgb,var(--td-accent) 55%,transparent); }
#trophydeck-rail .td-classic-platforms button:hover:not(:disabled), #trophydeck-rail .td-classic-platforms button.active { background:var(--td-accent); }
#trophydeck-rail .td-classic-status { display:block; color:#c7d6e4; font-size:11px; line-height:1.4; }
#trophydeck-rail .td-classic-status:not(:empty) { margin-top:6px; }
`;
    document.head.append(style);

    applyTheme();
    markPsnpVersionLabel();
    applyPagePosition();
    migrateGameNotes();
    updateFlagged();
    renderRail();
    updateGameNotes();
    updateStickyNav();
    updateGameCabinet();
    setupProfileLayoutEditor();
    applyProfileLayout();
    setupScrollControls();

    observePageChanges();
    observeAccountMenu();
    installSettingsMenu();
    if (showWelcome) openWelcome();

    window.addEventListener('scroll', pauseProfileAutoloadForScroll, {capture:true, passive:true});
    window.addEventListener('scroll', applyRailPosition, {passive:true});
    window.addEventListener('resize', () => {
        applyPagePosition();
        const rail = document.getElementById('trophydeck-rail');
        if (rail) rail.style.setProperty('--epic-width', railWidth() + 'px');
        applyRailPosition();
        scheduleProfileGrid();
    }, {passive:true});
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
} else {
    init();
}

})();
