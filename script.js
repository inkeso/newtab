// removed permissions: "webNavigation", "browserSettings"

function dgi(s) {
    return document.getElementById(s);
}

// this is privileged url. no extension can even link to it :-(
function places() {
    // open("chrome://browser/content/places/places.xhtml");
}

// get internal UID for TreeStyleTabs-Extension and (if installed) add a "New Group" link
// needs "management" permission (→manifest.json)
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/management
function newgroup() {
    // Thankfully, this works!
    browser.management.getAll().then(
        value => {
            for(const e of value) {
                if (e.id != "treestyletab@piro.sakura.ne.jp") continue;
                let tstgroups = e.hostPermissions[0].replace("*", "resources/group-tab.html");
                let groups = document.createElement("button");
                groups.innerText = "New Tabgroup"
                groups.onclick = () => {
                    browser.tabs.update({url: tstgroups});
                }
                let sh = dgi("searchhint");
                sh.insertBefore(groups, sh.firstChild);
                return;
            }
        },
        error => {
            console.log("Something went wrong while finding TST:", error);
        }
    );
}

// get searchengines with alias / keyword
// needs "search" permission (→manifest.json)
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/search
function getkeywords() {
    let srch = dgi("searchhint");
    browser.search.get().then(
        value => {
            value.forEach(v => {
                if (!v.alias) return
                let div = document.createElement("div");
                div.className = "slink";
                let tt = document.createElement("tt");
                tt.innerText = v.alias;
                let img = document.createElement("img");
                img.src = v.favIconUrl;
                let span = document.createElement("span");
                span.innerText = v.name.trim();
                div.appendChild(tt);
                if (v.favIconUrl) div.appendChild(img);
                div.appendChild(span);
                srch.appendChild(div);
            });
        },
        error => {
            console.log("Something went wrong while getting searchengines:", error);
        }
    );
    // I'd like to include keyworded bookmarks here as well, but there's no API for that.
}

// needs "downloads" permission (→manifest.json)
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/downloads

// This doesn't match with Downloads shown in Library, so not used at the moment.
/*
function getdownloads() {
    let rdiv = dgi("downloads");
    let today = (new Date()).toLocaleDateString("de-DE");

    browser.downloads.search({}).then(
        value => {
            console.log("DL:", value);
            
            value.forEach(v => {
                // v.bytesReceived ??
                
                let rb = document.createElement("button");
                
                let tab = document.createElement("table");
                let tr1 = document.createElement("tr"); tab.appendChild(tr1);
                let tr2 = document.createElement("tr"); tab.appendChild(tr2);
                rb.appendChild(tab);

                let td1 = document.createElement("td");
                td1.className = "time";
                let dla = new Date(v.startTime);
                td1.innerHTML = dla.toLocaleTimeString("de-DE");
                tr1.appendChild(td1);

                let td2 = document.createElement("td");
                td2.className = "title";
                td2.innerText = v.url;
                tr1.appendChild(td2);

                let td3 = document.createElement("td");
                td3.className = "date";
                let dat = dla.toLocaleDateString("de-DE");
                td3.innerText = dat != today ? dat : "";
                tr2.appendChild(td3);

                let td4 = document.createElement("td");
                td4.className = v.exists ? "url" : "nonexist";
                td4.innerText = v.filename;
                tr2.appendChild(td4);
                
                // erase-button?
                let tdel = document.createElement("td");
                tdel.className = "delete";
                tdel.rowSpan = 2;
                
                tbtn = document.createElement("button")
                tbtn.innerText = " 🗑 ";
                tbtn.onclick = () => { browser.downloads.erase({id: v.id}); }
                
                tdel.appendChild(tbtn);
                tr1.appendChild(tdel);
                
                rb.onclick = () => { browser.downloads.show(v.id); }
                rdiv.appendChild(rb);
            });
        },
        error => {
            console.log("Something went wrong while getting downloads:", error);
        }
    );
}
*/

// show recently closed tabs.
// needs "tabs" and "sessions" permission (→manifest.json)
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/sessions

// The sessions.getRecentlyClosed() function returns an array of tabs.Tab and windows.Window objects,
// representing tabs and windows that have been closed since the browser was running,
// up to the maximum defined in sessions.MAX_SESSION_RESULTS.
function recenttabs() {
    let recent = browser.sessions.getRecentlyClosed();
    let rdiv = dgi("recent");
    rdiv.replaceChildren(); // clear
    
    let today = (new Date()).toLocaleDateString("de-DE");
    recent.then(
        value => {
            value.forEach(v => {
                if (! v.tab) return;
                let rb = document.createElement("button");
                
                let tab = document.createElement("table");
                let tr1 = document.createElement("tr"); tab.appendChild(tr1);
                let tr2 = document.createElement("tr"); tab.appendChild(tr2);
                rb.appendChild(tab);

                let td1 = document.createElement("td");
                td1.className = "time";
                let dla = new Date(v.tab.lastAccessed);
                td1.innerHTML = dla.toLocaleTimeString("de-DE");
                tr1.appendChild(td1);

                let td2 = document.createElement("td");
                td2.className = "title";
                td2.innerText = v.tab.title;
                tr1.appendChild(td2);

                let td3 = document.createElement("td");
                td3.className = "date";
                let dat = dla.toLocaleDateString("de-DE");
                td3.innerText = dat != today ? dat : "";
                tr2.appendChild(td3);

                let td4 = document.createElement("td");
                td4.className = "url";
                td4.innerText = v.tab.url;
                //td4.innerText = v.tab.url.startsWith("moz-extension") ? "" : v.tab.url;
                tr2.appendChild(td4);
                
                rb.onclick = () => { // restore & reload
                    let restore = browser.sessions.restore(v.tab.sessionId);
                    restore.then(recenttabs, console.log);
                }
                rdiv.appendChild(rb);
            })
        },
        error => {
            console.log("Something went wrong while getting recent tabs:", error);
        }
    );
}

// --MAIN--
newgroup();     // once
getkeywords();  // once
recenttabs();   // update self on open
//getdownloads(); // doesn't work well.: not all downloads are shown
