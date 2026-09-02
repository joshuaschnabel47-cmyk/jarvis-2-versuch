/* =========================================================
   JARVIS v3.7
   ========================================================= */


/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEYS = {

    subjects:
        "jarvis_subjects",

    homework:
        "jarvis_homework",

    tasks:
        "jarvis_tasks",

    notes:
        "jarvis_notes",

    exams:
        "jarvis_exams",

    appointments:
        "jarvis_appointments",

    vocabulary:
        "jarvis_vocabulary",

    vocabularyFilter:
        "jarvis_vocabulary_filter"

};


/* =========================================================
   DATA
   ========================================================= */

let subjects =
    loadData(
        STORAGE_KEYS.subjects
    );

let homework =
    loadData(
        STORAGE_KEYS.homework
    );

let tasks =
    loadData(
        STORAGE_KEYS.tasks
    );

let notes =
    loadData(
        STORAGE_KEYS.notes
    );

let exams =
    loadData(
        STORAGE_KEYS.exams
    );

let appointments =
    loadData(
        STORAGE_KEYS.appointments
    );

let vocabulary =
    loadData(
        STORAGE_KEYS.vocabulary
    );


/* =========================================================
   VOCABULARY STATE
   ========================================================= */

let vocabularyIndex = 0;

let vocabularyFlipped = false;

let vocabularyFilter =
    localStorage.getItem(
        STORAGE_KEYS.vocabularyFilter
    ) ||
    "all";


/* =========================================================
   ACCESS
   ========================================================= */

const ACCESS_CODE =
    "220811";


/* =========================================================
   DOM
   ========================================================= */

const securityScreen =
    document.getElementById(
        "securityScreen"
    );

const reactorButton =
    document.getElementById(
        "reactorButton"
    );

const accessPanel =
    document.getElementById(
        "accessPanel"
    );

const accessForm =
    document.getElementById(
        "accessForm"
    );

const accessCodeInput =
    document.getElementById(
        "accessCodeInput"
    );

const accessError =
    document.getElementById(
        "accessError"
    );


const bootScreen =
    document.getElementById(
        "bootScreen"
    );

const bootStatus =
    document.getElementById(
        "bootStatus"
    );

const bootProgress =
    document.getElementById(
        "bootProgressBar"
    );

const bootPercent =
    document.getElementById(
        "bootPercent"
    );


const bootLoadingLabel =
    document.getElementById(
        "bootLoadingLabel"
    );

const bootLines =
    document.getElementById(
        "bootLines"
    );


const app =
    document.getElementById(
        "app"
    );

const schoolModeBtn =
    document.getElementById(
        "schoolModeBtn"
    );

const hackModeBtn =
    document.getElementById(
        "hackModeBtn"
    );

const hackModePanel =
    document.getElementById(
        "hackModePanel"
    );

const leaveHackModeBtn =
    document.getElementById(
        "leaveHackModeBtn"
    );


const commandInput =
    document.getElementById(
        "commandInput"
    );

const sendCommandBtn =
    document.getElementById(
        "sendCommandBtn"
    );

const voiceBtn =
    document.getElementById(
        "voiceBtn"
    );

const jarvisMessage =
    document.getElementById(
        "jarvisMessage"
    );

const jarvisState =
    document.getElementById(
        "jarvisState"
    );

const voiceStatus =
    document.getElementById(
        "voiceStatus"
    );


const subjectsList =
    document.getElementById(
        "subjectsList"
    );

const homeworkList =
    document.getElementById(
        "homeworkList"
    );

const tasksList =
    document.getElementById(
        "tasksList"
    );

const notesList =
    document.getElementById(
        "notesList"
    );

const examsList =
    document.getElementById(
        "examsList"
    );

const appointmentsList =
    document.getElementById(
        "appointmentsList"
    );


const addSubjectBtn =
    document.getElementById(
        "addSubjectBtn"
    );

const addHomeworkBtn =
    document.getElementById(
        "addHomeworkBtn"
    );

const addTaskBtn =
    document.getElementById(
        "addTaskBtn"
    );

const addNoteBtn =
    document.getElementById(
        "addNoteBtn"
    );

const addExamBtn =
    document.getElementById(
        "addExamBtn"
    );

const addAppointmentBtn =
    document.getElementById(
        "addAppointmentBtn"
    );


const modalOverlay =
    document.getElementById(
        "modalOverlay"
    );

const modalTitle =
    document.getElementById(
        "modalTitle"
    );

const modalFields =
    document.getElementById(
        "modalFields"
    );

const modalForm =
    document.getElementById(
        "modalForm"
    );

const closeModalBtn =
    document.getElementById(
        "closeModalBtn"
    );

const cancelModalBtn =
    document.getElementById(
        "cancelModalBtn"
    );


const vocabularyList =
    document.getElementById(
        "vocabularyList"
    );

const vocabularySubject =
    document.getElementById(
        "vocabularySubject"
    );

const vocabularySubjectFilter =
    document.getElementById(
        "vocabularySubjectFilter"
    );

const vocabularyFront =
    document.getElementById(
        "vocabularyFront"
    );

const vocabularyBack =
    document.getElementById(
        "vocabularyBack"
    );

const addVocabularyBtn =
    document.getElementById(
        "addVocabularyBtn"
    );

const flashcard =
    document.getElementById(
        "flashcard"
    );

const flashcardSubject =
    document.getElementById(
        "flashcardSubject"
    );

const flashcardText =
    document.getElementById(
        "flashcardText"
    );

const flashcardHint =
    document.getElementById(
        "flashcardHint"
    );

const flashcardCounter =
    document.getElementById(
        "flashcardCounter"
    );

const flipCardBtn =
    document.getElementById(
        "flipCardBtn"
    );

const previousCardBtn =
    document.getElementById(
        "previousCardBtn"
    );

const nextCardBtn =
    document.getElementById(
        "nextCardBtn"
    );

const knownCardBtn =
    document.getElementById(
        "knownCardBtn"
    );

const unknownCardBtn =
    document.getElementById(
        "unknownCardBtn"
    );

const learningStats =
    document.getElementById(
        "learningStats"
    );


/* =========================================================
   VOICE
   ========================================================= */

let recognition = null;

let isListening = false;


/* =========================================================
   MODAL
   ========================================================= */

let currentModalType = null;


/* =========================================================
   STORAGE HELPERS
   ========================================================= */

function loadData(key) {

    try {

        const raw =
            localStorage.getItem(
                key
            );

        if (!raw) {
            return [];
        }

        const parsed =
            JSON.parse(raw);

        return Array.isArray(parsed)
            ? parsed
            : [];

    }

    catch (error) {

        console.error(
            "STORAGE LOAD ERROR:",
            error
        );

        return [];

    }

}


function saveData(
    key,
    value
) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    }

    catch (error) {

        console.error(
            "STORAGE SAVE ERROR:",
            error
        );

        setJarvisMessage(
            "Die Daten konnten nicht gespeichert werden."
        );

    }

}


/* =========================================================
   SECURITY
   ========================================================= */

function openAccessPanel() {

    accessPanel.classList.remove(
        "hidden"
    );

    accessError.textContent = "";

    setTimeout(
        () => {

            accessCodeInput.focus();

        },
        50
    );

}


function authenticate() {

    const enteredCode =
        String(
            accessCodeInput.value || ""
        ).trim();


    if (
        enteredCode ===
        ACCESS_CODE
    ) {

        accessError.textContent =
            "ZUGANG BESTÄTIGT";

        accessError.style.color =
            "var(--success)";


        setTimeout(
            () => {

                securityScreen.classList.add(
                    "hidden"
                );

                bootScreen.classList.remove(
                    "hidden"
                );

                startBootAnimation();

            },
            450
        );

        return;

    }


    accessError.textContent =
        "ZUGANG VERWEIGERT // CODE UNGÜLTIG";

    accessError.style.color =
        "var(--danger)";

    accessCodeInput.value =
        "";

    accessCodeInput.focus();

}


/* =========================================================
   ETHICAL HACKING MODE
   ========================================================= */

let currentMode = "school";

function setCategoryMode(mode) {

    currentMode = mode;

    const schoolContent = document.querySelectorAll(
        ".jarvis-panel, .dashboard-grid, .command-list-panel, .vocabulary-panel"
    );

    const isHack = mode === "hack";

    schoolContent.forEach(
        element => element.classList.toggle("hidden", isHack)
    );

    if (hackModePanel) {
        hackModePanel.classList.toggle("hidden", !isHack);
    }

    schoolModeBtn?.classList.toggle("active", !isHack);
    hackModeBtn?.classList.toggle("active", isHack);
}

function startHackBootAnimation() {

    if (!bootScreen || !app) {
        return;
    }

    bootScreen.classList.add("hack-boot");
    bootScreen.classList.remove("hidden");
    app.classList.add("hidden");

    if (bootProgress) bootProgress.style.width = "0%";
    if (bootPercent) bootPercent.textContent = "0%";
    if (bootLoadingLabel) bootLoadingLabel.textContent = "SECURITY LAB // INITIALIZING...";
    if (bootLines) bootLines.innerHTML = "";

    const messages = [
        "INITIALISIERE SECURITY LAB...",
        "ANALYSIERE NETZWERKARCHITEKTUR...",
        "LADE DEFENSIVE ANALYSEMODULE...",
        "INITIALISIERE CRYPTOGRAPHY ENGINE...",
        "PRÜFE AUTHENTICATION LAYERS...",
        "LADE HASH & ENCODING LAB...",
        "AKTIVIERE SECURITY CHECKS...",
        "ETHICAL BOUNDARIES: ACTIVE...",
        "AUTHORIZED ANALYSIS MODE...",
        "SECURITY LAB ONLINE."
    ];

    let progress = 0;

    const interval = setInterval(() => {
        progress = Math.min(100, progress + Math.floor(Math.random() * 8) + 5);

        if (bootProgress) bootProgress.style.width = `${progress}%`;
        if (bootPercent) bootPercent.textContent = `${progress}%`;

        const index = Math.min(
            messages.length - 1,
            Math.floor(progress / (100 / messages.length))
        );

        if (bootStatus) bootStatus.textContent = messages[index];
        if (bootLoadingLabel) bootLoadingLabel.textContent = `SECURITY LAB // ${progress}%`;

        if (bootLines && bootLines.lastElementChild?.dataset.progress !== String(index)) {
            const line = document.createElement("div");
            line.className = "boot-line";
            line.dataset.progress = String(index);
            line.textContent = `> ${messages[index]}`;
            bootLines.appendChild(line);

            while (bootLines.children.length > 7) {
                bootLines.removeChild(bootLines.firstElementChild);
            }
        }

        if (progress >= 100) {
            clearInterval(interval);

            setTimeout(() => {
                bootScreen.classList.add("hidden");
                bootScreen.classList.remove("hack-boot");
                app.classList.remove("hidden");
                setCategoryMode("hack");
                setJarvisMessage("Ethical Hacking Lab geladen. Defensive Werkzeuge bereit.");
            }, 650);
        }
    }, 140);
}

function openHackMode() {
    startHackBootAnimation();
}

function openSchoolMode() {
    setCategoryMode("school");
    setJarvisMessage("Schulbereich aktiviert.");
}


/* =========================================================
   BOOT
   ========================================================= */

function startBootAnimation() {

    let progress = 0;


    const messages = [

        "INITIALISIERE SYSTEM...",

        "LADE JARVIS KERN...",

        "INITIALISIERE DATENBANK...",

        "LADE SCHULMODULE...",

        "AKTIVIERE LERNMODUL...",

        "AKTIVIERE VOKABELSYSTEM...",

        "AKTIVIERE SPRACHSTEUERUNG...",

        "PRÜFE BEFEHLSERKENNUNG...",

        "PRÜFE SYSTEMSTATUS...",

        "JARVIS WIRD GESTARTET..."

    ];


    if (bootProgress) {
        bootProgress.style.width = "0%";
    }

    if (bootPercent) {
        bootPercent.textContent = "0%";
    }


    const interval =
        setInterval(
            () => {

                progress +=
                    Math.floor(
                        Math.random() * 5
                    ) + 2;


                if (
                    progress >= 100
                ) {

                    progress = 100;

                }


                if (bootProgress) {
                    bootProgress.style.width = `${progress}%`;
                }

                if (bootPercent) {
                    bootPercent.textContent = `${progress}%`;
                }


                const index =
                    Math.min(
                        messages.length - 1,

                        Math.floor(
                            progress /
                            (
                                100 /
                                messages.length
                            )
                        )
                    );


                if (bootStatus) {
                    bootStatus.textContent = messages[index];
                }


                if (
                    progress >= 100
                ) {

                    clearInterval(
                        interval
                    );


                    setTimeout(
                        () => {

                            bootScreen.classList.add(
                                "hidden"
                            );

                            app.classList.remove(
                                "hidden"
                            );


                            renderAll();


                            setJarvisMessage(
                                "System erfolgreich gestartet. Alle Module sind bereit."
                            );


                            commandInput.focus();

                        },
                        500
                    );

                }

            },
            120
        );

}


/* =========================================================
   JARVIS MESSAGE
   ========================================================= */

function setJarvisMessage(
    message
) {

    if (jarvisMessage) {

        jarvisMessage.textContent =
            message;

    }

    if (jarvisState) {

        jarvisState.textContent =
            "Bereit";

    }

}


/* =========================================================
   NORMALIZATION
   ========================================================= */

/*
 * v3.7:
 * Befehle werden deutlich robuster normalisiert.
 *
 * Dadurch sind beispielsweise alle Varianten gültig:
 *
 * "lösche das Fach Mathe"
 * "lösche das Fach Mathe."
 * "Lösche das Fach Mathe!"
 * "LÖSCHE DAS FACH MATHE?"
 */

function normalizeCommand(
    command
) {

    if (!command) {

        return "";

    }


    let result =
        String(command)
            .toLowerCase()
            .trim();


    result =
        result.replace(
            /[\u200B-\u200D\uFEFF]/g,
            ""
        );


    result =
        result.replace(
            /[.!?,;:]+$/g,
            ""
        );


    result =
        result.replace(
            /^(?:jarvis|hey jarvis)\s*[,;:-]?\s*/i,
            ""
        );


    result =
        result.replace(
            /^(?:bitte|kannst du bitte|könntest du bitte)\s+/,
            ""
        );


    result =
        result.replace(
            /\s+/g,
            " "
        );


    return result.trim();

}


function cleanName(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /[.!?,;:]+$/g,
            ""
        )
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/* =========================================================
   SUBJECT HELPERS
   ========================================================= */

function findSubject(
    name
) {

    const cleaned =
        cleanName(name);


    return subjects.find(
        subject =>
            cleanName(
                subject.name
            ).toLowerCase() ===
            cleaned.toLowerCase()
    );

}


function findSubjectFromCommand(
    text
) {

    const cleaned =
        cleanName(text);


    const exact =
        findSubject(cleaned);


    if (exact) {

        return exact;

    }


    return subjects.find(
        subject => {

            const subjectName =
                cleanName(
                    subject.name
                ).toLowerCase();

            return cleaned
                .toLowerCase()
                .includes(
                    subjectName
                );

        }
    );

}


/* =========================================================
   COMMAND PROCESSOR
   ========================================================= */

function processCommand(
    rawCommand
) {

    const command =
        normalizeCommand(
            rawCommand
        );


    if (!command) {

        setJarvisMessage(
            "Bitte gib einen Befehl ein."
        );

        return;

    }


    jarvisState.textContent =
        "Verarbeite...";


    /* =====================================================
       FREIZEIT-MODUS + MUSIK (Sprachbefehl-Kombo)
       ===================================================== */

    if (
        (command.includes("freizeit") && (command.includes("aktivier") || command.includes("modus"))) &&
        !command.includes("wechsle")
    ) {
        document.getElementById("leisureModeBtn")?.click();
        setTimeout(() => { window.startJarvisRadio?.(); }, 300);
        setJarvisMessage("Freizeit-Modus aktiviert. JARVIS Radio spielt.");
        return;
    }


    /* =====================================================
       MODUS-WECHSEL (Sprachbefehl-Router)
       ===================================================== */

    if (command.includes("wechsle zu") || command.includes("wechsle in") || command.includes("öffne modus")) {

        if (command.includes("spiel")) {
            document.getElementById("gamesModeBtn")?.click();
            setJarvisMessage("Wechsle zu Spielen.");
            return;
        }
        if (command.includes("hack")) {
            document.getElementById("hackModeBtn")?.click();
            setJarvisMessage("Wechsle zu Hacking.");
            return;
        }
        if (command.includes("freizeit")) {
            document.getElementById("leisureModeBtn")?.click();
            setJarvisMessage("Wechsle zu Freizeit.");
            return;
        }
        if (command.includes("schule")) {
            document.getElementById("schoolModeBtn")?.click();
            setJarvisMessage("Wechsle zu Schule.");
            return;
        }

        setJarvisMessage("Diesen Modus kenne ich nicht. Sag z. B. 'wechsle zu Spielen'.");
        return;

    }


    /* =====================================================
       HILFE
       ===================================================== */

    if (
        command === "hilfe" ||
        command === "help" ||
        command.includes("was kannst du")
    ) {

        setJarvisMessage(
            "Ich kann Fächer, Hausaufgaben, Tagesziele, " +
            "Notizen, Klassenarbeiten, Termine und Vokabeln " +
            "verwalten. Außerdem kann ich die Uhrzeit nennen, " +
            "die Sprachsteuerung nutzen und YouTube Music öffnen."
        );

        return;

    }


    /* =====================================================
       STATUS
       ===================================================== */

    if (
        command === "status" ||
        command === "systemstatus"
    ) {

        const openHomework =
            homework.filter(
                item =>
                    !item.completed
            ).length;


        const openTasks =
            tasks.filter(
                item =>
                    !item.completed
            ).length;


        setJarvisMessage(
            `SYSTEM NOMINAL // ` +
            `${subjects.length} Fächer // ` +
            `${openHomework} offene Hausaufgaben // ` +
            `${openTasks} offene Tagesziele // ` +
            `${vocabulary.length} Vokabeln`
        );

        return;

    }


    /* =====================================================
       UHRZEIT
       ===================================================== */

    if (
        command.includes("wie spät") ||
        command.includes("wie spaet") ||
        command.includes("uhrzeit") ||
        command === "uhr"
    ) {

        const now =
            new Date();


        const time =
            now.toLocaleTimeString(
                "de-DE",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );


        setJarvisMessage(
            `Es ist ${time} Uhr.`
        );

        return;

    }


    /* =====================================================
       FÄCHER ANZEIGEN
       ===================================================== */

    if (
        command === "fächer" ||
        command === "faecher" ||
        command.includes("zeige fächer") ||
        command.includes("zeige faecher") ||
        command.includes("zeige meine fächer") ||
        command.includes("zeige meine faecher") ||
        command.includes("welche fächer") ||
        command.includes("was sind meine fächer") ||
        command.includes("was sind meine faecher") ||
        command.includes("liste meine fächer") ||
        command.includes("liste meine faecher")
    ) {

        if (
            subjects.length === 0
        ) {

            setJarvisMessage(
                "Du hast aktuell keine Fächer gespeichert."
            );

        }

        else {

            setJarvisMessage(
                "Deine Fächer sind: " +
                subjects
                    .map(
                        subject =>
                            subject.name
                    )
                    .join(", ")
            );

        }

        return;

    }


    /* =====================================================
       FACH HINZUFÜGEN
       ===================================================== */

    let addSubjectMatch =
        command.match(
            /^(?:füge|fuege)\s+(?:das\s+)?fach\s+(.+?)\s+(?:hinzu|hinzufügen|hinzufuegen|anlegen|an)$/
        );


    /*
     * Alternative Form:
     *
     * "füge Mathe als Fach hinzu"
     */

    if (!addSubjectMatch) {

        addSubjectMatch =
            command.match(
                /^(?:füge|fuege)\s+(.+?)\s+als\s+fach\s+(?:hinzu|hinzufügen|hinzufuegen|anlegen|an)$/
            );

    }


    /*
     * Alternative Form:
     *
     * "füge Mathe hinzu"
     */

    if (!addSubjectMatch) {

        addSubjectMatch =
            command.match(
                /^(?:füge|fuege)\s+(.+?)\s+(?:als\s+fach\s+)?hinzu$/
            );

    }


    if (addSubjectMatch) {

        const name =
            cleanName(
                addSubjectMatch[1]
            );


        if (!name) {

            setJarvisMessage(
                "Bitte nenne ein Fach."
            );

            return;

        }


        addSubject(name);

        return;

    }


    /* =====================================================
       FACH LÖSCHEN
       ===================================================== */

    let deleteSubjectMatch =
        command.match(
            /^(?:lösche|loesche|entferne)\s+(?:das\s+)?fach\s+(.+)$/
        );


    if (!deleteSubjectMatch) {

        deleteSubjectMatch =
            command.match(
                /^(?:kannst du|könntest du)\s+(?:bitte\s+)?(?:das\s+)?fach\s+(.+?)\s+(?:löschen|loeschen|entfernen)$/
            );

    }


    if (deleteSubjectMatch) {

        const name =
            cleanName(
                deleteSubjectMatch[1]
            );


        const subject =
            findSubject(name);


        if (!subject) {

            setJarvisMessage(
                `Das Fach ${name} wurde nicht gefunden.`
            );

            return;

        }


        deleteSubject(
            subject.id
        );


        setJarvisMessage(
            `Das Fach ${subject.name} wurde gelöscht.`
        );

        return;

    }


    /* =====================================================
       HAUSAUFGABEN
       ===================================================== */

    if (
        command.includes("zeige hausaufgaben") ||
        command === "hausaufgaben"
    ) {

        if (!homework.length) {

            setJarvisMessage(
                "Es sind keine Hausaufgaben gespeichert."
            );

            return;

        }


        const open =
            homework.filter(
                item =>
                    !item.completed
            );


        if (!open.length) {

            setJarvisMessage(
                "Alle Hausaufgaben sind erledigt."
            );

            return;

        }


        setJarvisMessage(
            "Offene Hausaufgaben: " +
            open
                .map(
                    item =>
                        item.title
                )
                .join(" // ")
        );

        return;

    }


    /* =====================================================
       TAGESZIELE
       ===================================================== */

    if (
        command.includes("zeige tagesziele") ||
        command.includes("zeige tagesziele") ||
        command === "tagesziele" ||
        command === "tagesziele anzeigen"
    ) {

        const open =
            tasks.filter(
                task =>
                    !task.completed
            );


        if (!open.length) {

            setJarvisMessage(
                "Keine offenen Tagesziele vorhanden."
            );

            return;

        }


        setJarvisMessage(
            "Offene Tagesziele: " +
            open
                .map(
                    task =>
                        task.title
                )
                .join(" // ")
        );

        return;

    }


    /* =====================================================
       NOTIZEN
       ===================================================== */

    if (
        command.includes("zeige notizen") ||
        command === "notizen"
    ) {

        if (!notes.length) {

            setJarvisMessage(
                "Es sind keine Notizen vorhanden."
            );

            return;

        }


        setJarvisMessage(
            "Notizen: " +
            notes
                .map(
                    note =>
                        note.title
                )
                .join(" // ")
        );

        return;

    }


    /* =====================================================
       KLASSENARBEITEN
       ===================================================== */

    if (
        command.includes(
            "zeige klassenarbeiten"
        ) ||
        command.includes(
            "zeige klassenarbeit"
        ) ||
        command === "klassenarbeiten"
    ) {

        if (!exams.length) {

            setJarvisMessage(
                "Keine Klassenarbeiten gespeichert."
            );

            return;

        }


        setJarvisMessage(
            "Klassenarbeiten: " +
            exams
                .map(
                    exam =>
                        exam.title +
                        (
                            exam.subject
                                ? " [" +
                                  exam.subject +
                                  "]"
                                : ""
                        )
                )
                .join(" // ")
        );

        return;

    }


    /* =====================================================
       TERMINE
       ===================================================== */

    if (
        command.includes("zeige termine") ||
        command === "termine"
    ) {

        if (!appointments.length) {

            setJarvisMessage(
                "Keine Termine gespeichert."
            );

            return;

        }


        setJarvisMessage(
            "Termine: " +
            appointments
                .map(
                    appointment =>
                        appointment.title
                )
                .join(" // ")
        );

        return;

    }


    /* =====================================================
       VOKABELN
       ===================================================== */

    if (
        command === "vokabeln" ||
        command.includes("zeige vokabeln")
    ) {

        if (!vocabulary.length) {

            setJarvisMessage(
                "Es sind noch keine Vokabeln vorhanden."
            );

            return;

        }


        setJarvisMessage(
            `${vocabulary.length} Vokabeln gespeichert.`
        );

        return;

    }


    /* =====================================================
       VOKABEL HINZUFÜGEN
       ===================================================== */

    let vocabularyMatch =
        command.match(
            /^(?:füge|fuege)\s+vokabel\s+(.+?)\s*[-–—]\s*(.+?)\s+(?:hinzu|an)$/
        );


    if (!vocabularyMatch) {

        vocabularyMatch =
            command.match(
                /^(?:füge|fuege)\s+(?:die\s+)?vokabel\s+(.+?)\s+(?:mit\s+)?(?:der\s+)?übersetzung\s+(.+?)\s+(?:hinzu|an)$/
            );

    }


    if (!vocabularyMatch) {

        vocabularyMatch =
            command.match(
                /^(?:füge|fuege)\s+(.+?)\s+(?:als\s+)?vokabel\s+mit\s+(?:der\s+)?übersetzung\s+(.+?)\s+(?:hinzu|an)$/
            );

    }


    if (vocabularyMatch) {

        addVocabulary(
            vocabularyMatch[1],
            vocabularyMatch[2],
            ""
        );

        return;

    }


    /* =====================================================
       VOKABEL UMDREHEN
       ===================================================== */

    if (
        command.includes(
            "vokabel umdrehen"
        )
    ) {

        flipVocabularyCard();

        setJarvisMessage(
            "Vokabelkarte umgedreht."
        );

        return;

    }


    /* =====================================================
       NÄCHSTE VOKABEL
       ===================================================== */

    if (
        command.includes("nächste vokabel") ||
        command.includes("naechste vokabel")
    ) {

        nextVocabularyCard();

        return;

    }


    /* =====================================================
       VORHERIGE VOKABEL
       ===================================================== */

    if (
        command.includes("vorherige vokabel") ||
        command.includes("vorherige karte")
    ) {

        previousVocabularyCard();

        return;

    }


    /* =====================================================
       YOUTUBE MUSIC
       ===================================================== */

    if (
        command.includes("youtube music") ||
        command.includes("youtube musik")
    ) {

        setJarvisMessage(
            "Ich öffne YouTube Music."
        );


        window.open(
            "https://music.youtube.com/",
            "_blank"
        );

        return;

    }


    /* =====================================================
       UNBEKANNT
       ===================================================== */

    setJarvisMessage(
        `Diesen Befehl kenne ich noch nicht: „${rawCommand}“.`
    );

}


