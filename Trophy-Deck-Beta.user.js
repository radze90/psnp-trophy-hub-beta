// ==UserScript==
// @name         Trophy Deck
// @namespace    trophydeck.local
// @updateURL    https://raw.githubusercontent.com/radze90/psn-trophy-deck/main/Trophy-Deck-Beta.user.js
// @downloadURL  https://raw.githubusercontent.com/radze90/psn-trophy-deck/main/Trophy-Deck-Beta.user.js
// @version      1.0.19
// @description  Enhancements for PSNProfiles and PSNP+
// @match        https://psnprofiles.com/*
// @run-at       document-start
// @noframes
// @grant        none
// @require      https://raw.githubusercontent.com/radze90/psn-trophy-deck/main/locales/de.js
// @require      https://raw.githubusercontent.com/radze90/psn-trophy-deck/main/locales/en.js
// ==/UserScript==

(function () {
    'use strict';

// Translation catalogs are loaded separately by Tampermonkey using @require.
const translations = {"de": __trophyDeckLocale_de, "en": __trophyDeckLocale_en};
const languageOptions = [["de","Deutsch"],["en","English"]];
const APP_VERSION = "1.0.19";

function getLanguage() {
    const saved = localStorage.getItem('trophydeck.language');
    if (Object.prototype.hasOwnProperty.call(translations, saved)) return saved;
    if (saved !== 'auto') return 'en';
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
    { key: 'trophydeck.hideFlaggedBox', label: t("Hide flagged notice"), defaultValue: true },
    { key: 'trophydeck.showRail', label: t("Show Trophy Deck"), defaultValue: true },
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
    { key: 'trophydeck.noteWrap', label: t("Wrap game notes"), defaultValue: false },
    { key: 'trophydeck.psnpColors', label: t("Apply theme to PSNProfiles"), defaultValue: false },
    { key: 'trophydeck.analytics', label: t("Count anonymous usage locally"), defaultValue: false }
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

function applyTheme() {
    const name = localStorage.getItem('trophydeck.theme') || 'Blau';
    const [base, card, accent] = themes[name] || themes.Blau;
    document.documentElement.style.setProperty('--td-base', base);
    document.documentElement.style.setProperty('--td-card', card);
    document.documentElement.style.setProperty('--td-accent', accent);
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
    a.download = 'trophy-deck-nutzung.json';
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
    const descriptions={hideFlaggedBox:t("Hides the leaderboard notice on profile pages."),showRail:t("Shows Trophy Deck as a collapsible sidebar."),showStats:t("Calculates additional profile statistics."),showLinks:t("Provides preset views of the game list."),showNote:t("A note for the profile currently displayed."),globalNote:t("The same note on every page."),favorites:t("Saves profile links as favorites."),cabinet:t("Use the star in the profile game list to save games to the cabinet."),cabinetNames:t("Shows shortened game names below covers."),scrollButtons:t("Adds a scroll-to-bottom button next to the scroll-to-top button."),customLinks:t("Manage your own links and categories."),gameNotes:t("Shows personal game notes on profile and game pages."),noteWrap:t("Displays long game notes over multiple lines."),stickyNav:t("Keeps the profile navigation with Profile, Trophy Log and Stats visible while scrolling."),psnpColors:t("Applies the selected theme to page headers and dialogs."),analytics:t("Counts selected actions locally; nothing is sent automatically.")};
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
    a.download='trophy-deck-daten.json';
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
        ['deck', 'Trophy Deck', ['showRail']],
        ['profile', "Profile page", ['stickyNav', 'hideFlaggedBox', 'scrollButtons']],
        ['blocks', "Deck sections", ['showStats', 'showLinks', 'showNote', 'globalNote', 'customLinks', 'favorites', 'cabinet', 'cabinetNames']],
        ['notes', "Game notes", ['gameNotes', 'noteWrap']],
        ['colors', "Colors", ['psnpColors']],
        ['analytics', "Usage statistics", ['analytics']],
        ['backup', 'Backup', []],
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

    const layoutHint = make('small', t('Use “Edit profile layout” on a profile page to move or hide sections.'), 'epic-muted');
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
    languageSelect.value = localStorage.getItem('trophydeck.language') || 'en';
    languageSelect.addEventListener('change', () => {
            localStorage.setItem('trophydeck.language', languageSelect.value);
            logEvent('setting.language');
            location.reload();
        });
    languageLabel.append(languageSelect);
    sections.deck.append(languageLabel);
    sections.deck.append(make('small', t("The language is applied after reloading the page."), 'epic-muted'));

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
    sections.backup.append(make('p',t("The backup contains your Trophy Deck settings, notes, links, favorites and locally stored data. Keep it safe. Importing replaces your current Trophy Deck data."),'epic-muted'),exportAll);
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
    sections.backup.append(make('p',t("A full reset permanently deletes all local Trophy Deck data. Download a backup first if needed."),'epic-muted'),wipe);
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
    sections.backup.append(importButton,fileInput);


    sections.analytics.append(make('p', t("Optional local counters, switches and appearance settings including the color theme. No note content, URLs or profile names. Export is manual; nothing is sent automatically."), 'epic-muted'));
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
            }
        });
    widthLabel.append(widthValue, width);
    sections.deck.append(widthLabel);
    const viewportHint=make('small','','epic-muted');
    sections.deck.append(viewportHint);
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
    sections.deck.append(sideLabel);
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
    sections.deck.append(behaviorLabel);
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
    sections.deck.append(heightLabel);
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
    sections.deck.append(panelHeightLabel);
    const defaults=make('button',t("Restore Trophy Deck defaults"),'epic-button');
    defaults.type='button';
    defaults.addEventListener('click',()=>{
            ['railWidth','panelHeight','positionPercent','positionMode','positionAnchorScroll','positionDocked','side'].forEach(k=>localStorage.removeItem('trophydeck.'+k));
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
    dialog.append(grid);
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
                [t("Profile layout"), t("Use the edit icon beside the profile name. Drag small sections into the left, middle or right column; use the width icon for full width. The reset icon appears while editing.")],
                [t("Game notes"), t("Click the note below a game or on its trophy page. Text is saved locally as you type; clicking outside closes the editor. Web links are clickable.")],
                [t("Game cabinet"), t("Use the star beside a game to save it to the displayed profile’s cabinet. Hover over its cover to reveal the remove button.")],
                [t("Profile navigation"), t("Optionally keep the upper navigation with Profile, Trophy Log and Stats visible while scrolling.")]
            ]],
        [t("In Trophy Deck"), [
                [t("Quick filters and progress"), t("Filters open preset game-list views. Progress calculates additional values from the displayed profile.")],
                [t("Notes"), t("The global note appears on all pages; profile notes belong to a specific profile. Manage notes to view or delete saved notes.")],
                [t("Favorites and links"), t("Add players or links. In edit mode, reorder or remove players; links can be organized into categories.")],
                [t("Sections"), t("Click a section heading to expand or collapse it. Reorder sections using the handle or arrows.")]
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
    box.append(make('small',t("Platform"),'epic-muted'),platform);
    panel.append(box);
}

function copyTypography(source, target) {
    const computed = getComputedStyle(source);
    ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform'].forEach(property => {
            target.style.setProperty(property, computed.getPropertyValue(property));
        });
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
            const signature = profile.nav.innerHTML;
            if (links.dataset.signature !== signature) {
                links.replaceChildren();
                profile.nav.querySelectorAll('a[href]').forEach(original => {
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
    const box=make('section',null,'epic-card');
    box.append(make('h3',t("My links")));
    const content=make('div',null,'td-links-content');
    function read() {
        try {
            const data=JSON.parse(localStorage.getItem('trophydeck.customLinkData') || '{}');
            return { categories:Array.isArray(data.categories)?data.categories:[], links:Array.isArray(data.links)?data.links:[] };
        }
        catch (_) {
            return {categories:[],links:[]};
        }
    }
    function save(data) {
        localStorage.setItem('trophydeck.customLinkData',JSON.stringify(data));
        logEvent('customLinks.change');
        draw();
    }
    function btn(text,title,callback) {
        const b=make('button',t(text),'td-link-button'+(title.includes('Add')?'':' td-edit-control'));
        b.type='button';
        b.title=t(title);
        b.setAttribute('aria-label',t(title));
        b.addEventListener('click',event=>{
                event.stopPropagation();
                callback();
            });
        return b;
    }
    async function askCategory(old) {
        const value=await tdDialog(t("Category"),[{label:t("Name (up to 30 characters)"),value:old||'',max:30}]);
        return value && value[0] ? value[0] : null;
    }
    async function askLink(current,category) {
        const result=await tdDialog(t("Edit link"),[{label:t("Link text"),value:current?.text||'',max:80},{label:t("Address (HTTP or HTTPS)"),value:current?.url||'https://'}]);
        if(!result || !result[0]){
            return null;
        }
        try {
            const url=new URL(result[1]);
            if(!['http:','https:'].includes(url.protocol)||url.username||url.password){
                throw new Error();
            } return {text:result[0],url:url.href,category};
        }
        catch (_) {
            await tdDialog(t("Invalid address"),[],t("Enter an HTTP or HTTPS address without credentials."));
            return null;
        }
    }
    function draw() {
        content.replaceChildren();
        const data=read();
        const categories=[...(data.links.some(link=>!link.category)?['']:[]),...data.categories];
        categories.forEach(category=>{
                const section=make('div',null,'td-custom-group');
                const title=make('div',null,'td-custom-heading');
                title.append(make('strong',category || t("Uncategorized")));
                if(category) {
                    title.append(btn('✎',"Rename category",async()=>{
                                const n=await askCategory(category);
                                if(!n || data.categories.includes(n)) {
                                    return;
                                } data.categories=data.categories.map(c=>c===category?n:c);
                                data.links.forEach(l=>{
                                        if(l.category===category) {
                                            l.category=n;
                                        }
                                    });
                                save(data);
                            }),
                        btn('×',"Delete category",async()=>{
                                if(!await tdDialog(t("Delete category"),[],t("The links will remain uncategorized."))) {
                                    return;
                                } data.categories=data.categories.filter(c=>c!==category);
                                data.links.forEach(l=>{
                                        if(l.category===category) {
                                            l.category='';
                                        }
                                    });
                                save(data);
                            }));
                }
                title.append(btn('+',"Add link",async()=>{
                            if(data.links.length>=100) {
                                await tdDialog(t("Maximum 100 links"));
                                return;
                            } const item=await askLink(null,category);
                            if(item){
                                data.links.push(item);
                                save(data);
                            }
                        }));
                section.append(title);
                data.links.forEach((item,index)=>{
                        if((item.category||'')!==category) {
                            return;
                        }
                        const row=make('div',null,'td-custom-row');
                        const a=make('a',item.text);
                        a.href=item.url;
                        a.target='_blank';
                        a.rel='noopener noreferrer';
                        a.addEventListener('click',()=>logEvent('customLinks.open'));
                        row.append(a,btn('✎',"Edit link",async()=>{
                                    const updated=await askLink(item,category);
                                    if(updated){
                                        data.links[index]=updated;
                                        save(data);
                                    }
                                }),btn('×',"Delete link",async()=>{
                                    if(await tdDialog(t("Delete link"),[],t("Delete this link?"))){
                                        data.links.splice(index,1);
                                        save(data);
                                    }
                                }));
                        section.append(row);
                    });
                content.append(section);
            });
        content.append(btn("+ Link","Add uncategorized link",async()=>{
                    if(data.links.length>=100){
                        await tdDialog(t("Maximum 100 links"));
                        return;
                    }const item=await askLink(null,'');
                    if(item){
                        data.links.push(item);
                        save(data);
                    }
                }));
        content.append(btn("+ Category","Add category",async()=>{
                    if(data.categories.length>=12){
                        await tdDialog(t("Maximum 12 categories"));
                        return;
                    } const name=await askCategory('');
                    if(name && !data.categories.includes(name)){
                        data.categories.push(name);
                        save(data);
                    }
                }));
    }
    draw();
    box.append(content);
    panel.append(box);
}


function maxRailWidth() {
    return Math.max(260, Math.min(1600, Math.floor(window.innerWidth * 0.45 / 10)*10));
}

function recommendedRailWidth() {
    const recommended = Math.round(Math.min(700, Math.max(310, window.innerWidth * 0.18)) / 10) * 10;
    return Math.max(260, Math.min(maxRailWidth(), recommended));
}

function railWidth() {
    const stored = localStorage.getItem('trophydeck.railWidth');
    const value = stored === null ? recommendedRailWidth() : Number(stored);
    return Math.max(260, Math.min(maxRailWidth(), Number.isFinite(value) && value > 0 ? value : recommendedRailWidth()));
}

function noteWidget(key, label, placeholder) {
    const wrap=make('div',null,'trophydeck-game-note');
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
                localStorage.setItem('trophydeck.gameInfo.'+profile.path.toLowerCase()+'.'+m[1],JSON.stringify({name:link.textContent.trim(),href:url.pathname}));
                const wrap=noteWidget('trophydeck.gameNote.'+profile.path.toLowerCase()+'.'+m[1],t("Note for ")+link.textContent.trim(),t("+ Game note"));
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
    let user=match[2];
    if(!user) {
        const own=Array.from(document.querySelectorAll('div.user-menu ul.dropdown-menu a')).find(a=>a.textContent.trim()==='Your Profile');
        if(own){
            user=new URL(own.href,location.href).pathname.split('/').filter(Boolean)[0];
        }
    }
    const title=Array.from(document.querySelectorAll('#content .title h3')).find(h=>/trophies$/i.test(h.textContent.trim()));
    if(!user||!title){
        return;
    }
    const bar=title.closest('.title');
    if(!bar||bar.parentElement.querySelector('[data-game-page-note]')){
        return;
    }
    localStorage.setItem('trophydeck.gameInfo./'+user.toLowerCase()+'.'+match[1],JSON.stringify({name:title.textContent.trim().replace(/\s+Trophies$/i,''),href:'/trophies/'+location.pathname.split('/')[2]+'/'+user}));
    const section=make('div',null,'td-game-page-note');
    section.dataset.gamePageNote='true';
    section.append(make('strong',t("Game note · ")+decodeURIComponent(user)));
    const note=noteWidget('trophydeck.gameNote./'+user.toLowerCase()+'.'+match[1],t("Game note for ")+decodeURIComponent(user),t("+ Game note"));
    note.dataset.gameNote='true';
    section.append(note);
    bar.after(section);
}


function setupCardSorting(cards) {
    const defaults = ['overview', 'filters', 'globalNote', 'profileNote', 'customLinks', 'favorites', 'settings'];
    let saved = [];
    try {
        saved = JSON.parse(localStorage.getItem('trophydeck.cardOrder') || '[]');
    } catch (_) { /* use default order */ }
    if (!Array.isArray(saved)) {
        saved = [];
    }
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
            const handle = make('button', '⋮⋮', 'epic-drag');
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
                    const input=make('input');
                    input.type=field.type||'text';
                    input.value=field.value||'';
                    input.maxLength=field.max||2048;
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
        const grid=make('div',null,'td-favorites-grid');
        let dragging=null;
        function persist(){
            localStorage.setItem('trophydeck.favoritePlayers',JSON.stringify(list));
            logEvent('favorites.change');
            draw();
        }
        list.forEach((name,index)=>{
                const tile=make('div',null,'td-favorite');
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
                            list[index]=result[0];
                            persist();
                        }
                    });
                controls.append(rename);
                const del=make('button','×','td-link-button');
                del.type='button';
                del.setAttribute('aria-label',name+t(" remove"));
                del.addEventListener('click',async()=>{
                        if(await tdDialog(t("Remove favorite"),[],name+t(" from favorites?"))){
                            list.splice(index,1);
                            persist();
                        }
                    });
                controls.append(del);
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
                const answer=await tdDialog(t("Add player"),[{label:'PSN-ID',max:16}]);
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
        actions.append(add,edit);
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
            if(k==='trophydeck.globalNoteText'||k.startsWith('trophydeck.note./')||k.startsWith('trophydeck.gameNote./')) {
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
                else if(key.startsWith('trophydeck.gameNote./')) {
                    const part=key.slice('trophydeck.gameNote./'.length), split=part.lastIndexOf('.');
                    label=t("Game note · ")+part.slice(0,split)+t(" · Game ID ")+part.slice(split+1);
                }
                
                else {
                    label=t("Profile note · ")+key.slice('trophydeck.note./'.length);
                }
                item.append(make('strong',label));
                if(key.startsWith('trophydeck.gameNote./')) {
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
                if(key==='trophydeck.globalNoteText'||key.startsWith('trophydeck.note./')||key.startsWith('trophydeck.gameNote./')){
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
    if(!enabled('trophydeck.cabinet')) {
        document.querySelectorAll('.td-cabinet-add,[data-td-cabinet]').forEach(e=>e.remove());
        return;
    }
    const key=cabinetKey(profile);
    document.querySelectorAll('tr td a.title[href*="/trophies/"]').forEach(link=>{
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
        const sidebar=document.querySelector('div.sidebar');
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
        if(!list.length){
            container.remove();
            return;
        }
        const heading=make('div',null,'title flex v-align');
        const grow=make('div',null,'grow');
        grow.append(make('h3',t("Game cabinet")));
        heading.append(grow);
        const grid=make('div',null,'box td-cabinet-grid');
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

function applyRailPosition() {
    const rail=document.getElementById('trophydeck-rail');
    if(!rail){
        return;
    }
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
        return;
    }
    const anchor=Number(localStorage.getItem('trophydeck.positionAnchorScroll')||0);
    rail.style.top=Math.max(0,localStorage.getItem('trophydeck.positionMode')==='fixed'?base:base-Math.max(0,window.scrollY-anchor))+'px';
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
        const definition = profileLayoutDefinitions.find(item => item.id === id);
        const previous = items.find(item => item && item.id === id) || {};
        let zone = ['top','main','left','center','sidebar','bottom'].includes(previous.zone) ? previous.zone : definition.zone;
        if (id === 'games' && ['left','center','sidebar'].includes(zone)) zone = 'main';
        if (id === 'recent' && !['top','bottom'].includes(zone)) zone = 'top';
        if (id !== 'games' && id !== 'recent' && zone === 'main') zone = 'left';
        const full = id === 'recent' || id === 'games' && ['top','bottom'].includes(zone) || (typeof previous.full === 'boolean' ? previous.full : ['top','bottom'].includes(zone));
        return {id, zone, full, hidden:previous.hidden === true, restoreZone:(id === 'games' ? 'main' : (['left','center','sidebar'].includes(previous.restoreZone) ? previous.restoreZone : 'sidebar'))};
    });
}

function saveProfileLayout(items) {
    localStorage.setItem(profileLayoutKey, JSON.stringify({version:1, items}));
    logEvent('profileLayout.change');
    applyProfileLayout();
}

function profileLayoutAreas() {
    const profile = profileInfo();
    if (!profile || location.pathname.replace(/\/$/, '').toLowerCase() !== profile.path.toLowerCase()) return null;
    const content = document.querySelector('#content');
    const sidebar = content && content.querySelector('.row > .sidebar');
    const main = sidebar && sidebar.parentElement.querySelector(':scope > .col-xs-8');
    if (!content || !sidebar || !main) return null;
    const row = sidebar.parentElement;
    let top = content.querySelector(':scope > [data-td-profile-zone="top"]');
    if (!top) {
        top = make('div', null, 'td-profile-top');
        top.dataset.tdProfileZone = 'top';
        row.before(top);
    }
    function ensureZone(name) {
        let zone = row.querySelector(':scope > [data-td-profile-zone="' + name + '"]');
        if (!zone) { zone = make('div', null, 'td-profile-small-column'); zone.dataset.tdProfileZone = name; row.append(zone); }
        return zone;
    }
    const left = ensureZone('left'), center = ensureZone('center');
    let bottom = content.querySelector(':scope > [data-td-profile-zone="bottom"]');
    if (!bottom) { bottom = make('div', null, 'td-profile-bottom'); bottom.dataset.tdProfileZone = 'bottom'; row.after(bottom); }
    row.classList.add('td-profile-grid');
    return {content, row, top, main, left, center, sidebar, bottom};
}

function collectProfileSections(areas) {
    const {content, top, main, sidebar} = areas;
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
    Array.from(sidebar.querySelectorAll(':scope > .title h3')).forEach(heading => {
        const id = titles[heading.textContent.trim().toLowerCase().replace(/\s*\([^)]*\)$/, '')];
        const title = heading.closest('.title');
        const box = title && title.nextElementSibling;
        if (!id || sections[id] || !box || !box.matches('.box')) return;
        const wrapper = make('div', null, 'td-profile-section');
        wrapper.dataset.tdProfileSection = id;
        title.before(wrapper); wrapper.append(title, box); sections[id] = wrapper;
    });
    if (!sections.updateInfo) {
        const status = Array.from(sidebar.querySelectorAll(':scope > span.floatr')).find(element => {
            const small = element.querySelector('small');
            return small && /^updated\b/i.test(small.textContent.trim());
        });
        if (status) {
            const wrapper = make('div', null, 'td-profile-section td-profile-update');
            wrapper.dataset.tdProfileSection = 'updateInfo';
            status.before(wrapper); wrapper.append(status); sections.updateInfo = wrapper;
        }
    }
    return sections;
}

function applyProfileLayout() {
    const areas = profileLayoutAreas();
    if (!areas) return;
    const sections = collectProfileSections(areas);
    const items = readProfileLayout();
    for (const item of items) if (sections[item.id]) {
        sections[item.id].hidden = item.hidden && !profileLayoutEditing;
        sections[item.id].classList.toggle('td-profile-is-wide', item.full || item.id === 'recent' || item.id === 'games');
        if (profileLayoutEditing) updateProfileSectionControls(sections[item.id], item);
    }
    // Preserve the site's exact original order until the user changes the layout.
    if (!localStorage.getItem(profileLayoutKey) && !profileLayoutEditing) { syncProfileGrid(areas); return; }
    for (const zone of ['top','main','left','center','sidebar','bottom']) {
        const target = areas[zone];
        let anchor = null;
        for (const item of items.filter(entry => entry.zone === zone).reverse()) {
            const section = sections[item.id];
            if (!section) continue;
            if (section.parentElement !== target || section.nextElementSibling !== anchor) target.insertBefore(section, anchor);
            anchor = section;
        }
    }
    syncProfileGrid(areas);
    if (profileLayoutEditing) for (const item of items) if (sections[item.id]) updateProfileSectionControls(sections[item.id], item);
}

function syncProfileGrid(areas) {
    const mainOccupied = Array.from(areas.main.children).some(child => !child.hidden);
    areas.row.classList.toggle('td-profile-main-empty', !mainOccupied && !profileLayoutEditing);
    const smallZones = ['left', 'center', 'sidebar'];
    let count = 0;
    for (const zone of smallZones) {
        const container = areas[zone];
        const occupied = Array.from(container.children).some(child => !child.hidden && (!child.dataset.tdProfileSection || child.classList.contains('td-profile-section')));
        container.classList.toggle('td-profile-zone-empty', !occupied);
        if (occupied) count++;
    }
    for (let number = 0; number <= 3; number++) areas.row.classList.toggle('td-profile-columns-' + number, number === count);
}

// Reorder data separately from the DOM, so absent and hidden sections remain intact.
function canDropProfileSection(item, zone) {
    if (item.id === 'games') return zone === 'main' || (['top','bottom'].includes(item.zone) && ['top','bottom'].includes(zone));
    if (item.id === 'recent') return ['top','bottom'].includes(zone);
    if (item.full) return ['top','bottom'].includes(zone);
    return ['left','center','sidebar','top','bottom'].includes(zone);
}

function moveProfileSection(items, id, zone, targetId, after = false) {
    if (!['top','main','left','center','sidebar','bottom'].includes(zone)) return items;
    const current = items.find(item => item.id === id);
    if (!current || !canDropProfileSection(current, zone)) return items;
    const next = items.map(item => ({...item}));
    const source = next.findIndex(item => item.id === id);
    if (source < 0 || id === targetId) return next;
    const [moved] = next.splice(source, 1);
    moved.zone = zone;
    if (['left','center','sidebar'].includes(zone)) { moved.full = false; moved.restoreZone = zone; }
    const target = next.findIndex(item => item.id === targetId && item.zone === zone);
    if (target >= 0) next.splice(target + (after ? 1 : 0), 0, moved);
    else {
        const last = next.reduce((found, item, index) => item.zone === zone ? index : found, -1);
        next.splice(last < 0 ? next.length : last + 1, 0, moved);
    }
    return next;
}

function resetProfileLayout() {
    saveProfileLayout(profileLayoutDefinitions.map(({id, zone}) => ({id, zone, hidden:false})));
}

function clearProfileDropIndicators() {
    document.querySelectorAll('.td-profile-drop-before, .td-profile-drop-after, .td-profile-drop-zone').forEach(element => {
        element.classList.remove('td-profile-drop-before', 'td-profile-drop-after', 'td-profile-drop-zone');
    });
}

function installProfileDropZone(container, zone) {
    if (container.dataset.tdLayoutDropZone) return;
    container.dataset.tdLayoutDropZone = zone;
    function findTarget(event) {
        const section = event.target.closest('[data-td-profile-section]');
        return section && section.parentElement === container ? section : null;
    }
    container.addEventListener('dragover', event => {
        if (!profileLayoutEditing || !draggedProfileSection) return;
        const current = readProfileLayout().find(item => item.id === draggedProfileSection);
        if (!current || !canDropProfileSection(current, zone)) return;
        event.preventDefault(); event.dataTransfer.dropEffect = 'move';
        clearProfileDropIndicators();
        const target = findTarget(event);
        if (target && target.dataset.tdProfileSection !== draggedProfileSection) {
            const bounds = target.getBoundingClientRect();
            target.classList.add(event.clientY > bounds.top + bounds.height / 2 ? 'td-profile-drop-after' : 'td-profile-drop-before');
        } else if (!target) container.classList.add('td-profile-drop-zone');
    });
    container.addEventListener('drop', event => {
        if (!profileLayoutEditing || !draggedProfileSection) return;
        const current = readProfileLayout().find(item => item.id === draggedProfileSection);
        if (!current || !canDropProfileSection(current, zone)) return;
        event.preventDefault();
        const target = findTarget(event);
        const targetId = target?.dataset.tdProfileSection || null;
        const after = !!target && event.clientY > target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
        const items = moveProfileSection(readProfileLayout(), draggedProfileSection, zone, targetId, after);
        draggedProfileSection = null;
        clearProfileDropIndicators();
        saveProfileLayout(items);
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
                const index = siblings.indexOf(section), neighbor = siblings[index + direction];
                if (!neighbor) return;
                const items = readProfileLayout();
                const current = items.find(entry => entry.id === section.dataset.tdProfileSection);
                if (current) saveProfileLayout(moveProfileSection(items, current.id, current.zone, neighbor.dataset.tdProfileSection, direction > 0));
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
            if (current.full) { current.zone = current.restoreZone; current.full = false; }
            else { if (['main','left','center','sidebar'].includes(current.zone)) current.restoreZone = current.zone; current.zone = 'top'; current.full = true; }
            saveProfileLayout(items);
        });
        toolbar.append(handle, title, up, down, width, visibility); section.prepend(toolbar);
    }
    const width = toolbar.querySelector('.td-profile-width');
    const wide = item.full;
    width.disabled = item.id === 'recent';
    setProfileLayoutIcon(width, wide ? 'shrink' : 'expand');
    width.title = item.id === 'recent' ? t('Recent trophies always use full width') : (wide ? t('Restore section width') : t('Expand section to full width'));
    width.setAttribute('aria-label', width.title + ': ' + t(profileLayoutDefinitions.find(entry => entry.id === item.id).label));
    width.setAttribute('aria-pressed', String(wide));
    const visibility = toolbar.querySelector('.td-profile-visibility');
    const siblings = Array.from(section.parentElement.children).filter(child => child.dataset.tdProfileSection);
    const siblingIndex = siblings.indexOf(section);
    toolbar.querySelector('.td-profile-up').disabled = siblingIndex <= 0;
    toolbar.querySelector('.td-profile-down').disabled = siblingIndex < 0 || siblingIndex >= siblings.length - 1;
    setProfileLayoutIcon(visibility, item.hidden ? 'eyeOff' : 'eye');
    visibility.title = item.hidden ? t('Show section') : t('Hide section');
    visibility.setAttribute('aria-label', visibility.title + ': ' + t(profileLayoutDefinitions.find(entry => entry.id === item.id).label));
}

function setProfileLayoutEditing(editing) {
    const areas = profileLayoutAreas();
    if (!areas) { tdDialog(t('Profile layout'), [], t('Open a profile page to arrange its sections.')); return false; }
    profileLayoutEditing = editing;
    document.querySelectorAll('[data-td-layout-controls]').forEach(bar => {
        const button = bar.querySelector('.td-profile-layout-edit');
        setProfileLayoutIcon(button, editing ? 'done' : 'edit');
        button.title = editing ? t('Done editing profile layout') : t('Edit profile layout');
        button.setAttribute('aria-label', button.title);
        button.setAttribute('aria-pressed', String(editing));
        bar.querySelector('.td-profile-layout-reset').hidden = !editing;
    });
    for (const zone of ['top','main','left','center','sidebar','bottom']) {
        areas[zone].classList.toggle('td-profile-edit-zone', editing);
        areas[zone].dataset.tdDropLabel = t(({top:'Upper area', main:'Games area', left:'Left column', center:'Middle column', sidebar:'Right column', bottom:'Lower area'})[zone]);
        installProfileDropZone(areas[zone], zone);
    }
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
    edit: 'M12 20h9 M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4z',
    done: 'M5 12l5 5L20 6', reset: 'M3 12a9 9 0 1 0 3-6.7 M3 3v6h6',
    drag: 'M9 5h.01 M15 5h.01 M9 12h.01 M15 12h.01 M9 19h.01 M15 19h.01',
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
    reset.addEventListener('click', resetProfileLayout); bar.append(button, reset);
    return bar;
}
function setupProfileLayoutEditor() {
    const areas = profileLayoutAreas();
    if (!areas) return;
    const profile = profileInfo();
    const heading = profile?.nav.closest('.title-bar')?.querySelector('h3');
    if (heading?.parentElement && !document.getElementById('td-profile-layout-bar')) heading.parentElement.append(makeProfileLayoutControls('td-profile-layout-bar'));
    const stickyTitle = document.querySelector('#trophydeck-sticky .td-sticky-title');
    if (stickyTitle && !stickyTitle.querySelector('[data-td-layout-controls]')) stickyTitle.append(makeProfileLayoutControls());
}


function renderRail() {
    const old = document.getElementById('trophydeck-rail');
    const previousScroll=old?.querySelector('.epic-panel')?.scrollTop || 0;
    if (old) {
        old.remove();
    }
    if (!enabled('trophydeck.showRail')) {
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
    const tabTitle = make('span', 'TROPHY DECK', 'epic-tab-title');
    tab.append(tabArrow, tabTitle);
    function updateTab() {
        tabArrow.textContent = isLeft ? (railOpen ? '«' : '»') : (railOpen ? '»' : '«');
        tabTitle.hidden = railOpen;
        tab.setAttribute('aria-label', railOpen ? t("Collapse Trophy Deck") : t("Expand Trophy Deck"));
        tab.setAttribute('aria-expanded', String(railOpen));
        root.classList.toggle('epic-closed', !railOpen);
    }
    tab.addEventListener('click', () => {
            logEvent('deck.toggle');
            railOpen = !railOpen;
            localStorage.setItem('trophydeck.railOpen', String(railOpen));
            updateTab();
        });
    updateTab();
    root.append(tab);
    const panel = make('div', null, 'epic-panel');
    const header = make('header', null, 'epic-header');
    header.append(make('h2', 'TROPHY DECK'));
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
    const profile = profileInfo();
    const cards = make('div', null, 'epic-cards');
    function addCard(key, add) {
        const count = cards.children.length;
        add(cards, profile);
        if (cards.children.length > count) {
            cards.lastElementChild.dataset.deckCard = key;
        }
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
    if (!profile) {
        panel.append(make('p', t("Open a profile for progress, quick filters and profile notes."), 'epic-muted'));
    }
    const settings = make('section', null, 'epic-card epic-settings');
    settings.append(make('h3', t("Quick settings")));
    features.filter(feature => feature.key !== 'trophydeck.showRail').forEach(feature => settings.append(toggleControl(feature)));
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
    panel.append(cards);
    root.append(panel);
    document.body.append(root);
    panel.scrollTop=previousScroll;
    applyRailPosition();
}

function addMenuItem() {
    const menu = document.querySelector('div.user-menu > div.dropdown > ul.dropdown-menu');
    if (!menu) {
        return false;
    }
    const psnp = Array.from(menu.querySelectorAll('a')).find(link => link.textContent.trim() === 'PSNP+ Settings');
    if (!psnp) {
        return false;
    }
    if (!menu.querySelector('[data-trophydeck-settings]')) {
        const item = make('li');
        const link = make('a', t("Trophy Deck Settings"));
        link.href = '#';
        link.dataset.trophydeckSettings = 'true';
        link.addEventListener('click', event => {
                event.preventDefault();
                openSettings();
            });
        item.append(link);
        psnp.closest('li').after(item);
    }
    return true;
}


function init() {
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
#td-profile-layout-bar button[aria-pressed="true"] { box-shadow:0 0 0 2px var(--td-accent); }
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
`;
    document.head.append(style);
    applyTheme();
    updateFlagged();
    renderRail();
    updateGameNotes();
    updateStickyNav();
    updateGameCabinet();
    setupProfileLayoutEditor();
    applyProfileLayout();
    let layoutPending = false;
    const layoutObserver = new MutationObserver(records => {
        if (layoutPending || !records.some(record => record.addedNodes.length)) return;
        layoutPending = true;
        requestAnimationFrame(() => { layoutPending = false; applyProfileLayout(); });
    });
    layoutObserver.observe(document.body, {childList:true, subtree:true});
    setupScrollControls();
    window.addEventListener('scroll',applyRailPosition,{passive:true});
    window.addEventListener('resize',()=>{
            const rail=document.getElementById('trophydeck-rail');
            if(rail){
                rail.style.setProperty('--epic-width',railWidth()+'px');
            }applyRailPosition();
        },{passive:true});
    let scanPending = false;
    const gameObserver = new MutationObserver(records => {
            if (!enabled('trophydeck.gameNotes') || !records.some(record => record.addedNodes.length)) {
                return;
            }
            if (!scanPending) {
                scanPending = true;
                requestAnimationFrame(() => {
                        scanPending = false;
                        updateGameNotes();
                    });
            }
        });
    gameObserver.observe(document.body, { childList: true, subtree: true });
    const cabinetObserver=new MutationObserver(records=>{
            if(records.some(record=>Array.from(record.addedNodes).some(node=>node.nodeType===1 && (node.matches?.('tr') || node.querySelector?.('tr td a.title[href*=\"/trophies/\"]'))))) {
                updateGameCabinet();
            }
        });
    cabinetObserver.observe(document.body,{childList:true,subtree:true});
    if (!addMenuItem()) {
        const observer = new MutationObserver(() => {
                if (addMenuItem()) {
                    observer.disconnect();
                }
            });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
}
else {
    init();
}

})();
