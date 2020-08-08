const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

const request = indexedDB.open("budget", 1);
let db;

// There are three lifecycle functions needed
// on error, on success, on upgrade needed
// destructured event.target
request.onupgradeneeded = ({ target }) => {
    db = target.result;
    // pending is the common name for object stores
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
    db = target.result;
    if (navigator.onLine) {
        checkDatabase();
    }
}

request.onerror = ({ target }) => {
    // IndexedDB will allow errorCode to exist
    console.log(target.errorCode);
}

const saveRecord = (record) => {
    const transaction = db.transaction("pending", "readwrite");
    const store = transaction.objectStore("pending");
    store.add(record);
}

const checkDatabase = () => {
    const transaction = db.transaction("pending", "readwrite");
    const store = transaction.objectStore("pending");
    const allTransactions = store.getAll();
    allTransactions.onsuccess = () => {
        // if the length is greater than 0
        if (allTransactions.result.length > 0) {
            // fetch
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(allTransactions.result), headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            }).then(response => {
                return response.json;
            }).then(() => {
                const transaction = db.transaction("pending", "readwrite");
                const store = transaction.objectStore("pending");
                store.clear();
            })
        }
    }
}

window.addEventListener("online", checkDatabase);