/* =========================================================
   SUBJECT FUNCTIONS
   ========================================================= */

function addSubject(
    name
) {

    const clean =
        cleanName(name);


    if (!clean) {

        return;

    }


    const exists =
        subjects.some(
            subject =>
                cleanName(
                    subject.name
                ).toLowerCase() ===
                clean.toLowerCase()
        );


    if (exists) {

        setJarvisMessage(
            `Das Fach ${clean} existiert bereits.`
        );

        return;

    }


    subjects.push({

        id:
            Date.now(),

        name:
            clean

    });


    saveData(
        STORAGE_KEYS.subjects,
        subjects
    );


    renderAll();


    setJarvisMessage(
        `Das Fach ${clean} wurde hinzugefügt.`
    );

}


function deleteSubject(
    id
) {

    subjects =
        subjects.filter(
            subject =>
                subject.id !== id
        );


    saveData(
        STORAGE_KEYS.subjects,
        subjects
    );


    renderAll();

}


/* =========================================================
   HOMEWORK
   ========================================================= */

function addHomework(
    title,
    subject,
    dueDate,
    attachment
) {

    homework.push({

        id:
            Date.now(),

        title:
            cleanName(title),

        subject:
            cleanName(subject),

        dueDate:
            dueDate,

        completed:
            false,

        attachment:
            attachment || null

    });


    saveData(
        STORAGE_KEYS.homework,
        homework
    );


    renderAll();

}


function toggleHomework(
    id
) {

    const item =
        homework.find(
            entry =>
                entry.id === id
        );


    if (!item) {
        return;
    }


    item.completed =
        !item.completed;


    saveData(
        STORAGE_KEYS.homework,
        homework
    );


    renderAll();

}


function deleteHomework(
    id
) {

    homework =
        homework.filter(
            item =>
                item.id !== id
        );


    saveData(
        STORAGE_KEYS.homework,
        homework
    );


    renderAll();

}


/* =========================================================
   TASKS
   ========================================================= */

function addTask(
    title
) {

    tasks.push({

        id:
            Date.now(),

        title:
            cleanName(title),

        completed:
            false

    });


    saveData(
        STORAGE_KEYS.tasks,
        tasks
    );


    renderAll();

}


function toggleTask(
    id
) {

    const task =
        tasks.find(
            item =>
                item.id === id
        );


    if (!task) {
        return;
    }


    task.completed =
        !task.completed;


    saveData(
        STORAGE_KEYS.tasks,
        tasks
    );


    renderAll();

}


function deleteTask(
    id
) {

    tasks =
        tasks.filter(
            task =>
                task.id !== id
        );


    saveData(
        STORAGE_KEYS.tasks,
        tasks
    );


    renderAll();

}


/* =========================================================
   NOTES
   ========================================================= */

function addNote(
    title,
    content
) {

    notes.push({

        id:
            Date.now(),

        title:
            cleanName(title),

        content:
            content,

        createdAt:
            new Date().toISOString()

    });


    saveData(
        STORAGE_KEYS.notes,
        notes
    );


    renderAll();

}


function deleteNote(
    id
) {

    notes =
        notes.filter(
            note =>
                note.id !== id
        );


    saveData(
        STORAGE_KEYS.notes,
        notes
    );


    renderAll();

}


/* =========================================================
   EXAMS
   ========================================================= */

function addExam(
    title,
    subject,
    date
) {

    exams.push({

        id:
            Date.now(),

        title:
            cleanName(title),

        subject:
            cleanName(subject),

        date:
            date

    });


    saveData(
        STORAGE_KEYS.exams,
        exams
    );


    renderAll();

}


function deleteExam(
    id
) {

    exams =
        exams.filter(
            exam =>
                exam.id !== id
        );


    saveData(
        STORAGE_KEYS.exams,
        exams
    );


    renderAll();

}


/* =========================================================
   APPOINTMENTS
   ========================================================= */

function addAppointment(
    title,
    date
) {

    appointments.push({

        id:
            Date.now(),

        title:
            cleanName(title),

        date:
            date

    });


    saveData(
        STORAGE_KEYS.appointments,
        appointments
    );


    renderAll();

}


function deleteAppointment(
    id
) {

    appointments =
        appointments.filter(
            appointment =>
                appointment.id !== id
        );


    saveData(
        STORAGE_KEYS.appointments,
        appointments
    );


    renderAll();

}


/* =========================================================
   VOCABULARY
   ========================================================= */

function addVocabulary(
    front,
    back,
    subject
) {

    const cleanFront =
        cleanName(front);

    const cleanBack =
        cleanName(back);

    const cleanSubject =
        cleanName(subject);


    if (
        !cleanFront ||
        !cleanBack
    ) {

        setJarvisMessage(
            "Bitte Vokabel und Übersetzung eingeben."
        );

        return;

    }


    vocabulary.push({

        id:
            Date.now(),

        front:
            cleanFront,

        back:
            cleanBack,

        subject:
            cleanSubject,

        known:
            0,

        unknown:
            0,

        createdAt:
            new Date().toISOString()

    });


    saveData(
        STORAGE_KEYS.vocabulary,
        vocabulary
    );


    vocabularyIndex =
        vocabulary.length - 1;

    vocabularyFlipped =
        false;


    renderAll();


    setJarvisMessage(
        `Vokabel ${cleanFront} wurde hinzugefügt.`
    );

}


function deleteVocabulary(
    id
) {

    vocabulary =
        vocabulary.filter(
            item =>
                item.id !== id
        );


    if (
        vocabularyIndex >=
        vocabulary.length
    ) {

        vocabularyIndex =
            Math.max(
                0,
                vocabulary.length - 1
            );

    }


    vocabularyFlipped =
        false;


    saveData(
        STORAGE_KEYS.vocabulary,
        vocabulary
    );


    renderAll();


    setJarvisMessage(
        "Die Vokabel wurde gelöscht."
    );

}


/* =========================================================
   VOCABULARY FILTER
   ========================================================= */

function getFilteredVocabulary() {

    if (
        vocabularyFilter ===
        "all"
    ) {

        return vocabulary;

    }


    return vocabulary.filter(
        item =>
            (
                item.subject ||
                ""
            ).toLowerCase() ===
            vocabularyFilter.toLowerCase()
    );

}


/* =========================================================
   VOCABULARY CARD
   ========================================================= */

function renderVocabularyCard() {

    const cards =
        getFilteredVocabulary();


    if (
        cards.length === 0
    ) {

        flashcardSubject.textContent =
            "KEINE VOKABEL";

        flashcardText.textContent =
            "Noch keine passende Vokabel vorhanden.";

        flashcardHint.textContent =
            "Füge eine Vokabel hinzu.";

        flashcardCounter.textContent =
            "0 / 0";

        return;

    }


    if (
        vocabularyIndex >=
        cards.length
    ) {

        vocabularyIndex =
            0;

    }


    if (
        vocabularyIndex < 0
    ) {

        vocabularyIndex =
            cards.length - 1;

    }


    const card =
        cards[vocabularyIndex];


    flashcardSubject.textContent =
        card.subject ||
        "Allgemein";


    flashcardText.textContent =
        vocabularyFlipped
            ? card.back
            : card.front;


    flashcardHint.textContent =
        vocabularyFlipped
            ? "Rückseite"
            : "Klicke zum Umdrehen";


    flashcardCounter.textContent =
        `${vocabularyIndex + 1} / ${cards.length}`;

}


function flipVocabularyCard() {

    const cards =
        getFilteredVocabulary();


    if (
        cards.length === 0
    ) {

        setJarvisMessage(
            "Es sind keine Vokabeln zum Lernen vorhanden."
        );

        return;

    }


    vocabularyFlipped =
        !vocabularyFlipped;


    renderVocabularyCard();

}


function nextVocabularyCard() {

    const cards =
        getFilteredVocabulary();


    if (
        cards.length === 0
    ) {

        setJarvisMessage(
            "Es sind keine Vokabeln vorhanden."
        );

        return;

    }


    vocabularyIndex++;

    if (
        vocabularyIndex >=
        cards.length
    ) {

        vocabularyIndex =
            0;

    }


    vocabularyFlipped =
        false;


    renderVocabularyCard();

}


function previousVocabularyCard() {

    const cards =
        getFilteredVocabulary();


    if (
        cards.length === 0
    ) {

        setJarvisMessage(
            "Es sind keine Vokabeln vorhanden."
        );

        return;

    }


    vocabularyIndex--;

    if (
        vocabularyIndex < 0
    ) {

        vocabularyIndex =
            cards.length - 1;

    }


    vocabularyFlipped =
        false;


    renderVocabularyCard();

}


/* =========================================================
   VOCABULARY RATING
   ========================================================= */

function rateCurrentVocabulary(
    known
) {

    const cards =
        getFilteredVocabulary();


    if (
        cards.length === 0
    ) {

        return;

    }


    const card =
        cards[vocabularyIndex];


    if (!card) {
        return;
    }


    if (known) {

        card.known =
            Number(card.known || 0) + 1;

    }

    else {

        card.unknown =
            Number(card.unknown || 0) + 1;

    }


    saveData(
        STORAGE_KEYS.vocabulary,
        vocabulary
    );


    updateLearningStats();


    if (known) {

        setJarvisMessage(
            "Vokabel als gewusst markiert."
        );

    }

    else {

        setJarvisMessage(
            "Vokabel als noch nicht gewusst markiert."
        );

    }


    nextVocabularyCard();

}


/* =========================================================
   VOICE
   ========================================================= */

function initializeVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        voiceStatus.textContent =
            "SPRACHSTEUERUNG NICHT VERFÜGBAR";

        voiceBtn.disabled =
            true;

        return;

    }


    recognition =
        new SpeechRecognition();


    recognition.lang =
        "de-DE";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    recognition.onstart =
        () => {

            isListening =
                true;

            voiceBtn.classList.add(
                "listening"
            );

            voiceStatus.textContent =
                "JARVIS HÖRT ZU...";

        };


    recognition.onresult =
        event => {

            const transcript =
                event
                    .results[0][0]
                    .transcript
                    .trim();


            if (!transcript) {

                setJarvisMessage(
                    "Ich habe keinen Befehl erkannt."
                );

                return;

            }


            commandInput.value =
                transcript;


            voiceStatus.textContent =
                "BEFEHL ERKANNT // VERARBEITE...";


            processCommand(
                transcript
            );

        };


    recognition.onerror =
        event => {

            console.error(
                "VOICE ERROR:",
                event.error
            );


            const messages = {

                "not-allowed":
                    "MIKROFONZUGRIFF VERWEIGERT",

                "service-not-allowed":
                    "SPRACHDIENST NICHT ERLAUBT",

                "audio-capture":
                    "KEIN MIKROFON ERKANNT",

                "no-speech":
                    "KEINE SPRACHE ERKANNT",

                "network":
                    "SPRACHDIENST NETZWERKFEHLER",

                "aborted":
                    "SPRACHERKENNUNG ABGEBROCHEN"

            };


            voiceStatus.textContent =
                messages[event.error] ||
                "SPRACHFEHLER";


            if (
                event.error !== "aborted"
            ) {

                setJarvisMessage(
                    messages[event.error] ||
                    "Die Sprachsteuerung konnte den Befehl nicht erkennen."
                );

            }

        };


    recognition.onend =
        () => {

            isListening =
                false;

            voiceBtn.classList.remove(
                "listening"
            );

            voiceStatus.textContent =
                "SPRACHSTEUERUNG BEREIT";

        };

}


function toggleVoice() {

    if (!recognition) {

        initializeVoice();

    }


    if (!recognition) {

        setJarvisMessage(
            "Die Spracherkennung wird von diesem Browser nicht unterstützt."
        );

        return;

    }


    if (isListening) {

        recognition.stop();

        return;

    }


    try {

        recognition.start();

        jarvisState.textContent =
            "Sprachsteuerung";

    }

    catch (error) {

        console.error(
            "VOICE START ERROR:",
            error
        );


        setJarvisMessage(
            "Die Sprachsteuerung konnte nicht gestartet werden."
        );

    }

}


/* =========================================================
   DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {

        const parts =
            value.split("-");


        return (
            `${parts[2]}.${parts[1]}.${parts[0]}`
        );

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleString(
        "de-DE",
        {
            dateStyle:
                "short",

            timeStyle:
                "short"
        }
    );

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value ?? ""
        );


    return div.innerHTML;

}


/* =========================================================
   RENDER SUBJECTS
   ========================================================= */

function renderSubjects() {

    if (
        subjects.length === 0
    ) {

        subjectsList.innerHTML =
            `<div class="empty-state">
                Keine Fächer gespeichert.
            </div>`;

        return;

    }


    subjectsList.innerHTML =
        subjects
            .map(
                subject => `
                    <div class="list-item">

                        <div class="item-main">

                            <div class="item-title">
                                ${escapeHTML(subject.name)}
                            </div>

                            <div class="item-meta">
                                Fach
                            </div>

                        </div>

                        <div class="item-actions">

                            <button
                                class="delete-btn"
                                data-delete-subject="${subject.id}"
                                type="button"
                            >
                                LÖSCHEN
                            </button>

                        </div>

                    </div>
                `
            )
            .join("");

}


/* =========================================================
   RENDER HOMEWORK
   ========================================================= */

function renderHomework() {

    if (
        homework.length === 0
    ) {

        homeworkList.innerHTML =
            `<div class="empty-state">
                Keine Hausaufgaben gespeichert.
            </div>`;

        return;

    }


    homeworkList.innerHTML =
        homework
            .map(
                item => `

                    <div
                        class="list-item ${
                            item.completed
                                ? "completed"
                                : ""
                        }"
                    >

                        <div class="item-main">

                            <div class="item-title">
                                ${escapeHTML(item.title)}
                            </div>

                            <div class="item-meta">
                                ${
                                    item.subject
                                        ? escapeHTML(item.subject)
                                        : "Allgemein"
                                }

                                ${
                                    item.dueDate
                                        ? " // " +
                                          formatDate(item.dueDate)
                                        : ""
                                }
                            </div>

                            ${
                                item.attachment
                                    ? item.attachment.type === "file"
                                        ? `<a class="homework-attachment" href="${item.attachment.data}" download="${escapeHTML(item.attachment.name)}">📎 ${escapeHTML(item.attachment.name)}</a>`
                                        : `<a class="homework-attachment" href="${escapeHTML(item.attachment.url)}" target="_blank" rel="noopener noreferrer">🔗 ${escapeHTML(item.attachment.name)}</a>`
                                    : ""
                            }

                        </div>

                        <div class="item-actions">

                            <button
                                class="complete-btn"
                                data-toggle-homework="${item.id}"
                                type="button"
                            >
                                ${
                                    item.completed
                                        ? "OFFEN"
                                        : "✓"
                                }
                            </button>

                            <button
                                class="delete-btn"
                                data-delete-homework="${item.id}"
                                type="button"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   RENDER TASKS
   ========================================================= */

function renderTasks() {

    if (
        tasks.length === 0
    ) {

        tasksList.innerHTML =
            `<div class="empty-state">
                Keine Tagesziele gespeichert.
            </div>`;

        return;

    }


    tasksList.innerHTML =
        tasks
            .map(
                task => `

                    <div
                        class="list-item ${
                            task.completed
                                ? "completed"
                                : ""
                        }"
                    >

                        <div class="item-main">

                            <div class="item-title">
                                ${escapeHTML(task.title)}
                            </div>

                            <div class="item-meta">
                                Tagesziel
                            </div>

                        </div>

                        <div class="item-actions">

                            <button
                                class="complete-btn"
                                data-toggle-task="${task.id}"
                                type="button"
                            >
                                ${
                                    task.completed
                                        ? "OFFEN"
                                        : "✓"
                                }
                            </button>

                            <button
                                class="delete-btn"
                                data-delete-task="${task.id}"
                                type="button"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   RENDER NOTES
   ========================================================= */

function renderNotes() {

    if (
        notes.length === 0
    ) {

        notesList.innerHTML =
            `<div class="empty-state">
                Keine Notizen gespeichert.
            </div>`;

        return;

    }


    notesList.innerHTML =
        notes
            .map(
                note => `

                    <div class="list-item">

                        <div class="item-main">

                            <div class="item-title">
                                ${escapeHTML(note.title)}
                            </div>

                            <div class="item-meta">
                                ${escapeHTML(note.content)}
                            </div>

                        </div>

                        <div class="item-actions">

                            <button
                                class="delete-btn"
                                data-delete-note="${note.id}"
                                type="button"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   RENDER EXAMS
   ========================================================= */

function renderExams() {

    if (
        exams.length === 0
    ) {

        examsList.innerHTML =
            `<div class="empty-state">
                Keine Klassenarbeiten gespeichert.
            </div>`;

        return;

    }


    examsList.innerHTML =
        exams
            .map(
                exam => `

                    <div class="list-item">

                        <div class="item-main">

                            <div class="item-title">
                                ${escapeHTML(exam.title)}
                            </div>

                            <div class="item-meta">

                                ${
                                    exam.subject
                                        ? escapeHTML(exam.subject)
                                        : "Allgemein"
                                }

                                ${
                                    exam.date
                                        ? " // " +
                                          formatDate(exam.date)
                                        : ""
                                }

                            </div>

                        </div>

                        <div class="item-actions">

                            <button
                                class="delete-btn"
                                data-delete-exam="${exam.id}"
                                type="button"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   RENDER APPOINTMENTS
   ========================================================= */

function renderAppointments() {

    if (
        appointments.length === 0
    ) {

        appointmentsList.innerHTML =
            `<div class="empty-state">
                Keine Termine gespeichert.
            </div>`;

        return;

    }


    appointmentsList.innerHTML =
        appointments
            .map(
                appointment => `

                    <div class="list-item">

                        <div class="item-main">

                            <div class="item-title">
                                ${escapeHTML(appointment.title)}
                            </div>

                            <div class="item-meta">

                                ${
                                    appointment.date
                                        ? formatDate(appointment.date)
                                        : ""
                                }

                            </div>

                        </div>

                        <div class="item-actions">

                            <button
                                class="delete-btn"
                                data-delete-appointment="${appointment.id}"
                                type="button"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   RENDER VOCABULARY
   ========================================================= */

function renderVocabulary() {

    if (
        vocabulary.length === 0
    ) {

        vocabularyList.innerHTML =
            `<div class="empty-state">
                Keine Vokabeln gespeichert.
            </div>`;

        return;

    }


    vocabularyList.innerHTML =
        vocabulary
            .map(
                item => `

                    <div class="vocabulary-item">

                        <div>

                            <div class="vocabulary-front">
                                ${escapeHTML(item.front)}
                            </div>

                            <div class="vocabulary-back">
                                ${escapeHTML(item.back)}
                            </div>

                            ${
                                item.subject
                                    ? `
                                        <div class="vocabulary-subject-tag">
                                            ${escapeHTML(item.subject)}
                                        </div>
                                    `
                                    : ""
                            }

                        </div>

                        <button
                            class="delete-btn"
                            data-delete-vocabulary="${item.id}"
                            type="button"
                        >
                            ×
                        </button>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   SUBJECT SELECTS
   ========================================================= */

function updateSubjectSelects() {

    const currentVocabularySubject =
        vocabularySubject.value;


    const currentFilter =
        vocabularySubjectFilter.value;


    const options =
        subjects
            .map(
                subject => `
                    <option
                        value="${escapeHTML(subject.name)}"
                    >
                        ${escapeHTML(subject.name)}
                    </option>
                `
            )
            .join("");


    vocabularySubject.innerHTML =
        `
            <option value="">
                Allgemein
            </option>
            ${options}
        `;


    vocabularySubjectFilter.innerHTML =
        `
            <option value="all">
                ALLE FÄCHER
            </option>
            ${options}
        `;


    if (
        [...vocabularySubject.options]
            .some(
                option =>
                    option.value ===
                    currentVocabularySubject
            )
    ) {

        vocabularySubject.value =
            currentVocabularySubject;

    }


    if (
        [...vocabularySubjectFilter.options]
            .some(
                option =>
                    option.value ===
                    currentFilter
            )
    ) {

        vocabularySubjectFilter.value =
            currentFilter;

    }

}


/* =========================================================
   LEARNING STATS
   ========================================================= */

function updateLearningStats() {

    let known = 0;

    let unknown = 0;


    vocabulary.forEach(
        item => {

            known +=
                Number(
                    item.known || 0
                );

            unknown +=
                Number(
                    item.unknown || 0
                );

        }
    );


    learningStats.textContent =
        `GEWUSST: ${known} // NOCH NICHT: ${unknown}`;

}


/* =========================================================
   DATA COUNT
   ========================================================= */

function updateDataCount() {

    /*
     * Zentrale Datenzählung bleibt intern.
     * Falls später ein Counter ergänzt wird,
     * kann dieser hier verwendet werden.
     */

}


/* =========================================================
   MODAL
   ========================================================= */

function field(
    label,
    id,
    type = "text",
    placeholder = "",
    required = true
) {

    return `

        <div class="form-group">

            <label for="${id}">
                ${label}
            </label>

            <input
                id="${id}"
                name="${id}"
                type="${type}"
                placeholder="${placeholder}"
                ${required ? "required" : ""}
            >

        </div>

    `;

}


function subjectSelectField(
    label,
    id
) {

    const options =
        subjects
            .map(
                subject => `
                    <option value="${escapeHTML(subject.name)}">
                        ${escapeHTML(subject.name)}
                    </option>
                `
            )
            .join("");


    return `

        <div class="form-group">

            <label for="${id}">
                ${label}
            </label>

            <select
                id="${id}"
                name="${id}"
            >

                <option value="">
                    Allgemein
                </option>

                ${options}

            </select>

        </div>

    `;

}


function openModal(
    type
) {

    currentModalType =
        type;


    modalFields.innerHTML =
        "";


    const titles = {

        subject:
            "FACH HINZUFÜGEN",

        homework:
            "HAUSAUFGABE HINZUFÜGEN",

        task:
            "TAGESZIEL HINZUFÜGEN",

        note:
            "NOTIZ HINZUFÜGEN",

        exam:
            "KLASSENARBEIT HINZUFÜGEN",

        appointment:
            "TERMIN HINZUFÜGEN"

    };


    modalTitle.textContent =
        titles[type] ||
        "EINTRAG HINZUFÜGEN";


    if (
        type ===
        "subject"
    ) {

        modalFields.innerHTML =
            field(
                "Fachname",
                "modalSubjectName",
                "text",
                "z. B. Mathematik"
            );

    }


    if (
        type ===
        "homework"
    ) {

        modalFields.innerHTML =

            field(
                "Aufgabe",
                "modalHomeworkTitle",
                "text",
                "z. B. Seite 42"
            )

            +

            subjectSelectField(
                "Fach",
                "modalHomeworkSubject"
            )

            +

            field(
                "Fällig am",
                "modalHomeworkDate",
                "date",
                "",
                false
            )

            +

            `
                <div class="form-group">
                    <label for="modalHomeworkFile">Datei anhängen (optional, max. 4 MB)</label>
                    <input id="modalHomeworkFile" name="modalHomeworkFile" type="file">
                </div>
            `

            +

            field(
                "Oder Link zur Datei (optional)",
                "modalHomeworkLink",
                "url",
                "z. B. https://...",
                false
            );

    }


    if (
        type ===
        "task"
    ) {

        modalFields.innerHTML =
            field(
                "Tagesziel",
                "modalTaskTitle",
                "text",
                "z. B. 30 Minuten lernen"
            );

    }


    if (
        type ===
        "note"
    ) {

        modalFields.innerHTML =

            field(
                "Titel",
                "modalNoteTitle",
                "text",
                "z. B. Merksatz"
            )

            +

            `
                <div class="form-group">

                    <label for="modalNoteContent">
                        Inhalt
                    </label>

                    <textarea
                        id="modalNoteContent"
                        name="modalNoteContent"
                        rows="5"
                        required
                    ></textarea>

                </div>
            `;

    }


    if (
        type ===
        "exam"
    ) {

        modalFields.innerHTML =

            field(
                "Titel",
                "modalExamTitle",
                "text",
                "z. B. Mathe Klassenarbeit"
            )

            +

            subjectSelectField(
                "Fach",
                "modalExamSubject"
            )

            +

            field(
                "Datum",
                "modalExamDate",
                "datetime-local",
                "",
                true
            );

    }


    if (
        type ===
        "appointment"
    ) {

        modalFields.innerHTML =

            field(
                "Titel",
                "modalAppointmentTitle",
                "text",
                "z. B. Arzttermin"
            )

            +

            field(
                "Datum und Uhrzeit",
                "modalAppointmentDate",
                "datetime-local",
                "",
                true
            );

    }


    modalOverlay.classList.remove(
        "hidden"
    );


    const firstInput =
        modalFields.querySelector(
            "input, select, textarea"
        );


    if (firstInput) {

        setTimeout(
            () =>
                firstInput.focus(),
            50
        );

    }

}


function closeModal() {

    currentModalType =
        null;

    modalOverlay.classList.add(
        "hidden"
    );

    modalFields.innerHTML =
        "";

}


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {

    renderSubjects();

    renderHomework();

    renderTasks();

    renderNotes();

    renderExams();

    renderAppointments();

    renderVocabulary();

    updateSubjectSelects();

    renderVocabularyCard();

    updateLearningStats();

    updateDataCount();

}


/* =========================================================
   EVENTS
   ========================================================= */


/* SECURITY */

reactorButton.addEventListener(
    "click",
    openAccessPanel
);


reactorButton.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" ||
            event.key === " "
        ) {

            event.preventDefault();

            openAccessPanel();

        }

    }
);


accessForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        authenticate();

    }
);


/* COMMAND */

function submitCommand() {

    const command =
        commandInput.value.trim();


    if (!command) {

        setJarvisMessage(
            "Bitte gib einen Befehl ein."
        );

        commandInput.focus();

        return;

    }


    processCommand(
        command
    );


    commandInput.value =
        "";


    commandInput.focus();

}


sendCommandBtn.addEventListener(
    "click",
    submitCommand
);


/*
 * v3.7:
 * Enter funktioniert zuverlässig,
 * auch wenn das Eingabefeld gerade den Fokus hat.
 */

commandInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            submitCommand();

        }

    }
);


/* VOICE */

voiceBtn.addEventListener(
    "click",
    toggleVoice
);


/* MODALS */

addSubjectBtn.addEventListener(
    "click",
    () =>
        openModal("subject")
);

addHomeworkBtn.addEventListener(
    "click",
    () =>
        openModal("homework")
);

addTaskBtn.addEventListener(
    "click",
    () =>
        openModal("task")
);

addNoteBtn.addEventListener(
    "click",
    () =>
        openModal("note")
);

addExamBtn.addEventListener(
    "click",
    () =>
        openModal("exam")
);

addAppointmentBtn.addEventListener(
    "click",
    () =>
        openModal("appointment")
);


closeModalBtn.addEventListener(
    "click",
    closeModal
);

cancelModalBtn.addEventListener(
    "click",
    closeModal
);


modalOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            modalOverlay
        ) {

            closeModal();

        }

    }
);


/* MODAL SAVE */

modalForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            currentModalType ===
            "subject"
        ) {

            addSubject(
                document.getElementById(
                    "modalSubjectName"
                ).value
            );

        }


        if (
            currentModalType ===
            "homework"
        ) {

            let attachment = null;

            const fileInput =
                document.getElementById(
                    "modalHomeworkFile"
                );

            const linkValue =
                document.getElementById(
                    "modalHomeworkLink"
                ).value.trim();

            const chosenFile =
                fileInput &&
                fileInput.files &&
                fileInput.files[0];

            if (
                chosenFile &&
                chosenFile.size >
                4 * 1024 * 1024
            ) {

                setJarvisMessage(
                    "Datei ist größer als 4 MB und wurde nicht angehängt. Nutze stattdessen einen Link."
                );

            } else if (chosenFile) {

                attachment =
                    await new Promise(
                        resolve => {
                            const reader =
                                new FileReader();
                            reader.onload =
                                () =>
                                    resolve({
                                        type: "file",
                                        name: chosenFile.name,
                                        mime: chosenFile.type || "application/octet-stream",
                                        data: reader.result
                                    });
                            reader.onerror =
                                () => resolve(null);
                            reader.readAsDataURL(
                                chosenFile
                            );
                        }
                    );

            } else if (linkValue) {

                attachment = {
                    type: "link",
                    name: linkValue,
                    url: linkValue
                };

            }

            addHomework(

                document.getElementById(
                    "modalHomeworkTitle"
                ).value,

                document.getElementById(
                    "modalHomeworkSubject"
                ).value,

                document.getElementById(
                    "modalHomeworkDate"
                ).value,

                attachment

            );

        }


        if (
            currentModalType ===
            "task"
        ) {

            addTask(
                document.getElementById(
                    "modalTaskTitle"
                ).value
            );

        }


        if (
            currentModalType ===
            "note"
        ) {

            addNote(

                document.getElementById(
                    "modalNoteTitle"
                ).value,

                document.getElementById(
                    "modalNoteContent"
                ).value

            );

        }


        if (
            currentModalType ===
            "exam"
        ) {

            addExam(

                document.getElementById(
                    "modalExamTitle"
                ).value,

                document.getElementById(
                    "modalExamSubject"
                ).value,

                document.getElementById(
                    "modalExamDate"
                ).value

            );

        }


        if (
            currentModalType ===
            "appointment"
        ) {

            addAppointment(

                document.getElementById(
                    "modalAppointmentTitle"
                ).value,

                document.getElementById(
                    "modalAppointmentDate"
                ).value

            );

        }


        closeModal();

    }
);


/* VOCABULARY */

addVocabularyBtn.addEventListener(
    "click",
    () => {

        addVocabulary(

            vocabularyFront.value,

            vocabularyBack.value,

            vocabularySubject.value

        );


        vocabularyFront.value =
            "";

        vocabularyBack.value =
            "";

        vocabularyFront.focus();

    }
);


vocabularySubjectFilter.addEventListener(
    "change",
    () => {

        vocabularyFilter =
            vocabularySubjectFilter.value;

        localStorage.setItem(
            STORAGE_KEYS.vocabularyFilter,
            vocabularyFilter
        );

        vocabularyIndex =
            0;

        vocabularyFlipped =
            false;

        renderVocabularyCard();

    }
);


flashcard.addEventListener(
    "click",
    flipVocabularyCard
);

flipCardBtn.addEventListener(
    "click",
    flipVocabularyCard
);

previousCardBtn.addEventListener(
    "click",
    previousVocabularyCard
);

nextCardBtn.addEventListener(
    "click",
    nextVocabularyCard
);

knownCardBtn.addEventListener(
    "click",
    () =>
        rateCurrentVocabulary(true)
);

unknownCardBtn.addEventListener(
    "click",
    () =>
        rateCurrentVocabulary(false)
);


/* =========================================================
   LIST EVENT DELEGATION
   ========================================================= */

subjectsList.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-delete-subject]"
            );


        if (!button) {
            return;
        }


        deleteSubject(
            Number(
                button.dataset.deleteSubject
            )
        );

    }
);


homeworkList.addEventListener(
    "click",
    event => {

        const toggle =
            event.target.closest(
                "[data-toggle-homework]"
            );


        const remove =
            event.target.closest(
                "[data-delete-homework]"
            );


        if (toggle) {

            toggleHomework(
                Number(
                    toggle.dataset.toggleHomework
                )
            );

            return;

        }


        if (remove) {

            deleteHomework(
                Number(
                    remove.dataset.deleteHomework
                )
            );

        }

    }
);


tasksList.addEventListener(
    "click",
    event => {

        const toggle =
            event.target.closest(
                "[data-toggle-task]"
            );


        const remove =
            event.target.closest(
                "[data-delete-task]"
            );


        if (toggle) {

            toggleTask(
                Number(
                    toggle.dataset.toggleTask
                )
            );

            return;

        }


        if (remove) {

            deleteTask(
                Number(
                    remove.dataset.deleteTask
                )
            );

        }

    }
);


notesList.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-delete-note]"
            );


        if (!button) {
            return;
        }


        deleteNote(
            Number(
                button.dataset.deleteNote
            )
        );

    }
);


examsList.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-delete-exam]"
            );


        if (!button) {
            return;
        }


        deleteExam(
            Number(
                button.dataset.deleteExam
            )
        );

    }
);


appointmentsList.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-delete-appointment]"
            );


        if (!button) {
            return;
        }


        deleteAppointment(
            Number(
                button.dataset.deleteAppointment
            )
        );

    }
);


vocabularyList.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-delete-vocabulary]"
            );


        if (!button) {
            return;
        }


        deleteVocabulary(
            Number(
                button.dataset.deleteVocabulary
            )
        );

    }
);


/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey &&
            event.code === "Space"
        ) {

            event.preventDefault();

            toggleVoice();

            return;

        }


        if (
            event.key === "Escape"
        ) {

            if (
                !modalOverlay.classList.contains(
                    "hidden"
                )
            ) {

                closeModal();

            }

        }

    }
);


/* =========================================================
   ETHICAL HACKING TOOLS
   ========================================================= */

async function calculateSHA256() {
    const input = document.getElementById("hashInput");
    const output = document.getElementById("hashOutput");

    if (!input || !output) return;

    const data = new TextEncoder().encode(input.value);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hash = Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");

    output.textContent = hash || "LEERER HASH";
}

function updatePasswordCheck() {
    const input = document.getElementById("passwordCheckInput");
    const output = document.getElementById("passwordCheckOutput");
    const meter = document.getElementById("passwordMeterBar");

    if (!input || !output || !meter) return;

    const value = input.value;
    let score = 0;

    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    const labels = ["LEER", "SEHR SCHWACH", "SCHWACH", "MITTEL", "STARK", "SEHR STARK"];
    meter.style.width = `${score * 20}%`;
    output.textContent = `${labels[score]} // ${score}/5`;
}

function encodeBase64() {
    const input = document.getElementById("base64Input");
    const output = document.getElementById("base64Output");
    if (!input || !output) return;

    try {
        output.textContent = btoa(unescape(encodeURIComponent(input.value)));
    } catch {
        output.textContent = "ENCODE FEHLER";
    }
}

function decodeBase64() {
    const input = document.getElementById("base64Input");
    const output = document.getElementById("base64Output");
    if (!input || !output) return;

    try {
        output.textContent = decodeURIComponent(escape(atob(input.value)));
    } catch {
        output.textContent = "UNGÜLTIGE BASE64-DATEN";
    }
}


/* =========================================================
   V4.0 SECURITY LAB // LOCAL DEFENSIVE TOOLS
   ========================================================= */

function renderSystemInfo() {
    const output = document.getElementById("systemInfoOutput");
    if (!output) return;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    const lines = [
        `ONLINE: ${navigator.onLine ? "JA" : "NEIN"}`,
        `PLATTFORM: ${navigator.platform || "UNBEKANNT"}`,
        `SPRACHE: ${navigator.language || "UNBEKANNT"}`,
        `BROWSER: ${navigator.userAgent || "UNBEKANNT"}`,
        `KERNE: ${navigator.hardwareConcurrency || "UNBEKANNT"}`,
        `DISPLAY: ${window.screen?.width || "?"} x ${window.screen?.height || "?"}`,
        `NETZWERK-TYP: ${connection?.effectiveType || "NICHT VERFÜGBAR"}`
    ];

    output.textContent = lines.join("\n");
}

function analyzeURL() {
    const input = document.getElementById("urlInput");
    const output = document.getElementById("urlOutput");
    if (!input || !output) return;

    const value = input.value.trim();

    if (!value) {
        output.textContent = "BITTE EINE URL EINGEBEN";
        return;
    }

    try {
        const url = new URL(value);
        const flags = [];

        if (url.protocol !== "https:") {
            flags.push("WARNUNG: KEIN HTTPS");
        } else {
            flags.push("HTTPS: OK");
        }

        if (url.username || url.password) {
            flags.push("WARNUNG: URL ENTHÄLT BENUTZERDATEN");
        }

        if (url.hostname.includes("xn--")) {
            flags.push("HINWEIS: PUNYCODE-DOMAIN");
        }

        if (url.port) {
            flags.push(`PORT: ${url.port}`);
        }

        if (url.search) {
            flags.push(`QUERY-PARAMETER: ${url.searchParams.size}`);
        }

        output.textContent =
            `HOST: ${url.hostname}\n` +
            `PROTOKOLL: ${url.protocol.replace(":", "").toUpperCase()}\n` +
            `PFAD: ${url.pathname || "/"}\n` +
            flags.join("\n");

    } catch {
        output.textContent = "UNGÜLTIGE URL";
    }
}

function caesarTransform(text, shift) {
    const normalizedShift = ((Number(shift) || 0) % 26 + 26) % 26;

    return String(text || "").replace(/[A-Za-z]/g, char => {
        const base = char >= "a" && char <= "z" ? 97 : 65;
        return String.fromCharCode(
            ((char.charCodeAt(0) - base + normalizedShift) % 26 + 26) % 26 + base
        );
    });
}

function runCaesar(encode = true) {
    const input = document.getElementById("caesarInput");
    const shift = document.getElementById("caesarShift");
    const output = document.getElementById("caesarOutput");

    if (!input || !shift || !output) return;

    const amount = Number(shift.value) || 0;
    output.textContent = caesarTransform(
        input.value,
        encode ? amount : -amount
    );
}

function analyzeLogs() {
    const input = document.getElementById("logInput");
    const output = document.getElementById("logOutput");
    if (!input || !output) return;

    const text = input.value || "";
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (!lines.length) {
        output.textContent = "KEINE LOGZEILEN VORHANDEN";
        return;
    }

    const info = lines.filter(line => /\bINFO\b/i.test(line)).length;
    const warn = lines.filter(line => /\bWARN(?:ING)?\b/i.test(line)).length;
    const error = lines.filter(line => /\bERROR\b/i.test(line)).length;
    const failed = lines.filter(line => /\b(?:failed|denied|unauthorized|invalid)\b/i.test(line)).length;

    output.textContent =
        `ZEILEN: ${lines.length}\n` +
        `INFO: ${info}\n` +
        `WARN: ${warn}\n` +
        `ERROR: ${error}\n` +
        `AUTH-HINWEISE: ${failed}\n\n` +
        `BEWERTUNG: ${error > 0 ? "ERROR-EINTRÄGE PRÜFEN" : warn > 0 ? "WARNUNGEN PRÜFEN" : "KEINE OFFENSICHTLICHEN FEHLER"}`;
}

const securityQuiz = [
    {
        question: "Was schützt ein starkes, einzigartiges Passwort am besten?",
        answers: ["Ein einzelnes Konto vor unbefugtem Zugriff", "Die Internetgeschwindigkeit", "Die Bildschirmauflösung"],
        correct: 0
    },
    {
        question: "Was ist MFA/2FA?",
        answers: ["Ein zusätzlicher Authentifizierungsfaktor", "Ein Dateiformat", "Ein Netzwerkprotokoll"],
        correct: 0
    },
    {
        question: "Was bedeutet HTTPS?",
        answers: ["Eine verschlüsselte Verbindung per TLS", "Ein schnelleres WLAN", "Eine Antivirensoftware"],
        correct: 0
    },
    {
        question: "Was ist beim Sicherheitstest fremder Systeme entscheidend?",
        answers: ["Ausdrückliche Autorisierung", "Ein möglichst langer Scan", "Das Umgehen von Schutzmaßnahmen"],
        correct: 0
    }
];

let securityQuizIndex = 0;
let securityQuizScore = 0;

function renderSecurityQuiz() {
    const question = document.getElementById("quizQuestion");
    const answers = document.getElementById("quizAnswers");
    const output = document.getElementById("quizOutput");

    if (!question || !answers || !output) return;

    const item = securityQuiz[securityQuizIndex];

    question.textContent = item.question;
    answers.innerHTML = "";

    item.answers.forEach((answer, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quiz-answer";
        button.textContent = answer;

        button.addEventListener("click", () => {
            if (index === item.correct) {
                securityQuizScore++;
                output.textContent = `RICHTIG // ${securityQuizScore} PUNKTE`;
                button.classList.add("quiz-correct");
            } else {
                output.textContent = `FALSCH // ${securityQuizScore} PUNKTE`;
                button.classList.add("quiz-wrong");
            }

            Array.from(answers.children).forEach(child => {
                child.disabled = true;
            });
        });

        answers.appendChild(button);
    });

    output.textContent = `${securityQuizScore} PUNKTE`;
}

function nextSecurityQuizQuestion() {
    securityQuizIndex =
        (securityQuizIndex + 1) % securityQuiz.length;

    renderSecurityQuiz();
}

function initializeV4SecurityLab() {
    document.getElementById("systemInfoBtn")?.addEventListener(
        "click",
        renderSystemInfo
    );

    document.getElementById("urlAnalyzeBtn")?.addEventListener(
        "click",
        analyzeURL
    );

    document.getElementById("caesarEncodeBtn")?.addEventListener(
        "click",
        () => runCaesar(true)
    );

    document.getElementById("caesarDecodeBtn")?.addEventListener(
        "click",
        () => runCaesar(false)
    );

    document.getElementById("logAnalyzeBtn")?.addEventListener(
        "click",
        analyzeLogs
    );

    document.getElementById("quizNextBtn")?.addEventListener(
        "click",
        nextSecurityQuizQuestion
    );

    renderSecurityQuiz();
}

function initializeHackMode() {

    // NOTE: schoolModeBtn/hackModeBtn navigation is handled exclusively by
    // the V5.0 mode controller further down in this file. The old
    // openSchoolMode()/openHackMode() handlers used to also be wired up
    // here, which caused a second "SECURITY LAB" boot overlay to run
    // on top of the real hacking UI every time HACKING was clicked.
    leaveHackModeBtn?.addEventListener("click", openSchoolMode);

    document.getElementById("hashBtn")?.addEventListener("click", calculateSHA256);
    document.getElementById("base64EncodeBtn")?.addEventListener("click", encodeBase64);
    document.getElementById("base64DecodeBtn")?.addEventListener("click", decodeBase64);
    document.getElementById("passwordCheckInput")?.addEventListener("input", updatePasswordCheck);
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeHackMode();
        initializeV4SecurityLab();
        setCategoryMode("school");
        initializeVoice();

        /*
         * v3.7:
         * Boot startet weiterhin erst nach:
         *
         * ARC REACTOR
         * ->
         * CODE 220811
         * ->
         * BOOT
         */

    }
);


console.log(
    "JARVIS v4.0 // COMMAND CORE ONLINE"
);


/* =========================================================
   JARVIS V4.2 CYBER RANGE
   Fully simulated / local-only defensive training environment
   ========================================================= */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const scenarios = {
    blackout: {
      title: "BLACKOUT",
      briefing: "Mehrere ungewöhnliche Ereignisse wurden im virtuellen Labornetz erkannt.",
      events: [
        ["21:43:01", "INFO", "PC-03 established a simulated outbound session."],
        ["21:43:03", "WARN", "Unusual login pattern detected on PC-03."],
        ["21:43:05", "ALERT", "Repeated authentication failures on WEB-01."],
        ["21:43:08", "ALERT", "DB-01 received an anomalous simulated request."]
      ],
      affected: ["pc3", "web", "db"],
      threat: 72,
      clues: ["pc3", "web", "db"]
    },
    phishing: {
      title: "PHANTOM",
      briefing: "Ein künstlicher Phishing-Vorfall muss anhand der Hinweise erkannt und eingedämmt werden.",
      events: [
        ["09:12:04", "INFO", "Synthetic message delivered to PC-02."],
        ["09:12:07", "WARN", "Message contains an unusual sender domain."],
        ["09:12:10", "ALERT", "Simulated credential prompt detected."],
        ["09:12:14", "ALERT", "User interaction event recorded on PC-02."]
      ],
      affected: ["pc2"],
      threat: 61,
      clues: ["pc2"]
    },
    insider: {
      title: "ECHO",
      briefing: "Eine künstliche Anomalie im Verhalten eines Testkontos soll untersucht werden.",
      events: [
        ["16:02:11", "INFO", "Test account JARVIS-LAB authenticated."],
        ["16:02:15", "WARN", "Access pattern differs from baseline."],
        ["16:02:19", "WARN", "Unusual simulated file access sequence."],
        ["16:02:24", "ALERT", "Multiple sensitive-demo resources requested."]
      ],
      affected: ["pc1", "db"],
      threat: 66,
      clues: ["pc1", "db"]
    }
  };

  let activeScenario = null;
  let activeDifficulty = "beginner";
  let score = 0;
  let startTime = 0;
  let timer = null;
  let discovered = new Set();
  let isolated = new Set();
  let contained = false;

  function rangeLog(message, level = "INFO") {
    const log = $("rangeLog");
    if (!log) return;
    const row = document.createElement("div");
    row.className = `range-log-${level.toLowerCase()}`;
    row.textContent = `[${level}] ${message}`;
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function setNode(node, state) {
    const el = document.querySelector(`.range-node[data-node="${node}"]`);
    if (el) el.className = `range-node ${state}`;
  }

  function updateStats() {
    const threat = activeScenario ? activeScenario.threat : 0;
    const modifier = isolated.size * 8 + (contained ? 25 : 0);
    const currentThreat = Math.max(0, threat - modifier);
    if ($("rangeThreat")) $("rangeThreat").textContent = `${currentThreat}%`;
    if ($("rangeThreatBar")) $("rangeThreatBar").style.width = `${currentThreat}%`;
    if ($("rangeAffected")) $("rangeAffected").textContent = activeScenario ? activeScenario.affected.length : 0;
    if ($("rangeScore")) $("rangeScore").textContent = score;
  }

  function updateTime() {
    if (!$("rangeTime") || !startTime) return;
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    $("rangeTime").textContent =
      `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function startSimulation() {
    const scenarioId = $("rangeScenario")?.value || "blackout";
    activeDifficulty = $("rangeDifficulty")?.value || "beginner";
    activeScenario = scenarios[scenarioId];
    score = activeDifficulty === "advanced" ? 150 : activeDifficulty === "intermediate" ? 125 : 100;
    discovered = new Set();
    isolated = new Set();
    contained = false;
    startTime = Date.now();

    clearInterval(timer);
    timer = setInterval(updateTime, 1000);

    document.querySelectorAll(".range-node").forEach(n => n.className = "range-node normal");
    const log = $("rangeLog");
    if (log) log.innerHTML = "";
    if ($("rangeStatus")) $("rangeStatus").textContent = "SIMULATION ACTIVE";
    if ($("rangeMission")) $("rangeMission").innerHTML =
      `<strong>${activeScenario.title} // MISSION</strong><p>${activeScenario.briefing}</p>`;

    rangeLog(`Scenario ${activeScenario.title} initialized.`);
    activeScenario.events.forEach((e, i) => {
      setTimeout(() => {
        rangeLog(`${e[0]} — ${e[2]}`, e[1]);
        if (e[1] === "ALERT") {
          const node = activeScenario.affected[Math.min(i - 2, activeScenario.affected.length - 1)];
          if (node) setNode(node, "alert");
        }
      }, 700 * (i + 1));
    });

    updateStats();
  }

  function investigate() {
    if (!activeScenario) return;
    const remaining = activeScenario.clues.filter(n => !discovered.has(n));
    if (!remaining.length) {
      rangeLog("No new clues found. Review the event timeline.", "WARN");
      return;
    }
    const node = remaining[0];
    discovered.add(node);
    setNode(node, "investigated");
    score += 15;
    rangeLog(`Investigation complete: ${node.toUpperCase()} requires attention.`, "OK");
    updateStats();
  }

  function analyzeLogs() {
    if (!activeScenario) return;
    const missing = activeScenario.clues.filter(n => !discovered.has(n)).length;
    score += missing ? 8 : 18;
    rangeLog(
      missing
        ? `Correlation found. ${missing} clue(s) still need investigation.`
        : "Event chain correlated successfully.",
      missing ? "WARN" : "OK"
    );
    updateStats();
  }

  function isolateSystem() {
    if (!activeScenario) return;
    const target = activeScenario.affected.find(n => discovered.has(n) && !isolated.has(n));
    if (!target) {
      rangeLog("Isolation requires an investigated affected system first.", "WARN");
      score = Math.max(0, score - 5);
      updateStats();
      return;
    }
    isolated.add(target);
    setNode(target, "isolated");
    score += 20;
    rangeLog(`${target.toUpperCase()} isolated in the simulation.`, "OK");
    updateStats();
  }

  function containIncident() {
    if (!activeScenario) return;
    if (isolated.size < Math.max(1, Math.ceil(activeScenario.affected.length / 2))) {
      rangeLog("Containment failed: investigate and isolate affected systems first.", "WARN");
      score = Math.max(0, score - 10);
      updateStats();
      return;
    }
    contained = true;
    score += 35;
    if ($("rangeStatus")) $("rangeStatus").textContent = "INCIDENT CONTAINED";
    if ($("rangeMission")) $("rangeMission").innerHTML =
      `<strong>MISSION COMPLETE</strong><p>Der simulierte Vorfall wurde erfolgreich eingedämmt. Score: ${score}.</p>`;
    rangeLog("SIMULATION: incident contained successfully.", "OK");
    updateStats();
    clearInterval(timer);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("startRangeBtn")?.addEventListener("click", startSimulation);
    document.querySelectorAll("[data-range-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.rangeAction;
        if (action === "investigate") investigate();
        if (action === "analyze") analyzeLogs();
        if (action === "isolate") isolateSystem();
        if (action === "contain") containIncident();
      });
    });
  });
})();

/* V4.3_OFFENSIVE_SIM */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", () => {
    let running = false, interval = null, count = 0, targets = 0, detection = 0;
    const events = {
      beacon: [
        "Künstlicher Beacon auf PC-02 ausgelöst.",
        "Periodische simulierte Telemetrie eingetroffen.",
        "Virtueller Beacon meldet sich erneut.",
        "Defensiver Sensor erkennt ein wiederkehrendes Muster."
      ],
      lateral: [
        "Simulierte Bewegung von PC-01 nach PC-02.",
        "Virtuelle Authentifizierungsaktivität erzeugt.",
        "WEB-01 als Simulationsziel markiert.",
        "Defensiver Sensor korreliert die Ereignisse."
      ],
      exfil: [
        "Künstlicher Datenabfluss vorbereitet.",
        "Simulierte Datenmenge erkannt.",
        "Virtueller Transfer im Labor dargestellt.",
        "Defensiver Sensor meldet ein ungewöhnliches Muster."
      ]
    };

    function log(text, type="INFO") {
      const box = $("beaconTelemetry");
      if (!box) return;
      const row = document.createElement("div");
      row.textContent = `[${new Date().toLocaleTimeString("de-DE")}] [${type}] ${text}`;
      box.appendChild(row);
      box.scrollTop = box.scrollHeight;
    }

    function update() {
      if ($("beaconCount")) $("beaconCount").textContent = count;
      if ($("offTargetCount")) $("offTargetCount").textContent = targets;
      if ($("offDetection")) $("offDetection").textContent = `${detection}%`;
      if ($("offPhase")) $("offPhase").textContent = running ? "AKTIV" : "BEREIT";
    }

    function start() {
      clearInterval(interval);
      running = true; count = 0; targets = 0; detection = 0;
      if ($("beaconTelemetry")) $("beaconTelemetry").innerHTML = "";
      if ($("offensiveStatus")) $("offensiveStatus").textContent = "SIMULATION AKTIV";
      const scenario = $("offensiveScenario")?.value || "beacon";
      const delay = $("offensiveIntensity")?.value === "high" ? 1100 :
                    $("offensiveIntensity")?.value === "medium" ? 1700 : 2500;
      log(`Szenario ${scenario.toUpperCase()} gestartet.`, "START");
      interval = setInterval(() => {
        const list = events[scenario];
        const text = list[count % list.length];
        count++;
        targets = Math.min(4, Math.ceil(count / 2));
        detection = Math.min(100, detection + 7);
        log(text, count % 3 === 0 ? "WARNUNG" : "BEACON");
        update();
      }, delay);
      update();
    }

    function stop() {
      running = false;
      clearInterval(interval);
      interval = null;
      if ($("offensiveStatus")) $("offensiveStatus").textContent = "LABOR BEREIT";
      log("Simulation gestoppt.", "STOPP");
      update();
    }

    $("startOffensiveBtn")?.addEventListener("click", start);
    $("stopOffensiveBtn")?.addEventListener("click", stop);

    document.querySelectorAll("[data-off-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!running) { log("Bitte zuerst eine Simulation starten.", "HINWEIS"); return; }
        const action = btn.dataset.offAction;
        if (action === "observe") { detection = Math.min(100, detection + 12); log("Telemetrie wird beobachtet und korreliert.", "ANALYSE"); }
        if (action === "simulateBeacon") { count++; targets = Math.min(4, targets + 1); detection = Math.min(100, detection + 5); log("Manueller Beacon innerhalb der Simulation ausgelöst.", "BEACON"); }
        if (action === "simulateMove") { targets = Math.min(4, targets + 1); detection = Math.min(100, detection + 10); log("Simulierte laterale Bewegung dargestellt.", "WARNUNG"); }
        if (action === "simulateExfil") { detection = Math.min(100, detection + 15); log("Simulierter Datenabfluss dargestellt.", "WARNUNG"); }
        if (action === "reset") start();
        update();
      });
    });
    update();
  });
})();

/* =========================================================
   V4.6 — CLEAN HACKING MODE NAVIGATION
   ========================================================= */
(() => {
  "use strict";
  function showHackingTool(id){
    if (typeof currentMode !== "undefined" && currentMode !== "hack") return;
    document.querySelectorAll(".hack-tool-card").forEach(card=>card.classList.remove("hack-active"));
    document.getElementById("cyberRangePanel")?.classList.remove("active");
    document.getElementById("offensiveRangePanel")?.classList.remove("active");
    const target=document.getElementById(id);
    if(!target)return;
    if(id === "cyberRangePanel" || id === "offensiveRangePanel"){
      target.classList.add("active");
    }else{
      target.classList.add("hack-active");
    }
    target.scrollIntoView({behavior:"smooth",block:"start"});
  }
  function setHackNavVisible(active){
    document.body.classList.toggle("hacking-mode-active",active);
    if(!active){
      document.querySelectorAll(".hack-tool-card").forEach(c=>c.classList.remove("hack-active"));
      document.getElementById("cyberRangePanel")?.classList.remove("active");
      document.getElementById("offensiveRangePanel")?.classList.remove("active");
    }else{
      showHackingTool("hackTool01");
    }
  }
  const originalSetCategoryMode = window.setCategoryMode;
  window.setCategoryMode = function(mode){
    if(typeof originalSetCategoryMode === "function") originalSetCategoryMode(mode);
    setHackNavVisible(mode === "hack");
  };
  document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll("#hackTopNavigation [data-hack-tool]").forEach(btn=>{
      btn.addEventListener("click",()=>showHackingTool(btn.dataset.hackTool));
    });
    document.getElementById("hackNavExit")?.addEventListener("click",()=>{
      if(typeof openSchoolMode === "function") openSchoolMode();
      else setHackNavVisible(false);
    });
    setHackNavVisible(false);
  });
})();

/* V4.6 URL ANALYZER GUARANTEE */
document.addEventListener("DOMContentLoaded",()=>{
  const b=document.getElementById("urlAnalyzeBtn");
  if(b && typeof analyzeURL === "function") b.addEventListener("click",analyzeURL);
});

/* V5.0 — one authoritative startup/mode controller */
(() => {
  "use strict";
  const ready = (fn) => {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, {once:true});
    else fn();
  };

  ready(() => {
    const body = document.body;
    const security = document.getElementById("securityScreen");
    const bootScreen = document.getElementById("bootScreen");
    const app = document.getElementById("app");
    const reactor = document.getElementById("reactorButton");
    const accessPanel = document.getElementById("accessPanel");
    const accessForm = document.getElementById("accessForm");
    const accessInput = document.getElementById("accessCodeInput");
    const accessError = document.getElementById("accessError");
    const nav = document.getElementById("hackCategoryNav");
    const schoolBtn = document.getElementById("schoolModeBtn");
    const hackBtn = document.getElementById("hackModeBtn");
    const chessBtn = document.getElementById("gamesModeBtn");
    const leisureBtn = document.getElementById("leisureModeBtn");
    const exitBtn = document.getElementById("hackCategoryExit");
    const gamesRoot = document.getElementById("gamesRoot");
    const leisureRoot = document.getElementById("leisureRoot");
    const topbar = document.querySelector(".topbar");
    const dashboard = document.querySelector("main.dashboard");

    let bootStarted = false;

    const hideNav = () => {
      if (!nav) return;
      nav.style.setProperty("display","none","important");
      nav.style.setProperty("visibility","hidden","important");
      nav.style.setProperty("pointer-events","none","important");
    };
    const showNav = () => {
      if (!nav) return;
      nav.style.removeProperty("display");
      nav.style.removeProperty("visibility");
      nav.style.removeProperty("pointer-events");
    };
    const clearCards = () => {
      document.querySelectorAll(".hack-tool-card[data-hack-category],#cyberRangePanel,#offensiveRangePanel")
        .forEach(el => el.classList.remove("hack-category-active"));
    };
    const selectCategory = (cat) => {
      clearCards();
      if (cat === "cyber") {
        document.getElementById("cyberRangePanel")?.classList.add("hack-category-active");
      } else if (cat === "offensive") {
        document.getElementById("offensiveRangePanel")?.classList.add("hack-category-active");
      } else if (cat === "defense") {
        // "Defensive Sicherheit" zeigt sowohl die Lernkarten als auch die
        // Cyber-Range-Simulation, damit die defensive Simulation hier sichtbar ist.
        document.querySelectorAll('.hack-tool-card[data-hack-category="defense"]')
          .forEach(el => el.classList.add("hack-category-active"));
        document.getElementById("cyberRangePanel")?.classList.add("hack-category-active");
      } else {
        document.querySelectorAll(`.hack-tool-card[data-hack-category="${CSS.escape(cat)}"]`)
          .forEach(el => el.classList.add("hack-category-active"));
      }
      nav?.querySelectorAll(".hack-main-category").forEach(b =>
        b.classList.toggle("active", b.dataset.hackCategory === cat));
    };

    const school = () => {
      gamesRoot?.classList.add("hidden");
      leisureRoot?.classList.add("hidden");
      if (topbar) topbar.style.display = "";
      if (dashboard) dashboard.style.display = "";
      body.classList.remove("jarvis-hacking","hacking-mode-active","jarvis-games","jarvis-leisure");
      body.classList.add("jarvis-school");
      clearCards();
      hideNav();
      schoolBtn?.classList.add("active");
      hackBtn?.classList.remove("active");
      chessBtn?.classList.remove("active");
      leisureBtn?.classList.remove("active");
      try { window.setCategoryMode?.("school"); } catch (_) {}
    };

    const hacking = () => {
      gamesRoot?.classList.add("hidden");
      leisureRoot?.classList.add("hidden");
      if (topbar) topbar.style.display = "none";
      if (dashboard) dashboard.style.display = "";
      body.classList.remove("jarvis-school","jarvis-games","jarvis-leisure");
      body.classList.add("jarvis-hacking","hacking-mode-active");
      schoolBtn?.classList.remove("active");
      hackBtn?.classList.add("active");
      chessBtn?.classList.remove("active");
      leisureBtn?.classList.remove("active");
      showNav();
      requestAnimationFrame(() => selectCategory("analysis"));
      try { window.setCategoryMode?.("hack"); } catch (_) {}
    };

    const games = () => {
      leisureRoot?.classList.add("hidden");
      body.classList.remove("jarvis-school","jarvis-hacking","hacking-mode-active","jarvis-leisure");
      body.classList.add("jarvis-games");
      clearCards();
      hideNav();
      if (topbar) topbar.style.display = "none";
      if (dashboard) dashboard.style.display = "none";
      schoolBtn?.classList.remove("active");
      hackBtn?.classList.remove("active");
      chessBtn?.classList.add("active");
      leisureBtn?.classList.remove("active");
      gamesRoot?.classList.remove("hidden");
      try { window.showGamesLauncher?.(); } catch (_) {}
    };

    const leisure = () => {
      gamesRoot?.classList.add("hidden");
      body.classList.remove("jarvis-school","jarvis-hacking","hacking-mode-active","jarvis-games");
      body.classList.add("jarvis-leisure");
      clearCards();
      hideNav();
      if (topbar) topbar.style.display = "none";
      if (dashboard) dashboard.style.display = "none";
      schoolBtn?.classList.remove("active");
      hackBtn?.classList.remove("active");
      chessBtn?.classList.remove("active");
      leisureBtn?.classList.add("active");
      leisureRoot?.classList.remove("hidden");
    };

    // Initial frame is always the security screen; never expose app/hacking UI.
    body.classList.remove("jarvis-hacking","hacking-mode-active","jarvis-school");
    body.classList.add("jarvis-preload","jarvis-booting");
    hideNav();
    if (app) app.style.display = "none";
    if (security) security.classList.remove("hidden");
    if (bootScreen) bootScreen.classList.add("hidden");

    const openAccess = () => {
      accessPanel?.classList.remove("hidden");
      if (accessError) accessError.textContent = "";
      requestAnimationFrame(() => accessInput?.focus());
    };
    reactor?.addEventListener("click", openAccess);
    reactor?.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openAccess(); }
    });

    const startBoot = () => {
      if (bootStarted) return;
      bootStarted = true;
      body.classList.remove("jarvis-preload","jarvis-school","jarvis-hacking","hacking-mode-active");
      body.classList.add("jarvis-booting");
      hideNav();
      security?.classList.add("hidden");
      bootScreen?.classList.remove("hidden");
      if (app) app.style.display = "none";

      const bar = document.getElementById("bootProgressBar");
      const percent = document.getElementById("bootPercent");
      const status = document.getElementById("bootStatus");
      const label = document.getElementById("bootLoadingLabel");
      const lines = document.getElementById("bootLines");
      const messages = [
        "INITIALISIERE JARVIS CORE...","LADE SYSTEMKOMPONENTEN...",
        "INITIALISIERE DATENBANK...","LADE SCHULMODULE...",
        "AKTIVIERE LERNMODUL...","AKTIVIERE VOKABELSYSTEM...",
        "AKTIVIERE SPRACHSTEUERUNG...","PRÜFE BEFEHLSERKENNUNG...",
        "PRÜFE SYSTEMSTATUS...","JARVIS WIRD GESTARTET..."
      ];

      let progress = 0;
      if (bar) bar.style.width = "0%";
      if (percent) percent.textContent = "0%";
      if (label) label.textContent = "SYSTEM INITIALIZATION // 0%";
      if (status) status.textContent = messages[0];
      if (lines) lines.innerHTML = "";

      const timer = setInterval(() => {
        progress = Math.min(100, progress + 5);
        const i = Math.min(messages.length - 1, Math.floor(progress / 10));
        if (bar) bar.style.width = progress + "%";
        if (percent) percent.textContent = progress + "%";
        if (label) label.textContent = "SYSTEM INITIALIZATION // " + progress + "%";
        if (status) status.textContent = messages[i];

        if (lines && !lines.querySelector(`[data-boot-index="${i}"]`)) {
          const line = document.createElement("div");
          line.className = "boot-line";
          line.dataset.bootIndex = String(i);
          line.textContent = "> " + messages[i];
          lines.appendChild(line);
        }

        if (progress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            bootScreen?.classList.add("hidden");
            if (app) { app.style.display = ""; app.classList.remove("hidden"); }
            body.classList.remove("jarvis-booting","jarvis-preload","jarvis-hacking","hacking-mode-active");
            body.classList.add("jarvis-school");
            hideNav();
            clearCards();
            schoolBtn?.classList.add("active");
            hackBtn?.classList.remove("active");
            try { window.setCategoryMode?.("school"); } catch (_) {}
            try { window.renderAll?.(); } catch (_) {}
          }, 500);
        }
      }, 100);
    };

    accessForm?.addEventListener("submit", e => {
      e.preventDefault();
      if (String(accessInput?.value || "").trim() === "220811") {
        if (accessError) {
          accessError.textContent = "ZUGANG BESTÄTIGT";
          accessError.style.color = "var(--success,#55ff99)";
        }
        setTimeout(startBoot, 250);
      } else {
        if (accessError) {
          accessError.textContent = "ZUGANG VERWEIGERT // CODE UNGÜLTIG";
          accessError.style.color = "var(--danger,#ff5555)";
        }
        if (accessInput) { accessInput.value = ""; accessInput.focus(); }
      }
    });

    // Für den biometrischen Gesichtsscan (gesture-script.js) zugänglich machen,
    // damit ein erfolgreicher Scan den Boot direkt auslösen kann.
    window.jarvisStartBoot = startBoot;

    nav?.querySelectorAll(".hack-main-category[data-hack-category]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (body.classList.contains("jarvis-hacking")) selectCategory(btn.dataset.hackCategory);
      });
    });

    schoolBtn?.addEventListener("click", school);
    hackBtn?.addEventListener("click", hacking);
    chessBtn?.addEventListener("click", games);
    leisureBtn?.addEventListener("click", leisure);
    exitBtn?.addEventListener("click", school);

    new MutationObserver(() => {
      if (!body.classList.contains("jarvis-hacking")) hideNav();
    }).observe(body, {attributes:true, attributeFilter:["class"]});
  });
})();

/* =========================================================
   NEUE TOOLS — Code-Generator, Passwort-Generator v2, Datei-Hash
   (ersetzt die zuvor nie verdrahteten Platzhalter-Karten)
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);

  const snippets = {
    html: `<!-- Beispiel: einfache Karte -->
<div class="card">
  <h3>Titel</h3>
  <p>Kurzer Beschreibungstext.</p>
  <button type="button">Mehr erfahren</button>
</div>`,
    css: `/* Beispiel: einfache Karte */
.card {
  padding: 16px;
  border-radius: 12px;
  background: #101d29;
  color: #e7f6ff;
  box-shadow: 0 4px 18px rgba(0,0,0,.3);
}
.card button {
  margin-top: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}`,
    js: `// Beispiel: einfacher Klick-Zähler
let count = 0;
function increment() {
  count += 1;
  console.log("Klicks:", count);
}
document.querySelector("button")
  ?.addEventListener("click", increment);`
  };

  $("codeGeneratorBtn")?.addEventListener("click", () => {
    const type = $("codeGeneratorType")?.value || "html";
    const out = $("codeGeneratorOutput");
    if (out) out.textContent = snippets[type] || "";
  });

  $("generatePasswordV2Btn")?.addEventListener("click", () => {
    const length = Math.min(64, Math.max(8, Number($("generatorLength")?.value || 20)));
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*+-_=?";
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    let pw = "";
    for (let i = 0; i < length; i++) pw += chars[values[i] % chars.length];
    const out = $("generatedPasswordOutput");
    if (out) out.textContent = pw;
  });

  $("fileHashBtn")?.addEventListener("click", async () => {
    const input = $("fileHashInput");
    const out = $("fileHashOutput");
    if (!input?.files?.[0]) { if (out) out.textContent = "Bitte zuerst eine Datei auswählen."; return; }
    if (!window.crypto?.subtle) { if (out) out.textContent = "Web Crypto API nicht verfügbar."; return; }
    const file = input.files[0];
    if (out) out.textContent = "Berechne...";
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const hash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
    if (out) out.textContent = `${file.name}: ${hash}`;
  });
})();

/* =========================================================
   WAKEBOARD LOG & CALISTHENICS TRACKER
   Eigenständige, lokal gespeicherte Mini-Tracker im Schulmodus.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  /* ---- Wakeboard ---- */
  const WB_KEY = "jarvisWakeboardLog";
  const loadWb = () => { try { return JSON.parse(localStorage.getItem(WB_KEY)) || []; } catch (_) { return []; } };
  const saveWb = (entries) => localStorage.setItem(WB_KEY, JSON.stringify(entries));

  function renderWb() {
    const list = $("wbList");
    if (!list) return;
    const entries = loadWb();
    if (!entries.length) {
      list.innerHTML = '<div class="empty-hint">Noch keine Sessions geloggt.</div>';
      return;
    }
    list.innerHTML = entries.slice().reverse().map((e, revIdx) => {
      const idx = entries.length - 1 - revIdx;
      return `<div class="list-item">
        <div><strong>${esc(e.trick || "Session")}</strong> — ${esc(e.spot || "")} ${e.minutes ? `· ${esc(e.minutes)} min` : ""}</div>
        <div class="list-item-meta">${esc(e.date)}</div>
        <button class="list-item-remove" data-wb-remove="${idx}" type="button">×</button>
      </div>`;
    }).join("");
  }

  $("wbAddBtn")?.addEventListener("click", () => {
    const trick = $("wbTrick")?.value.trim();
    const spot = $("wbSpot")?.value.trim();
    const minutes = $("wbMinutes")?.value.trim();
    if (!trick && !minutes) return;
    const entries = loadWb();
    entries.push({
      trick, spot, minutes,
      date: new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    });
    saveWb(entries);
    if ($("wbTrick")) $("wbTrick").value = "";
    if ($("wbMinutes")) $("wbMinutes").value = "";
    renderWb();
  });

  $("wbList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-wb-remove]");
    if (!btn) return;
    const entries = loadWb();
    entries.splice(Number(btn.dataset.wbRemove), 1);
    saveWb(entries);
    renderWb();
  });

  /* ---- Calisthenics ---- */
  const CALI_KEY = "jarvisCalisthenicsLog";
  const loadCali = () => { try { return JSON.parse(localStorage.getItem(CALI_KEY)) || []; } catch (_) { return []; } };
  const saveCali = (entries) => localStorage.setItem(CALI_KEY, JSON.stringify(entries));

  function renderCali() {
    const list = $("caliList");
    if (!list) return;
    const entries = loadCali();
    if (!entries.length) {
      list.innerHTML = '<div class="empty-hint">Noch kein Workout geloggt.</div>';
      return;
    }
    list.innerHTML = entries.slice().reverse().map((e, revIdx) => {
      const idx = entries.length - 1 - revIdx;
      return `<div class="list-item">
        <div><strong>${esc(e.exercise || "Übung")}</strong> — ${esc(e.sets || "?")}×${esc(e.reps || "?")}</div>
        <div class="list-item-meta">${esc(e.date)}</div>
        <button class="list-item-remove" data-cali-remove="${idx}" type="button">×</button>
      </div>`;
    }).join("");
  }

  $("caliAddBtn")?.addEventListener("click", () => {
    const exercise = $("caliExercise")?.value.trim();
    const sets = $("caliSets")?.value.trim();
    const reps = $("caliReps")?.value.trim();
    if (!exercise) return;
    const entries = loadCali();
    entries.push({
      exercise, sets, reps,
      date: new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    });
    saveCali(entries);
    if ($("caliExercise")) $("caliExercise").value = "";
    if ($("caliSets")) $("caliSets").value = "";
    if ($("caliReps")) $("caliReps").value = "";
    renderCali();
  });

  $("caliList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cali-remove]");
    if (!btn) return;
    const entries = loadCali();
    entries.splice(Number(btn.dataset.caliRemove), 1);
    saveCali(entries);
    renderCali();
  });

  renderWb();
  renderCali();
})();

/* =========================================================
   POMODORO-TIMER, NOTENRECHNER, TASCHENRECHNER
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);

  /* ---- Pomodoro ---- */
  const POMO_FOCUS = 25 * 60;
  const POMO_BREAK = 5 * 60;
  const POMO_ROUNDS_KEY = "jarvisPomodoroRounds";
  let pomoRemaining = POMO_FOCUS;
  let pomoRunning = false;
  let pomoIsBreak = false;
  let pomoInterval = null;

  const pomoTimeEl = $("pomoTime");
  const pomoPhaseEl = $("pomoPhase");
  const pomoRoundsEl = $("pomoRounds");

  function pomoFormat(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }
  function pomoTodayKey() {
    return POMO_ROUNDS_KEY + ":" + new Date().toISOString().slice(0, 10);
  }
  function pomoRenderRounds() {
    const n = Number(localStorage.getItem(pomoTodayKey()) || 0);
    if (pomoRoundsEl) pomoRoundsEl.textContent = `Runden heute: ${n}`;
  }
  function pomoRender() {
    if (pomoTimeEl) pomoTimeEl.textContent = pomoFormat(pomoRemaining);
    if (pomoPhaseEl) pomoPhaseEl.textContent = pomoIsBreak ? "PAUSE" : "FOKUS";
  }
  function pomoTick() {
    pomoRemaining--;
    if (pomoRemaining <= 0) {
      if (!pomoIsBreak) {
        const n = Number(localStorage.getItem(pomoTodayKey()) || 0) + 1;
        localStorage.setItem(pomoTodayKey(), String(n));
        pomoRenderRounds();
        document.dispatchEvent(new CustomEvent("jarvis:pomodoro-round-complete"));
      }
      pomoIsBreak = !pomoIsBreak;
      pomoRemaining = pomoIsBreak ? POMO_BREAK : POMO_FOCUS;
    }
    pomoRender();
  }
  $("pomoStartBtn")?.addEventListener("click", () => {
    if (pomoRunning) return;
    pomoRunning = true;
    pomoInterval = setInterval(pomoTick, 1000);
  });
  $("pomoPauseBtn")?.addEventListener("click", () => {
    pomoRunning = false;
    clearInterval(pomoInterval);
  });
  $("pomoResetBtn")?.addEventListener("click", () => {
    pomoRunning = false;
    clearInterval(pomoInterval);
    pomoIsBreak = false;
    pomoRemaining = POMO_FOCUS;
    pomoRender();
  });
  pomoRender();
  pomoRenderRounds();

  /* ---- Notenrechner ---- */
  const GRADE_KEY = "jarvisGrades";
  const loadGrades = () => { try { return JSON.parse(localStorage.getItem(GRADE_KEY)) || []; } catch (_) { return []; } };
  const saveGrades = (g) => localStorage.setItem(GRADE_KEY, JSON.stringify(g));

  function renderGrades() {
    const list = $("gradeList");
    const avgEl = $("gradeAverage");
    if (!list) return;
    const grades = loadGrades();
    if (!grades.length) {
      list.innerHTML = '<div class="empty-hint">Noch keine Noten eingetragen.</div>';
      if (avgEl) avgEl.textContent = "Durchschnitt: —";
      return;
    }
    list.innerHTML = grades.map((g, i) => `<div class="list-item">
      <div><strong>Note ${g.value}</strong> · Gewichtung ${g.weight}</div>
      <button class="list-item-remove" data-grade-remove="${i}" type="button">×</button>
    </div>`).join("");
    const totalWeight = grades.reduce((s, g) => s + Number(g.weight), 0);
    const weightedSum = grades.reduce((s, g) => s + Number(g.value) * Number(g.weight), 0);
    const avg = totalWeight ? (weightedSum / totalWeight) : 0;
    if (avgEl) avgEl.textContent = `Durchschnitt: ${avg.toFixed(2)}`;
  }
  $("gradeAddBtn")?.addEventListener("click", () => {
    const value = Number($("gradeInput")?.value);
    const weight = Number($("gradeWeight")?.value) || 1;
    if (!value || value < 1 || value > 6) return;
    const grades = loadGrades();
    grades.push({ value, weight });
    saveGrades(grades);
    if ($("gradeInput")) $("gradeInput").value = "";
    if ($("gradeWeight")) $("gradeWeight").value = "1";
    renderGrades();
  });
  $("gradeList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-grade-remove]");
    if (!btn) return;
    const grades = loadGrades();
    grades.splice(Number(btn.dataset.gradeRemove), 1);
    saveGrades(grades);
    renderGrades();
  });
  renderGrades();

  /* ---- Taschenrechner ---- */
  const calcDisplay = $("calcDisplay");
  let calcExpr = "";
  function calcRender() {
    if (calcDisplay) calcDisplay.textContent = calcExpr || "0";
  }
  document.querySelectorAll("[data-calc]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.calc;
      if (key === "clear") { calcExpr = ""; }
      else if (key === "back") { calcExpr = calcExpr.slice(0, -1); }
      else if (key === "=") {
        try {
          if (!/^[0-9+\-*/.,\s]+$/.test(calcExpr)) throw new Error("invalid");
          const safeExpr = calcExpr.replace(/,/g, ".");
          // eslint-disable-next-line no-new-func
          const result = Function('"use strict";return (' + safeExpr + ")")();
          calcExpr = String(Math.round(result * 1e6) / 1e6);
        } catch (_) {
          calcExpr = "Fehler";
        }
      } else {
        if (calcExpr === "Fehler") calcExpr = "";
        calcExpr += key;
      }
      calcRender();
    });
  });
  calcRender();
})();

/* =========================================================
   STUNDENPLAN, FORMELSAMMLUNG, LERN-ASSISTENT
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  /* ---- Stundenplan ---- */
  const SCHEDULE_KEY = "jarvisSchedule";
  const DAYS = ["Mo", "Di", "Mi", "Do", "Fr"];
  const SLOTS = ["1./2.", "3./4.", "5./6.", "7./8."];
  const loadSchedule = () => { try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY)) || {}; } catch (_) { return {}; } };
  const saveSchedule = (s) => localStorage.setItem(SCHEDULE_KEY, JSON.stringify(s));

  function renderSchedule() {
    const grid = $("scheduleGrid");
    if (!grid) return;
    const data = loadSchedule();
    let html = '<div class="schedule-cell schedule-head"></div>';
    DAYS.forEach(d => html += `<div class="schedule-cell schedule-head">${d}</div>`);
    SLOTS.forEach((slot, r) => {
      html += `<div class="schedule-cell schedule-head schedule-slot">${slot}</div>`;
      DAYS.forEach((d, c) => {
        const key = `${r}-${c}`;
        const val = data[key] || "";
        html += `<div class="schedule-cell schedule-fill" data-schedule-key="${key}">${esc(val)}</div>`;
      });
    });
    grid.innerHTML = html;
  }

  $("scheduleGrid")?.addEventListener("click", (e) => {
    const cell = e.target.closest("[data-schedule-key]");
    if (!cell) return;
    const data = loadSchedule();
    const key = cell.dataset.scheduleKey;
    const current = data[key] || "";
    const next = prompt("Fach eintragen (leer lassen zum Löschen):", current);
    if (next === null) return;
    if (next.trim() === "") delete data[key];
    else data[key] = next.trim();
    saveSchedule(data);
    renderSchedule();
  });

  renderSchedule();

  /* ---- Formelsammlung ---- */
  const FORMULAS = [
    { title: "Fläche Rechteck", formula: "A = a · b", tags: "fläche rechteck geometrie" },
    { title: "Fläche Dreieck", formula: "A = ½ · g · h", tags: "fläche dreieck geometrie" },
    { title: "Fläche Kreis", formula: "A = π · r²", tags: "fläche kreis geometrie" },
    { title: "Umfang Kreis", formula: "U = 2 · π · r", tags: "umfang kreis geometrie" },
    { title: "Satz des Pythagoras", formula: "a² + b² = c²", tags: "pythagoras dreieck geometrie" },
    { title: "Prozentrechnung", formula: "W = G · p / 100", tags: "prozent prozentrechnung" },
    { title: "Prozentsatz", formula: "p = W / G · 100", tags: "prozent prozentsatz" },
    { title: "Dreisatz", formula: "x = (b · c) / a", tags: "dreisatz verhältnis" },
    { title: "Lineare Funktion", formula: "y = m · x + b", tags: "funktion linear steigung" },
    { title: "Steigung m", formula: "m = (y₂ − y₁) / (x₂ − x₁)", tags: "steigung funktion" },
    { title: "Quadratische Formel (Mitternachtsformel)", formula: "x = (−b ± √(b²−4ac)) / 2a", tags: "quadratisch mitternachtsformel pq-formel" },
    { title: "Geschwindigkeit", formula: "v = s / t", tags: "physik geschwindigkeit" },
    { title: "Beschleunigung", formula: "a = Δv / Δt", tags: "physik beschleunigung" },
    { title: "Kraft (Newton)", formula: "F = m · a", tags: "physik kraft newton" },
    { title: "Ohmsches Gesetz", formula: "U = R · I", tags: "physik ohm strom spannung widerstand" },
    { title: "Elektrische Leistung", formula: "P = U · I", tags: "physik leistung strom" },
    { title: "Dichte", formula: "ρ = m / V", tags: "physik dichte masse volumen" },
    { title: "Kinetische Energie", formula: "E = ½ · m · v²", tags: "physik energie kinetisch" },
    { title: "Molare Masse", formula: "n = m / M", tags: "chemie mol masse" },
    { title: "pH-Wert", formula: "pH = −log₁₀[H⁺]", tags: "chemie ph säure base" },
  ];

  function renderFormulas(filter) {
    const list = $("formulaList");
    if (!list) return;
    const q = (filter || "").toLowerCase().trim();
    const custom = (window.getCustomFormulas ? window.getCustomFormulas() : []).map(f => ({ ...f, custom: true }));
    const allFormulas = [...FORMULAS, ...custom];
    const items = allFormulas.filter(f => !q || f.title.toLowerCase().includes(q) || f.tags.includes(q));
    list.innerHTML = items.length
      ? items.map(f => `<div class="formula-card${f.custom ? " formula-card-custom" : ""}">
          <div class="formula-title">${esc(f.title)}${f.custom ? " ★" : ""}</div>
          <div class="formula-eq">${esc(f.formula)}</div>
        </div>`).join("")
      : '<div class="empty-hint">Keine Formel gefunden.</div>';
  }
  $("formulaSearch")?.addEventListener("input", (e) => renderFormulas(e.target.value));
  document.addEventListener("jarvis:custom-formula-added", () => renderFormulas($("formulaSearch")?.value));
  renderFormulas("");

  /* ---- Lern-Assistent (regelbasiert, lokal, keine echte KI) ---- */
  const logEl = $("assistantLog");
  const inputEl = $("assistantInput");
  const sendBtn = $("assistantSendBtn");

  function assistantAppend(text, who) {
    if (!logEl) return;
    const div = document.createElement("div");
    div.className = `assistant-msg assistant-msg-${who}`;
    div.textContent = text;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function safeGet(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch (_) { return []; }
  }

  function assistantAnswer(raw) {
    const q = raw.toLowerCase();

    if (q.includes("arbeitsblatt") || q.includes("übungsblatt") || q.includes("uebungsblatt")) {
      const topic = raw.replace(/arbeitsblatt(s)?|übungsblatt|uebungsblatt|zu|zum|zur|für|fuer/gi, "").trim();
      if (topic && window.findWorksheetsFor) {
        window.findWorksheetsFor(topic);
        return `Ich öffne dir gleich Suchlinks für kostenlose PDF-Arbeitsblätter zu "${topic}" im Bereich ÜBUNGSBLÄTTER FINDEN.`;
      }
      return 'Sag mir ein Thema, z. B. "Arbeitsblatt zu Bruchrechnung", dann fülle ich dir die Suche im Feld ÜBUNGSBLÄTTER FINDEN aus.';
    }

    if (q.includes("fällig") || q.includes("heute")) {
      const hw = safeGet("jarvisHomework") || [];
      if (Array.isArray(hw) && hw.length) {
        return "Gefundene Hausaufgaben-Einträge im Speicher: " + hw.length + ". Schau im Feld HAUSAUFGABEN oben für Details.";
      }
      return "Ich finde gerade keine gespeicherten Hausaufgaben-Daten unter diesem Namen — schau im Feld HAUSAUFGABEN nach.";
    }

    if (q.includes("prozent")) {
      return "Prozentrechnung: W = G · p / 100 (Prozentwert = Grundwert · Prozentsatz / 100). Willst du eine Formel suchen? Nutze die Formelsammlung oben.";
    }
    if (q.includes("pythagoras")) {
      return "Satz des Pythagoras: a² + b² = c² — gilt im rechtwinkligen Dreieck, c ist die Hypotenuse (die längste Seite).";
    }
    if (q.includes("vokabel")) {
      const term = q.replace(/vokabeln?/g, "").trim();
      return term
        ? `Zum Suchen von "${term}" schau im VOKABELKARTEN-Bereich nach — dort kannst du direkt durchblättern und abfragen.`
        : "Öffne den Bereich VOKABELKARTEN oben, um deine Vokabeln zu üben.";
    }
    if (q.includes("durchschnitt") || q.includes("note")) {
      return "Trag deine Noten im NOTENRECHNER-Feld ein (mit Gewichtung) — der gewichtete Durchschnitt wird automatisch berechnet.";
    }
    if (q.includes("lern") && (q.includes("tipp") || q.includes("wie"))) {
      const tips = [
        "Pomodoro-Technik: 25 Minuten fokussiert lernen, 5 Minuten Pause — nutze den POMODORO-Timer oben.",
        "Aktives Abfragen (Karteikarten) merkt sich besser als reines Wiederlesen.",
        "Kurze, häufige Lerneinheiten schlagen langes Pauken am Stück.",
        "Erkläre den Stoff laut dir selbst — wenn du's erklären kannst, hast du's verstanden."
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
    if (q.match(/^[0-9+\-*/.,\s]+$/) && q.trim()) {
      try {
        const result = Function('"use strict";return (' + q.replace(/,/g, ".") + ")")();
        return `Ergebnis: ${result}`;
      } catch (_) { /* fall through */ }
    }

    return "Das kann ich als lokaler Assistent (noch) nicht beantworten. Ich kann: Fälligkeiten nennen, Formeln erklären, zur Vokabelkarte/Notenrechner/Pomodoro verweisen und einfache Rechnungen lösen.";
  }

  function assistantSend() {
    const val = inputEl?.value.trim();
    if (!val) return;
    assistantAppend(val, "user");
    inputEl.value = "";
    setTimeout(() => assistantAppend(assistantAnswer(val), "bot"), 250);
  }
  sendBtn?.addEventListener("click", assistantSend);
  inputEl?.addEventListener("keydown", (e) => { if (e.key === "Enter") assistantSend(); });
})();

/* =========================================================
   SPACED-REPETITION KARTEIKARTEN
   Erweitert bestehende Vokabel-Einträge (jarvis_vocabulary) um
   ein leichtgewichtiges SM-2-ähnliches Wiederholungssystem.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const VOCAB_KEY = "jarvis_vocabulary";
  const INTERVALS_DAYS = [0.007, 1, 3, 7, 14, 30, 60]; // erste Stufe ~10 Minuten

  const loadVocab = () => { try { return JSON.parse(localStorage.getItem(VOCAB_KEY)) || []; } catch (_) { return []; } };
  const saveVocab = (v) => localStorage.setItem(VOCAB_KEY, JSON.stringify(v));

  function ensureSrFields(vocab) {
    let changed = false;
    vocab.forEach(v => {
      if (v.srStage === undefined) { v.srStage = 0; changed = true; }
      if (v.srDueAt === undefined) { v.srDueAt = Date.now(); changed = true; }
    });
    if (changed) saveVocab(vocab);
    return vocab;
  }

  let srQueue = [];
  let srIndex = 0;
  let srShowingBack = false;

  function srDueCards() {
    const vocab = ensureSrFields(loadVocab());
    const now = Date.now();
    return vocab.filter(v => v.srDueAt <= now);
  }

  function srRenderCard() {
    const card = $("srCard");
    const face = $("srCardFace");
    const emptyHint = $("srEmptyHint");
    const countEl = $("srDueCount");
    if (!card || !face) return;

    srQueue = srDueCards();
    if (countEl) countEl.textContent = `${srQueue.length} Karte(n) heute fällig.`;

    if (!srQueue.length) {
      card.classList.add("hidden");
      emptyHint?.classList.remove("hidden");
      return;
    }
    emptyHint?.classList.add("hidden");
    card.classList.remove("hidden");
    srShowingBack = false;
    const current = srQueue[0];
    face.textContent = current.front || "—";
  }

  $("srFlipBtn")?.addEventListener("click", () => {
    const face = $("srCardFace");
    if (!face || !srQueue.length) return;
    srShowingBack = !srShowingBack;
    face.textContent = srShowingBack ? (srQueue[0].back || "—") : (srQueue[0].front || "—");
  });

  function srRate(delta) {
    if (!srQueue.length) return;
    const vocab = ensureSrFields(loadVocab());
    const target = vocab.find(v => v.id === srQueue[0].id);
    if (!target) return;
    if (delta < 0) {
      target.srStage = 0;
    } else {
      target.srStage = Math.min(INTERVALS_DAYS.length - 1, (target.srStage || 0) + delta);
    }
    const days = INTERVALS_DAYS[target.srStage];
    target.srDueAt = Date.now() + days * 24 * 60 * 60 * 1000;
    if (delta > 0) target.known = (target.known || 0) + 1;
    else target.unknown = (target.unknown || 0) + 1;
    saveVocab(vocab);
    srRenderCard();
  }

  $("srAgainBtn")?.addEventListener("click", () => srRate(-1));
  $("srGoodBtn")?.addEventListener("click", () => srRate(1));
  $("srEasyBtn")?.addEventListener("click", () => srRate(2));

  srRenderCard();
  // Neu prüfen, falls im VOKABELKARTEN-Bereich neue Vokabeln hinzugefügt werden.
  setInterval(srRenderCard, 15000);

  /* =========================================================
     HAUSAUFGABEN-ERINNERUNG (Browser-Benachrichtigungen)
     ========================================================= */
  const HW_KEY = "jarvis_homework";
  const NOTIFIED_KEY = "jarvisNotifiedHomeworkIds";
  const loadHomework = () => { try { return JSON.parse(localStorage.getItem(HW_KEY)) || []; } catch (_) { return []; } };
  const loadNotified = () => { try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY)) || []; } catch (_) { return []; } };
  const saveNotified = (ids) => localStorage.setItem(NOTIFIED_KEY, JSON.stringify(ids));

  function notifyStatusText() {
    if (!("Notification" in window)) return "Benachrichtigungen werden von diesem Browser nicht unterstützt.";
    if (Notification.permission === "granted") return "Status: aktiviert ✓";
    if (Notification.permission === "denied") return "Status: vom Browser blockiert.";
    return "Status: nicht aktiviert.";
  }
  function updateNotifyStatus() {
    const el = $("notifyStatus");
    if (el) el.textContent = notifyStatusText();
  }
  $("notifyEnableBtn")?.addEventListener("click", async () => {
    if (!("Notification" in window)) return;
    await Notification.requestPermission();
    updateNotifyStatus();
    checkHomeworkReminders();
  });
  updateNotifyStatus();

  function checkHomeworkReminders() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const hw = loadHomework();
    const notified = loadNotified();
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    hw.forEach(item => {
      if (item.completed || !item.dueDate || notified.includes(item.id)) return;
      const due = new Date(item.dueDate); due.setHours(0,0,0,0);
      if (due.getTime() === today.getTime() || due.getTime() === tomorrow.getTime()) {
        const when = due.getTime() === today.getTime() ? "heute" : "morgen";
        new Notification("JARVIS Erinnerung", {
          body: `Hausaufgabe "${item.title}" (${item.subject || "ohne Fach"}) ist ${when} fällig.`
        });
        notified.push(item.id);
      }
    });
    saveNotified(notified);
  }
  checkHomeworkReminders();
  setInterval(checkHomeworkReminders, 60 * 60 * 1000); // stündlich prüfen

  /* =========================================================
     PRÜFUNGS-COUNTDOWN
     ========================================================= */
  const EXAM_KEY = "jarvis_exams";
  const loadExams = () => { try { return JSON.parse(localStorage.getItem(EXAM_KEY)) || []; } catch (_) { return []; } };

  function renderExamCountdown() {
    const list = $("examCountdownList");
    if (!list) return;
    const exams = loadExams();
    const now = new Date(); now.setHours(0,0,0,0);
    const upcoming = exams
      .map(e => ({ ...e, daysLeft: Math.ceil((new Date(e.date) - now) / (1000 * 60 * 60 * 24)) }))
      .filter(e => e.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    if (!upcoming.length) {
      list.innerHTML = '<div class="empty-hint">Keine anstehenden Klassenarbeiten.</div>';
      return;
    }
    list.innerHTML = upcoming.map(e => {
      const pct = Math.max(4, 100 - Math.min(100, e.daysLeft * (100 / 30)));
      const urgency = e.daysLeft <= 2 ? "urgent" : e.daysLeft <= 7 ? "soon" : "ok";
      return `<div class="exam-countdown-item">
        <div class="exam-countdown-head">
          <strong>${e.title}</strong>
          <span>${e.subject || ""} · ${e.daysLeft === 0 ? "heute" : e.daysLeft + " Tag(e)"}</span>
        </div>
        <div class="exam-bar-track"><div class="exam-bar-fill exam-${urgency}" style="width:${pct}%"></div></div>
      </div>`;
    }).join("");
  }
  renderExamCountdown();
  setInterval(renderExamCountdown, 60000);

  /* =========================================================
     WETTER · KABELPARK KALLETAL (Open-Meteo, kein API-Key nötig)
     ========================================================= */
  const KALLETAL_LAT = 51.9722;
  const KALLETAL_LON = 9.0508;
  const WEATHER_CODES = {
    0: "☀️ Klar", 1: "🌤️ Meist klar", 2: "⛅ Teilweise bewölkt", 3: "☁️ Bewölkt",
    45: "🌫️ Nebel", 48: "🌫️ Reifnebel", 51: "🌦️ Leichter Niesel", 61: "🌧️ Leichter Regen",
    63: "🌧️ Regen", 65: "🌧️ Starker Regen", 71: "🌨️ Leichter Schnee", 73: "🌨️ Schnee",
    75: "❄️ Starker Schnee", 80: "🌦️ Schauer", 95: "⛈️ Gewitter"
  };
  async function loadWeather() {
    const el = $("weatherWidget");
    if (!el) return;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${KALLETAL_LAT}&longitude=${KALLETAL_LON}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FBerlin`;
      const res = await fetch(url);
      const data = await res.json();
      const cur = data.current;
      const label = WEATHER_CODES[cur.weather_code] || "—";
      const maxT = data.daily?.temperature_2m_max?.[0];
      const minT = data.daily?.temperature_2m_min?.[0];
      const wind = cur.wind_speed_10m;
      const gusts = cur.wind_gusts_10m ?? wind;

      // Wakeboard-Ampel: grün = ruhig, gelb = spürbar, rot = zu böig fürs Kabelpark-Fahren.
      let ampelColor = "green", ampelText = "🟢 Gute Bedingungen zum Fahren";
      if (gusts >= 32 || wind >= 24) { ampelColor = "red"; ampelText = "🔴 Zu böig — lieber pausieren"; }
      else if (gusts >= 20 || wind >= 14) { ampelColor = "yellow"; ampelText = "🟡 Spürbarer Wind — mit Vorsicht fahren"; }

      el.innerHTML = `
        <div class="weather-main">${label}</div>
        <div class="weather-temp">${Math.round(cur.temperature_2m)}°C</div>
        <div class="weather-meta">Wind: ${Math.round(wind)} km/h · Böen: ${Math.round(gusts)} km/h</div>
        <div class="weather-meta">Heute: ${Math.round(minT)}° / ${Math.round(maxT)}°C</div>
        <div class="wakeboard-ampel wakeboard-ampel-${ampelColor}">${ampelText}</div>
      `;
    } catch (_) {
      el.innerHTML = '<p class="empty-hint">Wetterdaten aktuell nicht erreichbar (Internetverbindung prüfen).</p>';
    }
  }
  loadWeather();
  setInterval(loadWeather, 15 * 60 * 1000);

  /* =========================================================
     WAKEBOARD TRICK-FORTSCHRITTS-CHECKLISTE
     ========================================================= */
  const TRICKS = [
    { name: "Toeside Grundstellung", level: "Anfänger" },
    { name: "Heelside Grundstellung", level: "Anfänger" },
    { name: "Ollie", level: "Anfänger" },
    { name: "Surface 180", level: "Anfänger" },
    { name: "Wake Jump", level: "Anfänger" },
    { name: "Surface 360", level: "Fortgeschritten" },
    { name: "Toeside Backroll", level: "Fortgeschritten" },
    { name: "Heelside Backroll", level: "Fortgeschritten" },
    { name: "Raley", level: "Fortgeschritten" },
    { name: "Tantrum", level: "Fortgeschritten" },
    { name: "Frontroll", level: "Fortgeschritten" },
    { name: "S-Bend", level: "Profi" },
    { name: "Krypt", level: "Profi" },
    { name: "KGB", level: "Profi" },
    { name: "Double Backroll", level: "Profi" }
  ];
  const TRICK_KEY = "jarvisTrickProgress";
  const loadTrickProgress = () => { try { return JSON.parse(localStorage.getItem(TRICK_KEY)) || {}; } catch (_) { return {}; } };
  const saveTrickProgress = (p) => localStorage.setItem(TRICK_KEY, JSON.stringify(p));

  function renderTricks() {
    const el = $("trickChecklist");
    if (!el) return;
    const progress = loadTrickProgress();
    const byLevel = {};
    TRICKS.forEach(t => { (byLevel[t.level] = byLevel[t.level] || []).push(t); });
    el.innerHTML = Object.entries(byLevel).map(([level, tricks]) => `
      <div class="trick-level-group">
        <h3 class="trick-level-title">${level}</h3>
        ${tricks.map(t => `
          <label class="trick-item">
            <input type="checkbox" data-trick="${t.name}" ${progress[t.name] ? "checked" : ""}>
            <span>${t.name}</span>
          </label>
        `).join("")}
      </div>
    `).join("");
  }
  $("trickChecklist")?.addEventListener("change", (e) => {
    const cb = e.target.closest("[data-trick]");
    if (!cb) return;
    const progress = loadTrickProgress();
    progress[cb.dataset.trick] = cb.checked;
    saveTrickProgress(progress);
  });
  renderTricks();
})();

/* =========================================================
   REFERATE-TIMER
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  let talkRemaining = 5 * 60;
  let talkTotal = 5 * 60;
  let talkWarnAt = 60;
  let talkWarned = false;
  let talkRunning = false;
  let talkInterval = null;

  function talkFormat(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }
  function talkRender() {
    const el = $("talkTime");
    if (!el) return;
    el.textContent = talkFormat(Math.max(0, talkRemaining));
    el.classList.toggle("talk-warn", talkRemaining <= talkWarnAt && talkRemaining > 0);
    el.classList.toggle("talk-over", talkRemaining <= 0);
  }
  function talkTick() {
    talkRemaining--;
    if (talkRemaining === talkWarnAt && !talkWarned) {
      talkWarned = true;
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Referate-Timer", { body: `Noch ${talkWarnAt} Sekunden!` });
      }
    }
    if (talkRemaining <= 0) {
      talkRemaining = 0;
      talkRunning = false;
      clearInterval(talkInterval);
    }
    talkRender();
  }
  $("talkStartBtn")?.addEventListener("click", () => {
    if (talkRunning) return;
    talkTotal = Math.max(1, Number($("talkMinutes")?.value || 5)) * 60;
    talkWarnAt = Math.max(0, Number($("talkWarnMinutes")?.value || 1)) * 60;
    if (talkRemaining <= 0 || talkRemaining > talkTotal) talkRemaining = talkTotal;
    talkWarned = talkRemaining <= talkWarnAt;
    talkRunning = true;
    talkInterval = setInterval(talkTick, 1000);
  });
  $("talkPauseBtn")?.addEventListener("click", () => {
    talkRunning = false;
    clearInterval(talkInterval);
  });
  $("talkResetBtn")?.addEventListener("click", () => {
    talkRunning = false;
    clearInterval(talkInterval);
    talkTotal = Math.max(1, Number($("talkMinutes")?.value || 5)) * 60;
    talkRemaining = talkTotal;
    talkWarned = false;
    talkRender();
  });
  talkRender();
})();

/* =========================================================
   FACH-STATISTIK (Pomodoro-Runden pro Fach)
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const SUBJECT_KEY = "jarvis_subjects";
  const STATS_KEY = "jarvisSubjectPomodoroStats";
  const loadSubjects = () => { try { return JSON.parse(localStorage.getItem(SUBJECT_KEY)) || []; } catch (_) { return []; } };
  const loadStats = () => { try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; } catch (_) { return {}; } };
  const saveStats = (s) => localStorage.setItem(STATS_KEY, JSON.stringify(s));

  function populateSubjectSelect() {
    const select = $("pomoSubjectSelect");
    if (!select) return;
    const subjects = loadSubjects();
    const current = select.value;
    select.innerHTML = '<option value="">Kein Fach zugeordnet</option>' +
      subjects.map(s => `<option value="${(s.name || s).toString().replace(/"/g, "&quot;")}">${s.name || s}</option>`).join("");
    if (current) select.value = current;
  }
  populateSubjectSelect();
  setInterval(populateSubjectSelect, 20000);

  function renderSubjectStats() {
    const el = $("subjectStatsList");
    if (!el) return;
    const stats = loadStats();
    const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    el.innerHTML = entries.length
      ? entries.map(([subject, rounds]) => `<div class="list-item"><div><strong>${subject}</strong> — ${rounds} Runde(n)</div></div>`).join("")
      : '<div class="empty-hint">Noch keine Pomodoro-Runden einem Fach zugeordnet.</div>';
  }
  renderSubjectStats();

  // Hört auf abgeschlossene Pomodoro-Runden (siehe POMODORO-Modul) via
  // CustomEvent, damit beide Module unabhängig bleiben.
  document.addEventListener("jarvis:pomodoro-round-complete", () => {
    const select = $("pomoSubjectSelect");
    const subject = select?.value;
    if (!subject) return;
    const stats = loadStats();
    stats[subject] = (stats[subject] || 0) + 1;
    saveStats(stats);
    renderSubjectStats();
  });
})();

/* =========================================================
   KALENDER-EXPORT (.ics)
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const loadJSON = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (_) { return []; } };

  function icsDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  }
  function icsEscape(s) {
    return String(s || "").replace(/[\\,;]/g, m => "\\" + m);
  }

  $("icsExportBtn")?.addEventListener("click", () => {
    const homework = loadJSON("jarvis_homework");
    const exams = loadJSON("jarvis_exams");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//JARVIS//Schulplaner//DE"
    ];
    homework.forEach(h => {
      const d = icsDate(h.dueDate);
      if (!d || h.completed) return;
      lines.push(
        "BEGIN:VEVENT",
        `UID:hw-${h.id}@jarvis`,
        `DTSTART;VALUE=DATE:${d}`,
        `SUMMARY:Hausaufgabe: ${icsEscape(h.title)}`,
        `DESCRIPTION:${icsEscape(h.subject || "")}`,
        "END:VEVENT"
      );
    });
    exams.forEach(ex => {
      const d = icsDate(ex.date);
      if (!d) return;
      lines.push(
        "BEGIN:VEVENT",
        `UID:exam-${ex.id}@jarvis`,
        `DTSTART;VALUE=DATE:${d}`,
        `SUMMARY:Klassenarbeit: ${icsEscape(ex.title)}`,
        `DESCRIPTION:${icsEscape(ex.subject || "")}`,
        "END:VEVENT"
      );
    });
    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jarvis-schulplaner.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
})();

/* =========================================================
   EIGENE FORMELN (erweitert die Formelsammlung)
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const CUSTOM_FORMULA_KEY = "jarvisCustomFormulas";
  const loadCustom = () => { try { return JSON.parse(localStorage.getItem(CUSTOM_FORMULA_KEY)) || []; } catch (_) { return []; } };
  const saveCustom = (list) => localStorage.setItem(CUSTOM_FORMULA_KEY, JSON.stringify(list));

  $("formulaAddBtn")?.addEventListener("click", () => {
    const title = $("formulaTitleInput")?.value.trim();
    const formula = $("formulaEqInput")?.value.trim();
    if (!title || !formula) return;
    const list = loadCustom();
    list.push({ title, formula, tags: title.toLowerCase() });
    saveCustom(list);
    if ($("formulaTitleInput")) $("formulaTitleInput").value = "";
    if ($("formulaEqInput")) $("formulaEqInput").value = "";
    // Signalisiert dem Formelsammlung-Modul, neu zu rendern.
    document.dispatchEvent(new CustomEvent("jarvis:custom-formula-added"));
  });

  window.getCustomFormulas = loadCustom;
  // Direkt beim Laden einmal Bescheid geben, falls schon eigene Formeln
  // gespeichert sind (die Formelsammlung rendert sich dann neu).
  document.dispatchEvent(new CustomEvent("jarvis:custom-formula-added"));
})();

/* =========================================================
   ACHIEVEMENTS (fasst Fortschritt aus Schule/Spielen/Hacking zusammen)
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const safeGet = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } };

  function countPomodoroRoundsTotal() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("jarvisPomodoroRounds:")) {
        total += Number(localStorage.getItem(key)) || 0;
      }
    }
    return total;
  }

  function getAchievements() {
    const grades = safeGet("jarvisGrades", []);
    const wb = safeGet("jarvisWakeboardLog", []);
    const cali = safeGet("jarvisCalisthenicsLog", []);
    const tricks = safeGet("jarvisTrickProgress", {});
    const highscores = safeGet("jarvisGameHighscores", {});
    const pomodoroRounds = countPomodoroRoundsTotal();
    const tricksDone = Object.values(tricks).filter(Boolean).length;
    const gamesPlayed = Object.keys(highscores).length;
    const konami = safeGet("jarvisKonamiUnlocked", false);

    return [
      { icon: "🍅", name: "Fokus-Anfänger", desc: "1 Pomodoro-Runde abgeschlossen", done: pomodoroRounds >= 1 },
      { icon: "🍅", name: "Fokus-Profi", desc: "10 Pomodoro-Runden abgeschlossen", done: pomodoroRounds >= 10 },
      { icon: "📊", name: "Erste Note", desc: "Erste Note im Notenrechner eingetragen", done: grades.length >= 1 },
      { icon: "🏄", name: "Erste Session", desc: "Erste Wakeboard-Session geloggt", done: wb.length >= 1 },
      { icon: "🏄", name: "Wasserratte", desc: "5 Wakeboard-Sessions geloggt", done: wb.length >= 5 },
      { icon: "🤸", name: "Erstes Workout", desc: "Erstes Calisthenics-Workout geloggt", done: cali.length >= 1 },
      { icon: "🎯", name: "Trick-Sammler", desc: "5 Wakeboard-Tricks abgehakt", done: tricksDone >= 5 },
      { icon: "🎯", name: "Trick-Meister", desc: "Alle Wakeboard-Tricks abgehakt", done: tricksDone >= 15 },
      { icon: "🎮", name: "Spieleentdecker", desc: "In 3 verschiedenen Spielen einen Highscore erzielt", done: gamesPlayed >= 3 },
      { icon: "🎮", name: "Spiele-Allrounder", desc: "In allen Spielen einen Highscore erzielt", done: gamesPlayed >= 10 },
      { icon: "🕹️", name: "Geheimcode", desc: "??? — manche Dinge muss man selbst herausfinden", done: konami },
    ];
  }

  window.getJarvisAchievements = getAchievements;

  function renderAchievements() {
    const el = $("achievementList");
    if (!el) return;
    const items = getAchievements();
    const doneCount = items.filter(i => i.done).length;
    el.innerHTML = `<p class="pomo-hint">${doneCount} / ${items.length} freigeschaltet</p>` +
      items.map(a => `<div class="achievement-item ${a.done ? "achievement-done" : ""}">
        <span class="achievement-icon">${a.icon}</span>
        <div>
          <div class="achievement-name">${a.name}</div>
          <div class="achievement-desc">${a.desc}</div>
        </div>
        ${a.done ? '<span class="achievement-check">✓</span>' : ""}
      </div>`).join("");
  }
  renderAchievements();
  setInterval(renderAchievements, 10000);
})();

/* =========================================================
   BACKUP / WIEDERHERSTELLEN (kompletter Zustand als JSON)
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);

  $("backupExportBtn")?.addEventListener("click", () => {
    const dump = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      dump[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jarvis-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    const status = $("backupStatus");
    if (status) status.textContent = "Backup heruntergeladen.";
  });

  $("backupImportBtn")?.addEventListener("click", () => {
    $("backupFileInput")?.click();
  });

  $("backupFileInput")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        const status = $("backupStatus");
        if (status) status.textContent = "Backup importiert — Seite wird neu geladen...";
        setTimeout(() => location.reload(), 1200);
      } catch (_) {
        const status = $("backupStatus");
        if (status) status.textContent = "Fehler: Datei ist kein gültiges JARVIS-Backup.";
      }
    };
    reader.readAsText(file);
  });
})();

/* =========================================================
   FREIZEIT-MODUS: Tab-Navigation
   ========================================================= */
(() => {
  "use strict";
  document.getElementById("leisure-exit-btn")?.addEventListener("click", () => {
    document.getElementById("schoolModeBtn")?.click();
  });
  const tabs = document.querySelectorAll(".leisure-tab");
  const grids = document.querySelectorAll(".leisure-grid");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.leisureTab;
      grids.forEach(g => g.classList.toggle("hidden", g.dataset.leisureCategory !== target));
    });
  });
})();

/* =========================================================
   ZOCKEN: Backlog, Spielzeit-Log, Trophäen, Release-Countdown,
   Squad-Planer, Random-Picker
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const store = (key) => ({
    load: () => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (_) { return []; } },
    save: (v) => localStorage.setItem(key, JSON.stringify(v))
  });

  /* ---- Backlog ---- */
  const backlogStore = store("jarvisGameBacklog");
  function renderBacklog() {
    const list = $("backlogList");
    if (!list) return;
    const items = backlogStore.load();
    list.innerHTML = items.length
      ? items.map((g, i) => `<div class="list-item">
          <div><strong>${esc(g.title)}</strong> — ${esc(g.status)}</div>
          <button class="list-item-remove" data-backlog-remove="${i}" type="button">×</button>
        </div>`).join("")
      : '<div class="empty-hint">Noch keine Spiele im Backlog.</div>';
  }
  $("backlogAddBtn")?.addEventListener("click", () => {
    const title = $("backlogTitle")?.value.trim();
    const status = $("backlogStatus")?.value || "Warteliste";
    if (!title) return;
    const items = backlogStore.load();
    items.push({ title, status });
    backlogStore.save(items);
    if ($("backlogTitle")) $("backlogTitle").value = "";
    renderBacklog();
  });
  $("backlogList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-backlog-remove]");
    if (!btn) return;
    const items = backlogStore.load();
    items.splice(Number(btn.dataset.backlogRemove), 1);
    backlogStore.save(items);
    renderBacklog();
  });
  renderBacklog();

  /* ---- Spielzeit-Log ---- */
  const sessionStore = store("jarvisGameSessions");
  function renderSessions() {
    const list = $("sessionList");
    const stat = $("sessionWeekStat");
    if (!list) return;
    const items = sessionStore.load();
    list.innerHTML = items.length
      ? items.slice().reverse().map((s, revIdx) => {
          const idx = items.length - 1 - revIdx;
          return `<div class="list-item">
            <div><strong>${esc(s.game)}</strong> — ${esc(s.minutes)} min</div>
            <div class="list-item-meta">${esc(s.date)}</div>
            <button class="list-item-remove" data-session-remove="${idx}" type="button">×</button>
          </div>`;
        }).join("")
      : '<div class="empty-hint">Noch keine Sessions geloggt.</div>';
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekTotal = items
      .filter(s => new Date(s.isoDate || s.date) >= weekAgo)
      .reduce((sum, s) => sum + Number(s.minutes || 0), 0);
    if (stat) stat.textContent = `Diese Woche: ${weekTotal} Minuten`;
  }
  $("sessionAddBtn")?.addEventListener("click", () => {
    const game = $("sessionGame")?.value.trim();
    const minutes = $("sessionMinutes")?.value.trim();
    if (!game || !minutes) return;
    const items = sessionStore.load();
    const now = new Date();
    items.push({ game, minutes, isoDate: now.toISOString(), date: now.toLocaleDateString("de-DE") });
    sessionStore.save(items);
    if ($("sessionGame")) $("sessionGame").value = "";
    if ($("sessionMinutes")) $("sessionMinutes").value = "";
    renderSessions();
  });
  $("sessionList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-session-remove]");
    if (!btn) return;
    const items = sessionStore.load();
    items.splice(Number(btn.dataset.sessionRemove), 1);
    sessionStore.save(items);
    renderSessions();
  });
  renderSessions();

  /* ---- Trophäen-Tracker ---- */
  const trophyStore = store("jarvisGameTrophies");
  function renderTrophies() {
    const list = $("trophyList");
    if (!list) return;
    const items = trophyStore.load();
    list.innerHTML = items.length
      ? items.map((t, i) => `<div class="list-item">
          <div><strong>${esc(t.trophy)}</strong> — ${esc(t.game)}</div>
          <button class="list-item-remove" data-trophy-remove="${i}" type="button">×</button>
        </div>`).join("")
      : '<div class="empty-hint">Noch keine Trophäen eingetragen.</div>';
  }
  $("trophyAddBtn")?.addEventListener("click", () => {
    const game = $("trophyGame")?.value.trim();
    const trophy = $("trophyName")?.value.trim();
    if (!game || !trophy) return;
    const items = trophyStore.load();
    items.push({ game, trophy });
    trophyStore.save(items);
    if ($("trophyGame")) $("trophyGame").value = "";
    if ($("trophyName")) $("trophyName").value = "";
    renderTrophies();
  });
  $("trophyList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-trophy-remove]");
    if (!btn) return;
    const items = trophyStore.load();
    items.splice(Number(btn.dataset.trophyRemove), 1);
    trophyStore.save(items);
    renderTrophies();
  });
  renderTrophies();

  /* ---- Release-Countdown ---- */
  const releaseStore = store("jarvisGameReleases");
  function renderReleases() {
    const list = $("releaseList");
    if (!list) return;
    const items = releaseStore.load();
    const now = new Date(); now.setHours(0,0,0,0);
    const withDays = items.map((r, i) => ({
      ...r, i, days: Math.ceil((new Date(r.date) - now) / (1000 * 60 * 60 * 24))
    })).sort((a, b) => a.days - b.days);
    list.innerHTML = withDays.length
      ? withDays.map(r => `<div class="list-item">
          <div><strong>${esc(r.title)}</strong> — ${r.days >= 0 ? r.days + " Tag(e)" : "erschienen"}</div>
          <button class="list-item-remove" data-release-remove="${r.i}" type="button">×</button>
        </div>`).join("")
      : '<div class="empty-hint">Keine Release-Termine eingetragen.</div>';
  }
  $("releaseAddBtn")?.addEventListener("click", () => {
    const title = $("releaseTitle")?.value.trim();
    const date = $("releaseDate")?.value;
    if (!title || !date) return;
    const items = releaseStore.load();
    items.push({ title, date });
    releaseStore.save(items);
    if ($("releaseTitle")) $("releaseTitle").value = "";
    if ($("releaseDate")) $("releaseDate").value = "";
    renderReleases();
  });
  $("releaseList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-release-remove]");
    if (!btn) return;
    const items = releaseStore.load();
    items.splice(Number(btn.dataset.releaseRemove), 1);
    releaseStore.save(items);
    renderReleases();
  });
  renderReleases();

  /* ---- Squad-Planer ---- */
  const squadStore = store("jarvisSquadPlans");
  function renderSquad() {
    const list = $("squadList");
    if (!list) return;
    const items = squadStore.load();
    list.innerHTML = items.length
      ? items.map((s, i) => `<div class="list-item">
          <div>${esc(s)}</div>
          <button class="list-item-remove" data-squad-remove="${i}" type="button">×</button>
        </div>`).join("")
      : '<div class="empty-hint">Noch nichts geplant.</div>';
  }
  $("squadAddBtn")?.addEventListener("click", () => {
    const note = $("squadNote")?.value.trim();
    if (!note) return;
    const items = squadStore.load();
    items.push(note);
    squadStore.save(items);
    if ($("squadNote")) $("squadNote").value = "";
    renderSquad();
  });
  $("squadList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-squad-remove]");
    if (!btn) return;
    const items = squadStore.load();
    items.splice(Number(btn.dataset.squadRemove), 1);
    squadStore.save(items);
    renderSquad();
  });
  renderSquad();

  /* ---- Random Game Picker ---- */
  $("randomGameBtn")?.addEventListener("click", () => {
    const items = backlogStore.load().filter(g => g.status === "Warteliste");
    const resultEl = $("randomGameResult");
    if (!items.length) {
      if (resultEl) resultEl.textContent = "Keine Spiele auf der Warteliste — trag welche im Backlog ein!";
      return;
    }
    const pick = items[Math.floor(Math.random() * items.length)];
    if (resultEl) resultEl.textContent = `🎮 Heute: ${pick.title}`;
  });
})();

/* =========================================================
   SCHLAGZEUG: Metronom, Übungs-Log, Rudiments,
   Rhythmus-Trainer, Song-Wunschliste
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const store = (key) => ({
    load: () => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (_) { return []; } },
    save: (v) => localStorage.setItem(key, JSON.stringify(v))
  });

  /* ---- Metronom ---- */
  let metroAudioCtx = null;
  let metroTimer = null;
  let metroBeatCount = 0;
  let metroBpm = 100;
  let metroBeatsPerBar = 4;
  let metroOnBeatCallback = null;
  window.setMetroBeatCallback = (fn) => { metroOnBeatCallback = fn; };

  function metroClick(accent) {
    if (!metroAudioCtx) metroAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const vol = (window.getJarvisVolume ? window.getJarvisVolume() : 1) * 0.35;
    const osc = metroAudioCtx.createOscillator();
    const gain = metroAudioCtx.createGain();
    osc.frequency.value = accent ? 1400 : 900;
    gain.gain.setValueAtTime(vol, metroAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, metroAudioCtx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(metroAudioCtx.destination);
    osc.start();
    osc.stop(metroAudioCtx.currentTime + 0.08);

    const dot = $("metroDot");
    if (dot) {
      dot.className = "metro-dot " + (accent ? "metro-accent" : "metro-active");
      setTimeout(() => { dot.className = "metro-dot"; }, 90);
    }
  }

  function metroStart() {
    metroStop();
    metroBeatCount = 0;
    const interval = 60000 / metroBpm;
    metroClick(true);
    metroOnBeatCallback?.(true);
    metroBeatCount = 1;
    metroTimer = setInterval(() => {
      const isAccent = metroBeatCount % metroBeatsPerBar === 0;
      metroClick(isAccent);
      metroOnBeatCallback?.(isAccent);
      metroBeatCount++;
    }, interval);
  }
  function metroStop() {
    clearInterval(metroTimer);
    metroTimer = null;
  }

  $("metroBpmSlider")?.addEventListener("input", (e) => {
    metroBpm = Number(e.target.value);
    if ($("metroBpmValue")) $("metroBpmValue").textContent = metroBpm;
    if (metroTimer) metroStart();
  });
  $("metroBeats")?.addEventListener("change", (e) => {
    metroBeatsPerBar = Number(e.target.value);
  });
  $("metroStartBtn")?.addEventListener("click", metroStart);
  $("metroStopBtn")?.addEventListener("click", metroStop);

  // Von RUDIMENTS-TRAINER aufrufbar, um das empfohlene Tempo zu übernehmen.
  window.setMetronomeBpm = (bpm) => {
    metroBpm = bpm;
    const slider = $("metroBpmSlider");
    if (slider) slider.value = bpm;
    if ($("metroBpmValue")) $("metroBpmValue").textContent = bpm;
  };

  /* ---- Übungs-Log ---- */
  const practiceStore = store("jarvisDrumPractice");
  function renderPractice() {
    const list = $("drumPracticeList");
    if (!list) return;
    const items = practiceStore.load();
    list.innerHTML = items.length
      ? items.slice().reverse().map((p, revIdx) => {
          const idx = items.length - 1 - revIdx;
          return `<div class="list-item">
            <div><strong>${esc(p.name)}</strong> — ${esc(p.minutes)} min</div>
            <div class="list-item-meta">${esc(p.date)}</div>
            <button class="list-item-remove" data-practice-remove="${idx}" type="button">×</button>
          </div>`;
        }).join("")
      : '<div class="empty-hint">Noch nichts geübt.</div>';
  }
  $("drumPracticeAddBtn")?.addEventListener("click", () => {
    const name = $("drumPracticeName")?.value.trim();
    const minutes = $("drumPracticeMinutes")?.value.trim();
    if (!name || !minutes) return;
    const items = practiceStore.load();
    items.push({ name, minutes, date: new Date().toLocaleDateString("de-DE") });
    practiceStore.save(items);
    if ($("drumPracticeName")) $("drumPracticeName").value = "";
    if ($("drumPracticeMinutes")) $("drumPracticeMinutes").value = "";
    renderPractice();
  });
  $("drumPracticeList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-practice-remove]");
    if (!btn) return;
    const items = practiceStore.load();
    items.splice(Number(btn.dataset.practiceRemove), 1);
    practiceStore.save(items);
    renderPractice();
  });
  renderPractice();

  /* ---- Rudiments-Trainer ---- */
  const RUDIMENTS = [
    { name: "Single Stroke Roll", desc: "R L R L R L R L", bpm: 120 },
    { name: "Double Stroke Roll", desc: "R R L L R R L L", bpm: 110 },
    { name: "Single Paradiddle", desc: "R L R R L R L L", bpm: 100 },
    { name: "Double Paradiddle", desc: "R L R L R R L R L R L L", bpm: 100 },
    { name: "Triple Paradiddle", desc: "RLRLRLRR LRLRLRLL", bpm: 95 },
    { name: "Paradiddle-Diddle", desc: "R L R R L L", bpm: 100 },
    { name: "Single Ratamacue", desc: "R L R L R R", bpm: 90 },
    { name: "Double Ratamacue", desc: "R L R L R L R R", bpm: 85 },
    { name: "Triple Ratamacue", desc: "R L R L R L R L R R", bpm: 80 },
    { name: "Multiple Bounce Roll", desc: "Buzz / Press Roll", bpm: 100 },
    { name: "Triple Stroke Roll", desc: "R R R L L L", bpm: 105 },
    { name: "Five Stroke Roll", desc: "R R L L R", bpm: 110 },
    { name: "Six Stroke Roll", desc: "R L L R R L", bpm: 100 },
    { name: "Seven Stroke Roll", desc: "R R L L R R L", bpm: 100 },
    { name: "Nine Stroke Roll", desc: "R R L L R R L L R", bpm: 95 },
    { name: "Ten Stroke Roll", desc: "R R L L R R L L R L", bpm: 95 },
    { name: "Eleven Stroke Roll", desc: "9x Alternierend + R L R", bpm: 90 },
    { name: "Thirteen Stroke Roll", desc: "Alternierend + Doppelschlag", bpm: 90 },
    { name: "Fifteen Stroke Roll", desc: "Alternierend + Doppelschlag", bpm: 85 },
    { name: "Seventeen Stroke Roll", desc: "Alternierend + Doppelschlag", bpm: 85 },
    { name: "Single Flam", desc: "lR / rL Grace Note", bpm: 90 },
    { name: "Flam Accent", desc: "lR L R", bpm: 90 },
    { name: "Flam Tap", desc: "lR R rL L", bpm: 95 },
    { name: "Flamacue", desc: "lR L R L rL", bpm: 85 },
    { name: "Flam Paradiddle", desc: "lR L R R L R L L", bpm: 90 },
    { name: "Single Drag Tap", desc: "rrL R", bpm: 90 },
    { name: "Double Drag Tap", desc: "rrL rrL R", bpm: 85 },
    { name: "Lesson 25 (Drag Paradiddle #1)", desc: "rrL R L R R", bpm: 85 },
    { name: "Single Dragadiddle", desc: "rrL L R L L", bpm: 85 },
    { name: "Drag", desc: "rrL", bpm: 100 },
    { name: "Single Paradiddle-Diddle", desc: "R L R R L L", bpm: 95 },
    { name: "Inverted Flam Tap", desc: "lR L rL R", bpm: 90 }
  ];
  function renderRudiments(filter) {
    const list = $("rudimentList");
    if (!list) return;
    const q = (filter || "").toLowerCase().trim();
    const items = RUDIMENTS.filter(r => !q || r.name.toLowerCase().includes(q));
    list.innerHTML = items.map(r => `<div class="rudiment-card" data-rudiment-bpm="${r.bpm}">
      <div class="rudiment-name">${esc(r.name)}</div>
      <div class="rudiment-desc">${esc(r.desc)}</div>
      <div class="rudiment-bpm">Ziel: ${r.bpm} BPM · Klicken zum Laden</div>
    </div>`).join("");
  }
  $("rudimentSearch")?.addEventListener("input", (e) => renderRudiments(e.target.value));
  $("rudimentList")?.addEventListener("click", (e) => {
    const card = e.target.closest("[data-rudiment-bpm]");
    if (!card) return;
    window.setMetronomeBpm?.(Number(card.dataset.rudimentBpm));
  });
  renderRudiments("");

  /* ---- Rhythmus-Trainer ---- */
  let rhythmAudioCtx = null;
  let rhythmTimer = null;
  let rhythmLastBeatTime = 0;
  let rhythmTapTimes = [];

  function rhythmClick() {
    if (!rhythmAudioCtx) rhythmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const vol = (window.getJarvisVolume ? window.getJarvisVolume() : 1) * 0.3;
    const osc = rhythmAudioCtx.createOscillator();
    const gain = rhythmAudioCtx.createGain();
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(vol, rhythmAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, rhythmAudioCtx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(rhythmAudioCtx.destination);
    osc.start();
    osc.stop(rhythmAudioCtx.currentTime + 0.06);
  }

  $("rhythmStartBtn")?.addEventListener("click", () => {
    clearInterval(rhythmTimer);
    rhythmTapTimes = [];
    const noteValue = Number($("rhythmNoteValue")?.value || 1);
    const bpm = 90;
    const interval = (60000 / bpm) * noteValue;
    rhythmLastBeatTime = performance.now();
    rhythmClick();
    rhythmTimer = setInterval(() => {
      rhythmLastBeatTime = performance.now();
      rhythmClick();
    }, interval);
    if ($("rhythmStatus")) $("rhythmStatus").textContent = "Läuft — tippe im Takt auf 'Tap'.";
  });
  $("rhythmTapBtn")?.addEventListener("click", () => {
    if (!rhythmTimer) return;
    const now = performance.now();
    const diff = Math.abs(now - rhythmLastBeatTime);
    rhythmTapTimes.push(diff);
    const avg = rhythmTapTimes.reduce((a, b) => a + b, 0) / rhythmTapTimes.length;
    if ($("rhythmStatus")) {
      $("rhythmStatus").textContent = `Abweichung: ${Math.round(diff)} ms · Durchschnitt: ${Math.round(avg)} ms`;
    }
  });

  /* ---- Song-Wunschliste ---- */
  const songWishStore = store("jarvisSongWishlist");
  function renderSongWish() {
    const list = $("songWishList");
    if (!list) return;
    const items = songWishStore.load();
    list.innerHTML = items.length
      ? items.map((s, i) => `<div class="list-item">
          <div><strong>${esc(s.title)}</strong> — ${esc(s.difficulty)}</div>
          <button class="list-item-remove" data-songwish-remove="${i}" type="button">×</button>
        </div>`).join("")
      : '<div class="empty-hint">Noch keine Songs auf der Liste.</div>';
  }
  $("songWishAddBtn")?.addEventListener("click", () => {
    const title = $("songWishTitle")?.value.trim();
    const difficulty = $("songWishDifficulty")?.value || "Mittel";
    if (!title) return;
    const items = songWishStore.load();
    items.push({ title, difficulty });
    songWishStore.save(items);
    if ($("songWishTitle")) $("songWishTitle").value = "";
    renderSongWish();
  });
  $("songWishList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-songwish-remove]");
    if (!btn) return;
    const items = songWishStore.load();
    items.splice(Number(btn.dataset.songwishRemove), 1);
    songWishStore.save(items);
    renderSongWish();
  });
  renderSongWish();
})();

/* =========================================================
   SCHLAGZEUG PLAY-ALONG (Metronom folgt Songstruktur)
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const PA_KEY = "jarvisPlayAlongStructure";
  const loadSections = () => { try { return JSON.parse(localStorage.getItem(PA_KEY)) || []; } catch (_) { return []; } };
  const saveSections = (s) => localStorage.setItem(PA_KEY, JSON.stringify(s));

  let paActive = false;
  let paSectionIdx = 0;
  let paBarInSection = 0;
  let paBeatInBar = 0;

  function renderSections() {
    const list = $("paSectionList");
    if (!list) return;
    const sections = loadSections();
    list.innerHTML = sections.length
      ? sections.map((s, i) => `<div class="list-item">
          <div><strong>${esc(s.name)}</strong> — ${esc(s.bars)} Takte</div>
          <button class="list-item-remove" data-pa-remove="${i}" type="button">×</button>
        </div>`).join("")
      : '<div class="empty-hint">Noch keine Abschnitte — z. B. Intro, Strophe, Refrain hinzufügen.</div>';
  }
  $("paAddSectionBtn")?.addEventListener("click", () => {
    const name = $("paSectionName")?.value.trim();
    const bars = Number($("paSectionBars")?.value);
    if (!name || !bars || bars < 1) return;
    const sections = loadSections();
    sections.push({ name, bars });
    saveSections(sections);
    if ($("paSectionName")) $("paSectionName").value = "";
    if ($("paSectionBars")) $("paSectionBars").value = "4";
    renderSections();
  });
  $("paSectionList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pa-remove]");
    if (!btn) return;
    const sections = loadSections();
    sections.splice(Number(btn.dataset.paRemove), 1);
    saveSections(sections);
    renderSections();
  });
  renderSections();

  function updateDisplay() {
    const sections = loadSections();
    const curEl = $("paCurrentSection");
    const barsEl = $("paBarCounter");
    if (!sections.length) {
      if (curEl) curEl.textContent = "Keine Struktur angelegt";
      if (barsEl) barsEl.textContent = "Takt — / —";
      return;
    }
    const section = sections[paSectionIdx];
    if (curEl) curEl.textContent = paActive ? section.name : "Bereit";
    if (barsEl) barsEl.textContent = `Takt ${paBarInSection + 1} / ${section.bars}`;
  }

  function onBeat(isBarStart) {
    if (!paActive) return;
    const sections = loadSections();
    if (!sections.length) return;
    if (isBarStart) {
      paBarInSection++;
      const section = sections[paSectionIdx];
      if (paBarInSection >= section.bars) {
        paBarInSection = 0;
        paSectionIdx = (paSectionIdx + 1) % sections.length;
      }
      updateDisplay();
    }
  }

  $("paStartBtn")?.addEventListener("click", () => {
    const sections = loadSections();
    if (!sections.length) {
      const curEl = $("paCurrentSection");
      if (curEl) curEl.textContent = "Bitte zuerst Abschnitte hinzufügen.";
      return;
    }
    paActive = true;
    paSectionIdx = 0;
    paBarInSection = -1; // erster Beat zählt als Takt 1
    window.setMetroBeatCallback?.(onBeat);
    document.getElementById("metroStartBtn")?.click();
    updateDisplay();
  });
  $("paStopBtn")?.addEventListener("click", () => {
    paActive = false;
    window.setMetroBeatCallback?.(null);
    document.getElementById("metroStopBtn")?.click();
    updateDisplay();
  });

  updateDisplay();
})();

/* =========================================================
   ZENTRALES EINSTELLUNGSMENÜ (Lautstärke, Theme, PWA)
   In allen Modi über den ⚙-Button erreichbar.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const SETTINGS_KEY = "jarvisSettings";

  function loadSettings() {
    try {
      return Object.assign({ volume: 1, theme: "blue" }, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {});
    } catch (_) {
      return { volume: 1, theme: "blue" };
    }
  }
  function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  let settings = loadSettings();

  // Global abrufbar für alle Sound-erzeugenden Module (Metronom, Rhythmus-Trainer, ...).
  window.getJarvisVolume = () => settings.volume;

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
  }

  function renderSettingsUI() {
    const volSlider = $("settingsVolume");
    const volValue = $("settingsVolumeValue");
    if (volSlider) volSlider.value = String(Math.round(settings.volume * 100));
    if (volValue) volValue.textContent = `${Math.round(settings.volume * 100)}%`;
    document.querySelectorAll(".settings-theme-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.theme === settings.theme);
    });
  }

  applyTheme(settings.theme);
  renderSettingsUI();

  const overlay = $("settingsOverlay");
  $("settingsToggleBtn")?.addEventListener("click", () => overlay?.classList.remove("hidden"));
  $("settingsCloseBtn")?.addEventListener("click", () => overlay?.classList.add("hidden"));
  overlay?.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.add("hidden"); });

  $("settingsVolume")?.addEventListener("input", (e) => {
    settings.volume = Number(e.target.value) / 100;
    saveSettings(settings);
    renderSettingsUI();
  });

  document.querySelectorAll(".settings-theme-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      settings.theme = btn.dataset.theme;
      saveSettings(settings);
      applyTheme(settings.theme);
      renderSettingsUI();
    });
  });

  /* ---- PWA: Service Worker registrieren + Installations-Prompt ---- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {
        // Läuft z. B. von file:// ohne Serverkontext — kein Problem,
        // die App funktioniert dann einfach ohne Offline-Cache.
      });
    });
  }

  let deferredInstallPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    $("settingsInstallBtn")?.classList.remove("hidden");
    if ($("settingsPwaHint")) $("settingsPwaHint").textContent = "JARVIS kann als App installiert werden.";
  });
  $("settingsInstallBtn")?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $("settingsInstallBtn")?.classList.add("hidden");
  });
  window.addEventListener("appinstalled", () => {
    if ($("settingsPwaHint")) $("settingsPwaHint").textContent = "JARVIS ist installiert. ✓";
    $("settingsInstallBtn")?.classList.add("hidden");
  });
})();

/* =========================================================
   "HEUTE"-ÜBERSICHT + LERN-STREAK
   Fasst Hausaufgaben, Klassenarbeiten, Stundenplan und Termine
   für heute zusammen, direkt oben im Schulmodus sichtbar.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const safeGet = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } };

  /* ---- Lern-Streak ---- */
  const STREAK_KEY = "jarvisStreak";
  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function updateStreak() {
    const streak = safeGet(STREAK_KEY, { count: 0, lastDate: null });
    const today = todayISO();
    if (streak.lastDate === today) return streak; // heute schon gezählt

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    if (streak.lastDate === yISO) {
      streak.count += 1; // nahtlos weitergemacht
    } else {
      streak.count = 1; // Streak neu gestartet (oder erster Tag)
    }
    streak.lastDate = today;
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
    return streak;
  }
  function renderStreak() {
    const streak = safeGet(STREAK_KEY, { count: 0, lastDate: null });
    const el = $("todayStreak");
    if (el) el.textContent = `🔥 ${streak.count} Tag${streak.count === 1 ? "" : "e"}`;
  }

  /* ---- Heute-Übersicht ---- */
  const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  // Stundenplan nutzt Mo-Fr als Spaltenindex 0-4 (siehe STUNDENPLAN-Modul).
  const SCHEDULE_DAY_INDEX = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }; // JS getDay(): 1=Mo..5=Fr

  function renderTodayOverview() {
    const el = $("todayOverview");
    if (!el) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const homework = safeGet("jarvis_homework", []);
    const exams = safeGet("jarvis_exams", []);
    const appointments = safeGet("jarvis_appointments", []);
    const schedule = safeGet("jarvisSchedule", {});

    const dueHomework = homework.filter(h => {
      if (h.completed || !h.dueDate) return false;
      const d = new Date(h.dueDate); d.setHours(0, 0, 0, 0);
      return d.getTime() === now.getTime() || d.getTime() === tomorrow.getTime();
    });

    const soonExams = exams.filter(e => {
      const d = new Date(e.date); d.setHours(0, 0, 0, 0);
      const days = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 3;
    });

    const todayAppointments = appointments.filter(a => {
      const d = new Date(a.date); d.setHours(0, 0, 0, 0);
      return d.getTime() === now.getTime();
    });

    const dayIdx = SCHEDULE_DAY_INDEX[now.getDay()];
    const SLOTS = ["1./2. Stunde", "3./4. Stunde", "5./6. Stunde", "7./8. Stunde"];
    const todaySchedule = [];
    if (dayIdx !== undefined) {
      SLOTS.forEach((slot, r) => {
        const subject = schedule[`${r}-${dayIdx}`];
        if (subject) todaySchedule.push({ slot, subject });
      });
    }

    const sections = [];

    sections.push(`<div class="today-section">
      <h3>📚 Fällige Hausaufgaben</h3>
      ${dueHomework.length
        ? dueHomework.map(h => {
            const d = new Date(h.dueDate); d.setHours(0, 0, 0, 0);
            const when = d.getTime() === now.getTime() ? "heute" : "morgen";
            return `<div class="today-item">${esc(h.title)} ${h.subject ? "· " + esc(h.subject) : ""} <span class="today-item-when">(${when})</span></div>`;
          }).join("")
        : '<div class="today-empty">Nichts fällig — sehr gut!</div>'}
    </div>`);

    sections.push(`<div class="today-section">
      <h3>📝 Bald anstehende Klassenarbeiten</h3>
      ${soonExams.length
        ? soonExams.map(e => {
            const d = new Date(e.date); d.setHours(0, 0, 0, 0);
            const days = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
            return `<div class="today-item">${esc(e.title)} ${e.subject ? "· " + esc(e.subject) : ""} <span class="today-item-when">(${days === 0 ? "heute" : days + " Tag(e)"})</span></div>`;
          }).join("")
        : '<div class="today-empty">Keine in den nächsten 3 Tagen.</div>'}
    </div>`);

    sections.push(`<div class="today-section">
      <h3>🗓️ Heutiger Stundenplan</h3>
      ${todaySchedule.length
        ? todaySchedule.map(s => `<div class="today-item">${esc(s.slot)}: ${esc(s.subject)}</div>`).join("")
        : `<div class="today-empty">${dayIdx === undefined ? "Heute ist Wochenende." : "Nichts eingetragen — im Stundenplan-Panel ergänzen."}</div>`}
    </div>`);

    sections.push(`<div class="today-section">
      <h3>📅 Heutige Termine</h3>
      ${todayAppointments.length
        ? todayAppointments.map(a => `<div class="today-item">${esc(a.title)}</div>`).join("")
        : '<div class="today-empty">Keine Termine heute.</div>'}
    </div>`);

    el.innerHTML = `<div class="today-grid">${sections.join("")}</div>`;
  }

  updateStreak();
  renderStreak();
  renderTodayOverview();
  setInterval(renderTodayOverview, 60000);
})();

/* =========================================================
   VOKABEL CSV-IMPORT / EXPORT
   Nutzt die bestehende "vocabulary"-Datenstruktur direkt,
   damit Import/Export nahtlos mit Karteikarten & Spaced
   Repetition zusammenarbeitet.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);

  function csvEscape(val) {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function parseCsvLine(line) {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { cur += ch; }
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ",") { out.push(cur); cur = ""; }
        else cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  $("vocabExportCsvBtn")?.addEventListener("click", () => {
    if (typeof vocabulary === "undefined" || !vocabulary.length) {
      if ($("vocabCsvStatus")) $("vocabCsvStatus").textContent = "Keine Vokabeln zum Exportieren vorhanden.";
      return;
    }
    const lines = ["front,back,subject"];
    vocabulary.forEach(v => {
      lines.push([csvEscape(v.front), csvEscape(v.back), csvEscape(v.subject || "")].join(","));
    });
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jarvis-vokabeln.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if ($("vocabCsvStatus")) $("vocabCsvStatus").textContent = `${vocabulary.length} Vokabel(n) exportiert.`;
  });

  $("vocabImportCsvBtn")?.addEventListener("click", () => {
    $("vocabCsvFileInput")?.click();
  });

  $("vocabCsvFileInput")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result).replace(/^\uFEFF/, "");
        const rows = text.split(/\r?\n/).filter(r => r.trim() !== "");
        if (!rows.length) throw new Error("leer");

        // Kopfzeile erkennen (front,back,subject in beliebiger Reihenfolge) — sonst als Daten behandeln.
        let startIdx = 0;
        let colOrder = ["front", "back", "subject"];
        const firstCols = parseCsvLine(rows[0]).map(c => c.trim().toLowerCase());
        if (firstCols.includes("front") && firstCols.includes("back")) {
          colOrder = firstCols;
          startIdx = 1;
        }

        let added = 0;
        for (let i = startIdx; i < rows.length; i++) {
          const cols = parseCsvLine(rows[i]);
          const entry = {};
          colOrder.forEach((name, idx) => { entry[name] = (cols[idx] || "").trim(); });
          if (!entry.front || !entry.back) continue;

          vocabulary.push({
            id: Date.now() + added,
            front: entry.front,
            back: entry.back,
            subject: entry.subject || "",
            known: 0,
            unknown: 0,
            createdAt: new Date().toISOString()
          });
          added++;
        }

        if (added > 0) {
          saveData(STORAGE_KEYS.vocabulary, vocabulary);
          renderAll();
        }
        if ($("vocabCsvStatus")) {
          $("vocabCsvStatus").textContent = added > 0
            ? `${added} Vokabel(n) importiert.`
            : "Keine gültigen Zeilen gefunden (Format: front,back,subject).";
        }
      } catch (_) {
        if ($("vocabCsvStatus")) $("vocabCsvStatus").textContent = "Fehler beim Lesen der CSV-Datei.";
      }
      e.target.value = "";
    };
    reader.readAsText(file, "utf-8");
  });
})();

/* =========================================================
   "WAS JETZT?" — PRIORITÄTS-EMPFEHLUNG
   Berechnet aus Hausaufgaben, Klassenarbeiten & Tageszielen
   automatisch, was gerade am dringendsten ist, und startet mit
   einem Klick direkt eine passende Pomodoro-Fokus-Runde dafür.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const safeGet = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } };

  function computePriorities() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const homework = safeGet("jarvis_homework", []).filter(h => !h.completed);
    const exams = safeGet("jarvis_exams", []);
    const tasks = safeGet("jarvis_tasks", []).filter(t => !t.completed);

    const items = [];

    homework.forEach(h => {
      let score = 30; // Grundpriorität für offene Hausaufgaben
      let reason = "offene Hausaufgabe";
      if (h.dueDate) {
        const due = new Date(h.dueDate); due.setHours(0, 0, 0, 0);
        const days = Math.round((due - now) / (1000 * 60 * 60 * 24));
        if (days < 0) { score = 100; reason = `überfällig seit ${Math.abs(days)} Tag(en)`; }
        else if (days === 0) { score = 90; reason = "heute fällig"; }
        else if (days === 1) { score = 75; reason = "morgen fällig"; }
        else if (days <= 3) { score = 50; reason = `in ${days} Tagen fällig`; }
        else { score = 20; reason = `in ${days} Tagen fällig`; }
      }
      items.push({ title: h.title, subject: h.subject, score, reason, kind: "Hausaufgabe" });
    });

    exams.forEach(e => {
      const due = new Date(e.date); due.setHours(0, 0, 0, 0);
      const days = Math.round((due - now) / (1000 * 60 * 60 * 24));
      if (days < 0) return; // vorbei
      let score = 25;
      let reason = `in ${days} Tagen`;
      if (days === 0) { score = 95; reason = "heute!"; }
      else if (days === 1) { score = 85; reason = "morgen"; }
      else if (days <= 3) { score = 65; reason = `in ${days} Tagen`; }
      else if (days <= 7) { score = 40; reason = `in ${days} Tagen`; }
      items.push({ title: e.title, subject: e.subject, score, reason, kind: "Klassenarbeit — lernen für" });
    });

    tasks.forEach(t => {
      items.push({ title: t.title, subject: "", score: 15, reason: "Tagesziel", kind: "Tagesziel" });
    });

    items.sort((a, b) => b.score - a.score);
    return items;
  }

  function renderWhatNow() {
    const el = $("whatNowContent");
    if (!el) return;
    const items = computePriorities();

    if (!items.length) {
      el.innerHTML = '<div class="empty-hint">Alles erledigt — nichts Dringendes offen. 🎉</div>';
      return;
    }

    const top = items[0];
    const rest = items.slice(1, 4);

    el.innerHTML = `
      <div class="whatnow-top">
        <div class="whatnow-top-kind">${esc(top.kind)}</div>
        <div class="whatnow-top-title">${esc(top.title)}</div>
        <div class="whatnow-top-meta">${top.subject ? esc(top.subject) + " · " : ""}${esc(top.reason)}</div>
        <button id="whatNowStartBtn" class="ctrl-btn whatnow-start-btn" type="button">▶ 25-Minuten-Fokus starten</button>
      </div>
      ${rest.length ? `<div class="whatnow-rest">
        <p class="pomo-hint">Danach als Nächstes:</p>
        ${rest.map(r => `<div class="whatnow-rest-item">${esc(r.title)} <span class="today-item-when">(${esc(r.reason)})</span></div>`).join("")}
      </div>` : ""}
    `;

    $("whatNowStartBtn")?.addEventListener("click", () => {
      const select = $("pomoSubjectSelect");
      if (select && top.subject) {
        const match = [...select.options].find(o => o.value === top.subject);
        if (match) select.value = top.subject;
      }
      document.getElementById("pomoStartBtn")?.click();
      document.querySelector(".pomo-display")?.scrollIntoView({ behavior: "smooth", block: "center" });
      setJarvisMessage?.(`Fokus-Runde für "${top.title}" gestartet.`);
    });
  }

  renderWhatNow();
  setInterval(renderWhatNow, 60000);
  // Neu berechnen, sobald sich Hausaufgaben/Tasks ändern (z. B. neu hinzugefügt oder erledigt).
  document.addEventListener("jarvis:pomodoro-round-complete", renderWhatNow);
  const origRenderAll = window.renderAll;
  if (typeof origRenderAll === "function") {
    window.renderAll = function (...args) {
      const result = origRenderAll.apply(this, args);
      renderWhatNow();
      return result;
    };
  }
})();

/* =========================================================
   ÜBUNGSBLÄTTER FINDEN
   Baut gezielte Suchlinks für kostenlose PDF-Arbeitsblätter zu
   einem Thema. JARVIS sucht NICHT selbst im Internet (das kann
   eine reine Browser-App nicht) — es öffnet eine echte,
   vorgefilterte Suchergebnis-Seite in einem neuen Tab.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  function populateWorksheetSubjects() {
    const select = $("worksheetSubject");
    if (!select) return;
    const subjects = (typeof window.subjects !== "undefined" ? window.subjects : []) || [];
    const current = select.value;
    const list = (typeof subjects !== "undefined" ? subjects : []);
    select.innerHTML = '<option value="">Kein Fach</option>' +
      list.map(s => `<option value="${esc(s.name || s)}">${esc(s.name || s)}</option>`).join("");
    if (current) select.value = current;
  }
  populateWorksheetSubjects();
  setInterval(populateWorksheetSubjects, 20000);

  function buildSearchUrl(engine, query) {
    const q = encodeURIComponent(query);
    if (engine === "google") return `https://www.google.com/search?q=${q}`;
    if (engine === "bing") return `https://www.bing.com/search?q=${q}`;
    return `https://duckduckgo.com/?q=${q}`;
  }

  function runSearch() {
    const topic = $("worksheetTopic")?.value.trim();
    const subject = $("worksheetSubject")?.value.trim();
    const resultsEl = $("worksheetResults");
    if (!topic) {
      if (resultsEl) resultsEl.innerHTML = '<div class="empty-hint">Bitte zuerst ein Thema eingeben.</div>';
      return;
    }

    const baseTerms = [topic, subject, "Arbeitsblatt", "kostenlos", "Übung"].filter(Boolean).join(" ");
    const pdfQuery = `${baseTerms} filetype:pdf`;

    const links = [
      { label: "🔎 Google — PDF-Arbeitsblätter", url: buildSearchUrl("google", pdfQuery) },
      { label: "🔎 Bing — PDF-Arbeitsblätter", url: buildSearchUrl("bing", pdfQuery) },
      { label: "🔎 DuckDuckGo — PDF-Arbeitsblätter", url: buildSearchUrl("duckduckgo", pdfQuery) }
    ];

    if (resultsEl) {
      resultsEl.innerHTML = links.map(l =>
        `<a class="worksheet-link" href="${l.url}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`
      ).join("");
    }
  }

  $("worksheetSearchBtn")?.addEventListener("click", runSearch);
  $("worksheetTopic")?.addEventListener("keydown", (e) => { if (e.key === "Enter") runSearch(); });

  // Auch über den Lern-Assistenten erreichbar: "arbeitsblatt zu <thema>" o. ä.
  window.findWorksheetsFor = (topic) => {
    if ($("worksheetTopic")) $("worksheetTopic").value = topic;
    runSearch();
    document.querySelector(".worksheet-results")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
})();

/* =========================================================
   BEFEHLSPALETTE (Strg+K)
   Durchsucht alle Panels/Spiele/Bereiche der App und springt
   direkt dorthin — löst das "ich finde das nicht mehr"-Problem
   grundsätzlich für die ganze App.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  // Registry: jeder Eintrag weiß, wie er sich selbst öffnet.
  const REGISTRY = [
    // Schule
    { label: "Was jetzt?", group: "Schule", action: () => gotoSchoolPanel("whatnow-panel") },
    { label: "Übungsblätter finden", group: "Schule", action: () => gotoSchoolPanel(null, "worksheetTopic") },
    { label: "Fächer", group: "Schule", action: () => gotoSchoolPanelByHeading("FÄCHER") },
    { label: "Hausaufgaben", group: "Schule", action: () => gotoSchoolPanelByHeading("HAUSAUFGABEN") },
    { label: "Tagesziele", group: "Schule", action: () => gotoSchoolPanelByHeading("TAGESZIELE") },
    { label: "Notizen", group: "Schule", action: () => gotoSchoolPanelByHeading("NOTIZEN") },
    { label: "Klassenarbeiten", group: "Schule", action: () => gotoSchoolPanelByHeading("KLASSENARBEITEN") },
    { label: "Termine", group: "Schule", action: () => gotoSchoolPanelByHeading("TERMINE") },
    { label: "Vokabelkarten", group: "Schule", action: () => gotoSchoolPanelByHeading("VOKABELKARTEN") },
    { label: "Wakeboard Log", group: "Schule", action: () => gotoSchoolPanel(null, "wbTrick") },
    { label: "Calisthenics", group: "Schule", action: () => gotoSchoolPanel(null, "caliExercise") },
    { label: "Pomodoro", group: "Schule", action: () => gotoSchoolPanel(null, "pomoTime") },
    { label: "Notenrechner", group: "Schule", action: () => gotoSchoolPanel(null, "gradeInput") },
    { label: "Taschenrechner", group: "Schule", action: () => gotoSchoolPanel(null, "calcDisplay") },
    { label: "Stundenplan", group: "Schule", action: () => gotoSchoolPanel(null, "scheduleGrid") },
    { label: "Formelsammlung", group: "Schule", action: () => gotoSchoolPanel(null, "formulaSearch") },
    { label: "Lern-Assistent", group: "Schule", action: () => gotoSchoolPanel(null, "assistantInput") },
    { label: "Karteikarten-Wiederholung", group: "Schule", action: () => gotoSchoolPanel(null, "srCard") },
    { label: "Erinnerungen", group: "Schule", action: () => gotoSchoolPanel(null, "notifyEnableBtn") },
    { label: "Prüfungs-Countdown", group: "Schule", action: () => gotoSchoolPanel(null, "examCountdownList") },
    { label: "Wetter · Kabelpark", group: "Schule", action: () => gotoSchoolPanel(null, "weatherWidget") },
    { label: "Trick-Fortschritt", group: "Schule", action: () => gotoSchoolPanel(null, "trickChecklist") },
    { label: "Referate-Timer", group: "Schule", action: () => gotoSchoolPanel(null, "talkTime") },
    { label: "Fach-Statistik", group: "Schule", action: () => gotoSchoolPanel(null, "subjectStatsList") },
    { label: "Kalender-Export", group: "Schule", action: () => gotoSchoolPanel(null, "icsExportBtn") },
    { label: "Achievements", group: "Schule", action: () => gotoSchoolPanel(null, "achievementList") },
    { label: "Backup / Export", group: "Schule", action: () => gotoSchoolPanel(null, "backupExportBtn") },

    // Hacking
    { label: "Hacking: Analyse", group: "Hacking", action: () => gotoHackCategory("analysis") },
    { label: "Hacking: Kryptografie", group: "Hacking", action: () => gotoHackCategory("crypto") },
    { label: "Hacking: Defensive Sicherheit", group: "Hacking", action: () => gotoHackCategory("defense") },
    { label: "Hacking: Tools", group: "Hacking", action: () => gotoHackCategory("tools") },
    { label: "Hacking: Wissen & Quiz", group: "Hacking", action: () => gotoHackCategory("knowledge") },
    { label: "Hacking: Cyber Range", group: "Hacking", action: () => gotoHackCategory("cyber") },
    { label: "Hacking: Offensive Simulation", group: "Hacking", action: () => gotoHackCategory("offensive") },

    // Spiele
    { label: "Spiele-Menü öffnen", group: "Spiele", action: () => { document.getElementById("gamesModeBtn")?.click(); } },
    ...["chess:Holo Chess", "connect4:Vier Gewinnt", "memory:Holo Memory", "snake:Holo Snake",
        "2048:Holo 2048", "ttt:Tic-Tac-Toe", "mines:Holo Minesweeper", "battleship:Schiffe versenken",
        "sudoku:Holo Sudoku", "reflex:Reaktionstest", "puzzle15:Schiebepuzzle", "airhockey:Air Hockey 3D",
        "checkers:3D-Dame", "minigolf:Mini-Golf 3D", "billiard:Billard 3D"
    ].map(entry => {
      const [id, label] = entry.split(":");
      return { label: `Spiel: ${label}`, group: "Spiele", action: () => gotoGame(id) };
    }),

    // Freizeit
    { label: "Freizeit: Zocken", group: "Freizeit", action: () => gotoLeisureTab("gaming") },
    { label: "Freizeit: Schlagzeug", group: "Freizeit", action: () => gotoLeisureTab("drums") },
    { label: "Freizeit: GoPro", group: "Freizeit", action: () => gotoLeisureTab("gopro") },
    { label: "Freizeit: Allgemein", group: "Freizeit", action: () => gotoLeisureTab("general") },
    { label: "JARVIS Radio", group: "Freizeit", action: () => gotoLeisureTab("general") },
    { label: "Münzwurf / Würfel / Zufallsgenerator", group: "Freizeit", action: () => gotoLeisureTab("general") },
    { label: "Gesten-Scanner", group: "Freizeit", action: () => gotoLeisureTab("gopro") },
    { label: "Face-Scan", group: "Freizeit", action: () => gotoLeisureTab("gopro") },
    { label: "Metronom", group: "Freizeit", action: () => gotoLeisureTab("drums") },
    { label: "Play-Along", group: "Freizeit", action: () => gotoLeisureTab("drums") },
    { label: "Rudiments-Trainer", group: "Freizeit", action: () => gotoLeisureTab("drums") },
    { label: "Rhythmus-Trainer", group: "Freizeit", action: () => gotoLeisureTab("drums") },
    { label: "Song-Wunschliste", group: "Freizeit", action: () => gotoLeisureTab("drums") },
    { label: "Übungs-Log (Schlagzeug)", group: "Freizeit", action: () => gotoLeisureTab("drums") },
    { label: "Spiele-Backlog", group: "Freizeit", action: () => gotoLeisureTab("gaming") },
    { label: "Spielzeit-Log", group: "Freizeit", action: () => gotoLeisureTab("gaming") },
    { label: "Trophäen-Tracker", group: "Freizeit", action: () => gotoLeisureTab("gaming") },
    { label: "Release-Countdown", group: "Freizeit", action: () => gotoLeisureTab("gaming") },
    { label: "Squad-Planer", group: "Freizeit", action: () => gotoLeisureTab("gaming") },
    { label: "Clip-Ideen", group: "Freizeit", action: () => gotoLeisureTab("gopro") },
    { label: "Kamera-Presets", group: "Freizeit", action: () => gotoLeisureTab("gopro") },

    // JARVIS-Kern
    { label: "Einstellungen öffnen", group: "JARVIS", action: () => { $("settingsOverlay")?.classList.remove("hidden"); } },
    { label: "Achievement-Sharecard erstellen", group: "JARVIS", action: () => gotoSchoolPanel(null, "sharecardBtn") }
  ];

  function ensureSchoolMode() {
    if (!document.body.classList.contains("jarvis-school")) {
      document.getElementById("schoolModeBtn")?.click();
    }
  }

  function highlight(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("palette-highlight");
    setTimeout(() => el.classList.remove("palette-highlight"), 1600);
  }

  function gotoSchoolPanel(panelClass, innerId) {
    ensureSchoolMode();
    setTimeout(() => {
      let el = null;
      if (panelClass) el = document.querySelector(`.${panelClass}`);
      else if (innerId) el = document.getElementById(innerId)?.closest(".panel");
      highlight(el);
    }, 150);
  }

  function gotoSchoolPanelByHeading(text) {
    ensureSchoolMode();
    setTimeout(() => {
      const headings = document.querySelectorAll(".dashboard-grid .panel h2");
      const match = [...headings].find(h => h.textContent.trim().toUpperCase().includes(text));
      highlight(match?.closest(".panel"));
    }, 150);
  }

  function gotoHackCategory(cat) {
    document.getElementById("hackModeBtn")?.click();
    setTimeout(() => {
      document.querySelector(`.hack-main-category[data-hack-category="${cat}"]`)?.click();
    }, 200);
  }

  function gotoGame(id) {
    document.getElementById("gamesModeBtn")?.click();
    setTimeout(() => {
      document.querySelector(`.game-tile[data-game="${id}"]`)?.click();
    }, 200);
  }

  function gotoLeisureTab(tab) {
    document.getElementById("leisureModeBtn")?.click();
    setTimeout(() => {
      document.querySelector(`.leisure-tab[data-leisure-tab="${tab}"]`)?.click();
    }, 200);
  }

  /* ---- UI ---- */
  const overlay = $("commandPaletteOverlay");
  const input = $("paletteInput");
  const resultsEl = $("paletteResults");
  let filtered = [];
  let selectedIdx = 0;

  function renderResults() {
    const q = input.value.toLowerCase().trim();
    filtered = REGISTRY.filter(r => !q || r.label.toLowerCase().includes(q));
    selectedIdx = 0;
    resultsEl.innerHTML = filtered.length
      ? filtered.map((r, i) => `<div class="palette-result${i === 0 ? " palette-selected" : ""}" data-idx="${i}">
          <span class="palette-result-group">${esc(r.group)}</span>
          <span class="palette-result-label">${esc(r.label)}</span>
        </div>`).join("")
      : '<div class="palette-empty">Nichts gefunden.</div>';
  }

  function updateSelection() {
    resultsEl.querySelectorAll(".palette-result").forEach((el, i) => {
      el.classList.toggle("palette-selected", i === selectedIdx);
    });
    resultsEl.querySelector(".palette-selected")?.scrollIntoView({ block: "nearest" });
  }

  function openPalette() {
    overlay?.classList.remove("hidden");
    input.value = "";
    renderResults();
    setTimeout(() => input.focus(), 30);
  }
  function closePalette() {
    overlay?.classList.add("hidden");
  }
  function runSelected() {
    const item = filtered[selectedIdx];
    if (!item) return;
    closePalette();
    item.action();
  }

  $("paletteToggleBtn")?.addEventListener("click", openPalette);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      overlay?.classList.contains("hidden") ? openPalette() : closePalette();
    } else if (e.key === "Escape" && !overlay?.classList.contains("hidden")) {
      closePalette();
    }
  });
  overlay?.addEventListener("click", (e) => { if (e.target === overlay) closePalette(); });
  input?.addEventListener("input", renderResults);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, filtered.length - 1); updateSelection(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); updateSelection(); }
    else if (e.key === "Enter") { e.preventDefault(); runSelected(); }
  });
  resultsEl?.addEventListener("click", (e) => {
    const row = e.target.closest("[data-idx]");
    if (!row) return;
    selectedIdx = Number(row.dataset.idx);
    runSelected();
  });
})();

/* =========================================================
   FAVORITEN / PIN-SYSTEM
   Fügt jedem Schul-Panel einen kleinen ⭐-Button hinzu; angepinnte
   Panels erscheinen in einer eigenen Übersicht ganz oben.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const FAV_KEY = "jarvisFavoritePanels";
  const loadFavs = () => { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (_) { return []; } };
  const saveFavs = (f) => localStorage.setItem(FAV_KEY, JSON.stringify(f));

  function panelKey(panel) {
    const h2 = panel.querySelector(".panel-header h2");
    return h2 ? h2.textContent.trim() : null;
  }

  function injectPinButtons() {
    const favs = loadFavs();
    document.querySelectorAll(".dashboard-grid > .panel, .dashboard-grid > section.panel").forEach(panel => {
      if (panel.id === "favoritesPanel") return;
      if (panel.querySelector(".panel-pin-btn")) return; // schon vorhanden
      const header = panel.querySelector(".panel-header");
      const key = panelKey(panel);
      if (!header || !key) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "panel-pin-btn";
      btn.title = "Anpinnen";
      btn.textContent = favs.includes(key) ? "★" : "☆";
      btn.classList.toggle("pinned", favs.includes(key));
      btn.addEventListener("click", () => {
        let f = loadFavs();
        if (f.includes(key)) f = f.filter(k => k !== key);
        else f.push(key);
        saveFavs(f);
        btn.textContent = f.includes(key) ? "★" : "☆";
        btn.classList.toggle("pinned", f.includes(key));
        renderFavoritesWidget();
      });
      header.appendChild(btn);
    });
  }

  function renderFavoritesWidget() {
    const favs = loadFavs();
    const panelEl = $("favoritesPanel");
    const listEl = $("favoritesList");
    if (!panelEl || !listEl) return;
    if (!favs.length) { panelEl.classList.add("hidden"); return; }
    panelEl.classList.remove("hidden");
    listEl.innerHTML = favs.map(key => `<button class="favorite-chip" data-fav-key="${esc(key)}" type="button">⭐ ${esc(key)}</button>`).join("");
  }

  $("favoritesList")?.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-fav-key]");
    if (!chip) return;
    const key = chip.dataset.favKey;
    const headings = document.querySelectorAll(".dashboard-grid .panel h2");
    const match = [...headings].find(h => h.textContent.trim() === key);
    const panel = match?.closest(".panel");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
      panel.classList.add("palette-highlight");
      setTimeout(() => panel.classList.remove("palette-highlight"), 1600);
    }
  });

  injectPinButtons();
  renderFavoritesWidget();
  // Neue Panels (z. B. nach renderAll) ebenfalls mit Pin-Button versehen.
  setInterval(injectPinButtons, 3000);
})();

/* =========================================================
   JARVIS RADIO — generative Ambient-Musik (Web Audio API)
   Erzeugt komplett lokal fortlaufende Musik ohne echte Songs,
   also ohne Urheberrechtsfragen. Drei Stimmungen mit
   unterschiedlichen Akkordfolgen/Tempi.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);

  let audioCtx = null;
  let masterGain = null;
  let playing = false;
  let chordTimer = null;
  let arpTimer = null;
  let currentMood = "chill";

  // Akkordfolgen als MIDI-Grundtöne (werden in Frequenzen umgerechnet).
  const MOODS = {
    chill: {
      chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [50, 53, 57]], // Am - F - G - Dm (ungefähr, entspannt)
      chordSeconds: 6,
      arpNoteSeconds: 0.75,
      filterFreq: 900,
      waveform: "sine"
    },
    focus: {
      chords: [[57, 60, 64], [57, 60, 65], [55, 59, 62], [57, 60, 64]], // ruhig, minimal, wenig Bewegung
      chordSeconds: 8,
      arpNoteSeconds: 1.2,
      filterFreq: 650,
      waveform: "triangle"
    },
    upbeat: {
      chords: [[60, 64, 67], [57, 60, 64], [62, 65, 69], [55, 59, 62]], // C - Am - Dm-ish - G, etwas heller
      chordSeconds: 3.2,
      arpNoteSeconds: 0.32,
      filterFreq: 1400,
      waveform: "sawtooth"
    }
  };

  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.18;
      masterGain.connect(audioCtx.destination);
    }
  }

  function playPad(freq, duration, filterFreq, waveform) {
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    osc.type = waveform;
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const vol = (window.getJarvisVolume ? window.getJarvisVolume() : 1);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22 * vol, now + duration * 0.15);
    gain.gain.linearRampToValueAtTime(0.22 * vol, now + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function playArpNote(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * 2; // eine Oktave höher, leiser Glitzer-Ton
    const vol = (window.getJarvisVolume ? window.getJarvisVolume() : 1);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.09 * vol + 0.001, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  let chordIdx = 0;
  function scheduleChordLoop() {
    const mood = MOODS[currentMood];
    const chord = mood.chords[chordIdx % mood.chords.length];
    chord.forEach(midi => playPad(midiToFreq(midi), mood.chordSeconds, mood.filterFreq, mood.waveform));
    chordIdx++;
    chordTimer = setTimeout(scheduleChordLoop, mood.chordSeconds * 1000);
  }

  let arpStep = 0;
  function scheduleArpLoop() {
    const mood = MOODS[currentMood];
    const chord = mood.chords[(chordIdx - 1 + mood.chords.length) % mood.chords.length];
    const note = chord[arpStep % chord.length];
    playArpNote(midiToFreq(note), mood.arpNoteSeconds * 1.5);
    arpStep++;
    arpTimer = setTimeout(scheduleArpLoop, mood.arpNoteSeconds * 1000);
  }

  function updateStatusUI() {
    const statusEl = $("radioStatus");
    const moodEl = $("radioMoodLabel");
    if (statusEl) statusEl.textContent = playing ? "▶ Läuft" : "⏸ Gestoppt";
    if (moodEl) {
      const labels = { chill: "Chill / Lo-fi", focus: "Fokus / minimal", upbeat: "Energiegeladen" };
      moodEl.textContent = labels[currentMood] || currentMood;
    }
  }

  function startRadio() {
    ensureAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    if (playing) return;
    playing = true;
    chordIdx = 0;
    arpStep = 0;
    scheduleChordLoop();
    scheduleArpLoop();
    updateStatusUI();
  }
  function stopRadio() {
    playing = false;
    clearTimeout(chordTimer);
    clearTimeout(arpTimer);
    updateStatusUI();
  }

  $("radioPlayBtn")?.addEventListener("click", startRadio);
  $("radioStopBtn")?.addEventListener("click", stopRadio);
  $("radioMoodSelect")?.addEventListener("change", (e) => {
    currentMood = e.target.value;
    updateStatusUI();
    if (playing) {
      stopRadio();
      startRadio();
    }
  });

  // Vom Sprachbefehl-Router aufrufbar ("Jarvis, Freizeit Modus aktivieren").
  window.startJarvisRadio = startRadio;
  window.stopJarvisRadio = stopRadio;

  updateStatusUI();
})();

/* =========================================================
   KONAMI-CODE EASTER EGG
   ↑ ↑ ↓ ↓ ← → ← → B A — schaltet einen Spaß-Modus frei.
   ========================================================= */
(() => {
  "use strict";
  const SEQUENCE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let progress = 0;

  function triggerEasterEgg() {
    if (!localStorage.getItem("jarvisKonamiUnlocked")) {
      localStorage.setItem("jarvisKonamiUnlocked", "true");
    }

    document.body.classList.add("konami-mode");
    setJarvisMessage?.("🕹️ Konami-Code erkannt! Geheim-Achievement freigeschaltet.");

    // Konfetti-Overlay
    const canvas = document.createElement("canvas");
    canvas.className = "konami-confetti";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const colors = ["#00e5ff", "#cf42ff", "#ffb454", "#28df9c", "#ff4d67"];
    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height,
      r: 4 + Math.random() * 5,
      c: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 2,
      rot: Math.random() * Math.PI
    }));

    let frame = 0;
    const maxFrames = 260;
    function animate() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        p.rot += 0.05;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();
      });
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }
    animate();

    setTimeout(() => document.body.classList.remove("konami-mode"), 6000);

    // Achievements-Ansicht aktualisieren, falls gerade offen.
    document.dispatchEvent(new CustomEvent("jarvis:custom-formula-added"));
    if (typeof window.getJarvisAchievements === "function") {
      const el = document.getElementById("achievementList");
      if (el) {
        const items = window.getJarvisAchievements();
        const doneCount = items.filter(i => i.done).length;
        el.innerHTML = `<p class="pomo-hint">${doneCount} / ${items.length} freigeschaltet</p>` +
          items.map(a => `<div class="achievement-item ${a.done ? "achievement-done" : ""}">
            <span class="achievement-icon">${a.icon}</span>
            <div>
              <div class="achievement-name">${a.name}</div>
              <div class="achievement-desc">${a.desc}</div>
            </div>
            ${a.done ? '<span class="achievement-check">✓</span>' : ""}
          </div>`).join("");
      }
    }
  }

  document.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === SEQUENCE[progress]) {
      progress++;
      if (progress === SEQUENCE.length) {
        progress = 0;
        triggerEasterEgg();
      }
    } else {
      progress = (key === SEQUENCE[0]) ? 1 : 0;
    }
  });
})();

/* =========================================================
   ACHIEVEMENT-SHARECARD
   Rendert ein hübsches, herunterladbares Bild mit deinen Stats
   zum Teilen/Screenshotten.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const safeGet = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } };

  function collectStats() {
    const streak = safeGet("jarvisStreak", { count: 0 });
    const highscores = safeGet("jarvisGameHighscores", {});
    const grades = safeGet("jarvisGrades", []);
    const achievements = (typeof window.getJarvisAchievements === "function") ? window.getJarvisAchievements() : [];
    const doneCount = achievements.filter(a => a.done).length;

    let pomodoroRounds = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("jarvisPomodoroRounds:")) pomodoroRounds += Number(localStorage.getItem(key)) || 0;
    }

    const gradeAvg = grades.length
      ? (grades.reduce((s, g) => s + Number(g.value) * Number(g.weight), 0) / grades.reduce((s, g) => s + Number(g.weight), 0)).toFixed(2)
      : "—";

    const topGame = Object.entries(highscores).sort((a, b) => String(b[1]).localeCompare(String(a[1])))[0];

    return {
      streak: streak.count || 0,
      achievements: `${doneCount} / ${achievements.length}`,
      pomodoroRounds,
      gradeAvg,
      gamesWithScores: Object.keys(highscores).length,
      topGame: topGame ? topGame[0] : "—"
    };
  }

  function drawSharecard() {
    const canvas = $("sharecardCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const stats = collectStats();
    const w = canvas.width, h = canvas.height;

    // Hintergrund
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#050b12");
    grad.addColorStop(1, "#0b1f2e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Dekorativer Rand
    ctx.strokeStyle = "rgba(0,191,255,0.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, w - 28, h - 28);

    // Titel
    ctx.fillStyle = "#00bfff";
    ctx.font = "bold 40px 'Segoe UI', sans-serif";
    ctx.fillText("◈ JARVIS — Meine Stats", 48, 78);

    ctx.fillStyle = "#7895a8";
    ctx.font = "18px 'Segoe UI', sans-serif";
    ctx.fillText(new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }), 48, 108);

    // Stat-Kacheln
    const tiles = [
      { label: "🔥 Lern-Streak", value: `${stats.streak} Tage` },
      { label: "🏆 Achievements", value: stats.achievements },
      { label: "🍅 Pomodoro-Runden", value: String(stats.pomodoroRounds) },
      { label: "📊 Notenschnitt", value: String(stats.gradeAvg) },
      { label: "🎮 Spiele mit Highscore", value: String(stats.gamesWithScores) },
      { label: "⭐ Bestes Spiel", value: stats.topGame }
    ];

    const cols = 3;
    const tileW = (w - 96 - (cols - 1) * 20) / cols;
    const tileH = 130;
    tiles.forEach((tile, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 48 + col * (tileW + 20);
      const y = 150 + row * (tileH + 20);

      ctx.fillStyle = "rgba(16,29,41,0.9)";
      ctx.strokeStyle = "rgba(27,53,72,1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, tileW, tileH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#7895a8";
      ctx.font = "16px 'Segoe UI', sans-serif";
      ctx.fillText(tile.label, x + 18, y + 34);

      ctx.fillStyle = "#e7f6ff";
      ctx.font = "bold 30px 'Segoe UI', sans-serif";
      ctx.fillText(tile.value, x + 18, y + 78);
    });

    ctx.fillStyle = "#4a6478";
    ctx.font = "14px 'Segoe UI', sans-serif";
    ctx.fillText("Erstellt mit JARVIS · komplett lokal, keine Cloud", 48, h - 30);

    canvas.classList.remove("hidden");
    canvas.scrollIntoView({ behavior: "smooth", block: "center" });

    const link = $("sharecardDownload");
    if (link) {
      link.href = canvas.toDataURL("image/png");
      link.classList.remove("hidden");
      link.textContent = "⬇ Als Bild herunterladen";
      link.className = "ctrl-btn sharecard-download-link";
    }
  }

  $("sharecardBtn")?.addEventListener("click", drawSharecard);
})();
